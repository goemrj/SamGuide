# 특정내역 = 「특정내역코드_통합본.xlsx」(마스터) + 세부작성요령 PDF Ⅸ장 본문(있는 코드만)
#
# 엑셀 쪽이 마스터인 이유: 의과·산재·자보·DRG·신DRG·한방·요양병원 중 어느 분야에서 쓰는지,
# 적용일자~종료일자(과거 판 포함)까지 들어 있어 코드 수가 더 많다(179코드 272행).
# PDF 쪽은 건강보험 의과 기준이라 코드 수는 적지만(115) 예시·표가 붙은 자세한 작성요령이 있다.
# 두 자료의 코드가 만나면 PDF 본문을 body 로 붙인다.
#
# 인자: SEC9=sec9.jsonl(PDF 변환 결과)  두번째 파일=통합본 TSV
# ※ LC_ALL=C.UTF-8 필요

function trim(s){ gsub(/^[ \t]+/,"",s); gsub(/[ \t]+$/,"",s); return s }
function jesc(s){ gsub(/\\/,"\\\\",s); gsub(/"/,"\\\"",s); gsub(/\r/,"",s); return s }
function yn(v){ v = tolower(trim(v)); return (v == "true" || v == "o" || v == "y") }

BEGIN { FS="\t"; nf = split("의과,산재,자보,DRG,신DRG,한방,요양병원", FIELDNAMES, ",") }

# 1차: PDF 변환 결과에서 code → body, page 를 읽어 둔다
FNR == NR && FILENAME == SEC9 {
  if (match($0, /"code":"[A-Z0-9]+"/)){
    c = substr($0, RSTART + 8, RLENGTH - 9)
    p = ""
    if (match($0, /"page":[0-9]+/)) p = substr($0, RSTART + 7, RLENGTH - 7)
    b = $0
    sub(/^.*"body":"/, "", b)
    sub(/"\},?$/, "", b)
    BODY[c] = b; PAGE[c] = p
    PNAME[c] = pick("name"); PFMT[c] = pick("format"); PUNIT[c] = pick("unit")
  }
  next
}

# 1차 패스에서 쓰는 보조 — 현재 줄($0)에서 "key":"값" 의 값을 꺼낸다
function pick(key,   s){
  s = $0
  if (!match(s, "\"" key "\":\"[^\"]*\"")) return ""
  s = substr(s, RSTART + length(key) + 4, RLENGTH - length(key) - 5)
  return s
}

FNR == 1 { next }              # 통합본 머리글

{
  code = trim($1); if (code == "") next
  rec  = trim($2); name = trim($3); fmt = trim($4)
  from = trim($5); to = trim($6); guide = trim($7)

  fl = ""
  for (k = 1; k <= nf; k++){
    col = 8 + (k - 1) * 2                       # 8,10,12,… = true/false 칸, 그 다음 칸은 "O" 표시
    if (yn($col) || yn($(col + 1))) fl = fl (fl == "" ? "" : ",") "\"" FIELDNAMES[k] "\""
  }

  cur = (to == "99991231") ? "true" : "false"
  # PDF 본문은 현재 판(종료일자 99991231)에만 붙인다 — 지난 판에 붙이면 틀린 설명이 된다
  b  = (cur == "true" && (code in BODY)) ? BODY[code] : ""
  pg = (cur == "true" && (code in PAGE)) ? PAGE[code] : 0

  SEEN[code] = 1
  printf "%s{\"code\":\"%s\",\"rec\":\"%s\",\"name\":\"%s\",\"format\":\"%s\",\"from\":\"%s\",\"to\":\"%s\",\"cur\":%s,\"fields\":[%s],\"guide\":\"%s\",\"page\":%s,\"body\":\"%s\"}",
    (n++ ? ",\n" : ""), jesc(code), jesc(rec), jesc(name), jesc(fmt), jesc(from), jesc(to),
    cur, fl, jesc(guide), (pg == "" ? 0 : pg), b
}

# 통합본에 없고 세부작성요령에만 있는 코드(고시가 통합본보다 최신이거나 약국 등 통합본이 안 다루는 분야)도
# 빠뜨리지 않고 넣는다. 분야·적용일자는 알 수 없으므로 비우고 onlyPdf 로 표시해 화면에서 구분한다.
END {
  # PDF는 발생단위를 "명일련단위/줄번호단위/처방내역단위"로 부르고 통합본은 내역구분을
  # "일반내역/진료내역/처방일반내역"으로 부른다. 화면 필터가 하나로 동작하도록 통합본 쪽 이름으로 맞춘다.
  RECMAP["명일련단위"] = "일반내역"; RECMAP["줄번호단위"] = "진료내역"; RECMAP["처방내역단위"] = "처방일반내역"
  # ── 사용자 확인에 따른 보정 (2026-08-19) ────────────────────────────
  # 통합본에 없고 세부작성요령에만 있는 코드는 분야를 알 수 없어 원래 "분야 미상"으로 넣지만,
  # 아래 두 건은 사용자에게 직접 확인받아 처리한다.
  #   JT009 저함량 배수 조제 의약품 조제사유 — 약국 전용. 이 점검 대상이 아니므로 아예 뺀다.
  #   JT040 만성질환 통합관리 진료 — 의과에서만 쓴다.
  delete BODY["JT009"]
  FIXFIELD["JT040"] = "\"의과\""
  for (c in BODY){
    if (c in SEEN) continue
    r = (PUNIT[c] in RECMAP) ? RECMAP[PUNIT[c]] : PUNIT[c]
    if (c in FIXFIELD){
      printf "%s{\"code\":\"%s\",\"rec\":\"%s\",\"name\":\"%s\",\"format\":\"%s\",\"from\":\"\",\"to\":\"99991231\",\"cur\":true,\"fields\":[%s],\"guide\":\"\",\"page\":%s,\"body\":\"%s\"}",
        (n++ ? ",\n" : ""), jesc(c), jesc(r), jesc(PNAME[c]), jesc(PFMT[c]), FIXFIELD[c],
        (PAGE[c] == "" ? 0 : PAGE[c]), BODY[c]
      continue
    }
    printf "%s{\"code\":\"%s\",\"rec\":\"%s\",\"name\":\"%s\",\"format\":\"%s\",\"from\":\"\",\"to\":\"99991231\",\"cur\":true,\"fields\":[],\"guide\":\"\",\"page\":%s,\"onlyPdf\":true,\"body\":\"%s\"}",
      (n++ ? ",\n" : ""), jesc(c), jesc(r), jesc(PNAME[c]), jesc(PFMT[c]),
      (PAGE[c] == "" ? 0 : PAGE[c]), BODY[c]
  }
  print ""
}
