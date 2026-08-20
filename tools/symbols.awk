# 특정기호 목록 TSV(특정기호·한글명칭·적용일자·종료일자) → JSON
# TSV 는 Excel COM 으로 「특정기호_YYYYMMDD.xlsx」 첫 시트를 뽑은 것이고,
# 날짜는 엑셀 시리얼값이라 뽑을 때 yyyy.MM.dd 로 바꿔 둔다.
function jesc(s){ gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s); gsub(/\r/, "", s); return s }

BEGIN { FS = "\t"; print "const SYMBOLS = {" }

$1 == "" { next }

{
  printf "%s  \"%s\": {n:\"%s\", from:\"%s\", to:\"%s\"}",
    (n++ ? ",\n" : ""), jesc($1), jesc($2), jesc($3), jesc($4)
}

END { print "\n};" }
