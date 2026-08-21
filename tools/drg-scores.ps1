# 붙임1_DRG별 점수.xlsx  →  data/drg-scores.js
#
#   원본: 심평원 「일자별수가(2026.01.01.기준)」 묶음 안의 붙임1_DRG별 점수.xlsx
#         (7개 질병군 93개 DRG의 입원일수 구간 · 점수당단가 · 일당점수 · 기준점수 ·
#          부인과 가산점수 · 야간공휴점수)
#   쓰는 곳: js/page-drg.js — 질병군(DRG) 계산기
#
#   실행:  powershell -NoProfile -ExecutionPolicy Bypass -File tools\drg-scores.ps1 "<붙임1 경로>"
#          (경로를 안 주면 Downloads 의 기본 위치를 본다)
#
#   시트 구조 (머리줄 2줄)
#     A 질병군분류번호 | B 명칭 | C~E 입원일수(평균·하한·상한)
#     F~H 점수당단가(병원·의원·요양정신) | I~L 일당점수(상급·종합·병원·의원)
#     M~P 기준점수(상급·종합·병원·의원) | Q~T 가산점수(부인과, 상급·종합·병원·의원)
#     U~X 야간공휴점수(상급·종합·병원·의원)
#   ※ 요양·정신병원은 점수 열이 따로 없다 — 병원 점수에 점수당단가 84.2 를 쓴다
#     (붙임2 「요양·정신병원」 시트 값으로 확인함).

param(
  [string]$Src = "D:\Documents\Downloads\일자별수가(2026.01.01.기준)\일자별수가(2026.01.01.기준)\붙임1_DRG별 점수.xlsx"
)

if (-not (Test-Path $Src)) { Write-Error "원본을 찾을 수 없다: $Src"; exit 1 }

$out = Join-Path $PSScriptRoot "..\data\drg-scores.js"
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
$wb = $xl.Workbooks.Open($Src, 0, $true)
$ws = $wb.Worksheets.Item(1)
$last = $ws.UsedRange.Rows.Count

function Num($r, $c) {
  $t = ([string]$ws.Cells.Item($r, $c).Text).Replace(",", "").Trim()
  if ($t -eq "") { return $null }
  return [double]$t
}
function J($s) {
  # JS 문자열 리터럴로 안전하게 — 명칭은 원문 그대로 옮긴다
  return "'" + ([string]$s).Replace("\", "\\").Replace("'", "\'") + "'"
}

$rows = @()
$unit = $null
for ($r = 3; $r -le $last; $r++) {
  $code = ([string]$ws.Cells.Item($r, 1).Text).Trim()
  if ($code -eq "") { continue }
  if ($null -eq $unit) {
    $unit = @{ hosp = (Num $r 6); clinic = (Num $r 7); ltc = (Num $r 8) }
  }
  $gyn = if ($null -eq (Num $r 17)) { "null" }
         else { "[{0},{1},{2},{3}]" -f (Num $r 17), (Num $r 18), (Num $r 19), (Num $r 20) }
  $rows += ("  {{ c:'{0}', n:{1}, avg:{2}, lo:{3}, hi:{4},`n" +
            "    day:[{5},{6},{7},{8}], base:[{9},{10},{11},{12}],`n" +
            "    gyn:{13}, night:[{14},{15},{16},{17}] }},") -f `
    $code, (J $ws.Cells.Item($r, 2).Text), (Num $r 3), (Num $r 4), (Num $r 5),
    (Num $r 9), (Num $r 10), (Num $r 11), (Num $r 12),
    (Num $r 13), (Num $r 14), (Num $r 15), (Num $r 16),
    $gyn,
    (Num $r 21), (Num $r 22), (Num $r 23), (Num $r 24)
}
$wb.Close($false); $xl.Quit()

$head = @"
/* ---------- 질병군(DRG) 점수 — 자동 생성 파일 (손으로 고치지 않는다) ----------
   만든 것: tools/drg-scores.ps1
   원본:    심평원 「일자별수가(2026.01.01.기준)」 / 붙임1_DRG별 점수.xlsx
   내용:    7개 질병군 $($rows.Count)개 DRG — 입원일수(평균·하한·상한) · 일당점수 · 기준점수 ·
            부인과 가산점수(gyn, 없으면 null) · 야간공휴점수
   점수 배열 순서는 모두 [상급종합, 종합병원, 병원, 의원] 이다.
   요양·정신병원은 점수 열이 따로 없어 **병원 점수 + 점수당단가 84.2** 를 쓴다
   (붙임2 「요양·정신병원」 시트 값으로 확인함).
------------------------------------------------------------------ */

/* 점수당 단가 (2026.01.01. 기준) — 상급종합·종합병원·병원은 같은 단가를 쓴다 */
const DRG_UNIT = { hosp: $($unit.hosp), clinic: $($unit.clinic), ltc: $($unit.ltc) };

const DRG_SCORES = [
"@

$body = $rows -join "`n"
$tail = "`n];`n"
Set-Content -Path $out -Value ($head + "`n" + $body + $tail) -Encoding utf8
Write-Host ("생성: {0} ({1}개 질병군)" -f (Resolve-Path $out), $rows.Count)
