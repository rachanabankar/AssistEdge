$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:8000"

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
function Check($label, $ok, $detail) {
  Write-Host ("{0,-6} {1,-44} {2}" -f $(if ($ok) {"PASS"} else {"FAIL"}), $label, $detail)
  if (-not $ok) { throw "Stopping at first failure: $label" }
}

$u  = "zz_test_" + (Get-Random -Maximum 999999)
$pw = "Aa1!" + [guid]::NewGuid().ToString("N").Substring(0,12)
$r = Call "POST" "/auth/signup" @{ username=$u; password=$pw }
Check "signup" ($r.Code -eq 200) "got $($r.Code)"
$tok = $r.Json.access_token

$before = Call "GET" "/profile" $null $tok
Check "GET /profile before" ($before.Code -eq 200) "got $($before.Code)"
Write-Host ("       profile keys: " + (($before.Json.PSObject.Properties.Name) -join ", "))

$evil = "attacker_$(Get-Random -Maximum 99999)@example.invalid"
$patch = @{ name="Test Name"; phone="555-0100"; email=$evil; username="hijacked_name"; token_version=99; id=1 }
$r = Call "PATCH" "/profile" $patch $tok
Check "PATCH with extra fields" ($r.Code -in 200,422) "got $($r.Code) (200 ignore / 422 reject both acceptable)"

$after = Call "GET" "/profile" $null $tok
Check "JWT still valid after PATCH" ($after.Code -eq 200) "got $($after.Code)"
$a = $after.Json
Check "email NOT changed" ($a.email -ne $evil) "email now: '$($a.email)'"
Check "username NOT changed" ($a.username -eq $u) "username unchanged: $($a.username -eq $u)"
Check "id NOT changed" ($a.id -eq $before.Json.id) "id unchanged: $($a.id -eq $before.Json.id)"
if ($r.Code -eq 200) { Check "allowed field 'name' updated" ($a.name -eq "Test Name") "name now: '$($a.name)'" }
Write-Host "`nALL PASS"
