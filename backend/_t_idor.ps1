$base = "http://127.0.0.1:8000"
$script:fails = 0

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
function Row($status, $label, $detail) { Write-Host ("{0,-12} {1,-40} {2}" -f $status, $label, $detail) }
function Denied($label, $r) {
  if ($r.Code -in 401,403,404) { Row "PASS" $label "got $($r.Code)" }
  elseif ($r.Code -eq 422) { Row "INCONCLUSIVE" $label "got 422 (body rejected before ownership check)" }
  else { Row "FAIL" $label "got $($r.Code) <-- B reached A's data"; $script:fails++ }
}
function NewAcct($tag) {
  $u  = "zz_idor${tag}_" + (Get-Random -Maximum 999999)
  $pw = "Aa1!" + [guid]::NewGuid().ToString("N").Substring(0,12)
  $r = Call "POST" "/auth/signup" @{ username=$u; password=$pw }
  if ($r.Code -ne 200) { throw "signup $tag failed: $($r.Code)" }
  return $r.Json.access_token
}

$tokA = NewAcct "A"
$tokB = NewAcct "B"

$r = Call "POST" "/session/" @{ mode="manual"; scenario="idor test"; product_context="idor test" } $tokA
if ($r.Code -notin 200,201) { throw "A create session failed: $($r.Code)" }
$sid = if ($r.Json.id) { $r.Json.id } else { $r.Json.session_id }
Write-Host "A created session id: $sid`n"

Write-Host "--- positive controls (A on own session) ---"
foreach ($p in "/session/$sid", "/session/$sid/messages") {
  $c = (Call "GET" $p $null $tokA).Code
  if ($c -eq 200) { Row "PASS" "A GET $p" "got 200" } else { Row "FAIL" "A GET $p" "got $c"; $script:fails++ }
}

Write-Host "`n--- no token at all ---"
Denied "anon GET /session/$sid" (Call "GET" "/session/$sid" $null $null)
Denied "anon GET /session/$sid/messages" (Call "GET" "/session/$sid/messages" $null $null)

Write-Host "`n--- B attacking A's session ---"
Denied "B GET /session/$sid"              (Call "GET"  "/session/$sid" $null $tokB)
Denied "B GET /session/$sid/messages"     (Call "GET"  "/session/$sid/messages" $null $tokB)
Denied "B GET /session/$sid/report"       (Call "GET"  "/session/$sid/report" $null $tokB)
Denied "B GET /session/$sid/report/pdf"   (Call "GET"  "/session/$sid/report/pdf" $null $tokB)
Denied "B POST /session/$sid/report"      (Call "POST" "/session/$sid/report" $null $tokB)
Denied "B POST /session/$sid/query"       (Call "POST" "/session/$sid/query" @{ query="test"; question="test"; text="test" } $tokB)

Write-Host "`n--- B's session list must not contain A's session ---"
$l = Call "GET" "/session/" $null $tokB
if ($l.Code -ne 200) { Row "FAIL" "B GET /session/" "got $($l.Code)"; $script:fails++ }
else {
  $items = @($l.Json); if ($l.Json.sessions) { $items = @($l.Json.sessions) }
  $ids = @($items | ForEach-Object { if ($_.id) { $_.id } else { $_.session_id } })
  if ($ids -contains $sid) { Row "FAIL" "B list excludes A's session" "A's session IS in B's list"; $script:fails++ }
  else { Row "PASS" "B list excludes A's session" "B sees $($ids.Count) session(s)" }
}

Write-Host "`nFAIL count: $script:fails"
