<#  [별표12] 소아가산 xlsx → data/b12-codes.js

    쓰는 법:
      powershell -NoProfile -ExecutionPolicy Bypass -File tools/b12.ps1 "경로\★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터(기관안내용).xlsx"

    원본: 심평원 배포 「★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터(기관안내용).xlsx」
    이 스크립트가 읽는 시트는 두 장이다.
      2.소아가산관련행위목록  — 분류번호·수가코드·명칭·구분·6세 미만·6세 이상~16세 미만·비고
      3-1.마취료 코드조합     — 한 시트 안에 표가 세 덩어리로 나란히 있다 (A열은 비어 있다)
                                 2~5열   마취료 가산 가능 5단 코드별 대응코드
                                 7~14열  마취료 별도보상 가능 산정코드 조합
                                 16~19열 ※ [참고] 산정코드별 보상율

    3-1 가운데 표는 첫·둘·셋째 자리가 **병합 셀(2행 묶음)** 이라 값이 묶음의 첫 행에만 있다.
    같은 코드조합에 신설(별표12)/기존(별표12) 두 줄의 보상율이 달리기 때문이다.
    약국 산정특례(tools/pharm.ps1)와 같은 방식으로 "앞의 값 이어받기" 로 풀어 행마다 채운다.

    Excel COM 은 이 PC 에서 정상 동작한다(한글 COM 은 안 된다 — CLAUDE.md 참조).
    이 .ps1 은 UTF-8 BOM 으로 저장해야 한다 (PowerShell 5.1 이 BOM 없는 파일을 ANSI 로 읽는다).
#>
param([Parameter(Mandatory=$true)][string]$Xlsx)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$outPath = Join-Path $root 'data\b12-codes.js'

# 원본이 엑셀에서 열려 있어도 읽히도록 임시 파일로 복사한 뒤 읽기 전용으로 연다
$tmp = Join-Path $env:TEMP ('b12_' + [IO.Path]::GetRandomFileName() + '.xlsx')
Copy-Item -LiteralPath $Xlsx -Destination $tmp

$xl = New-Object -ComObject Excel.Application
$xl.Visible = $false
$xl.DisplayAlerts = $false
$wb = $xl.Workbooks.Open($tmp, 0, $true)

function Get-Sheet($name){
  foreach($ws in $wb.Worksheets){ if($ws.Name.Trim() -eq $name){ return $ws } }
  throw "시트를 찾을 수 없다: $name"
}
# 셀 글자. 줄바꿈만 \n 으로 맞추고 앞뒤 공백을 턴다 (글자는 고치지 않는다)
function T($ws, $r, $c){
  $v = $ws.Cells.Item($r, $c).Text
  if ($null -eq $v){ return '' }
  return ([string]$v -replace "`r`n", "`n").Trim()
}
# JS 문자열 리터럴
function J($s){
  $t = [string]$s
  $t = $t -replace '\\', '\\'
  $t = $t -replace '"', '\"'
  $t = $t -replace "`n", '\n'
  return '"' + $t + '"'
}
function JArr($list){ return '[' + (($list | ForEach-Object { J $_ }) -join ', ') + ']' }

# ---------------- 2. 소아가산관련행위목록 ----------------
$ws2 = Get-Sheet '2.소아가산관련행위목록'
$actTitle = T $ws2 1 1
$actIntro = T $ws2 2 1
$actHead  = @(1..7 | ForEach-Object { T $ws2 3 $_ })

$acts = New-Object System.Collections.Generic.List[string]
$last2 = $ws2.UsedRange.Row + $ws2.UsedRange.Rows.Count - 1
for($r = 4; $r -le $last2; $r++){
  $code = T $ws2 $r 2
  if ($code -eq ''){ continue }
  $acts.Add('{"cls":' + (J (T $ws2 $r 1)) +
            ',"code":' + (J $code) +
            ',"name":' + (J (T $ws2 $r 3)) +
            ',"gb":'   + (J (T $ws2 $r 4)) +
            ',"u6":'   + (J (T $ws2 $r 5)) +
            ',"a16":'  + (J (T $ws2 $r 6)) +
            ',"note":' + (J (T $ws2 $r 7)) + '}')
}

# ---------------- 3-1. 마취료 코드조합 ----------------
$ws3 = Get-Sheet '3-1.마취료 코드조합'
$last3 = $ws3.UsedRange.Row + $ws3.UsedRange.Rows.Count - 1

$mapTitle   = T $ws3 2 2
$comboTitle = T $ws3 2 7
$rateTitle  = T $ws3 2 16
$mapHead    = @(2..5  | ForEach-Object { T $ws3 3 $_ })
$comboHead  = @(7..14 | ForEach-Object { T $ws3 3 $_ })
$rateHead   = @((T $ws3 3 16), (T $ws3 3 18))
$rateSub    = @(16..19 | ForEach-Object { T $ws3 4 $_ })

# 표 A — 5단코드별 대응코드 (2~5열)
$map = New-Object System.Collections.Generic.List[string]
for($r = 4; $r -le $last3; $r++){
  $c5 = T $ws3 $r 2
  if ($c5 -eq ''){ continue }
  $map.Add('{"c5":' + (J $c5) +
           ',"cm":' + (J (T $ws3 $r 3)) +
           ',"sa":' + (J (T $ws3 $r 4)) +
           ',"em":' + (J (T $ws3 $r 5)) + '}')
}

# 표 B — 산정코드 조합 (7~14열). 7·8·9열은 병합 셀이라 앞의 값을 이어받는다
$combo = New-Object System.Collections.Generic.List[string]
$d1 = ''; $d2 = ''; $d3 = ''
for($r = 4; $r -le $last3; $r++){
  $rate = T $ws3 $r 10
  if ($rate -eq ''){ continue }
  $a = T $ws3 $r 7; if ($a -ne ''){ $d1 = $a }
  $b = T $ws3 $r 8; if ($b -ne ''){ $d2 = $b }
  $c = T $ws3 $r 9; if ($c -ne ''){ $d3 = $c }
  $combo.Add('{"d1":' + (J $d1) + ',"d2":' + (J $d2) + ',"d3":' + (J $d3) +
             ',"rate":' + (J $rate) +
             ',"dose":' + (J (T $ws3 $r 11)) +
             ',"g1":'   + (J (T $ws3 $r 12)) +
             ',"g2":'   + (J (T $ws3 $r 13)) +
             ',"g3":'   + (J (T $ws3 $r 14)) + '}')
}

# 표 C — ※ [참고] 산정코드별 보상율 (16~19열). 5행부터 값이 없어질 때까지
$rsa = New-Object System.Collections.Generic.List[string]
$rem = New-Object System.Collections.Generic.List[string]
$rateNote = ''
for($r = 5; $r -le $last3; $r++){
  $k = T $ws3 $r 16
  $v = T $ws3 $r 17
  if ($k -ne '' -and $v -ne ''){ $rsa.Add('[' + (J $k) + ', ' + (J $v) + ']') }
  elseif ($k -ne '' -and $v -eq '' -and $rateNote -eq ''){ $rateNote = $k }
  $k2 = T $ws3 $r 18
  $v2 = T $ws3 $r 19
  if ($k2 -ne '' -and $v2 -ne ''){ $rem.Add('[' + (J $k2) + ', ' + (J $v2) + ']') }
}

$wb.Close($false)
$xl.Quit()
[void][Runtime.InteropServices.Marshal]::ReleaseComObject($wb)
[void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
Remove-Item -LiteralPath $tmp -Force

# ---------------- data/b12-codes.js ----------------
$sb = New-Object System.Text.StringBuilder
function W($s){ [void]$sb.AppendLine($s) }

W '/* ---------- [별표12] 소아가산 (자동 생성 — 손으로 고치지 말 것) ----------'
W '   출처: 심평원 「★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터(기관안내용).xlsx」'
W '         2.소아가산관련행위목록 / 3-1.마취료 코드조합'
W '   변환: tools/b12.ps1'
W ''
W '   B12_ACTS   소아가산 관련 행위 목록 — cls 분류번호 · code 수가코드 · name 명칭 ·'
W '              gb 구분 · u6 6세 미만 · a16 6세 이상~16세 미만 · note 비고'
W '   B12_MAP    마취료 가산 가능 5단 코드별 대응코드 — c5 5단코드 · cm 대응코드 ·'
W '              sa 9장 별표12 관련 소아가산 · em 응급가산'
W '   B12_COMBO  마취료 별도보상 가능 산정코드 조합 — d1/d2/d3 첫·둘·셋째 자리 ·'
W '              rate 보상율(%) · dose 1회투여량 · g1 병원 ·'
W '              g2 종병 이상(응급가산을 별도보상 받지 않는 기관) ·'
W '              g3 종병 이상(응급가산을 별도보상 받는 기관)'
W '              원문에서 d1·d2·d3 는 2행짜리 병합 셀이다(같은 코드조합에 신설/기존 두 줄).'
W '              화면에서 걸러 보려면 행마다 값이 있어야 해서 병합을 풀어 채웠다.'
W '   B12_RATE   ※ [참고] 산정코드별 보상율'
W '------------------------------------------------------------------ */'
W ('const B12_ACT_TITLE = ' + (J $actTitle) + ';')
W ('const B12_ACT_INTRO = ' + (JArr ($actIntro -split "`n")) + ';')
W ('const B12_ACT_HEAD  = ' + (JArr $actHead) + ';')
W 'const B12_ACTS = ['
foreach($x in $acts){ W ($x + ',') }
W '];'
W ''
W ('const B12_MAP_TITLE   = ' + (J $mapTitle) + ';')
W ('const B12_MAP_HEAD    = ' + (JArr $mapHead) + ';')
W 'const B12_MAP = ['
foreach($x in $map){ W ($x + ',') }
W '];'
W ''
W ('const B12_COMBO_TITLE = ' + (J $comboTitle) + ';')
W ('const B12_COMBO_HEAD  = ' + (JArr $comboHead) + ';')
W 'const B12_COMBO = ['
foreach($x in $combo){ W ($x + ',') }
W '];'
W ''
W ('const B12_RATE_TITLE = ' + (J $rateTitle) + ';')
W ('const B12_RATE_HEAD  = ' + (JArr $rateHead) + ';')
W ('const B12_RATE_SUB   = ' + (JArr $rateSub) + ';')
W ('const B12_RATE_NOTE  = ' + (J $rateNote) + ';')
W 'const B12_RATE = {'
W ('  sa: [' + ($rsa -join ', ') + '],')
W ('  em: [' + ($rem -join ', ') + '],')
W '};'

[IO.File]::WriteAllText($outPath, $sb.ToString(), [Text.UTF8Encoding]::new($false))
"data/b12-codes.js  행위 {0}행 · 5단코드 {1}행 · 코드조합 {2}행 · 보상율 소아 {3}건 · 응급 {4}건" -f $acts.Count, $map.Count, $combo.Count, $rsa.Count, $rem.Count
