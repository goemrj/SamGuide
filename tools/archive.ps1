# ---------- 지난 판 만들기 ----------
# git 에 남아 있는 옛 data 파일을 그대로 감싸 data/archive/ 에 넣는다.
# 저장소가 모든 판을 들고 있으니, 갱신할 때 미리 챙겨 두지 않아도 나중에 뽑을 수 있다.
#
#   .\tools\archive.ps1 -Page page-detail -Date 2025.08.01 -Commit 8103a65
#   .\tools\archive.ps1 -Page page-detail -Date 2025.08.01 -Commit 8103a65 -WhatIf
#
# Page   : 화면 id (page-detail · page-special · …). data/updated.js 의 키와 같다.
# Date   : 그 판의 **기준일**. 커밋한 날이 아니라 고시·엑셀에 적힌 날짜를 쓴다.
# Commit : 그 시점의 커밋. `git log --oneline -- data/<파일>` 로 찾는다.
#
# 만들고 나면 index.html 에 <script> 한 줄이 자동으로 붙는다(공용 파일이라 팀원에게 알릴 것).

param(
  [Parameter(Mandatory=$true)][string]$Page,
  [Parameter(Mandatory=$true)][string]$Date,
  [Parameter(Mandatory=$true)][string]$Commit,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

# 화면 id → 그 화면이 쓰는 data 파일. 새 카테고리가 생기면 여기 한 줄 더한다.
$map = @{
  'page-burden'    = 'data/burden-hira.js'
  'page-detail'    = 'data/detail-codes.js'
  'page-special'   = 'data/special-codes.js'
  'page-pharm'     = 'data/pharm-codes.js'
  'page-injury'    = 'data/injury-codes.js'
  'page-pilot'     = 'data/pilot-codes.js'
  'page-b12'       = 'data/b12-codes.js'
  'page-emergency' = 'data/emergency-codes.js'
}
if (-not $map.ContainsKey($Page)) {
  throw "모르는 화면 id: $Page  (아는 것: $($map.Keys -join ', '))"
}
if ($Date -notmatch '^\d{4}\.\d{2}\.\d{2}$') {
  throw "Date 는 YYYY.MM.DD 형식으로: $Date"
}

$src = $map[$Page]
$body = & git -C $root show "${Commit}:$src"
if ($LASTEXITCODE -ne 0 -or -not $body) { throw "git show 실패: ${Commit}:$src" }

# 그 파일이 선언하는 전역 이름을 뽑는다 (var/let/const 모두)
$names = [regex]::Matches(($body -join "`n"), '(?m)^\s*(?:var|let|const)\s+([A-Z_0-9]+)\s*=') |
         ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
if (-not $names) { throw "$src 에서 전역 이름을 찾지 못했다" }

$outDir = Join-Path $root 'data/archive'
$outFile = Join-Path $outDir "$Page.$($Date -replace '\.','-').js"

# 원본을 손대지 않고 함수로 감싼다 — 안에서 선언한 이름이 밖으로 새지 않는다.
$sb = [System.Text.StringBuilder]::new()
[void]$sb.AppendLine("/* ---------- 지난 판 (자동 생성 — 손으로 고치지 말 것) ----------")
[void]$sb.AppendLine("   화면 $Page · 기준일 $Date")
[void]$sb.AppendLine("   원본: $src @ $Commit")
[void]$sb.AppendLine("   만든 명령: tools\archive.ps1 -Page $Page -Date $Date -Commit $Commit")
[void]$sb.AppendLine("------------------------------------------------------------------ */")
[void]$sb.AppendLine("SG_ARCHIVE_ADD('$Page', '$Date', (function(){")
foreach ($line in $body) { [void]$sb.AppendLine($line) }
[void]$sb.AppendLine("  return { $(($names | ForEach-Object { "$_`: $_" }) -join ', ') };")
[void]$sb.AppendLine("})());")

if ($WhatIf) {
  Write-Host "만들 파일: $outFile"
  Write-Host "담을 전역: $($names -join ', ')"
  return
}

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory $outDir | Out-Null }
[IO.File]::WriteAllText($outFile, $sb.ToString(), [Text.UTF8Encoding]::new($false))
Write-Host "만들었습니다: $outFile  (전역 $($names -join ', '))"

# index.html 에 <script> 한 줄 추가 (이미 있으면 건너뛴다)
$rel = "data/archive/$(Split-Path -Leaf $outFile)"
$idx = Join-Path $root 'index.html'
# PS 5.1 은 -Encoding 을 안 주면 ANSI 로 읽어 한글을 깨뜨린다 — 반드시 UTF8 로 읽고 쓴다
  $html = [IO.File]::ReadAllText($idx, [Text.UTF8Encoding]::new($false))
if ($html -like "*$rel*") {
  Write-Host "index.html 에 이미 걸려 있습니다."
} else {
  $anchor = '<script src="js/common.js"></script>'
  if ($html -notlike "*$anchor*") { throw "index.html 에서 $anchor 를 찾지 못했다 — 직접 추가할 것" }
  # common.js 뒤에 넣는다 — SG_ARCHIVE_ADD 가 거기 있어 앞에 두면 함수가 없다
  $html = $html.Replace($anchor, "$anchor`r`n<script src=`"$rel`"></script>")
  [IO.File]::WriteAllText($idx, $html, [Text.UTF8Encoding]::new($false))
  Write-Host "index.html 에 <script src=`"$rel`"> 를 추가했습니다 (공용 파일 — 팀원에게 알릴 것)."
}
