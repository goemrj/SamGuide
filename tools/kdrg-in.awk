# ------------------------------------------------------------------
# SAM 신포괄 명세서 → 심평원 신포괄 그루퍼 입력파일(Npo_kdrg11.in)
#
#   LC_ALL=C awk -f tools/kdrg-in.awk "…P020.GHP" > Npo_kdrg11.in
#
# **여기서는 LC_ALL=C 다** (다른 tools/*.awk 와 반대). SAM 은 EUC-KR 바이트 자리로 짜인 서식이라
# 글자수가 아니라 바이트로 세어야 한다. C.UTF-8 로 돌리면 한글이 든 줄에서 자리가 한두 칸씩 밀린다
# (실제로 진료결과가 9 대신 0 으로 잘렸다).
#
# 화면(js/page-kdrg.js)이 낸 분류번호를 **심평원 그루퍼로 검산**하려고 만든 것이다.
# 자리는 「NPO Grouper Program Manual」 붙임1 그대로다.
#
#   요양기관기호 1(8) · 주민번호 9(13) · 요양개시일 22(8) · 입원일수 30(3) · 진료결과 33(1)
#   진단코드1-10 34(60, 6자리×10)      시술코드1-10 94(50, 5자리×10)
#   검사1-5 144(25)  방사선1-5 169(25)  주사및혈액제제1-5 194(25)  마취및호흡치료1-5 219(25)
#   알콜및약물중독재활 244(5)           부가코드1-5 249(25)
#   입원시체중(g) 274(5)               인공호흡시간(hour) 279(5)
#   MDC 284(3) · ADRG 287(4) · PCCL 291(1) · DRG분류번호 292(6) · version 298(8)  ← 그루퍼가 채운다
#   공란 306(100) — 여기에 **명세서일련번호**를 적어 두고 결과를 되짚는다
#
# SAM 의 L항 목번호가 그루퍼 입력항목과 그대로 짝이 된다.
#   51 주사 및 혈액제제 · 52 마취 및 호흡치료 · 53 수술처치 · 54 검사 · 55 방사선 · 56 부가코드
# NCV(알콜·약물중독 재활치료) 코드는 어느 목에 적히든 알콜약물 칸으로 보낸다.
#
# **주민번호는 매뉴얼대로 가린다** — 앞 7자리만 두고 나머지 6자리는 '9' 로 채운다(YYMMDD-□999999).
# 그루퍼가 나이·성별만 보기 때문에 이걸로 충분하고, 입력파일에 주민번호가 그대로 남지 않는다.
# ------------------------------------------------------------------
BEGIN{ FS=""; blank=sprintf("%405s",""); }

function put(s, pos, len, val,   v){
  v=substr(val "" , 1, len);
  return substr(s,1,pos-1) sprintf("%-*s", len, v) substr(s, pos+len);
}
function putr(s, pos, len, val){        # 숫자는 오른쪽 정렬
  return substr(s,1,pos-1) sprintf("%*s", len, substr(val,1,len)) substr(s, pos+len);
}
function cut(line,pos,len,   v){ v=substr(line,pos,len); gsub(/^ +| +$/,"",v); return v }
function flush(   i,s,t){
  if(key=="") return;
  if(form!="P020" && form!="P030"){ reset(); return }
  s=blank;
  s=put(s,1,8,inst);
  s=put(s,9,13, substr(jumin,1,7) "999999");     # 매뉴얼대로 뒷자리를 가린다
  s=put(s,22,8,start);
  s=putr(s,30,3,los);
  s=put(s,33,1,result);
  t=""; for(i=1;i<=10;i++) t=t sprintf("%-6s", dx[i]); s=put(s,34,60,t);
  t=""; for(i=1;i<=10;i++) t=t sprintf("%-5s", op[i]);  s=put(s,94,50,t);
  t=""; for(i=1;i<=5;i++)  t=t sprintf("%-5s", ex[i]);  s=put(s,144,25,t);
  t=""; for(i=1;i<=5;i++)  t=t sprintf("%-5s", rd[i]);  s=put(s,169,25,t);
  t=""; for(i=1;i<=5;i++)  t=t sprintf("%-5s", inj[i]); s=put(s,194,25,t);
  t=""; for(i=1;i<=5;i++)  t=t sprintf("%-5s", anes[i]);s=put(s,219,25,t);
  s=put(s,244,5,ncv);
  t=""; for(i=1;i<=5;i++)  t=t sprintf("%-5s", adc[i]); s=put(s,249,25,t);
  if(wt!="")   s=putr(s,274,5,wt);
  if(vent!="") s=putr(s,279,5,vent);
  s=put(s,306,100, seq " " drg);                 # 되짚을 열쇠 — 명일련 + 파일에 적힌 질병군번호
  sub(/ +$/,"",s);
  print s;
  n++;
  reset();
}
function reset(   i){
  key=""; form=""; inst=""; jumin=""; start=""; los=""; result=""; drg=""; seq="";
  ncv=""; wt=""; vent="";
  for(i=1;i<=10;i++){ dx[i]=""; op[i]="" }
  for(i=1;i<=5;i++){ ex[i]=""; rd[i]=""; inj[i]=""; anes[i]=""; adc[i]="" }
  ndx=0; nop=0; nex=0; nrd=0; ninj=0; nanes=0; nadc=0;
}

NR==1 { next }                                    # 첫 줄은 청구서(H)
{
  t=substr($0,16,1);
  if(t!="A" && t!="B" && t!="C" && t!="E") next;
  k=substr($0,1,10) "|" substr($0,11,5);
  if(k!=key){ flush(); key=k }

  if(t=="A"){
    form=cut($0,17,4); inst=cut($0,21,8); drg=cut($0,45,6);
    seq=substr($0,11,5); jumin=cut($0,134,13);
    los=cut($0,160,3)+0; start=cut($0,66,8); result=cut($0,196,1);
  }
  else if(t=="B"){
    # 최초입원개시일이 비어 있는 명세서가 있다 — 상병내역의 당월요양개시일로 메운다
    if(start=="") start=cut($0,29,8);
    c=cut($0,18,6); if(c=="") next;
    if(cut($0,17,1)=="1"){ dx[1]=c }                        # 주진단은 반드시 첫 자리
    else if(ndx<9){ ndx++; dx[ndx+1]=c }
  }
  else if(t=="C"){
    if(substr($0,17,1)!="L") next;
    mok=substr($0,19,2); c=cut($0,26,9); if(c=="") next;
    # 분류에 쓰이는 코드는 모두 5자리다(O1141 · KK053 · ADC01 · NCV01).
    # SAM 에는 8자리 코드도 섞여 있는데(HA670010 등) 분류집에 없는 것이라 넘기지 않는다 —
    # 넣으면 칸이 밀려 뒤의 코드까지 어긋난다.
    if(length(c)!=5) next;
    if(c ~ /^NCV/){ ncv=c; next }
    if(mok=="53"){ if(nop<10){ nop++; op[nop]=c } }
    else if(mok=="54"){ if(nex<5){ nex++; ex[nex]=c } }
    else if(mok=="55"){ if(nrd<5){ nrd++; rd[nrd]=c } }
    else if(mok=="51"){ if(ninj<5){ ninj++; inj[ninj]=c } }
    else if(mok=="52"){ if(nanes<5){ nanes++; anes[nanes]=c } }
    else if(mok=="56"){ if(nadc<5){ nadc++; adc[nadc]=c } }
  }
  else if(t=="E"){
    d=cut($0,35,5);
    if(d=="MS004" && wt=="")   wt=cut($0,40,5)+0;
    if(d=="MT026" && vent=="") vent=cut($0,40,5)+0;
  }
}
END{ flush(); printf "명세서 %d 건\n", n > "/dev/stderr" }
