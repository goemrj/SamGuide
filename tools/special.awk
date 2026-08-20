# 산정특례 목록 TSV(구분·특정기호·상병코드·상병일련번호·질환명) → JSON
# TSV는 Excel COM으로 「산정특례_질환별_등록기준」 엑셀에서 시트별로 열을 골라 뽑은 것이다.
function jesc(s){ gsub(/\\/, "\\\\", s); gsub(/"/, "\\\"", s); gsub(/\r/, "", s); return s }

BEGIN { FS = "\t" }

$4 == "" { next }        # 상병일련번호가 없는 줄은 표가 아니라 시트 안내문이다

{
  printf "%s{\"g\":\"%s\",\"sym\":\"%s\",\"code\":\"%s\",\"seq\":\"%s\",\"name\":\"%s\"}",
    (n++ ? ",\n" : ""), jesc($1), jesc($2), jesc($3), jesc($4), jesc($5)
}

END { print "" }
