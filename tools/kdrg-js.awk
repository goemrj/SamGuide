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
  if(VER=="") VER="1.6";
  # 지금 판(1.6)은 늘 올라와 있으므로 이름 그대로 쓴다.
  # 옛 판은 필요할 때만 불러오므로 이름 뒤에 판을 붙이고(KDRG_ADRG_V15 …) 맨 끝에 KDRG_OLD 에 등록한다.
  OLD=(VER!="1.6");
  SFX=""; PFX="kdrg-";
  if(OLD){ v=VER; gsub(/\./,"",v); SFX="_V" v; PFX="kdrg-v" v "-" }
  A=OUT "/" PFX "adrg.js"; T=OUT "/" PFX "tbl.js"; M=OUT "/" PFX "mdcdx.js"; S=OUT "/" PFX "sev.js";
  hd="/* ---------- KDRG 분류집 (신포괄지불제도용 Version " VER ") — 자동 생성 파일 (손으로 고치지 않는다) ----------\n"\
     "   만든 것: tools/kdrg.awk → tools/kdrg-js.awk -v VER=" VER "\n"\
     "   원본:    「KDRG 분류집 (신포괄지불제도용 Version " VER ")」 (심평원)\n";
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
       "   KDRG_MDCDX 에는 주진단 목록(table1 + table2)만 넣고, 세 표는 KDRG_HIV 에 그대로 남겼다.\n"\
       "\n"\
       "   MDC 18-1 과 21-1(다발성 외상)의 코드는 **모두** 다른 MDC 에도 들어 있다 —\n"\
       "   두 MDC 는 조건이 맞을 때만 얹히는 목록이지 주진단이 곧장 가는 곳이 아니다.\n"\
       "   나머지 MDC 끼리 겹치는 것은 45개뿐이고 모두 12(남성)·13(여성)이라 성별로 갈린다.\n"\
       "-------------------------------------------------------------------------- */" > M;
  print hd "\n   KDRG_CCL  (부표 1) 기타 진단의 중증도 점수 — KCD: [외과계, 내과계]\n"\
       "   KDRG_SEV  (부표 2) AADRG별 중증도 구분 기준 — a AADRG · n 명칭 · rows [DRG 6자리, 기준]\n"\
       "   주진단과 관련이 높은 기타진단의 점수를 0 으로 내리는 CC edit 규정은\n"\
       "   「매우 복잡하기 때문에 전산적인 처리가 필요하며 본 책자에는 포함시키지 않았다」(책 1173쪽).\n"\
       "   그래서 여기 값으로 낸 PCCL 은 CC edit 을 적용하기 전 값이다 — 실제보다 높게 나올 수 있다.\n"\
       "-------------------------------------------------------------------------- */" > S;

  print "\nvar KDRG_ADRG" SFX " = [" > A;
  print "\nvar KDRG_TBL" SFX " = [" > T;
  print "\nvar KDRG_MDCDX" SFX " = {" > M;
  print "\nvar KDRG_CCL" SFX " = {" > S;
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
  # MDC 18-1(HIV)만 표 세 개로 나뉘어 온다. 주진단 목록(table1·table2)은 MDC 배정에 쓰고,
  # 조건을 그대로 따질 수 있게 세 표를 KDRG_HIV 에 따로 남긴다.
  mdc=fld($0,"mdc"); part=fld($0,"part"); k=arr($0,"kcd");
  if(!(mdc in SEEN)){ SEEN[mdc]=1; MORD[++nm]=mdc }
  if(part==""){ MX[mdc]=k; next }
  if(part ~ /table1/) HIV1=k; else if(part ~ /table2/) HIV2=k; else HIV3=k;
  if(part ~ /기타진단명/) next;                       # 기타진단 표는 MDC 배정 목록이 아니다
  MX[mdc]=(MX[mdc]==""? k : substr(MX[mdc],1,length(MX[mdc])-1) "," substr(k,2));
  next;
}
/"t":"ccl"/{
  nc++;
  printf "%s\"%s\":[%s,%s]", (nc==1?"  ":(nc%8==1?",\n  ":", ")), fld($0,"kcd"), num($0,"s"), num($0,"m") >> S;
  next;
}
/"t":"dxtbl"/{ nx++; DXT[nx]=$0; next }
/"t":"sev"/{ ns++; SEV[ns]=$0; next }

END{
  print "\n];" >> A;
  print "\nvar KDRG_DEF" SFX " = [" >> A;
  for(i=1;i<=nd;i++)
    printf "%s  { c:\"%s\", mdc:\"%s\", grp:\"%s\", n:\"%s\", e:\"%s\", def:\"%s\", ts:%s }",
      (i>1?",\n":""), fld(DEF[i],"c"), fld(DEF[i],"mdc"), fld(DEF[i],"grp"), fld(DEF[i],"n"),
      fld(DEF[i],"e"), fld(DEF[i],"def"), num(DEF[i],"ts") >> A;
  print "\n];" >> A;
  print "\nvar KDRG_PRIO" SFX " = [" >> A;
  for(i=1;i<=np;i++)
    printf "%s  { mdc:\"%s\", r:%s, a:\"%s\", e:\"%s\" }",
      (i>1?",\n":""), fld(PRI[i],"mdc"), num(PRI[i],"r"), fld(PRI[i],"a"), fld(PRI[i],"e") >> A;
  print "\n];" >> A;

  print "\n];" >> T;
  for(i=1;i<=nm;i++) printf "%s  \"%s\": %s", (i>1?",\n":""), MORD[i], MX[MORD[i]] >> M;
  print "\n};" >> M;
  print "\n/* MDC 18-1(HIV) 은 조건이 「HIV 주진단명 table1 or (HIV 관련 주진단명 table2 and HIV 기타진단명 table3)」 이다.\n"\
        "   KDRG_MDCDX['18-1'] 에는 주진단 목록(table1 + table2)만 들어 있다. */" >> M;
  printf "var KDRG_HIV" SFX " = {\n  t1: %s,\n  t2: %s,\n  t3: %s\n};\n", HIV1, HIV2, HIV3 >> M;
  print "\n/* MDC 08 끝에 붙어 있는 부위별 진단 표 — 어느 질병군에도 매이지 않고 MDC 전체가 함께 쓴다.\n"\
        "   정의식에서 「Diagnosis Table6(견부 질환)」처럼 이름으로 부른다. */" >> M;
  print "var KDRG_DXTBL" SFX " = [" >> M;
  for(i=1;i<=nx;i++)
    printf "%s  { mdc:\"%s\", name:\"%s\", kcd:%s }", (i>1?",\n":""),
      fld(DXT[i],"mdc"), fld(DXT[i],"name"), arr(DXT[i],"kcd") >> M;
  print "\n];" >> M;
  print "\n};" >> S;
  print "\nvar KDRG_SEV" SFX " = [" >> S;
  for(i=1;i<=ns;i++)
    printf "%s  { a:\"%s\", n:\"%s\", rows:%s }",
      (i>1?",\n":""), fld(SEV[i],"a"), fld(SEV[i],"n"), arr(SEV[i],"rows") >> S;
  print "\n];" >> S;

  # 옛 판은 마지막 파일 끝에서 KDRG_OLD 에 등록한다 — 네 파일을 차례로 읽은 뒤 화면이 이걸 집어 간다.
  if(OLD){
    print "\n/* 이 판을 KDRG_OLD 에 등록한다 — js/page-kdrg.js 가 진료일에 맞는 판을 여기서 집어 간다.\n"\
          "   네 파일(adrg · tbl · mdcdx · sev)을 차례로 읽어야 하고, 이 줄은 맨 마지막에 와야 한다. */" >> S;
    printf "KDRG_OLD[\"%s\"] = { ADRG:KDRG_ADRG%s, DEF:KDRG_DEF%s, PRIO:KDRG_PRIO%s, TBL:KDRG_TBL%s,\n"\
           "  MDCDX:KDRG_MDCDX%s, HIV:KDRG_HIV%s, DXTBL:KDRG_DXTBL%s, CCL:KDRG_CCL%s, SEV:KDRG_SEV%s };\n",
      VER, SFX, SFX, SFX, SFX, SFX, SFX, SFX, SFX, SFX >> S;
  }
  printf "v%s — ADRG %d · 질병군정의 %d · 우선순위 %d · 표 %d · MDC주진단 %d · 중증도점수 %d · 중증도구분 %d\n",
    VER, na, nd, np, nt, nm, nc, ns > "/dev/stderr";
}
