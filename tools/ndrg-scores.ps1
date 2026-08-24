# 신포괄지불제도 시범사업 지침 PDF + 질병군명칭 xlsx  →  data/ndrg-scores.js
#
#   원본 둘
#     ① 「신포괄지불제도 시범사업 지침 개정(전문)」 PDF — 별표4. 질병군별 평균입원일수,
#        정상군 하한·상한, 점수 등 (지침 215~272쪽 / PDF 221~278쪽)
#        → 평균입원일수 · 정상군 하한일·상한일 · 기준점수 · 기준수가 · 일당점수 · 일당수가 · 구분
#     ② 「신포괄용 KDRG 버전1.6_질병군명칭(변경없음).xlsx」
#        → AADRG 명 · 중증도코드명 (별표4 의 명칭 칸과 같은 글자)
#   쓰는 곳: js/page-ndrg.js — 신포괄 계산기
#
#   실행:  powershell -NoProfile -ExecutionPolicy Bypass -File tools\ndrg-scores.ps1 "<지침 PDF>" "<명칭 xlsx>"
#          (경로를 안 주면 Downloads 의 기본 위치를 본다)
#
# ── 왜 이런 방식인가 ────────────────────────────────────────────────
#   이 PDF 은 폰트가 Adobe-Korea1 CID 인데 유니코드 대응표(ToUnicode)가 없어서
#   pdftotext · 한글 · Word 변환이 모두 **깨진 글자**를 내놓는다. 그런데 깨지는 방식이
#   글리프 하나 → 글자 하나로 **일대일 치환**이라, 대응표를 만들면 되살릴 수 있다.
#   숫자 · 쉼표 · 소수점은 PDF 221쪽을 그림으로 그려 읽은 값과 맞춰 정했고,
#   영문 대문자는 RDRG 뒤 5자리를 위 ② 엑셀의 RDRG 목록과 맞춰 하나씩 확정했다.
#   (한글은 대응표를 만들지 않았다 — 명칭은 ② 엑셀에서 원문 그대로 가져온다.
#    구분 칸은 값이 외과계·내과계·정신과계 셋뿐이라 그 세 덩어리만 대응시켰다.)
#
#   옮겨 적은 것이 아니라 뽑아낸 것이라 아래 다섯 가지로 **줄마다 검산**한다.
#   하나라도 어긋나면 파일을 쓰지 않고 멈춘다.
#     ① 기준수가 = 10원미만 4사5입(기준점수 × 점수당 단가 83.8)
#     ② 일당수가 = 10원미만 4사5입(일당점수 × 점수당 단가 83.8)
#     ③ RDRG 가 ② 엑셀의 목록에 있다
#     ④ RDRG 가 겹치지 않고 오름차순이다
#     ⑤ AADRG 마다 구분이 하나로 정해진다
#   덧붙여 정신과계 ADRG 가 지침 36쪽의 「정신과 14개 질병군(U010~V610)」과 맞는지 알려 준다.
# ────────────────────────────────────────────────────────────────────

param(
  [string]$Pdf   = "D:\Documents\Downloads\신포괄지불제도 시범사업 지침 개정(전문).pdf",
  [string]$Names = "D:\Documents\Downloads\신포괄용 KDRG 버전1.6_질병군명칭(변경없음).xlsx",
  [double]$Unit  = 83.8      # 점수당 단가 — 지침 39쪽 〈표 2〉
)

if (-not (Test-Path $Pdf))   { Write-Error "지침 PDF 을 찾을 수 없다: $Pdf"; exit 1 }
if (-not (Test-Path $Names)) { Write-Error "명칭 엑셀을 찾을 수 없다: $Names"; exit 1 }
if (-not (Get-Command pdftotext -ErrorAction SilentlyContinue)) {
  Write-Error "pdftotext 가 없다 — Git for Windows 의 xpdf pdftotext 를 쓴다"; exit 1
}

# ---------- ① PDF → 글자 (여러 단 표라 -layout 이 아니라 -table 로 뽑는다) ----------
$tmp = Join-Path $env:TEMP ("ndrg-" + [IO.Path]::GetRandomFileName() + ".txt")
& pdftotext -table -enc UTF-8 $Pdf $tmp 2>$null
if (-not (Test-Path $tmp)) { Write-Error "pdftotext 가 글자를 뽑지 못했다"; exit 1 }

# 글리프 → 원래 글자 대응표.
#   나란한 두 줄로 둔다 — 파워셸 해시 리터럴은 대소문자를 가리지 않아 'B'/'b' · 'U'/'u' 가
#   같은 열쇠로 취급돼 쓸 수 없다(Dictionary[char,char] 를 쓰는 이유도 같다).
#   윗줄 = 깨진 글자, 아랫줄 = 원래 글자. 자리를 맞춰 읽는다.
$glyph =
  "TLVZabihkmB" + [char]0x00B9 +                                    # 숫자 0~9 · 쉼표 · 소수점
  "Uu" + [char]0x008A + [char]0x008B + [char]0x00C6 + [char]0x00C7 +
  [char]0x00C8 + [char]0x0112 + [char]0x0121 + [char]0x0152 + [char]0x0156 +
  [char]0x015E + [char]0x0162 + [char]0x0169 + [char]0x016B + [char]0x016E +
  [char]0x0170 + [char]0x0177 + [char]0x017E + [char]0x0182 + [char]0x0184
$plain =
  "0123456789,." +
  "BICHDGREFJKLMNOQTUVXY"
if ($glyph.Length -ne $plain.Length) { Write-Error "대응표 길이가 어긋난다"; exit 1 }
$map = New-Object 'System.Collections.Generic.Dictionary[char,char]'
for ($i = 0; $i -lt $glyph.Length; $i++) { $map[$glyph[$i]] = $plain[$i] }

# 구분 칸 — 값이 셋뿐이다 (PDF 221·276·278쪽을 그림으로 읽어 확인)
$GBN = @{ ("R" + [char]0x00BB + "@") = '외과계'
          ("W" + [char]0x00BB + "@") = '내과계'
          ("}" + [char]0x00BB + "@") = '정신과계' }

$rowRe = [regex]'([A-Z][0-9]{5}) +([0-9]+\.[0-9]+) +([0-9]+) +([0-9]+) +([0-9,]+\.[0-9]+) +([0-9,]+) +([0-9,]+\.[0-9]+) +([0-9,]+) *$'
$aaRe  = [regex]'^ *([A-Z][0-9]{4}) '

$err = New-Object System.Collections.ArrayList

# 줄을 모두 되살려 담는다. 구분(외과계 · 내과계 · 정신과계)은 **별표4 안에서만** 본다 —
# 「해당기관 내과계 조정계수」처럼 본문에도 같은 글자가 나오기 때문이다(지침 39쪽).
# 그래서 표 줄이 처음 나온 자리부터 마지막 자리까지로 창을 좁힌다.
$lines = New-Object System.Collections.ArrayList
$first = -1; $last = -1
foreach ($raw in [IO.File]::ReadLines($tmp, [Text.Encoding]::UTF8)) {
  $sb = New-Object System.Text.StringBuilder $raw.Length
  foreach ($ch in $raw.ToCharArray()) {
    $o = [char]0
    if ($map.TryGetValue($ch, [ref]$o)) { [void]$sb.Append($o) } else { [void]$sb.Append($ch) }
  }
  $line = $sb.ToString()
  [void]$lines.Add($line)
  if ($rowRe.IsMatch($line)) { if ($first -lt 0) { $first = $lines.Count - 1 }; $last = $lines.Count - 1 }
}
Remove-Item $tmp -Force -ErrorAction SilentlyContinue
if ($first -lt 0) { Write-Error "별표4 에서 한 줄도 뽑지 못했다 — 대응표가 이 판과 맞지 않는다"; exit 1 }

$rows = New-Object System.Collections.ArrayList
$gbnOf = @{}         # AADRG → 구분
$lastAA = ''
for ($i = $first; $i -le $last; $i++) {
  $line = $lines[$i]

  $m = $aaRe.Match($line)
  if ($m.Success) { $lastAA = $m.Groups[1].Value }
  foreach ($g in $GBN.Keys) {
    if ($line.Contains($g)) {
      $v = $GBN[$g]
      if ($lastAA -eq '') { [void]$err.Add("구분 '$v' 앞에 AADRG 가 없다") ; continue }
      if ($gbnOf.ContainsKey($lastAA) -and $gbnOf[$lastAA] -ne $v) {
        [void]$err.Add("구분 충돌 $lastAA : $($gbnOf[$lastAA]) / $v")
      }
      $gbnOf[$lastAA] = $v
    }
  }

  $m = $rowRe.Match($line)
  if (-not $m.Success) { continue }
  $g = $m.Groups
  [void]$rows.Add([pscustomobject]@{
    c    = $g[1].Value
    a    = $g[1].Value.Substring(0, 5)
    avg  = [double]$g[2].Value
    lo   = [int]$g[3].Value
    hi   = [int]$g[4].Value
    bs   = [double]($g[5].Value -replace ',', '')
    base = [long]  ($g[6].Value -replace ',', '')
    ds   = [double]($g[7].Value -replace ',', '')
    day  = [long]  ($g[8].Value -replace ',', '')
  })
}

# ---------- ② 명칭 엑셀 ----------
$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false; $xl.DisplayAlerts = $false
$wb = $xl.Workbooks.Open($Names, 0, $true)
$ws = $wb.Worksheets.Item(1)
$ur = $ws.UsedRange
$v  = $ur.Value2
$nm = @{}     # RDRG → @(AADRG 명, 중증도코드명)
for ($r = 2; $r -le $ur.Rows.Count; $r++) {
  $code = if ($null -eq $v[$r, 4]) { '' } else { ([string]$v[$r, 4]).Trim() }
  if ($code -eq '') { continue }
  $n1 = if ($null -eq $v[$r, 3]) { '' } else { ([string]$v[$r, 3]).Trim() }
  $n2 = if ($null -eq $v[$r, 5]) { '' } else { ([string]$v[$r, 5]).Trim() }
  $nm[$code] = @($n1, $n2)
}
$wb.Close($false); $xl.Quit()

# ---------- 검산 ----------
function Up10([double]$n) { return [long]([Math]::Round($n / 10, 0, [MidpointRounding]::AwayFromZero) * 10) }
$seen = @{}
$prev = ''
foreach ($x in $rows) {
  $eb = Up10 ($x.bs * $Unit)
  $ed = Up10 ($x.ds * $Unit)
  if ($eb -ne $x.base) { [void]$err.Add("$($x.c) 기준수가 : 점수 $($x.bs) × $Unit → $eb / 표에는 $($x.base)") }
  if ($ed -ne $x.day)  { [void]$err.Add("$($x.c) 일당수가 : 점수 $($x.ds) × $Unit → $ed / 표에는 $($x.day)") }
  if (-not $nm.ContainsKey($x.c)) { [void]$err.Add("$($x.c) 명칭 엑셀에 없는 RDRG") }
  if ($seen.ContainsKey($x.c))    { [void]$err.Add("$($x.c) 겹친다") } else { $seen[$x.c] = 1 }
  if ($prev -ne '' -and $x.c -le $prev) { [void]$err.Add("$prev → $($x.c) 순서가 어긋난다") }
  $prev = $x.c
  if (-not $gbnOf.ContainsKey($x.a)) { [void]$err.Add("$($x.a) 구분을 못 찾았다") }
}
if ($err.Count -gt 0) {
  Write-Host ("검산에서 {0}건이 어긋났다 — 파일을 쓰지 않는다." -f $err.Count) -ForegroundColor Red
  $err | Select-Object -First 20 | ForEach-Object { Write-Host "  $_" }
  exit 1
}

# 정신과 14개 질병군(U010~V610) 확인 — 지침 36쪽
$psy = @{}
foreach ($x in $rows) { if ($gbnOf[$x.a] -eq '정신과계') { $psy[$x.c.Substring(0, 4)] = 1 } }
$psyK = $psy.Keys | Sort-Object
Write-Host ("정신과계 ADRG = {0}개 ({1} ~ {2}) — 지침 36쪽은 「14개 질병군(U010~V610)」" -f `
            $psyK.Count, $psyK[0], $psyK[-1])

# ---------- 파일 쓰기 ----------
function J($s) {
  return "'" + ([string]$s).Replace("\", "\\").Replace("'", "\'") + "'"
}
$adrg  = ($rows | ForEach-Object { $_.c.Substring(0, 4) } | Sort-Object -Unique).Count
$aadrg = ($rows | ForEach-Object { $_.a } | Sort-Object -Unique).Count

$fmt = "  {{ c:'{0}', a:'{1}', g:'{2}', n:{3}, s:{4},`n" +
       "    avg:{5}, lo:{6}, hi:{7}, bs:{8}, base:{9}, ds:{10}, day:{11} }},"
$body = New-Object System.Collections.ArrayList
foreach ($x in $rows) {
  $n = $nm[$x.c]
  $args1 = @($x.c, $x.a, $gbnOf[$x.a], (J $n[0]), (J $n[1]),
             $x.avg, $x.lo, $x.hi, $x.bs, $x.base, $x.ds, $x.day)
  [void]$body.Add(($fmt -f $args1))
}

$head = @"
/* ---------- 신포괄 질병군별 점수 · 수가 (별표4) — 자동 생성 파일 (손으로 고치지 않는다) ----------
   만든 것: tools/ndrg-scores.ps1
   원본:    ① 「신포괄지불제도 시범사업 지침 개정(전문)」 별표4. 질병군별 평균입원일수,
               정상군 하한·상한, 점수 등 (2026.1.1. 적용 기준) — 지침 215~272쪽
            ② 「신포괄용 KDRG 버전1.6_질병군명칭(변경없음).xlsx」 — 명칭(n) · 중증도코드명(s)
   내용:    RDRG $($rows.Count)건 / AADRG $aadrg 개 / ADRG $adrg 개
            (지침 39쪽은 「607개 질병군」이라 적혀 있다 — ADRG 로 센 수다)

   지침 PDF 은 글자를 뽑을 수 없는 판이지만(폰트에 유니코드 대응표가 없다) 깨지는 방식이
   글리프 하나 → 글자 하나 치환이라 되살렸다. 자세한 것은 tools/ndrg-scores.ps1 머리말 참조.
   숫자는 줄마다 **기준수가 = 10원미만 4사5입(기준점수 × 83.8)** 로 검산해서 넣었다
   (일당수가도 같다 — $($rows.Count)줄 모두 맞았다).

   줄 하나
     c    RDRG 번호 (6자리)          a  AADRG 번호 (5자리)
     g    구분 (외과계 · 내과계 · 정신과계)
     n    AADRG 명 — 별표4 의 명칭 칸       s  중증도코드명 (없으면 '')
     avg  평균 입원일수                lo · hi  정상군 하한일 · 상한일
     bs   기준점수   base 기준수가     ds  일당점수   day  일당수가
   base · day 는 조정계수 1 · 점수당 단가 $Unit 일 때의 값이다 — 기관별 조정계수가 있으면
   js/page-ndrg.js 가 「10원미만 4사5입(점수 × 조정계수 × 점수당 단가)」로 다시 낸다.
------------------------------------------------------------------ */

/* 점수당 단가 — 지침 39쪽 〈표 2〉 예시의 $Unit (보건복지부 고시 「건강보험 요양급여비용의 내역」).
   신포괄 시범기관은 병원 · 종합병원 · 상급종합병원이라 모두 같은 단가를 쓴다. */
const NDRG_UNIT = $Unit;

const NDRG_SCORES = [
"@

$out = Join-Path $PSScriptRoot "..\data\ndrg-scores.js"
Set-Content -Path $out -Value ($head + "`n" + ($body -join "`n") + "`n];`n") -Encoding utf8
Write-Host ("생성: {0} (RDRG {1}건 · AADRG {2}개 · ADRG {3}개)" -f `
            (Resolve-Path $out), $rows.Count, $aadrg, $adrg)
