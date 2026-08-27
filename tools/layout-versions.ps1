# ---------- sam-layout-dump.tsv → data/layout-versions.js ----------
#
# tools/sam-layout-dump.ps1 이 심평원 레이아웃 문서(.doc)에서 뽑아 둔 TSV 를
# 화면이 읽는 자바스크립트 데이터로 바꾼다. 글자는 원문 그대로 옮기고 줄이지 않는다.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/layout-versions.ps1 `
#     -Tsv "<sam-layout-dump.tsv>" -Out data/layout-versions.js
#
# 필드 하나 = [위치, 길이(정수부), 소수부, 형식, 항목명, 설명]
#   * 실제 바이트 수 = 길이 + 소수부  (문서의 n(10.2) 는 12byte 다)
#
# 이 파일은 UTF-8 BOM 으로 저장한다 (PowerShell 5.1 은 BOM 이 없으면 CP949 로 읽는다).

param(
  [Parameter(Mandatory=$true)][string]$Tsv,
  [string]$Out = "data\layout-versions.js"
)

$ErrorActionPreference = "Stop"

# 문서 종류 → 화면에 쓸 이름과, 지금 화면의 **어느 청구분야들**과 짝인지(쉼표로 나눈다).
#   청구서(H010) 하나를 건강보험·완화·질병군·의료급여정액·한방이 함께 쓴다 — 그래서 여럿이다.
#   산재 청구서(M010.1)도 산재 의치과와 산재 한방이 함께 쓴다.
# 짝이 없는 것(약국·보건·산재약제비)은 지금 화면에 청구분야가 없다 — 그래도 자료는 담아 둔다.
$kinds = [ordered]@{
  '청구서'          = @{ label = '청구서 (건강보험 · 의료급여 공통)'; claim = 'GEN,WANHWA,DRG,MG,HANBANG' }
  '의치과'          = @{ label = '의과 · 치과 명세서';                claim = 'GEN,WANHWA' }
  '한방'            = @{ label = '한방 명세서';                      claim = 'HANBANG'    }
  'DRG'             = @{ label = '질병군(DRG) 명세서';               claim = 'DRG'        }
  '의료급여정액'    = @{ label = '의료급여 정액 명세서';              claim = 'MG'         }
  '약국'            = @{ label = '약국 명세서';                      claim = ''           }
  '보건'            = @{ label = '보건기관 명세서';                   claim = ''           }
  '산재청구서'      = @{ label = '산재 청구서 (의 · 치과)';           claim = 'SANJAE,SANJAE_HAN' }
  '산재의치과'      = @{ label = '산재 의 · 치과 명세서';             claim = 'SANJAE'     }
  '산재한의과'      = @{ label = '산재 한의과 명세서';                claim = 'SANJAE_HAN' }
  '산재약제비청구서'= @{ label = '산재 청구서 (약제비)';              claim = ''           }
  '산재약제비'      = @{ label = '산재 약제비 명세서';                claim = ''           }
}

function Esc([string]$s){
  if ($null -eq $s) { return '' }
  $s = $s -replace '\\', '\\'
  $s = $s -replace '"', '\"'
  return $s
}

$lines = [IO.File]::ReadAllLines($Tsv, [Text.UTF8Encoding]::new($false))
$data = [ordered]@{}
for ($i = 1; $i -lt $lines.Count; $i++) {
  $c = $lines[$i] -split "`t"
  if ($c.Count -lt 10) { continue }
  $kind = $c[0]; $ver = $c[1]; $rec = $c[2]
  if (-not $data.Contains($kind)) { $data[$kind] = [ordered]@{} }
  if (-not $data[$kind].Contains($ver)) { $data[$kind][$ver] = [ordered]@{} }
  if (-not $data[$kind][$ver].Contains($rec)) { $data[$kind][$ver][$rec] = New-Object System.Collections.Generic.List[string] }
  $dec = if ($c[7]) { $c[7] } else { '0' }
  $data[$kind][$ver][$rec].Add(('[{0},{1},{2},"{3}","{4}","{5}"]' -f `
    $c[8], $c[6], $dec, (Esc $c[5]), (Esc $c[4]), (Esc $c[9])))
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('/* ---------- 서식버전별 SAM 레이아웃 — 심평원 레이아웃 문서에서 그대로 뽑은 것 ----------')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('   원본: 「질의 참고파일\SAM」 의 버전별 문서(SAM_01_청구서 · SAM_02_의치과명세서 …).')
[void]$sb.AppendLine('   만드는 법: tools/sam-layout-dump.ps1 (.doc → TSV) → tools/layout-versions.ps1 (TSV → 이 파일).')
[void]$sb.AppendLine('   손으로 고치지 않는다 — 다시 뽑으면 덮어쓴다.')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('   필드 하나 = [위치, 길이(정수부), 소수부, 형식, 항목명, 설명]')
[void]$sb.AppendLine('     * 실제 바이트 수 = 길이 + 소수부. 문서의 n(10.2) 는 12byte 다.')
[void]$sb.AppendLine('     * 항목명은 문서의 「항 목」 칸 그대로다. 머리칸이 한 단계 더 있는 줄은')
[void]$sb.AppendLine('       잎 이름만 남는다(예: 청구구분 → 코드).')
[void]$sb.AppendLine('   ------------------------------------------------------------------------ */')
[void]$sb.AppendLine('')
[void]$sb.AppendLine('var SG_LAYOUT_VERSIONS = {')

$kindKeys = @($kinds.Keys) | Where-Object { $data.Contains($_) }
foreach ($k in $kindKeys) {
  $meta = $kinds[$k]
  [void]$sb.AppendLine(('  "{0}": {{ label:"{1}", claim:"{2}", vers:{{' -f $k, $meta.label, $meta.claim))
  foreach ($v in ($data[$k].Keys | Sort-Object)) {
    [void]$sb.AppendLine(('    "{0}": {{' -f $v))
    foreach ($r in $data[$k][$v].Keys) {
      [void]$sb.AppendLine(('      "{0}": [' -f $r))
      foreach ($row in $data[$k][$v][$r]) { [void]$sb.AppendLine('        ' + $row + ',') }
      [void]$sb.AppendLine('      ],')
    }
    [void]$sb.AppendLine('    },')
  }
  [void]$sb.AppendLine('  }},')
}
[void]$sb.AppendLine('};')

[IO.File]::WriteAllText($Out, $sb.ToString(), [Text.UTF8Encoding]::new($false))
$n = ($lines.Count - 1)
Write-Host ("{0} — 필드 {1}개" -f $Out, $n)
