#!/usr/bin/env powershell
# 특정기호 이력 엑셀 → data/symbol-codes.js  (2026-08-24)
#
# 실행:
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/symbols.ps1 "D:\Documents\Downloads\특정기호_20260824.xlsx"
#
# 「특정기호_YYYYMMDD.xlsx」는 기호 하나에 **이력이 여러 줄**이다(명칭이 바뀌면 줄이 하나 늘고
# 앞 줄에 종료일자가 찍힌다). 화면은 기호 하나에 한 줄이므로 이렇게 묶는다.
#   적용일자 = 그 기호의 **가장 이른** 적용일자
#   종료일자 = 그 기호의 **가장 늦은** 종료일자 (아직 살아 있으면 9999.12.31)
#   중간의 명칭 변경은 무시한다 — 2026-08-24 사용자 지정("중간에 이름 바뀐건 신경쓰지 말고").
#
# 명칭은 **이미 data/symbol-codes.js 에 있는 기호는 그대로 둔다.** 두 가지 이유다.
#   1) 앞선 판(특정기호_20260819.xlsx)의 명칭에는 「」 가 붙어 있고 이력 파일에는 없다.
#      둘 다 심평원 원문이라 한쪽으로 고쳐 쓸 근거가 없다 — 화면에 이미 쓰던 글자를 지킨다.
#   2) ⑥ 화면의 F 기호 하이라이트 문구(js/page-special.js 의 SP_F_KEY)가 그 글자에 맞춰져 있다.
# 이력 파일에만 있는 기호(끝난 기호들)는 이력 파일의 **가장 최근 줄** 명칭을 쓴다.
#
# 이 스크립트는 tools/symbols.awk(한 기호 한 줄인 평면 목록용)를 대신한다.
# 엑셀 COM 은 이 PC 에서 정상 동작한다. 이 파일은 **UTF-8 BOM** 으로 저장한다
# (PowerShell 5.1 은 BOM 이 없으면 CP949 로 읽어 한글이 깨진다).

param(
  [Parameter(Mandatory=$true)][string]$Xlsx,
  [string]$Out = ''
)

# $PSScriptRoot 는 param 기본값 자리에서 비어 있을 때가 있어 본문에서 채운다
if ($Out -eq '') {
  $here = Split-Path -Parent $MyInvocation.MyCommand.Path
  $Out = Join-Path $here '..\data\symbol-codes.js'
}
if (-not (Test-Path $Xlsx)) { throw "엑셀을 못 찾았다: $Xlsx" }
$Out = [IO.Path]::GetFullPath($Out)
$src = Split-Path $Xlsx -Leaf

# ---------- 1. 지금 쓰는 명칭을 먼저 읽어 둔다 ----------
$keepName = @{}
if (Test-Path $Out) {
  foreach ($line in [IO.File]::ReadAllLines($Out, [Text.Encoding]::UTF8)) {
    $m = [regex]::Match($line, '^\s*"([A-Z0-9]+)":\s*\{n:"(.*)",\s*from:"')
    if ($m.Success) { $keepName[$m.Groups[1].Value] = $m.Groups[2].Value }
  }
}

# ---------- 2. 이력 엑셀 읽기 ----------
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open($Xlsx, 0, $true)
try {
  $ws = $wb.Sheets(1)
  $v = $ws.UsedRange.Value2          # 셀 하나씩 읽으면 1,080행에 COM 왕복이 4,000번이라 느리다
  $rows = $v.GetLength(0)

  function Cell($c) {
    if ($null -eq $c) { return '' }
    # 엑셀 날짜는 시리얼값. CCYY-MM-DD 로 적는다 — 엑셀 원본에 보이는 꼴이고,
    # 글자 그대로 비교하면 날짜 순서가 된다(2026-08-24 사용자 지정).
    if ($c -is [double]) { return ([datetime]::FromOADate($c)).ToString('yyyy-MM-dd') }
    return ([string]$c).Trim()
  }

  $from = @{}; $to = @{}; $late = @{}; $name = @{}; $n = 0
  for ($r = 2; $r -le $rows; $r++) {
    $code = Cell $v[$r,1]
    if ($code -eq '') { continue }
    $nm = Cell $v[$r,2]; $f = Cell $v[$r,3]; $t = Cell $v[$r,4]
    $n++
    if (-not $from.ContainsKey($code) -or $f -lt $from[$code]) { $from[$code] = $f }
    if (-not $to.ContainsKey($code)   -or $t -gt $to[$code])   { $to[$code]   = $t }
    if (-not $late.ContainsKey($code) -or $f -ge $late[$code]) { $late[$code] = $f; $name[$code] = $nm }
  }
} finally {
  $wb.Close($false)
  $excel.Quit()
}

# ---------- 3. data/symbol-codes.js 쓰기 ----------
function Jesc($s) { return ($s -replace '\\','\\' -replace '"','\"') }

$sb = New-Object System.Text.StringBuilder
$null = $sb.AppendLine("/* ---------- 특정기호 (자동 생성 — 손으로 고치지 말 것) ----------")
$null = $sb.AppendLine("   출처: 「$src」 (다운로드 폴더) — 기호마다 이력이 여러 줄인 파일이다.")
$null = $sb.AppendLine("   적용일자는 가장 이른 값, 종료일자는 가장 늦은 값으로 묶었다(중간의 명칭 변경은 무시).")
$null = $sb.AppendLine("   명칭은 앞선 판(특정기호_20260819.xlsx)에 있던 기호는 그 글자를 그대로 두고,")
$null = $sb.AppendLine("   이력 파일에만 있는 기호는 가장 최근 줄의 명칭을 넣었다.")
$null = $sb.AppendLine("   쓰는 곳: 표에 붙는 기호 배지 툴팁 · ⑥ 특정기호 화면의 F코드·V코드 행과 적용/종료일자.")
$null = $sb.AppendLine("   변환: tools/symbols.ps1 ---------- */")
$null = $sb.AppendLine("const SYMBOLS = {")

$codes = $from.Keys | Sort-Object
$i = 0
foreach ($c in $codes) {
  $i++
  $nm = if ($keepName.ContainsKey($c)) { $keepName[$c] } else { Jesc $name[$c] }
  $comma = if ($i -lt $codes.Count) { ',' } else { '' }
  $null = $sb.AppendLine("  ""$c"": {n:""$nm"", from:""$($from[$c])"", to:""$($to[$c])""}$comma")
}
$null = $sb.AppendLine("};")

[IO.File]::WriteAllText($Out, $sb.ToString(), (New-Object System.Text.UTF8Encoding($false)))
"$src : 이력 $n 줄 → 특정기호 $($codes.Count) 개  ($Out)"
"  이름 그대로 둔 것 $($keepName.Count) 개 · 이력 파일에서 새로 가져온 것 $($codes.Count - $keepName.Count) 개"
