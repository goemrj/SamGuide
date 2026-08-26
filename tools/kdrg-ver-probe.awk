# ------------------------------------------------------------------
# 심평원 신포괄 그루퍼가 **어느 판(진료일)까지 돌리는지** 재는 도구.
#
#   LC_ALL=C awk -v QUIET=1 -f tools/kdrg-in.awk "…P020.GHP" > nb1.in
#   LC_ALL=C awk -v NREC=250 -v DATES=20220101,20240101,20240701,20260101 \
#                -f tools/kdrg-ver-probe.awk nb1.in > probe.in
#   # probe.in 을 Npo_kdrg11.in 자리에 놓고 Npo_kdrg11.exe 실행 → .out 에서 답을 비교
#
# 하는 일 — 명세서 하나를 **요양개시일만 바꿔 여러 벌** 만든다. 같은 환자·같은 시술인데
# 진료일만 다르니, 답이 달라지면 그루퍼가 그 날짜에서 다른 마스터를 쓴 것이다.
# (매뉴얼 4쪽 「동일 파일명에 숫자가 추가된 파일은 요양개시일 기준으로 다른 마스터를 참고하기 위함」)
#
# **나이를 정확히 고정하는 것이 요령이다.** 날짜를 밀면 나이도 같이 밀려서, 나이 조건이 뒤집힌 것을
# 판이 바뀐 것으로 잘못 읽는다(2026-08-26 에 실제로 그랬다 — 분기마다 답이 바뀌는 것처럼 보였다).
# 그래서 생년월일을 「목표일 − 원래나이」로 다시 만든다. 월·일을 목표일과 같게 두면 나이가 딱 맞는다.
# 주민번호 뒷자리 첫 글자(성별)는 세기를 뜻하므로 생년이 2000년을 넘나들면 1/2 ↔ 3/4 로 맞춘다.
#
# 되짚을 열쇠는 공란(306)에 **레코드번호 2자리 + 날짜번호 2자리** 로 적는다.
#
#   -v NREC=250              앞에서 몇 건까지 쓸지
#   -v DATES=YYYYMMDD,…      재 볼 요양개시일 목록
#
# **`LC_ALL=C` 로 돌린다** — 자리로 짜인 서식이라 글자수가 아니라 바이트로 세야 한다.
# ------------------------------------------------------------------
function cen(dig){ return (dig==1||dig==2||dig==5||dig==6) ? 1900 : (dig==9||dig==0) ? 1800 : 2000 }
BEGIN{ nd=split(DATES,D,","); if(nd==0){ print "DATES 를 넘겨 주세요" > "/dev/stderr"; exit 1 } }
NR<=NREC{
  start=substr($0,22,8); j=substr($0,9,13);
  dig=substr(j,7,1)+0;
  by=cen(dig)+substr(j,1,2); bm=substr(j,3,2)+0; bd=substr(j,5,2)+0;
  sy=substr(start,1,4)+0; sm=substr(start,5,2)+0; sd=substr(start,7,2)+0;
  age=sy-by; if(sm<bm || (sm==bm && sd<bd)) age--;
  if(age<0) next;                                  # 주민번호를 못 읽은 줄은 건너뛴다
  for(i=1;i<=nd;i++){
    ty=substr(D[i],1,4)+0; tmd=substr(D[i],5,4);
    nby=ty-age;                                    # 목표일에 나이가 딱 age 가 되는 생년
    ndig=(nby<2000) ? ((dig%2)?1:2) : ((dig%2)?3:4);
    nj=sprintf("%02d%s%d999999", nby%100, tmd, ndig);
    d=substr($0,1,8) nj substr($0,22);             #   9 주민번호
    d=substr(d,1,21) D[i] substr(d,30);            #  22 요양개시일
    print substr(d,1,305) sprintf("%02d%02d", NR, i) substr(d,310);   # 306 공란 = 레코드+날짜
  }
}
END{ if(!QUIET) printf "명세서 %d건 × 날짜 %d개\n", (NR<NREC?NR:NREC), nd > "/dev/stderr" }
