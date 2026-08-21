<#  [별표12] 소아가산 xlsx → data/b12-codes.js

    쓰는 법:
      powershell -NoProfile -ExecutionPolicy Bypass -File tools/b12.ps1 "경로\★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터(기관안내용).xlsx"

    원본: 심평원 배포 「★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터(기관안내용).xlsx」
    이 스크립트가 읽는 시트는 한 장이다.
      2.소아가산관련행위목록  — 분류번호·수가코드·명칭·구분·6세 미만·6세 이상~16세 미만·비고
                                (1행 제목 · 2행 머리말 · 3행 열이름 · 4행부터 값)

    같은 엑셀의 3-1.마취료 코드조합 시트도 한때 함께 뽑았으나 화면에서 내렸다 (2026-08-21).
    다시 필요해지면 git log 에서 그때 판을 꺼내면 된다.

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
W '         2.소아가산관련행위목록'
W '   변환: tools/b12.ps1'
W ''
W '   B12_ACT_TITLE  시트 1행 제목'
W '   B12_ACT_INTRO  시트 2행 머리말 — 어떤 기준으로 "해당" 이 붙었는지가 여기 적혀 있다'
W '   B12_ACT_HEAD   시트 3행 열이름'
W '   B12_ACTS       cls 분류번호 · code 수가코드 · name 명칭 ·'
W '                  gb 구분 · u6 6세 미만 · a16 6세 이상~16세 미만 · note 비고'
W '------------------------------------------------------------------ */'
W ('const B12_ACT_TITLE = ' + (J $actTitle) + ';')
W ('const B12_ACT_INTRO = ' + (JArr ($actIntro -split "`n")) + ';')
W ('const B12_ACT_HEAD  = ' + (JArr $actHead) + ';')
W 'const B12_ACTS = ['
foreach($x in $acts){ W ($x + ',') }
W '];'

[IO.File]::WriteAllText($outPath, $sb.ToString(), [Text.UTF8Encoding]::new($false))
"data/b12-codes.js  행위 {0}행" -f $acts.Count
