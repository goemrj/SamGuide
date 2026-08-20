# 세부작성요령 Ⅸ. 특정내역 구분코드 작성요령(211~253쪽) → JSON 변환
# pdftotext -table 출력은 "구분코드 | 특정내역(이름) | 작성요령" 3단 표를 공백으로 정렬해 준다.
# 쪽마다 3번째 단이 시작하는 칸 위치가 다르므로, 그 쪽에서 가장 왼쪽에 나온 '♦' 위치를 단 경계로 삼는다.
# ※ 반드시 UTF-8 로케일(LC_ALL=C.UTF-8)에서 돌려야 substr/index가 글자 단위로 동작한다.

function trim(s){ gsub(/^[ ]+/,"",s); gsub(/[ ]+$/,"",s); return s }
function rtrim(s){ gsub(/[ ]+$/,"",s); return s }
function jesc(s){ gsub(/\\/,"\\\\",s); gsub(/"/,"\\\"",s); gsub(/\r/,"",s); return s }

function isSkip(l){
  if (l ~ /^[ ]*-[ ]*[0-9]+[ ]*-[ ]*$/) return 1                 # 쪽번호
  if (l ~ /^[ ]*구분.*특정내역.*작성요령/) return 1               # 표 머리글
  if (l ~ /^[ ]*코드[ ]*$/) return 1
  if (l ~ /특정내역 구분코드 작성요령/) return 1                   # 장 제목
  if (l ~ /^[ ]*[0-9]+\..*특정내역 항목/) return 1                # 절 제목
  return 0
}

function unitOf(c){
  if (c ~ /^M/) return "명일련단위"
  if (c ~ /^J/) return "줄번호단위"
  if (c ~ /^C/) return "처방내역단위"
  return ""
}

function flush(   i, txt, minInd, ind, n, out){
  if (code == "") return
  # 뒤쪽 빈 줄 제거
  while (nb > 0 && trim(body[nb]) == "") nb--
  # 공통 들여쓰기만큼 왼쪽으로 당긴다
  minInd = 9999
  for (i = 1; i <= nb; i++){
    if (trim(body[i]) == "") continue
    ind = match(body[i], /[^ ]/) - 1
    if (ind < minInd) minInd = ind
  }
  if (minInd == 9999) minInd = 0
  # -table 출력은 모든 줄 사이에 빈 줄을 하나씩 끼워 넣는다. 빈 줄 k개 → k/2개로 줄여
  # 원문의 문단 구분(빈 줄 2개 이상)만 남긴다.
  txt = ""; blanks = 0; first = 1
  for (i = 1; i <= nb; i++){
    if (trim(body[i]) == ""){ blanks++; continue }
    if (!first) { txt = txt "\\n"; for (n = 0; n < int(blanks / 2); n++) txt = txt "\\n" }
    txt = txt substr(body[i], minInd + 1)
    blanks = 0; first = 0
  }
  printf "{\"code\":\"%s\",\"name\":\"%s\",\"unit\":\"%s\",\"page\":%d,\"format\":\"%s\",\"since\":\"%s\",\"body\":\"%s\"},\n",
    jesc(code), jesc(trim(name)), unitOf(code), page0, jesc(fmt), jesc(since), jesc(txt)
  code=""; name=""; fmt=""; since=""; nb=0
}

BEGIN { p = START; lastC = 17; printed = 0 }

# 1차: 쪽별 3번째 단 시작 칸
NR == FNR {
  if (index($0, "\f")) { p++; next }
  i = index($0, "♦")
  if (i > 0 && (!(p in C) || i < C[p])) C[p] = i
  next
}

FNR == 1 { p = START }

{
  if (index($0, "\f")) { p++; next }
  line = $0
  if (isSkip(line)) next

  c = (p in C) ? C[p] : lastC
  lastC = c

  left  = substr(line, 1, c - 1)
  right = rtrim(substr(line, c))

  if (left ~ /^[A-Z][A-Z][0-9][0-9][0-9]/){
    flush()
    code = substr(left, 1, 5)
    name = trim(substr(left, 6))
    page0 = p
    nb = 0
    nameOpen = 1
  } else if (nameOpen && trim(left) != ""){
    # 이름은 셀 맨 윗줄부터 이어서 줄바꿈된다 — 첫 단이 빈 줄이 나오면 이름은 거기서 끝
    name = (name == "" ? trim(left) : name " " trim(left))
  } else if (rtrim(line) != ""){
    # 이름이 끝난 뒤로는 첫 단 자리까지 삐져나온 표(예: MT018 본인부담구분코드 표)도
    # 잘리지 않게 줄 전체를 본문으로 쓴다
    if (trim(left) != "") right = rtrim(line)
    if (nameOpen) nameOpen = 0
  }

  if (code == "") next                       # 표 시작 전 잡줄

  if (right != "" || nb > 0){ nb++; body[nb] = right }

  # 항목 앞 글머리표가 ♦ 인 곳과 ◆ 인 곳이 섞여 있어(원문 혼용) 글머리표는 보지 않는다.
  # "기재형식(상호금기인 경우):" 처럼 단서가 붙는 경우(JT006)가 있어 콜론 앞 단서도 같이 살린다.
  if (right ~ /기재형식[^:]*:/){
    t = right; q = right
    sub(/^.*기재형식/, "", q); sub(/:.*$/, "", q); q = trim(q)
    sub(/^.*기재형식[^:]*:[ ]*/, "", t); t = trim(t)
    one = (q == "" ? t : q " " t)
    fmt = (fmt == "" ? one : fmt " / " one)
  }
  if (right ~ /적용일[^:]*:/){ t = right; sub(/^.*적용일[^:]*:[ ]*/, "", t); if (since == "") since = trim(t) }
}

END { flush() }
