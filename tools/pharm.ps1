<#  약국 산정특례 (별표 6) hwpx → data/pharm-codes.js

    쓰는 법:
      powershell -NoProfile -ExecutionPolicy Bypass -File tools/pharm.ps1 "경로\별표6.hwpx"

    hwpx 는 zip 안에 XML 이 든 형식이라 한글(HWP) COM 을 띄우지 않고 그대로 읽을 수 있다.
    (이 PC 에서 HWP COM 은 보안 대화상자에서 멈춘다 — CLAUDE.md 참조)
    표는 Contents/section0.xml 의 첫 hp:tbl 한 개, 구분·대상·특정기호 3열이다.
    병합 셀(rowSpan)은 값이 첫 행에만 있으므로 "앞의 값 이어받기" 로 풀어 한 행씩 만든다.
    본문 1·2호(제외 규정)는 표 앞 문단에서 뽑는다.
#>
param([Parameter(Mandatory=$true)][string]$Hwpx)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$tmp  = Join-Path $env:TEMP ('pharm_' + [IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item -LiteralPath $Hwpx -Destination (Join-Path $tmp 'src.zip')
Expand-Archive -LiteralPath (Join-Path $tmp 'src.zip') -DestinationPath $tmp -Force

# PreserveWhitespace 가 없으면 공백만 있는 <hp:t> </hp:t> 가 버려져 낱말이 붙는다.
# (원문은 줄이 바뀌는 자리의 공백을 별도 run 으로 넣어 둔다)
$xml = New-Object System.Xml.XmlDocument
$xml.PreserveWhitespace = $true
$xml.Load((Join-Path $tmp 'Contents\section0.xml'))
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('hp', 'http://www.hancom.co.kr/hwpml/2011/paragraph')

function Get-ParaText($p){
  $s = ''
  foreach($t in $p.SelectNodes('hp:run/hp:t', $ns)){ $s += $t.InnerText }
  return $s
}

# ---- 본문 문단 (표 앞) ----
$notes = New-Object System.Collections.Generic.List[string]
foreach($p in $xml.DocumentElement.SelectNodes('hp:p', $ns)){
  if ($p.SelectNodes('.//hp:tbl', $ns).Count -gt 0){ break }
  $s = (Get-ParaText $p).TrimEnd()
  if ($s -match '^\s*(\d+\.|가\.|나\.|\d+\))') { $notes.Add($s.Trim()) }
}

# ---- 표 ----
$tbl = $xml.SelectNodes('//hp:tbl', $ns)[0]
$rows = New-Object System.Collections.Generic.List[object]
$no = ''; $sym = ''
foreach($tr in $tbl.SelectNodes('hp:tr', $ns)){
  $name = ''
  foreach($tc in $tr.SelectNodes('hp:tc', $ns)){
    $col = [int]$tc.SelectSingleNode('hp:cellAddr', $ns).colAddr
    $txt = @()
    foreach($p in $tc.SelectNodes('hp:subList/hp:p', $ns)){ $txt += (Get-ParaText $p) }
    $v = (($txt -join ' ') -replace '\s+$', '') -replace '^\s+', ''
    switch($col){ 0 { $no = $v } 1 { $name = $v } 2 { $sym = $v } }
  }
  if ($no -eq '구분'){ continue }                 # 머리줄
  if (-not $name){ continue }
  $rows.Add([pscustomobject]@{ no = $no; name = $name; sym = $sym })
}

# ---- 내보내기 ----
$BS = [string][char]92
$q  = { param($s) '"' + $s.Replace($BS, $BS + $BS).Replace('"', $BS + '"') + '"' }
$out = New-Object System.Collections.Generic.List[string]
$out.Add('/* ---------- 약국 산정특례 (자동 생성 — 손으로 고치지 말 것) ----------')
$out.Add('   출처: 「본인일부부담금 산정특례에 관한 기준」 [별표 6]')
$out.Add('         약국 요양급여비용총액의 본인부담률 산정특례 대상 (제6조 관련)')
$out.Add('   원문 표는 구분 · 대상 · 특정기호 3열이고 구분과 특정기호가 병합 셀로 묶여 있다.')
$out.Add('   화면에서 걸러 보려면 행마다 값이 있어야 해서 병합을 풀어 한 행씩 넣었다')
$out.Add('   (구분 번호와 특정기호가 같은 값으로 여러 행에 반복된다 — 원문 글자는 그대로다).')
$out.Add('   변환: tools/pharm.ps1 ---------- */')
$out.Add('const PHARM_NOTES = [')
foreach($n in $notes){ $out.Add('  ' + (& $q $n) + ',') }
$out.Add('];')
$out.Add('const PHARM_CODES = [')
foreach($r in $rows){
  $out.Add('{"no":' + (& $q $r.no) + ',"name":' + (& $q $r.name) + ',"sym":' + (& $q $r.sym) + '},')
}
$out.Add('];')

$dest = Join-Path $root 'data\pharm-codes.js'
[IO.File]::WriteAllLines($dest, $out, [Text.UTF8Encoding]::new($false))
Remove-Item $tmp -Recurse -Force
Write-Output ("data/pharm-codes.js : " + $rows.Count + "행, 본문 " + $notes.Count + "문단")
