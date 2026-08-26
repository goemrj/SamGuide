# ------------------------------------------------------------------
# SAM 신포괄 명세서를 심평원 신포괄 그루퍼(Npo_kdrg11.exe)로 돌린다.
#
#   powershell -ExecutionPolicy Bypass -File tools/kdrg-grouper.ps1 "…P020.GHP" [파일 더]
#   또는 「그루퍼 돌리기.bat」 위에 SAM 파일을 끌어다 놓는다.
#
# 하는 일
#   ① SAM → 그루퍼 입력파일(.in)   tools/kdrg-in.awk 가 만든다 (주민번호는 매뉴얼대로 가린다)
#   ② 그루퍼 폴더에서 Npo_kdrg11.exe 실행
#   ③ 결과를 SAM 파일 옆에 남긴다 — **그루퍼 원본 .out 그대로** + 읽기 쉬운 대조표(.csv)
#
# 그루퍼 폴더의 Npo_kdrg11.in / .out 은 심평원이 넣어 둔 견본이다.
# **돌리기 전에 옮겨 두었다가 끝나면 되돌려 놓는다** — 남의 견본을 덮어쓴 채로 두지 않는다.
#
# 필요한 것
#   · 심평원 신포괄 그루퍼 폴더 (Npo_kdrg11.exe + Npo_T* 마스터)
#     요양기관업무포털 > 모니터링 > 환자분류체계 > 입원환자분류체계 > 자료실
#   · Git for Windows 의 awk (변환기가 awk 스크립트다)
# ------------------------------------------------------------------
# 인자는 param() 에 맡기지 않고 직접 읽는다.
# 파일 여러 개를 끌어다 놓으면 .bat 가 하나씩 따로 넘기는데, param() 의 자리(Position) 규칙과
# ValueFromRemainingArguments 가 얽혀 두 번째 파일이 -GrouperDir 자리로 들어가 버린다.
$Files = @(); $GrouperDir = ""; $OutDir = ""
for ($i = 0; $i -lt $args.Count; $i++) {
  $a = [string]$args[$i]
  if ($a -match '^-(GrouperDir|Dir|G)$')   { $i++; $GrouperDir = [string]$args[$i] }
  elseif ($a -match '^-(OutDir|Out|O)$')   { $i++; $OutDir = [string]$args[$i] }
  else { $Files += $a }
}

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$conv = Join-Path $root "tools\kdrg-in.awk"

function Say($msg) { Write-Host $msg }
function Die($msg) { Write-Host ""; Write-Host "[멈춤] $msg" -ForegroundColor Red; Write-Host ""; Read-Host "엔터를 누르면 닫힙니다" | Out-Null; exit 1 }

# ---------- awk 찾기 ----------
$awk = $null
foreach ($p in @("C:\Program Files\Git\usr\bin\awk.exe", "C:\Program Files (x86)\Git\usr\bin\awk.exe")) {
  if (Test-Path $p) { $awk = $p; break }
}
if (-not $awk) {
  $cmd = Get-Command awk -ErrorAction SilentlyContinue
  if ($cmd) { $awk = $cmd.Source }
}
if (-not $awk) { Die "awk 를 찾지 못했습니다. Git for Windows 가 설치되어 있어야 합니다." }
if (-not (Test-Path $conv)) { Die "변환기가 없습니다: $conv" }

# ---------- 그루퍼 폴더 찾기 ----------
if (-not $GrouperDir) {
  $guess = @(
    "D:\Documents\Downloads\npo_kdrg_setup",
    "$env:USERPROFILE\Downloads\npo_kdrg_setup",
    (Join-Path $root "npo_kdrg_setup")
  )
  foreach ($g in $guess) { if (Test-Path (Join-Path $g "Npo_kdrg11.exe")) { $GrouperDir = $g; break } }
}
if (-not $GrouperDir -or -not (Test-Path (Join-Path $GrouperDir "Npo_kdrg11.exe"))) {
  Die "신포괄 그루퍼(Npo_kdrg11.exe)를 찾지 못했습니다.`n     -GrouperDir ""폴더경로"" 로 알려 주세요."
}
$exe = Join-Path $GrouperDir "Npo_kdrg11.exe"
$gin = Join-Path $GrouperDir "Npo_kdrg11.in"
$gout = Join-Path $GrouperDir "Npo_kdrg11.out"

# ---------- 넣을 파일 ----------
if (-not $Files -or $Files.Count -eq 0) {
  Say "SAM 신포괄 명세서 파일을 「그루퍼 돌리기.bat」 위에 끌어다 놓으세요."
  Read-Host "엔터를 누르면 닫힙니다" | Out-Null
  exit 0
}
$targets = @()
foreach ($f in $Files) {
  if (Test-Path $f -PathType Container) { $targets += (Get-ChildItem $f -File -Include *.GHP, *.ghp -Recurse).FullName }
  elseif (Test-Path $f) { $targets += (Resolve-Path $f).Path }
  else { Say "  건너뜀 (없는 파일): $f" }
}
if ($targets.Count -eq 0) { Die "읽을 파일이 없습니다." }

Say ""
Say "신포괄 그루퍼 : $GrouperDir"
Say "그루퍼 버전   : $(Get-Content (Join-Path $GrouperDir 'Npo_kdrg1x_version') -ErrorAction SilentlyContinue)"
Say "돌릴 파일     : $($targets.Count) 개"
Say ""

# ---------- 심평원 견본 .in/.out 은 잠시 옮겨 둔다 ----------
$stash = Join-Path ([IO.Path]::GetTempPath()) ("npo_stash_" + [IO.Path]::GetRandomFileName())
New-Item -ItemType Directory -Path $stash -Force | Out-Null
if (Test-Path $gin) { Copy-Item $gin $stash -Force }
if (Test-Path $gout) { Copy-Item $gout $stash -Force }

$grand = 0; $grandDiff = 0
try {
  foreach ($sam in $targets) {
    $name = [IO.Path]::GetFileNameWithoutExtension($sam)
    $dir = if ($OutDir) { $OutDir } else { Split-Path -Parent $sam }
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    $myIn = Join-Path $dir "$name.그루퍼입력.in"
    $myOut = Join-Path $dir "$name.그루퍼결과.out"
    $myCsv = Join-Path $dir "$name.대조표.csv"

    Say "· $([IO.Path]::GetFileName($sam))"

    # ① 변환 — LC_ALL=C 여야 한다(SAM 은 EUC-KR 바이트 자리 서식이다)
    # QUIET=1 — 변환기가 stderr 로 건수를 알리면 PowerShell 이 그걸 오류로 감싼다(NativeCommandError)
    $env:LC_ALL = "C"
    $lines = & $awk -v QUIET=1 -f $conv $sam
    Remove-Item Env:\LC_ALL -ErrorAction SilentlyContinue
    Set-Content -Path $myIn -Value $lines -Encoding Ascii
    if (-not (Test-Path $myIn)) { Say "    변환 실패 — 건너뜁니다"; continue }
    $n = (Get-Content $myIn | Measure-Object -Line).Lines
    if ($n -eq 0) { Say "    신포괄 명세서(P020·P030)가 없습니다 — 건너뜁니다"; Remove-Item $myIn -Force; continue }

    # ② 그루퍼 실행
    Copy-Item $myIn $gin -Force
    Push-Location $GrouperDir
    & $exe | Out-Null
    Pop-Location
    if (-not (Test-Path $gout)) { Say "    그루퍼가 결과를 내지 않았습니다"; continue }
    Copy-Item $gout $myOut -Force

    # ③ 대조표
    $rows = @()
    $diff = 0
    foreach ($line in (Get-Content $myOut)) {
      if ($line.Length -lt 312) { continue }
      $seq = $line.Substring(305, 5).Trim()
      $fileDrg = if ($line.Length -ge 317) { $line.Substring(311, 6).Trim() } else { "" }
      $mdc = $line.Substring(283, 3).Trim()
      $adrg = $line.Substring(286, 4).Trim()
      $pccl = $line.Substring(290, 1).Trim()
      $drg = $line.Substring(291, 6).Trim()
      $same = if ($fileDrg -eq "") { "" } elseif ($fileDrg -eq $drg) { "같음" } else { "다름" }
      if ($same -eq "다름") { $diff++ }
      $rows += [pscustomobject]@{
        "명일련" = $seq; "파일 질병군번호" = $fileDrg; "그루퍼 분류번호" = $drg
        "MDC" = $mdc; "ADRG" = $adrg; "PCCL" = $pccl; "대조" = $same
      }
    }
    $rows | Export-Csv -Path $myCsv -NoTypeInformation -Encoding UTF8
    $grand += $n; $grandDiff += $diff
    Say "    명세서 $n 건 · 파일과 다름 $diff 건"
    Say "    → $([IO.Path]::GetFileName($myOut))  /  $([IO.Path]::GetFileName($myCsv))"
  }
}
finally {
  # 심평원 견본 되돌리기 — 무슨 일이 있어도 원래대로 둔다
  if (Test-Path (Join-Path $stash "Npo_kdrg11.in")) { Copy-Item (Join-Path $stash "Npo_kdrg11.in") $gin -Force }
  if (Test-Path (Join-Path $stash "Npo_kdrg11.out")) { Copy-Item (Join-Path $stash "Npo_kdrg11.out") $gout -Force }
  Remove-Item $stash -Recurse -Force -ErrorAction SilentlyContinue
}

Say ""
Say "끝났습니다 — 명세서 $grand 건 · 파일과 다름 $grandDiff 건"
Say "결과는 SAM 파일과 같은 폴더에 있습니다."
Say ""
if (-not $OutDir) { Read-Host "엔터를 누르면 닫힙니다" | Out-Null }
