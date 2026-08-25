# ------------------------------------------------------------------
# tools/kdrg.awk 가 뽑은 JSONL → data/kdrg-*.js 네 파일
#
#   LC_ALL=C.UTF-8 awk -v OUT=data -f tools/kdrg-js.awk kdrg.jsonl
#
# 만드는 파일
#   data/kdrg-adrg.js   KDRG_ADRG(ADRG 목록) · KDRG_DEF(질병군 정의) · KDRG_PRIO(우선순위)
#   data/kdrg-tbl.js    KDRG_TBL  정의가 가리키는 시술표 · 진단표
#   data/kdrg-mdcdx.js  KDRG_MDCDX  MDC별 KCD 주진단 목록
#   data/kdrg-sev.js    KDRG_CCL(부표1) · KDRG_SEV(부표2)
#
# 데이터 전역은 반드시 var 다 — const·let 은 window 에 붙지 않아 「지난 판 보기」로 바꿔 끼울 수 없다.
# ------------------------------------------------------------------
BEGIN{
  if(OUT=="") OUT="data";
  A=OUT "/kdrg-adrg.js"; T=OUT "/kdrg-tbl.js"; M=OUT "/kdrg-mdcdx.js"; S=OUT "/kdrg-sev.js";
  hd="/* ---------- KDRG 분류집 (신포괄지불제도용 Version 1.6) — 자동 생성 파일 (손으로 고치지 않는다) ----------\n"\
     "   만든 것: tools/kdrg.awk → tools/kdrg-js.awk\n"\
     "   원본:    「KDRG 분류집 (신포괄지불제도용 Version 1.6)」 (심평원, G000EV3-2025-175)\n";
  print hd "\n   KDRG_ADRG  ADRG 목록 — c 코드(4자리) · p Partition(S 외과 · M 내과 · O 기타) · mdc · n 한글명\n"\
       "   KDRG_DEF   본문 질병군 정의 — c(3~5자리) · mdc · grp 그룹 · n 한글명 · e 영문명\n"\
       "              def 정의식 · ts 정의식이 가리키는 표묶음 번호\n"\
       "   KDRG_PRIO  MDC별 외과 시술 DRGs 우선순위 — 시술이 여럿일 때 순위가 앞선 질병군이 이긴다\n"\
       "-------------------------------------------------------------------------- */" > A;
  print hd "\n   KDRG_TBL  질병군 정의가 가리키는 표\n"\
       "     ts    표묶음 번호 (KDRG_DEF.ts 와 짝)      name  표 이름 (시술명 table1 · 부가코드2 …)\n"\
       "     rows  [보험코드, 시술코드, 명칭]           kcd   진단표일 때 KCD 코드 목록\n"\
       "   시술코드가 SAM 신포괄 명세서 L항 51~56목의 코드다.\n"\
       "-------------------------------------------------------------------------- */" > T;
  print hd "\n   KDRG_MDCDX  MDC별 KCD 주진단 목록 — 주진단이 어느 MDC 로 가는지 정한다.\n"\
       "   MDC 18-1(HIV)은 원본에서 표 세 개로 나뉘어 있고 조건이\n"\
       "   「HIV 주진단명 table1 or (HIV 관련 주진단명 table2 and HIV 기타진단명 table3)」이다.\n"\
       "   여기에는 세 표의 코드를 모두 모아 두었다.\n"\
       "-------------------------------------------------------------------------- */" > M;
  print hd "\n   KDRG_CCL  (부표 1) 기타 진단의 중증도 점수 — KCD: [외과계, 내과계]\n"\
       "   KDRG_SEV  (부표 2) AADRG별 중증도 구분 기준 — a AADRG · n 명칭 · rows [DRG 6자리, 기준]\n"\
       "   주진단과 관련이 높은 기타진단의 점수를 0 으로 내리는 CC edit 규정은\n"\
       "   「매우 복잡하기 때문에 전산적인 처리가 필요하며 본 책자에는 포함시키지 않았다」(책 1173쪽).\n"\
       "   그래서 여기 값으로 낸 PCCL 은 CC edit 을 적용하기 전 값이다 — 실제보다 높게 나올 수 있다.\n"\
       "-------------------------------------------------------------------------- */" > S;

  print "\nvar KDRG_ADRG = [" > A;
  print "\nvar KDRG_TBL = [" > T;
  print "\nvar KDRG_MDCDX = {" > M;
  print "\nvar KDRG_CCL = {" > S;
  na=0; nt=0; nm=0; nc=0;
}

function fld(s,k,   m){ if(match(s, "\"" k "\":\"([^\"]*)\"", m)) return m[1]; return "" }
function num(s,k,   m){ if(match(s, "\"" k "\":([0-9]+)", m)) return m[1]; return "" }
function arr(s,k,   m){ if(match(s, "\"" k "\":(\\[.*\\])", m)) return m[1]; return "" }

/"t":"adrg"/{
  na++;
  printf "%s  { c:\"%s\", p:\"%s\", mdc:\"%s\", n:\"%s\" }", (na>1?",\n":""), fld($0,"c"), fld($0,"p"), fld($0,"mdc"), fld($0,"n") >> A;
  next;
}
/"t":"drg"/{
  nd++; DEF[nd]=$0; next;
}
/"t":"prio"/{ np++; PRI[np]=$0; next }
/"t":"tbl"/{
  nt++;
  r=arr($0,"rows"); k=arr($0,"kcd");
  printf "%s  { ts:%s, name:\"%s\", %s }", (nt>1?",\n":""), num($0,"ts"), fld($0,"name"),
    (r!="" ? "rows:" r : "kcd:" k) >> T;
  next;
}
/"t":"mdcdx"/{
  nm++;
  printf "%s  \"%s\": %s", (nm>1?",\n":""), fld($0,"mdc"), arr($0,"kcd") >> M;
  next;
}
/"t":"ccl"/{
  nc++;
  printf "%s\"%s\":[%s,%s]", (nc==1?"  ":(nc%8==1?",\n  ":", ")), fld($0,"kcd"), num($0,"s"), num($0,"m") >> S;
  next;
}
/"t":"sev"/{ ns++; SEV[ns]=$0; next }

END{
  print "\n];" >> A;
  print "\nvar KDRG_DEF = [" >> A;
  for(i=1;i<=nd;i++)
    printf "%s  { c:\"%s\", mdc:\"%s\", grp:\"%s\", n:\"%s\", e:\"%s\", def:\"%s\", ts:%s }",
      (i>1?",\n":""), fld(DEF[i],"c"), fld(DEF[i],"mdc"), fld(DEF[i],"grp"), fld(DEF[i],"n"),
      fld(DEF[i],"e"), fld(DEF[i],"def"), num(DEF[i],"ts") >> A;
  print "\n];" >> A;
  print "\nvar KDRG_PRIO = [" >> A;
  for(i=1;i<=np;i++)
    printf "%s  { mdc:\"%s\", r:%s, a:\"%s\", e:\"%s\" }",
      (i>1?",\n":""), fld(PRI[i],"mdc"), num(PRI[i],"r"), fld(PRI[i],"a"), fld(PRI[i],"e") >> A;
  print "\n];" >> A;

  print "\n];" >> T;
  print "\n};" >> M;
  print "\n};" >> S;
  print "\nvar KDRG_SEV = [" >> S;
  for(i=1;i<=ns;i++)
    printf "%s  { a:\"%s\", n:\"%s\", rows:%s }",
      (i>1?",\n":""), fld(SEV[i],"a"), fld(SEV[i],"n"), arr(SEV[i],"rows") >> S;
  print "\n];" >> S;

  printf "ADRG %d · 질병군정의 %d · 우선순위 %d · 표 %d · MDC주진단 %d · 중증도점수 %d · 중증도구분 %d\n",
    na, nd, np, nt, nm, nc, ns > "/dev/stderr";
}
