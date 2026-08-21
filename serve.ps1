$port = 8392
$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"
$mime = @{ ".html"="text/html"; ".css"="text/css"; ".js"="application/javascript"; ".GHP"="application/octet-stream" }
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
    $res.StatusCode = 500
  } finally {
    $res.OutputStream.Close()
  }
}
