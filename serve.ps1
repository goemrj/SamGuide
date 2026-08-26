$port = 8392
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"
$mime = @{ ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript"; ".GHP"="application/octet-stream" }

# ---------------- 신포괄 그루퍼 ----------------
# 브라우저는 .exe 를 못 돌린다. 그래서 「신포괄 분류번호」 화면이 만든 그루퍼 입력줄을 여기로 보내면
# 이 서버가 심평원 Npo_kdrg11.exe 를 대신 돌리고 결과(.out)를 그대로 돌려준다.
# **바깥으로 나가는 것은 없다** — localhost 안에서만 오간다(SamGuide 의 전제 그대로).
# 그루퍼는 자기 폴더의 Npo_kdrg11.in 을 읽고 .out 을 쓰는 구조라 심평원 견본 자리를 쓸 수밖에 없다.
# 돌리기 전에 옮겨 두었다가 **finally 에서 무슨 일이 있어도 되돌려 놓는다.**
function Find-Grouper {
  foreach ($g in @("D:\Documents\Downloads\npo_kdrg_setup",
                   (Join-Path $env:USERPROFILE "Downloads\npo_kdrg_setup"),
                   (Join-Path $root "npo_kdrg_setup"))) {
    if ($g -and (Test-Path (Join-Path $g "Npo_kdrg11.exe"))) { return $g }
  }
  return $null
}
function Invoke-Grouper($lines) {
  $dir = Find-Grouper
  if (-not $dir) { return $null }
  $gin = Join-Path $dir "Npo_kdrg11.in"
  $gout = Join-Path $dir "Npo_kdrg11.out"
  $stash = Join-Path ([IO.Path]::GetTempPath()) ("npo_" + [IO.Path]::GetRandomFileName())
  New-Item -ItemType Directory -Path $stash -Force | Out-Null
  try {
    if (Test-Path $gin) { Copy-Item $gin $stash -Force }
    if (Test-Path $gout) { Copy-Item $gout $stash -Force }
    Remove-Item $gout -Force -ErrorAction SilentlyContinue
    [IO.File]::WriteAllText($gin, $lines, [Text.Encoding]::ASCII)
    # Push-Location 이 아니라 -WorkingDirectory 다 — 예외가 나도 서버의 현재 폴더가 틀어지지 않는다.
    # 그루퍼는 마스터(Npo_T*)를 자기 폴더에서 읽으므로 작업 폴더를 그리로 맞춰야 한다.
    Start-Process -FilePath (Join-Path $dir "Npo_kdrg11.exe") -WorkingDirectory $dir -NoNewWindow -Wait
    if (Test-Path $gout) { return [IO.File]::ReadAllText($gout, [Text.Encoding]::ASCII) }
    return ""
  } finally {
    if (Test-Path (Join-Path $stash "Npo_kdrg11.in")) { Copy-Item (Join-Path $stash "Npo_kdrg11.in") $gin -Force }
    if (Test-Path (Join-Path $stash "Npo_kdrg11.out")) { Copy-Item (Join-Path $stash "Npo_kdrg11.out") $gout -Force }
    Remove-Item $stash -Recurse -Force -ErrorAction SilentlyContinue
  }
}
function Write-Text($res, $code, $type, $text) {
  $res.StatusCode = $code
  $res.ContentType = $type
  $b = [Text.Encoding]::UTF8.GetBytes($text)
  $res.ContentLength64 = $b.Length
  $res.OutputStream.Write($b, 0, $b.Length)
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.LocalPath)
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path.TrimStart("/"))

    # 화면의 「열 너비 기본값으로 굳히기」가 쓰는 자리. 쓰기는 이 파일 하나만 받는다
    # (localhost 전용 서버지만, 아무 경로나 받으면 프로젝트 어디든 덮어쓸 수 있다).
    if ($req.HttpMethod -eq "PUT") {
      if ($path -eq "/data/colw-defaults.js" -and $req.ContentLength64 -le 262144) {
        $sr = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::UTF8)
        $body = $sr.ReadToEnd(); $sr.Close()
        [IO.File]::WriteAllText((Join-Path $root "data\colw-defaults.js"), $body, [Text.UTF8Encoding]::new($false))
        Write-Host ("saved data/colw-defaults.js ({0} bytes)" -f $body.Length)
        $res.StatusCode = 204
      } else {
        $res.StatusCode = 403
      }
    }
    # 그루퍼가 이 PC 에 있는지 — 화면은 이 답을 보고 「그루퍼로 검산」 단추를 띄울지 정한다
    elseif ($path -eq "/grouper" -and $req.HttpMethod -eq "GET") {
      $dir = Find-Grouper
      if ($dir) {
        $ver = (Get-Content (Join-Path $dir "Npo_kdrg1x_version") -ErrorAction SilentlyContinue | Select-Object -First 1)
        Write-Text $res 200 "application/json" ('{"ok":true,"dir":' + ($dir | ConvertTo-Json) + ',"version":' + (([string]$ver).Trim() | ConvertTo-Json) + '}')
      } else {
        Write-Text $res 200 "application/json" '{"ok":false}'
      }
    }
    elseif ($path -eq "/grouper" -and $req.HttpMethod -eq "POST") {
      if ($req.ContentLength64 -gt 8388608) {
        Write-Text $res 413 "text/plain; charset=utf-8" "명세서가 너무 많습니다 (한 번에 8MB 까지)."
      } else {
        $sr = New-Object IO.StreamReader($req.InputStream, [Text.Encoding]::ASCII)
        $body = $sr.ReadToEnd(); $sr.Close()
        $out = Invoke-Grouper $body
        if ($null -eq $out) {
          Write-Text $res 503 "text/plain; charset=utf-8" "신포괄 그루퍼(Npo_kdrg11.exe)를 이 PC 에서 찾지 못했습니다."
        } else {
          $n = ($body -split "`r?`n" | Where-Object { $_.Trim() -ne "" }).Count
          Write-Host ("grouper: {0} lines" -f $n)
          Write-Text $res 200 "text/plain; charset=us-ascii" $out
        }
      }
    }
    elseif (Test-Path $file -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($file)
      $ct = $mime[$ext]
      if (-not $ct) { $ct = "application/octet-stream" }
      $res.ContentType = $ct
      $bytes = [IO.File]::ReadAllBytes($file)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
    }
  } catch {
    Write-Host ("error: " + $_.Exception.Message)
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
