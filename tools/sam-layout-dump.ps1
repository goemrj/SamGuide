# ---------- 심평원 SAM 레이아웃 문서(.doc) → TSV ----------
#
# 「질의 참고파일\SAM」 에 모아 둔 버전별 레이아웃 문서에서 필드 목록을 그대로 뽑는다.
# js/layout-*.js (SamEditor 복사본) 이 지금 버전만 들고 있어서, 지난 서식버전과
# 대조하고 화면에 버전별로 보여 주려면 원본에서 다시 뽑아야 한다.
#
# 문서 생김새 — 표 칸이 「구조 | 항목 | MODE | Pos. | 코드 및 유형」 인데
# 세로 병합(구조 칸) 때문에 칸 번호가 줄마다 밀린다. 그래서 표를 격자로 읽지 않고
# **칸을 읽는 순서대로 한 줄로 펴서** MODE(`an(10)` · `n(4.2)`)를 만나면
# 그 앞이 항목, 뒤가 Pos, 그 뒤가 설명으로 본다. 병합에 영향받지 않는다.
#
# 레코드는 Pos 가 1 로 돌아가는 자리에서 끊고, 그 레코드 안의 「내역구분」 설명에 적힌
# 글자('A': 일반내역)로 이름을 붙인다. 없으면 서식번호 코드로 청구서(H)를 알아낸다.
#
# 쓰는 법
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/sam-layout-dump.ps1 `
#     -Root "D:\Documents\Desktop\질의 참고파일\SAM" -Out "<나갈 폴더>"
#
# 이 파일은 UTF-8 BOM 으로 저장한다 (PowerShell 5.1 은 BOM 이 없으면 CP949 로 읽는다).

param(
  [string]$Root = "D:\Documents\Desktop\질의 참고파일\SAM",
  [string]$Out  = ".",
  [string]$Filter = ""
)

$ErrorActionPreference = "Stop"

# 뽑을 문서만 고른다 — 청구서·명세서 레이아웃이 실린 것들. 수신문서(심결·반송)는 지금 화면과 상관없다.
$wanted = @(
  @{ pat = 'SAM_01_청구서\((\d{3})';           kind = '청구서' },
  @{ pat = 'SAM_02_의치과명세서\((\d{3})';     kind = '의치과' },
  @{ pat = 'SAM_03_한방 ?명세서\((\d{3})';     kind = '한방' },
  @{ pat = 'SAM_04_보건 ?명세서\((\d{3})';     kind = '보건' },
  @{ pat = 'SAM_05_약국 ?명세서\((\d{3})';     kind = '약국' },
  @{ pat = 'SAM_06_의료급여비용정액명세서\((\d{3})'; kind = '의료급여정액' },
  @{ pat = 'SAM_07_DRG ?명세서\((\d{3})';      kind = 'DRG' },
  @{ pat = 'SAM_01_산재의치과청구서\((\d{3})'; kind = '산재청구서' },
  @{ pat = 'SAM_01_산재약제비청구서\((\d{3})'; kind = '산재약제비청구서' },
  @{ pat = 'SAM_02_산재의치과명세서\((\d{3})'; kind = '산재의치과' },
  @{ pat = 'SAM_03_산재한의과명세서\((\d{3})'; kind = '산재한의과' },
  @{ pat = 'SAM_04_산재약제비 ?명세서\((\d{3})'; kind = '산재약제비' }
)

function Get-DocKind([string]$name){
  foreach ($w in $wanted){
    $m = [regex]::Match($name, $w.pat)
    if ($m.Success) { return @{ kind = $w.kind; ver = $m.Groups[1].Value } }
  }
  return $null
}

# 같은 (문서종류, 버전) 이 여러 폴더에 있다 — 처음 하나만 쓴다(내용은 같은 문서다).
$targets = @{}
Get-ChildItem -LiteralPath $Root -Recurse -Filter *.doc -File | ForEach-Object {
  if ($_.Name -like '~$*') { return }
  $k = Get-DocKind $_.Name
  if (-not $k) { return }
  if ($Filter -and ($k.kind + $k.ver) -notlike "*$Filter*") { return }
  $key = $k.kind + '|' + $k.ver
  if (-not $targets.ContainsKey($key)) {
    $targets[$key] = @{ kind = $k.kind; ver = $k.ver; path = $_.FullName }
  }
}

Write-Host ("문서 {0}개" -f $targets.Count)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$modeRe = [regex]'^(an|n)\((\d+)(?:\.(\d+))?\)$'
$rows = New-Object System.Collections.Generic.List[string]
$rows.Add(("분야`t버전`t레코드`t순번`t항목`t형식`t길이`t소수`t위치`t설명"))

foreach ($key in ($targets.Keys | Sort-Object)) {
  $t = $targets[$key]
  Write-Host ("  읽는 중: {0} ({1})" -f $t.kind, $t.ver)
  $doc = $null
  try {
    $doc = $word.Documents.Open($t.path, $false, $true)

    # 표의 칸을 읽는 순서대로 한 줄로 편다
    $cells = New-Object System.Collections.Generic.List[string]
    for ($i = 1; $i -le $doc.Tables.Count; $i++) {
      $txt = $doc.Tables.Item($i).Range.Text
      foreach ($c in ($txt -split ([string][char]13 + [string][char]7))) {
        $v = ($c -replace [string][char]13, ' ' -replace [string][char]7, '' -replace [string][char]11, ' ')
        $v = ($v -replace '\s+', ' ').Trim()
        $cells.Add($v)
      }
    }

    # MODE 를 만나면 앞뒤로 항목·위치·설명을 집는다.
    # 항목 이름은 **바로 앞 칸 하나**만 쓴다. 문서의 「항 목」 칸에 적힌 그대로다.
    # (앞쪽 칸을 더 잇는 것도 해 봤지만, 코드표가 별도 칸으로 들어 있어
    #  "H130 의료급여 의과 입원 명세서 요양기관기호" 처럼 코드표 조각이 딸려온다.
    #  머리칸이 한 단계 더 있는 줄은 잎 이름만 남는다 — 예: 청구구분→'코드'.)
    $fields = New-Object System.Collections.Generic.List[object]
    for ($i = 0; $i -lt $cells.Count; $i++) {
      $m = $modeRe.Match($cells[$i])
      if (-not $m.Success) { continue }
      if ($i -lt 1 -or $i + 1 -ge $cells.Count) { continue }
      $pos = $cells[$i + 1]
      if ($pos -notmatch '^\d+$') { continue }        # Pos 자리가 숫자가 아니면 표 머리줄 등이다
      $name = $cells[$i - 1]
      if (-not $name -or $name.Length -gt 40) { continue }
      $desc = if ($i + 2 -lt $cells.Count) { $cells[$i + 2] } else { '' }
      if ($desc -match '^\d+$' -or $modeRe.IsMatch($desc)) { $desc = '' }   # 설명 자리가 아니면 비운다
      # 같은 위치·같은 이름이 바로 뒤에 또 나오면 문서의 칸이 쪼개져 있는 것이다 — 한 번만 담는다
      # (산재 명세서의 '목번호', DRG 진료내역의 머리칸에서 실제로 생긴다)
      if ($fields.Count -gt 0) {
        $prev = $fields[$fields.Count - 1]
        if ($prev.pos -eq [int]$pos -and $prev.name -eq $name) { continue }
      }
      $fields.Add([pscustomobject]@{
        name = $name
        mode = $m.Groups[1].Value
        len  = [int]$m.Groups[2].Value
        dec  = if ($m.Groups[3].Success) { $m.Groups[3].Value } else { '' }
        pos  = [int]$pos
        desc = $desc
      })
    }

    # 위치가 1 로 돌아가는 자리에서 레코드를 끊는다
    $recs = New-Object System.Collections.Generic.List[object]
    $cur = $null
    foreach ($f in $fields) {
      if ($f.pos -eq 1 -or $cur -eq $null) {
        $cur = [pscustomobject]@{ letter = ''; items = (New-Object System.Collections.Generic.List[object]) }
        $recs.Add($cur)
      }
      $cur.items.Add($f)
    }

    # 레코드 이름 — 「내역구분」 설명에 적힌 글자를 먼저 쓰고(의과·DRG 계열),
    # 그것이 없는 분야(한방·약국·의료급여정액·산재·보건)는 레코드가 들고 있는 필드로 가른다.
    foreach ($r in $recs) {
      foreach ($f in $r.items) {
        if ($f.name -match '내역구분') {
          $mm = [regex]::Match($f.desc, "[‘'`"]([A-Z])[’'`"]")
          if ($mm.Success) { $r.letter = $mm.Groups[1].Value; break }
        }
      }
      if ($r.letter) { continue }
      $has = { param($re) @($r.items | Where-Object { $_.name -match $re }).Count -gt 0 }
      # 청구서 문서는 첫 레코드가 청구서(H). 산재 청구서는 둘째 레코드(간병료, M010.2)가 더 있다.
      # 산재 청구서는 서식버전 칸의 잎 이름이 '청구서'·'명세서' 라 이름만으로는 못 가른다.
      if ($t.kind -match '청구서$') {
        $r.letter = if ($recs.IndexOf($r) -eq 0) { 'H' } else { 'H2' }
        continue
      }
      if     (& $has '서식버전')            { $r.letter = 'H'  }
      elseif (& $has '서식번호')            { $r.letter = 'A'  }
      elseif (& $has '특정내역')            { $r.letter = 'E'  }
      elseif (& $has '항\s*번호|^항$')      { $r.letter = 'C'  }
      elseif (& $has '처방전')              { $r.letter = 'D'  }
      elseif (& $has '상병분류기호|상병코드|질병분류기호|진단분류기호|상병구분') { $r.letter = 'B' }
      elseif (& $has '간병')                { $r.letter = 'H2' }
    }

    # 한 문서에 같은 글자가 두 번 나오는 경우가 있다 — DRG 087·091 은 진료내역이 둘(본 명세서 · 열외군)이다.
    # 뒤에 나온 쪽에 번호를 붙여 따로 둔다(C · C2).
    $seen = @{}
    foreach ($r in $recs) {
      if (-not $r.letter) { continue }
      if ($seen.ContainsKey($r.letter)) {
        $seen[$r.letter] = $seen[$r.letter] + 1
        $r.letter = $r.letter + $seen[$r.letter]
      } else { $seen[$r.letter] = 1 }
    }

    $n = 0
    foreach ($r in $recs) {
      $n++
      $letter = if ($r.letter) { $r.letter } else { "?$n" }
      $seq = 0
      foreach ($f in $r.items) {
        $seq++
        $rows.Add(("{0}`t{1}`t{2}`t{3}`t{4}`t{5}`t{6}`t{7}`t{8}`t{9}" -f `
          $t.kind, $t.ver, $letter, $seq, $f.name, $f.mode, $f.len, $f.dec, $f.pos, $f.desc))
      }
    }
  } catch {
    Write-Host ("    !! 실패: {0}" -f $_.Exception.Message)
  } finally {
    if ($doc) { try { $doc.Close(0) } catch {} }
  }
}

try { $word.Quit() } catch {}
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

$outFile = Join-Path $Out "sam-layout-dump.tsv"
[IO.File]::WriteAllLines($outFile, $rows, [Text.UTF8Encoding]::new($false))
Write-Host ("{0} — {1}줄" -f $outFile, ($rows.Count - 1))
