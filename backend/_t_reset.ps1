param([string]$User, [string]$Pw1)
$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:8000"
if (-not $User -or -not $Pw1) { throw "pass -User and -Pw1" }

function Call($method, $path, $body, $token) {
  $h = @{}
  if ($token) { $h["Authorization"] = "Bearer $token" }
  $p = @{ Uri = "$base$path"; Method = $method; Headers = $h; UseBasicParsing = $true }
  if ($body) { $p.Body = ($body | ConvertTo-Json); $p.ContentType = "application/json" }
  try {
    $r = Invoke-WebRequest @p
    $j = $null; try { $j = $r.Content | ConvertFrom-Json } catch {}
    return @{ Code = [int]$r.StatusCode; Json = $j }
  } catch {
    $c = 0; if ($_.Exception.Response) { $c = [int]$_.Exception.Response.StatusCode }
    return @{ Code = $c; Json = $null }
  }
}
function Check($label, $got, $want) {
  $ok = $want -contains $got
  Write-Host ("{0,-6} {1,-40} got {2} (want {3})" -f $(if ($ok) {"PASS"} else {"FAIL"}), $label, $got, ($want -join "/"))
  if (-not $ok) { throw "Stopping at first failure: $label" }
}
function Tok($r) { if ($r.Json.access_token) { $r.Json.access_token } else { $r.Json.token } }

$Pw2 = "Bb2!" + [guid]::NewGuid().ToString("N").Substring(0,12)

$r = Call "POST" "/auth/login" @{ username=$User; password=$Pw1 }
Check "login with current password" $r.Code @(200)
$tokA = Tok $r
Check "JWT works before reset" (Call "GET" "/profile" $null $tokA).Code @(200)

$r = Call "POST" "/auth/forgot-password" @{ identifier=$User }
Check "forgot-password" $r.Code @(200)
$link = $r.Json.dev_reset_link
Write-Host ("       dev_reset_link present: " + [bool]$link)
if (-not $link) { throw "No dev link returned" }
$tok = [regex]::Match($link, 'token=([^&\s]+)').Groups[1].Value

Check "reset-password (valid token)" (Call "POST" "/auth/reset-password" @{ token=$tok; new_password=$Pw2 }).Code @(200)
Check "OLD JWT after reset -> 401" (Call "GET" "/profile" $null $tokA).Code @(401)
Check "reuse reset token -> rejected" (Call "POST" "/auth/reset-password" @{ token=$tok; new_password=$Pw1 }).Code @(400,401,403,404,410)
Check "login with OLD password -> rejected" (Call "POST" "/auth/login" @{ username=$User; password=$Pw1 }).Code @(400,401,403)

$r = Call "POST" "/auth/login" @{ username=$User; password=$Pw2 }
Check "login with NEW password" $r.Code @(200)
Check "NEW JWT works" (Call "GET" "/profile" $null (Tok $r)).Code @(200)
Write-Host "`nALL PASS"
