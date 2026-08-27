# ---------- 자보(자동차보험) 레이아웃 PDF → TSV ----------
#
# 자보는 심평원 자료가 .doc 이 아니라 **PDF** 다(020 행정예고 · 021 작성요령).
# 그래서 tools/sam-layout-dump.ps1 이 건너뛴다 — 이 스크립트가 같은 모양의 TSV 를 만들어 이어 붙인다.
#
# PDF 는 Git for Windows 의 xpdf `pdftotext` 로 뽑는다. poppler 가 아니라 `-bbox-layout` 이 없고
# 대신 `-table` 이 있다 — 여러 단으로 된 표는 `-layout` 말고 `-table` 이라야 칸이 안 섞인다.
#
# 뽑은 글은 「항 목 명 | MODE | POSITION | 설명」 순서라, 한 줄에서 `an(10)` · `n(8.2)` 같은
# MODE 와 그 뒤 숫자(POSITION)를 찾아 앞을 항목명으로 본다. 레코드는 POSITION 이 1 로
# 돌아가는 자리에서 끊는다 (.doc 쪽과 같은 규칙).
#
# 문서 한 개에 **의·치과와 한방이 같이** 들어 있다 — 「(2) 한방」 줄에서 갈린다.
# 020 문서는 뒤에 치료재료·조제제제·보완자료 같은 다른 서식이 이어져서 「3.」 절에서 멈춘다.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/sam-layout-jabo.ps1 `
#     -Root "D:\Documents\Desktop\질의 참고파일\SAM" -Tsv "<sam-layout-dump.tsv>"
#
# 이 파일은 UTF-8 BOM 으로 저장한다 (PowerShell 5.1 은 BOM 이 없으면 CP949 로 읽는다).

param(
  [string]$Root = "D:\Documents\Desktop\질의 참고파일\SAM",
  [Parameter(Mandatory=$true)][string]$Tsv,
  [string]$PdfToText = "pdftotext"
)

$ErrorActionPreference = "Stop"

# 어느 PDF 가 어느 버전인지. 「★」 가 붙은 것은 레이아웃만 추린 판이라 그쪽을 먼저 쓴다.
$docs = @(
  @{ ver = '021'; file = '4. 자보 (021)\★ 자보 SAM (021).pdf' },
  @{ ver = '020'; file = '4. 자보 (020) (2018년 4월)\자보 청구명세서 전자문서 작성요령_020버전_행정예고.pdf' }
)

$modeRe = [regex]'(an|n)\((\d+)(?:\.(\d+))?\)[ \t]+(\d+)(?=[ \t]|$)'
$rows = New-Object System.Collections.Generic.List[string]

foreach ($d in $docs) {
  $pdf = Join-Path $Root $d.file
  if (-not (Test-Path -LiteralPath $pdf)) { Write-Host ("  건너뜀(없음): {0}" -f $d.file); continue }
  $txt = [IO.Path]::GetTempFileName()
  & $PdfToText -table -enc UTF-8 $pdf $txt | Out-Null
  $lines = [IO.File]::ReadAllLines($txt, [Text.UTF8Encoding]::new($false))
  Remove-Item $txt -Force

  # 의·치과 → 한방으로 갈리는 자리, 그리고 레이아웃이 끝나는 자리
  $splitAt = $lines.Count
  $stopAt  = $lines.Count
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($splitAt -eq $lines.Count -and $lines[$i] -match '^\s*\(2\)\s*한방') { $splitAt = $i }
    # 020 문서는 자보 명세서 뒤에 다른 서식들이 이어진다 — 「3. 치료재료…」 에서 끊는다
    if ($stopAt -eq $lines.Count -and $lines[$i] -match '^\s*3\.\s*치료재료') { $stopAt = $i }
  }
  Write-Host ("  {0} 버전 — 한방 시작 {1}줄 · 끝 {2}줄" -f $d.ver, $splitAt, $stopAt)

  # 항목명이 MODE 와 **다른 줄**에 떨어지는 칸이 있다(020 의 수신기관 · 특정내역).
  # 그럴 때를 대비해 "MODE 가 없는 줄의 맨 앞 글자"를 들고 다니다가 이름이 빈 칸에 쓴다.
  $fields = New-Object System.Collections.Generic.List[object]
  $pendName = ''
  for ($i = 0; $i -lt $stopAt; $i++) {
    $m = $modeRe.Match($lines[$i])
    if (-not $m.Success) {
      # 줄 앞 공백을 먼저 떼야 한다 — 안 그러면 나뉜 첫 조각이 빈 글이 되어 이름을 못 문다
      $head = (($lines[$i].Trim()) -split '\s{2,}')[0].Trim()
      if ($head -and $head.Length -le 40 -and $head -notmatch '^[0-9(【]') { $pendName = $head }
      continue
    }
    $name = $lines[$i].Substring(0, $m.Index).Trim()
    $name = ($name -replace '\s+', ' ')
    if (-not $name) { $name = $pendName }        # 이름이 앞줄에 떨어진 칸
    $pendName = ''
    if (-not $name -or $name.Length -gt 40) { continue }
    if ($name -match '^(MODE|POSI|항\s*목)') { continue }
    $desc = $lines[$i].Substring($m.Index + $m.Length).Trim()
    $fields.Add([pscustomobject]@{
      kind = if ($i -ge $splitAt) { '자보한방' } else { '자보' }
      name = $name
      mode = $m.Groups[1].Value
      len  = [int]$m.Groups[2].Value
      dec  = if ($m.Groups[3].Success) { $m.Groups[3].Value } else { '' }
      pos  = [int]$m.Groups[4].Value
      desc = ($desc -replace '\s+', ' ')
    })
  }

  # 분야별로 나눈 뒤 POSITION 이 1 로 돌아가는 자리에서 레코드를 끊는다.
  # 청구서(C010)는 의·치과 쪽 첫 레코드에 들어 있고 한방도 같은 청구서를 쓴다.
  foreach ($kind in @('자보','자보한방')) {
    $mine = @($fields | Where-Object { $_.kind -eq $kind })
    if (-not $mine.Count) { continue }
    $recs = New-Object System.Collections.Generic.List[object]
    $cur = $null
    foreach ($f in $mine) {
      if ($f.pos -eq 1 -or $null -eq $cur) {
        $cur = [pscustomobject]@{ letter = ''; items = (New-Object System.Collections.Generic.List[object]) }
        $recs.Add($cur)
      }
      $cur.items.Add($f)
    }
    foreach ($r in $recs) {
      $has = { param($re) @($r.items | Where-Object { $_.name -match $re }).Count -gt 0 }
      if     (& $has '서식버전')   { $r.letter = 'H' }
      elseif (& $has '서식번호')   { $r.letter = 'A' }
      elseif (& $has '특정내역')   { $r.letter = 'E' }
      elseif (& $has '항\s*번호')  { $r.letter = 'C' }
      elseif (& $has '처방전')     { $r.letter = 'D' }
      elseif (& $has '상병분류기호'){ $r.letter = 'B' }
    }
    # 글자가 겹치면 칸이 많은 쪽이 원래 글자를 갖고, 5칸 이하로 겹친 것은 문서 속 예시 표라 버린다
    $drop = New-Object System.Collections.Generic.List[object]
    foreach ($g in ($recs | Where-Object { $_.letter } | Group-Object letter | Where-Object { $_.Count -gt 1 })) {
      $sorted = $g.Group | Sort-Object { $_.items.Count } -Descending
      for ($j = 1; $j -lt $sorted.Count; $j++) {
        if ($sorted[$j].items.Count -le 5) { $drop.Add($sorted[$j]) }
        else { $sorted[$j].letter = $sorted[$j].letter + ($j + 1) }
      }
    }
    foreach ($x in $drop) { [void]$recs.Remove($x) }

    # 빠진 칸 찾기 — SAM 레코드는 앞 칸이 끝나는 자리에서 다음 칸이 시작한다.
    # 틈이 있으면 PDF 에서 그 줄을 못 읽은 것이다. 조용히 넘기지 않고 알린다.
    foreach ($r in $recs) {
      if (-not $r.letter) { continue }
      $expect = 1
      foreach ($f in $r.items) {
        if ($f.pos -ne $expect) {
          Write-Host ("    !! {0} {1} {2} — {3} 앞에 {4}~{5} 가 비었다 (PDF 에서 못 읽은 칸)" -f `
            $kind, $d.ver, $r.letter, $f.name, $expect, ($f.pos - 1))
        }
        $expect = $f.pos + $f.len + $(if ($f.dec) { [int]$f.dec } else { 0 })
      }
    }

    $n = 0
    foreach ($r in $recs) {
      $n++
      if (-not $r.letter) { Write-Host ("    · 이름 못 붙인 레코드 {0}칸 — 건너뜀" -f $r.items.Count); continue }
      $seq = 0
      foreach ($f in $r.items) {
        $seq++
        $rows.Add(("{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}`t{7}`t{8}`t{9}" -f `
          $kind, $d.ver, $r.letter, $seq, $f.name, $f.mode, $f.len, $f.dec, $f.pos, $f.desc))
      }
    }
    Write-Host ("    {0} {1} — 레코드 {2}개" -f $kind, $d.ver, @($recs | Where-Object { $_.letter }).Count)
  }
}

# 있던 TSV 뒤에 이어 붙인다 (머리줄은 그대로 두고 자보 줄만 새로 넣는다)
$old = @([IO.File]::ReadAllLines($Tsv, [Text.UTF8Encoding]::new($false))) | Where-Object { $_ -notmatch '^자보' }
$all = New-Object System.Collections.Generic.List[string]
$all.AddRange([string[]]$old)
$all.AddRange([string[]]$rows)
[IO.File]::WriteAllLines($Tsv, $all, [Text.UTF8Encoding]::new($false))
Write-Host ("{0} — 자보 {1}줄 이어 붙임" -f $Tsv, $rows.Count)
