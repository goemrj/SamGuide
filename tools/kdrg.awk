# ------------------------------------------------------------------
# KDRG 분류집 (신포괄지불제도용 Version 1.6) → JSONL
#
#   pdftotext -table -enc UTF-8 "KDRG 분류집 (신포괄지불제도용 Version 1.6).pdf" kdrg.txt
#   LC_ALL=C.UTF-8 awk -f tools/kdrg.awk kdrg.txt > kdrg.jsonl
#
# LC_ALL=C.UTF-8 없이 돌리면 awk 가 글자를 바이트로 세어 칸 위치가 어긋난다. 반드시 붙인다.
# 여러 단으로 짜인 표라 pdftotext 는 -layout 이 아니라 -table 로 뽑아야 한다
# (-layout 은 보험코드 칸이 두 줄씩 밀려 다른 시술코드와 짝지어진다).
#
# 내보내는 줄 (JSONL)
#   {"t":"adrg"}   ADRG 목록 (책 1~34쪽)   c 코드 · p Partition(S/M/O) · mdc · n 한글명
#   {"t":"grp"}    본문 ADRG 그룹 머리      c 3자리 · n 한글명 · e 영문명
#   {"t":"drg"}    본문 질병군 정의         c 3~5자리 · n · e · def 정의식 · ts 표묶음번호
#   {"t":"tbl"}    정의가 가리키는 표       ts · name(시술명 table1 …) · rows[] 또는 kcd[]
#   {"t":"mdcdx"}  MDC별 KCD 주진단 목록    mdc · kcd[]
#   {"t":"prio"}   외과 시술 DRGs 우선순위  mdc · r 순위 · a ADRG · e 영문명
#   {"t":"ccl"}    (부표 1) 기타 진단 중증도 점수  kcd · s 외과 · m 내과
#   {"t":"sev"}    (부표 2) AADRG별 중증도 구분    a AADRG · n 명칭 · rows[[DRG6,기준]]
#
# 쪽마다 좌우 여백에 세로로 박힌 장식(MDC · 01 · (B) · KDRG · 쪽번호)이 -table 출력에서
# 본문 줄 앞뒤에 붙는다. fields() 가 2칸 이상 공백으로 칸을 나눈 뒤 앞뒤의 장식 칸만
# 걷어낸다. 칸 안에서 여러 칸 벌어진 공백은 한 칸으로 줄인다(PDF 조판 자국이다).
#
# MDC 구분면 뒤의 대여섯 쪽은 분류 흐름도(decision tree) **그림**이라 글자가 없다.
# 그림이 보여 주는 조건(Age >18 등)은 ADRG 정의(이름과 정의식)에 그대로 들어 있어
# 빠뜨리는 규칙은 없다.
# ------------------------------------------------------------------
BEGIN{ RS="\f"; FS="\n"; TS=0 }

# ---------- 0차: 쪽 범위를 스스로 찾는다 ----------
# 판마다 쪽번호가 다르다(1.4 · 1.5 · 1.6 이 다 다르다). 머리글로 구간을 잡는다.
# -v P_ADRG_S=… 처럼 넘기면 그 값이 이긴다.
function ranges(   ){
  if(!P_ADRG_S) P_ADRG_S=M_ADRG_S;   if(!P_ADRG_E) P_ADRG_E=M_ADRG_E;
  if(!P_BODY_S) P_BODY_S=P_ADRG_E+1; if(!P_BODY_E) P_BODY_E=M_PRIO_S-1;
  if(!P_PRIO_S) P_PRIO_S=M_PRIO_S;   if(!P_PRIO_E) P_PRIO_E=M_PRIO_E;
  if(!P_CCL_S)  P_CCL_S=M_CCL_S;     if(!P_CCL_E)  P_CCL_E=M_SEV_S-1;
  if(!P_SEV_S)  P_SEV_S=M_SEV_S;
  printf "쪽 범위 — ADRG목록 %d~%d · 본문 %d~%d · 우선순위 %d~%d · 부표1 %d~%d · 부표2 %d~\n",
    P_ADRG_S,P_ADRG_E,P_BODY_S,P_BODY_E,P_PRIO_S,P_PRIO_E,P_CCL_S,P_CCL_E,P_SEV_S > "/dev/stderr";
}

# ---------- 줄 다듬기 ----------
function isnoise(f,   t){
  t=f; gsub(/^[ \t]+|[ \t]+$/,"",t);
  if(t=="") return 1;
  if(t ~ /^(MDC|Pre MDC|Pre|ADRG|DRGs|KDRG|목록|중증도|분류|우선순위|외과적|내과적)$/) return 1;
  if(t ~ /^\([A-Z]\)$/) return 1;                       # (A) ~ (Z) 쪽옆 표시
  # MDC 번호 — 우선순위 표에서는 맨 앞 칸이 순위 숫자라 지우면 안 된다
  if(!KEEPNUM && t ~ /^[0-9]{1,2}(-[0-9])?$/) return 1;
  if(t ~ /^[0-9]{1,4}[ \t]+KDRG$/) return 1;            # 짝수쪽 발
  if(t ~ /^MDC[ \t].*[0-9]{1,4}$/) return 1;            # 홀수쪽 러닝헤더
  if(t ~ /^Pre MDC[ \t]+[0-9]{1,4}$/) return 1;
  return 0;
}
function fields(line, A,   n,i,B,s,e,m,t){
  gsub(/\r/,"",line);
  t=line; gsub(/^[ \t]+|[ \t]+$/,"",t);
  # 쪽 머리글·발글은 줄 전체를 버린다 (칸으로 쪼개지면 앞뒤 걷어내기로는 안 떨어진다)
  if(t ~ /^MDC[ \t]*[0-9]{2}(-[0-9])?\./) return 0;
  if(t ~ /^Pre MDC([ \t]|$)/ && t !~ /[가-힣]/) return 0;
  if(t ~ /^[0-9]{1,4}[ \t]+KDRG([ \t]|$)/) return 0;
  n=split(line, B, /[ \t][ \t]+/);
  s=1; while(s<=n && isnoise(B[s])) s++;
  e=n; while(e>=s && isnoise(B[e])) e--;
  m=0;
  for(i=s;i<=e;i++){ t=B[i]; gsub(/^[ \t]+|[ \t]+$/,"",t); if(t=="") continue; m++; A[m]=t }
  for(i=m+1;i<=n+2;i++) delete A[i];
  IND=(m>0? index(line, A[1])-1 : 0);   # 첫 칸이 몇 번째 글자에서 시작하나 (부표2 이어지는 줄 가르기)
  return m;
}
function esc(s){ gsub(/\\/,"\\\\",s); gsub(/"/,"\\\"",s); return s }
function jf(i,from,to,   j,s){ s=""; for(j=from;j<=to;j++){ if(F[i,j]=="") continue; if(s!="") s=s" "; s=s F[i,j] } return s }

# ---------- 1차: 쪽을 읽어 줄을 모은다 ----------
{
  page=NR;
  # 구간 표시 — 쪽 전체를 보고 찾는다
  if($0 ~ /Partition/){ if(!M_ADRG_S) M_ADRG_S=page; M_ADRG_E=page }
  if($0 ~ /외과적/ && $0 ~ /소분류/){ if(!M_PRIO_S) M_PRIO_S=page; M_PRIO_E=page }
  if($0 ~ /기타 *진단의 *중증도 *점수 *규정/ && !M_CCL_S) M_CCL_S=page;
  if($0 ~ /\(부표 *2\)/ && $0 ~ /중증도 *구분 *기준/ && !M_SEV_S) M_SEV_S=page;

  # 우선순위 쪽에서는 맨 앞 칸이 순위 숫자라 여백 장식으로 지우면 안 된다
  KEEPNUM=($0 ~ /외과적/ && $0 ~ /소분류/);
  nl=split($0,L,"\n");
  for(li=1;li<=nl;li++){
    raw=L[li]; gsub(/\r/,"",raw); t=raw; gsub(/^[ \t]+|[ \t]+$/,"",t);
    # MDC 는 장식을 걷어내기 전 원본 줄에서 읽는다 (걷어내면 머리글이 사라진다)
    if(t ~ /Pre MDC/) curmdc="00";
    else if(match(t, /MDC[ \t]*(0[1-9]|1[0-9]|2[0-3])(-[12])?/, mm)) curmdc=mm[1] mm[2];
    m=fields(raw,A);
    if(m==0) continue;
    N++; PG[N]=page; NC[N]=m; MD[N]=curmdc; LI[N]=IND;
    for(i=1;i<=m;i++) F[N,i]=A[i];
    W[N]=jf(N,1,m);
  }
}

# ---------- 줄 갈래 ----------
# GRP  A01 간 이식술            DRG  D101 내시경을 …      ENG  영문명
# HDR  시술명 table1 (다음 줄이 표의 행)     DEF  정의식
# ROW  자114주 O1141 명칭       KCD  진단목록 줄
function kind(i,   m,f1,f2,w){
  m=NC[i]; f1=F[i,1]; f2=F[i,2]; w=W[i];
  if(m>=2 && f1 ~ /^[A-Z][0-9]{2}$/  && f2 ~ /[가-힣]/) return "GRP";
  if(m>=2 && f1 ~ /^[A-Z][0-9]{3,4}$/ && f2 ~ /[가-힣]/) return "DRG";
  # 시술 행 — 보험코드 · 시술코드 · 명칭. 칸 사이가 한 칸뿐인 줄도 있어 줄 전체로 본다.
  if(rowsplit(w)) return "ROW";
  if(w ~ /^(시술명|주진단명|부가코드|기타진단|기타진단명|주진단명 또는 기타진단명)[0-9]*( ?[Tt]able ?[0-9]*)?$/) return "TBLNAME";
  # MDC 전체가 함께 쓰는 진단 표
  #   MDC 08  Diagnosis table1(슬관절 질환) … 부위별 11개
  #   MDC 15  신생아의 주요 문제(table 1)
  # 판에 따라 한글과 영문이 뒤섞여 나온다 — 1.6 「Diagnosis table1(슬관절 질환)」,
  # 1.5 「Diagnosis 슬관절 table1( 질환)」. 앞이 Diagnosis 이고 tableN 이 있으면 표 이름으로 본다
  # (정의식은 「Diagnosis table9(족부 질환) and 시술명」처럼 and/or 가 붙는다).
  if(w ~ /^Diagnosis[ \t]/ && w ~ /[Tt]able[ \t]*[0-9]+/ && w !~ /( and | or |not )/) return "DXTBL";
  if(w ~ /\([Tt]able[ \t]*[0-9]+\)$/) return "DXTBL";
  if(w ~ /(시술명|주진단명|부가코드|인공호흡|주진단|기타진단)/ && w ~ /( and | or |not |\(|table)/) return "DEF";
  # 시술·진단 표를 가리키지 않는 조건식 (예: 입원시 체중 < 750g · 재원기간 < 5일 · Any OR Procedures)
  # 「Any Other OR Procedures」처럼 Any 와 OR 사이에 낱말이 끼는 것도 있다(Q02)
  if(w ~ /(입원시|재원기간|퇴원유형|인공호흡|연령|체중|모든 주진단|주진단명|출생시)/) return "DEF";
  if(w ~ /[Aa]ny([ \t]+[A-Za-z]+)?[ \t]+OR[ \t]+[Pp]rocedure/) return "DEF";
  # 「At least 2 procedures in the following table」 — 바로 뒤의 표에서 둘 이상 (G102 복수 항문 수술)
  if(w ~ /^[Aa]t least [0-9]+ (procedures?|diagnos)/) return "DEF";
  return "TXT";
}
function haskcd(i,   j){ for(j=1;j<=NC[i];j++) if(F[i,j] ~ /^[A-Z][0-9]{2,5}$/) return 1; return 0 }
# 시술 행이면 R1(보험코드) · R2(시술코드) · R3(명칭)에 담고 1 을 돌려준다.
# 보험코드 칸은 비어 있을 수 있고(앞줄에서 이어짐) 칸 사이가 한 칸뿐인 줄도 있다.
function rowsplit(w,   mm){
  R1=""; R2=""; R3="";
  if(match(w, /^([^ \t]+)[ \t]+([A-Z]{1,3}[0-9]{2,4})[ \t]+(.+)$/, mm)){
    if(mm[1] ~ /^[A-Z][0-9]{2,4}$/) return 0;          # ADRG 머리줄이다
    R1=mm[1]; R2=mm[2]; R3=mm[3]; return 1;
  }
  # 보험코드 칸이 빈 행 — 시술 표를 읽는 중일 때만 본다.
  # 아무 데서나 보면 「N02 및 N03의 주진단명 …」 같은 정의식이 시술 행으로 잘못 읽힌다(N041).
  if(tname ~ /시술명|부가코드/ && match(w, /^([A-Z]{1,3}[0-9]{2,4})[ \t]+([^A-Z].*)$/, mm)){
    R1=""; R2=mm[1]; R3=mm[2]; return 1;
  }
  return 0;
}

# ---------- 표 담기 ----------
function tbl_open(nm){ tbl_close(); tname=nm; trows=0; tkcds=0 }
function tbl_close(   j,s){
  if(tname==""){ return }
  ntbl++; TNAMES[ntbl]=tname;
  s="";
  if(trows>0){
    for(j=1;j<=trows;j++){ s=s (j>1?",":"") "[\"" esc(TR1[j]) "\",\"" esc(TR2[j]) "\",\"" esc(TR3[j]) "\"]" }
    printf "{\"t\":\"tbl\",\"ts\":%d,\"name\":\"%s\",\"rows\":[%s]}\n", TS, esc(tname), s;
  } else if(tkcds>0){
    for(j=1;j<=tkcds;j++){ s=s (j>1?",":"") "\"" TK[j] "\"" }
    printf "{\"t\":\"tbl\",\"ts\":%d,\"name\":\"%s\",\"kcd\":[%s]}\n", TS, esc(tname), s;
  }
  tname=""; trows=0; tkcds=0;
}
function tbl_row(a,b,c){ trows++; TR1[trows]=a; TR2[trows]=b; TR3[trows]=c }
function tbl_kcd(i,   j){ for(j=1;j<=NC[i];j++) if(F[i,j] ~ /^[A-Z][0-9]{2,5}$/){ tkcds++; TK[tkcds]=F[i,j] } }

# ---------- 정의 묶음 ----------
function defs_reset(){ nd=0 }
function defs_flush(   j,d){
  tbl_close();
  if(nd==0){ ntbl=0; return }
  for(j=1;j<=nd;j++){
    d=DD[j];
    # 정의식이 따로 없으면 — 표가 하나뿐이면 그 표, 표도 없으면 주진단만으로 배정되는 질병군
    if(d=="" && ntbl==1) d=TNAMES[1];
    if(DE[j]=="" && DC[j]==DG[j] "0") DE[j]=grpe;
    printf "{\"t\":\"drg\",\"c\":\"%s\",\"mdc\":\"%s\",\"grp\":\"%s\",\"n\":\"%s\",\"e\":\"%s\",\"def\":\"%s\",\"ts\":%d}\n",
      DC[j], DM[j], DG[j], esc(DN[j]), esc(DE[j]), esc(d), TS;
  }
  nd=0; ntbl=0; TENT=0; TS++;
}
function defs_add(c,mdc,grp,n){ nd++; DC[nd]=c; DM[nd]=mdc; DG[nd]=grp; DN[nd]=n; DE[nd]=""; DD[nd]="" }

# 정의식 한 줄을 건다.
#   책은 **연령만 다른 질병군을 줄줄이 적고 정의식을 그 뒤에 한 번만** 적는다.
#     G0951 … 연령 ≤7세 / G0952 … 7세＜연령＜70세 / G0953 … 연령 ≥70세
#     시술명 table1 and 부가코드1        ← 셋이 함께 쓰는 정의식
#   그래서 마지막 하나가 아니라 **아직 정의식이 없는 것 모두**에 건다.
#   질병군마다 정의식이 따로 붙는 곳(E631 · E632 …)은 자기 것이 붙을 때 하나만 비어 있어 그대로 맞다.
#   앞줄에서 이어지는 정의식은 마지막 것에 잇는다.
function def_put(w,   z){
  if(nd==0) return;
  if(lastwas=="DEF" && DD[nd]!=""){ DD[nd]=DD[nd]" "w; return }
  for(z=1; z<=nd; z++) if(DD[z]=="") DD[z]=w;
}

END{
  ranges();
  for(i=1;i<=N;i++){
    p=PG[i]; m=NC[i]; w=W[i]; f1=F[i,1]; f2=F[i,2]; mdc=MD[i];

    # ---------- ADRG 목록 ----------
    if(p>=P_ADRG_S && p<=P_ADRG_E){
      if(m>=3 && f1 ~ /^[A-Z][0-9]{3}$/ && f2 ~ /^[SMO]$/)
        printf "{\"t\":\"adrg\",\"c\":\"%s\",\"p\":\"%s\",\"mdc\":\"%s\",\"n\":\"%s\"}\n", f1, f2, mdc, esc(jf(i,3,m));
      continue;
    }

    # ---------- 본문 ----------
    if(p>=P_BODY_S && p<=P_BODY_E){
      # MDC별 KCD 주진단 목록
      if(w ~ /분류(된|되는) KCD 주진단명/){ defs_flush(); dxmode=1; dxmdc=mdc; dxpart=""; ndx=0; continue }
      k=kind(i);
      # 다음 줄이 **코드만 있는 줄**이면 이 줄은 그 코드의 이름이다 — 정의식이 아니다.
      # 질병군 이름에 「연령」·「체중」이 들어가 정의식으로 잘못 읽히던 것을 막는다
      #   「적혈구 질환, 연령 세 >17」 다음 줄에 「Q6102」 — 이름이지 조건식이 아니다.
      nextlone = (i<N && NC[i+1]==1 && F[i+1,1] ~ /^[A-Z][0-9]{2,4}$/);
      if(k=="DEF" && nextlone && w ~ /[가-힣]/ && w !~ /(시술명|주진단명|부가코드|기타진단|[Tt]able)/) k="TXT";
      # 판에 따라 **한글명이 코드보다 앞줄에** 찍힌다(1.5 · 1.4). 코드만 있는 줄이면 앞줄에서 이름을 가져온다.
      #     골반적출술, 근치적 자궁절제술 …    ← 한글명
      #   N01                                ← 코드 (혼자)
      #     PELVIC EVISCERATION, …           ← 영문명
      # 진단 목록을 읽는 중(dxmode)에도 이걸 먼저 봐야 목록이 끝난 줄 안다.
      if(k=="TXT" && m==1 && f1 ~ /^[A-Z][0-9]{2,4}$/ && PK=="TXT" && PW ~ /[가-힣]/ && PW !~ /^[A-Z][0-9]/){
        w=f1" "PW; NC[i]=2; F[i,1]=f1; F[i,2]=PW; W[i]=w; m=2; f2=PW;
        k=(length(f1)==3? "GRP" : "DRG");
      }
      PK=k; PW=W[i];
      if(dxmode){
        # MDC 18-1(HIV)만 주진단 목록이 표 세 개로 나뉘어 있다
        # (HIV 주진단명 table1 or (HIV 관련 주진단명 table2 and HIV 기타진단명 table3)).
        # 표 이름이 나오면 앞 표를 내보내고 새 표로 넘어간다 — 조건을 그대로 따지려면 나뉘어 있어야 한다.
        if(k=="TBLNAME" || (k=="DEF" && w ~ /table/)){
          if(w ~ /table[0-9]*$/ && w !~ /( and | or |not |\()/){ dx_emit(); dxpart=w }
          continue;
        }
        if(k=="GRP" || k=="DRG"){ dx_emit(); dxmode=0 }
        else { if(haskcd(i)) for(j=1;j<=m;j++) if(F[i,j] ~ /^[A-Z][0-9]{2,5}$/){ ndx++; DX[ndx]=F[i,j] } ; continue }
      }
      # MDC 08 끝의 부위별 진단 표 — 어느 질병군에도 매이지 않고 MDC 전체가 함께 쓴다.
      # 정의식에서 「Diagnosis Table6(견부 질환)」처럼 이름으로 부른다.
      if(k=="DXTBL"){
        # 표가 시작되기 전에 **차례**로 표 이름만 줄줄이 적어 둔 데가 있다(1.4 · 1.5).
        # 바로 다음 줄도 표 이름이면 그건 차례 줄이라 건너뛴다.
        if(i<N && kind(i+1)=="DXTBL") continue;
        defs_flush(); dt_emit(); dtmdc=mdc; dtname=w; ndt=0; dtmode=1; continue;
      }
      if(dtmode){
        if(k=="GRP" || k=="DRG"){ dt_emit(); dtmode=0 }
        else { if(haskcd(i)) tbl_dt(i); continue }
      }
      if(k=="GRP"){
        defs_flush(); grp=f1; grpn=jf(i,2,m); grpe=""; wantgrpe=1; lastwas="GRP";
        # 그룹이 더 쪼개지지 않으면 그룹 자체가 질병군이다(예: D09 → D090).
        # 바로 뒤에 4~5자리 질병군이 나오면 이 임시 항목을 물린다.
        defs_add(grp "0", mdc, grp, grpn); TENT=1;
        continue;
      }
      if(k=="DRG"){
        if(TENT && nd==1){ nd=0; TENT=0 }
        else if(tname!="" || trows>0 || tkcds>0) defs_flush();
        defs_add(f1, mdc, grp, jf(i,2,m)); lastwas="DRG"; continue;
      }
      if(k=="TBLNAME"){
        # 다음 줄이 표의 행이면 표 머리, 아니면 정의식
        nx=i+1; nk=(nx<=N? kind(nx) : "TXT");
        # 진단표 머리인지 보려고 다음 줄에 KCD 가 있나 보는데, 질병군 머리줄(B666 …)도 KCD 처럼 생겼다.
        # 그래서 다음 줄이 GRP·DRG 면 표 머리가 아니라 정의식으로 본다.
        dxhead = (nx<=N && nk!="GRP" && nk!="DRG" && w ~ /(주진단명|기타진단)/ && haskcd(nx));
        adchead = (nx<=N && w ~ /부가코드/ && F[nx,1]=="부가코드");
        if(nk=="ROW" || dxhead || adchead){
          if(nd==0 && grp!=""){ defs_add(grp "0", mdc, grp, grpn); DE[nd]=grpe }
          TENT=0; tbl_open(w);
        } else {
          def_put(w);
        }
        lastwas=k; continue;
      }
      if(k=="DEF"){
        # 그룹 머리 바로 뒤의 정의식이면 그룹 자체가 질병군이다 (예: R04 → R040)
        if(nd==0 && grp!=""){ defs_add(grp "0", mdc, grp, grpn); DE[nd]=grpe }
        def_put(w);
        TENT=0; lastwas="DEF"; continue;
      }
      if(tname!="" && tname ~ /(주진단명|기타진단)/){ if(haskcd(i)) tbl_kcd(i); lastwas="KCD"; continue }
      if(k=="ROW" && tname!=""){ rowsplit(w); tbl_row(R1,R2,R3); lastwas="ROW"; continue }
      # 영문명
      if(w ~ /^[A-Za-z(]/ && (lastwas=="GRP" || lastwas=="DRG" || lastwas=="ENG")){
        if(lastwas=="GRP" || (lastwas=="ENG" && wantgrpe)){ grpe=(grpe==""? w : grpe" "w); wantgrpe=1 }
        else if(nd>0) DE[nd]=(DE[nd]==""? w : DE[nd]" "w);
        lastwas="ENG"; continue;
      }
      lastwas="TXT"; continue;
    }

    # ---------- 우선순위 ----------
    if(p>=P_PRIO_S && p<=P_PRIO_E){
      defs_flush();
      if(m>=3 && f1 ~ /^[0-9]{1,3}$/ && f2 ~ /^([A-Z][0-9]{3}|[0-9]{3})$/)
        printf "{\"t\":\"prio\",\"mdc\":\"%s\",\"r\":%s,\"a\":\"%s\",\"e\":\"%s\"}\n", mdc, f1, f2, esc(jf(i,3,m));
      continue;
    }

    # ---------- (부표 1) 기타 진단 중증도 점수 ----------
    if(p>=P_CCL_S && p<=P_CCL_E){
      n2=split(w, T, /[ \t]+/);
      for(j=1;j<=n2;j++)
        if(T[j] ~ /^[A-Z][0-9]{2,5}$/ && T[j+1] ~ /^[0-4]$/ && T[j+2] ~ /^[0-4]$/){
          printf "{\"t\":\"ccl\",\"kcd\":\"%s\",\"s\":%s,\"m\":%s}\n", T[j], T[j+1], T[j+2]; j+=2;
        }
      continue;
    }

    # ---------- (부표 2) AADRG별 중증도 구분 ----------
    if(p>=P_SEV_S){
      sev_line(i,m);
      continue;
    }
  }
  sev_flush(); dt_emit(); defs_flush();
}

function tbl_dt(i,   j){ for(j=1;j<=NC[i];j++) if(F[i,j] ~ /^[A-Z][0-9]{2,5}$/){ ndt++; DT[ndt]=F[i,j] } }
function dt_emit(   j,s){
  if(ndt==0 || dtname=="") return;
  s=""; for(j=1;j<=ndt;j++) s=s (j>1?",":"") "\"" DT[j] "\"";
  printf "{\"t\":\"dxtbl\",\"mdc\":\"%s\",\"name\":\"%s\",\"kcd\":[%s]}\n", dtmdc, esc(dtname), s;
  ndt=0; dtname="";
}
function dx_emit(   j,s){
  if(ndx==0) return;
  s=""; for(j=1;j<=ndx;j++) s=s (j>1?",":"") "\"" DX[j] "\"";
  printf "{\"t\":\"mdcdx\",\"mdc\":\"%s\",\"part\":\"%s\",\"kcd\":[%s]}\n", dxmdc, esc(dxpart), s;
  ndx=0;
}

# 부표2 — 왼쪽에 AADRG(4자리)+명칭, 오른쪽에 DRG(6자리)+중증도 구분 기준
function sev_line(i,m,   j,pos,a,rest,mm){
  pos=0;
  for(j=1;j<=m;j++) if(F[i,j] ~ /^[A-Z][0-9]{5}$/){ pos=j; break }
  # AADRG 와 명칭 사이가 **한 칸뿐인 줄**도 있다 — 「Q6102 Red Blood Cell Disorders, Age >17」.
  # 칸으로 나누면 한 칸에 붙어 나오므로 앞머리에서 코드를 떼어 낸다.
  if(m>=1 && match(F[i,1], /^([A-Z][0-9]{4})([ \t]+(.*))?$/, mm)){
    sev_flush();
    sa=mm[1];
    sn=mm[3];
    rest=(pos>1? jf(i,2,pos-1) : jf(i,2,m));
    if(rest!="") sn=(sn==""? rest : sn" "rest);
    snr=0; sleft=LI[i];
  } else if(pos>1 && sa!=""){
    sn=sn" "jf(i,1,pos-1);
  } else if(pos==0 && sa!=""){
    # DRG 6자리가 없는 이어지는 줄 — 왼쪽에서 시작하면 명칭, 오른쪽(기준 칸)이면 구분 기준이다
    if(snr>0 && LI[i]>sleft+25) SR2[snr]=SR2[snr]" "W[i]; else sn=sn" "W[i];
    return;
  }
  if(pos>0){ snr++; SR1[snr]=F[i,pos]; SR2[snr]=jf(i,pos+1,m) }
}
function sev_flush(   j,s){
  if(sa=="") return;
  s=""; for(j=1;j<=snr;j++) s=s (j>1?",":"") "[\"" SR1[j] "\",\"" esc(SR2[j]) "\"]";
  printf "{\"t\":\"sev\",\"a\":\"%s\",\"n\":\"%s\",\"rows\":[%s]}\n", sa, esc(sn), s;
  sa=""; sn=""; snr=0;
}
