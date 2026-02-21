# Backend API Test Script
# Use port 3000 (default)
$base = "http://localhost:3000/api"
$token = $null
$categoryId = $null
$expenseId = $null

function Invoke-Api {
    param($Method, $Path, $Body = $null, $Auth = $false)
    $headers = @{ "Content-Type" = "application/json" }
    if ($Auth -and $token) { $headers["Authorization"] = "Bearer $token" }
    $params = @{ Uri = "$base$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Compress) }
    try {
        $r = Invoke-WebRequest @params
        return @{ Status = $r.StatusCode; Content = $r.Content }
    } catch {
        return @{ Status = $_.Exception.Response.StatusCode.value__; Content = $_.ErrorDetails.Message }
    }
}

Write-Host "`n=== 1. Health Check ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/health"
Write-Host "Status: $($r.Status) | $($r.Content)"

Write-Host "`n=== 2. Signup ===" -ForegroundColor Cyan
$rand = Get-Random
$signupEmail = "test$rand@example.com"
$r = Invoke-Api -Method Post -Path "/auth/signup" -Body @{
    email = $signupEmail
    password = "password123"
    name = "Test User"
    tenantName = "TestOrg$rand"
}
Write-Host "Status: $($r.Status)"
$json = $r.Content | ConvertFrom-Json
if ($json.success) {
    $token = $json.data.token
    Write-Host "OK - User: $($json.data.user.email), Tenant: $($json.data.user.tenantSlug)"
} else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 3. Login ===" -ForegroundColor Cyan
$loginEmail = $signupEmail
$r = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = $loginEmail; password = "password123" }
Write-Host "Status: $($r.Status)"
$loginJson = $r.Content | ConvertFrom-Json
if ($loginJson.success) {
    $token = $loginJson.data.token
    Write-Host "OK - Token received"
} else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 4. Get Profile (auth/me) ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/auth/me" -Auth $true
Write-Host "Status: $($r.Status)"
$meJson = $r.Content | ConvertFrom-Json
if ($meJson.success) { Write-Host "OK - $($meJson.data.user.name), Currency: $($meJson.data.user.currency)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 5. Update Profile ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Patch -Path "/users/me" -Body @{ currency = "INR"; monthlyBudget = 50000 } -Auth $true
Write-Host "Status: $($r.Status)"
$upJson = $r.Content | ConvertFrom-Json
if ($upJson.success) { Write-Host "OK - Currency: $($upJson.data.user.currency), Budget: $($upJson.data.user.monthlyBudget)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 6. Create Category ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Post -Path "/categories" -Body @{
    name = "Food & Dining"
    type = "expense"
    color = "#FF5733"
} -Auth $true
Write-Host "Status: $($r.Status)"
$catJson = $r.Content | ConvertFrom-Json
if ($catJson.success) {
    $categoryId = $catJson.data.category.id
    Write-Host "OK - Category: $($catJson.data.category.name) (id: $categoryId)"
} else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 7. List Categories ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/categories" -Auth $true
Write-Host "Status: $($r.Status)"
$listCat = $r.Content | ConvertFrom-Json
if ($listCat.success) { Write-Host "OK - Count: $($listCat.data.categories.Count)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 8. Create Expense ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Post -Path "/expenses" -Body @{
    amount = 250.50
    currency = "INR"
    description = "Lunch at cafe"
    date = "2025-02-21"
    categoryId = $categoryId
} -Auth $true
Write-Host "Status: $($r.Status)"
$expJson = $r.Content | ConvertFrom-Json
if ($expJson.success) {
    $expenseId = $expJson.data.expense.id
    Write-Host "OK - Amount: $($expJson.data.expense.amount), Desc: $($expJson.data.expense.description)"
} else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 9. List Expenses ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/expenses?page=1&limit=10" -Auth $true
Write-Host "Status: $($r.Status)"
$listExp = $r.Content | ConvertFrom-Json
if ($listExp.success) { Write-Host "OK - Count: $($listExp.data.expenses.Count), Total: $($listExp.data.pagination.total)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 10. Get Expense by ID ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/expenses/$expenseId" -Auth $true
Write-Host "Status: $($r.Status)"
$getExp = $r.Content | ConvertFrom-Json
if ($getExp.success) { Write-Host "OK - $($getExp.data.expense.description)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 11. List Receipts ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/receipts" -Auth $true
Write-Host "Status: $($r.Status)"
$recJson = $r.Content | ConvertFrom-Json
if ($recJson.success) { Write-Host "OK - Count: $($recJson.data.receipts.Count)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 11b. Receipt Upload endpoint (no file) ===" -ForegroundColor Cyan
$headers = @{ "Authorization" = "Bearer $token" }
$uploadStatus = $null
try {
    $r = Invoke-WebRequest -Uri "$base/receipts/upload" -Method Post -Headers $headers -UseBasicParsing
    $uploadStatus = $r.StatusCode
    Write-Host "Status: $uploadStatus"
} catch {
    $uploadStatus = $_.Exception.Response.StatusCode.value__
    Write-Host "Status: $uploadStatus (400/415 = route exists)"
}
if ($uploadStatus -in @(400, 415, 200)) { Write-Host "OK - Upload route reachable" }

Write-Host "`n=== 12. Unauthorized (no token) ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/expenses"
Write-Host "Status: $($r.Status) - Expected 401"
if ($r.Status -eq 401) { Write-Host "OK - Correctly rejected" } else { Write-Host "UNEXPECTED" }

Write-Host "`n=== 13. AI Status ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/ai/status" -Auth $true
Write-Host "Status: $($r.Status)"
$aiStatus = $r.Content | ConvertFrom-Json
if ($aiStatus.success) { Write-Host "OK - AI enabled: $($aiStatus.data.enabled)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 14. AI Categorize ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Post -Path "/ai/categorize" -Body @{ text = "Lunch at Starbucks" } -Auth $true
Write-Host "Status: $($r.Status)"
$catAi = $r.Content | ConvertFrom-Json
if ($catAi.success) { Write-Host "OK - Category: $($catAi.data.category), Confidence: $($catAi.data.confidence)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 15. AI Insights ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/ai/insights" -Auth $true
Write-Host "Status: $($r.Status)"
$insAi = $r.Content | ConvertFrom-Json
if ($insAi.success) { Write-Host "OK - Insights count: $($insAi.data.insights.Count)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 16. AI Expense from Text ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Post -Path "/ai/expense-from-text" -Body @{ text = "25 dollars lunch at cafe" } -Auth $true
Write-Host "Status: $($r.Status)"
$nlJson = $r.Content | ConvertFrom-Json
if ($nlJson.success) { Write-Host "OK - Parsed: $($nlJson.data.parsed.amount) $($nlJson.data.parsed.currency)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 17. AI Recurring ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/ai/recurring" -Auth $true
Write-Host "Status: $($r.Status)"
$recJson = $r.Content | ConvertFrom-Json
if ($recJson.success) { Write-Host "OK - Patterns: $($recJson.data.patterns.Count)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 18. AI Report ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/ai/report" -Auth $true
Write-Host "Status: $($r.Status)"
$repJson = $r.Content | ConvertFrom-Json
if ($repJson.success) { Write-Host "OK - Report generated" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 19. AI Anomalies ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Get -Path "/ai/anomalies" -Auth $true
Write-Host "Status: $($r.Status)"
$anomJson = $r.Content | ConvertFrom-Json
if ($anomJson.success) { Write-Host "OK - Anomalies: $($anomJson.data.anomalies.Count)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 20. AI Check Duplicate ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Post -Path "/ai/check-duplicate" -Body @{ amount = 250.50; date = "2025-02-21" } -Auth $true
Write-Host "Status: $($r.Status)"
$dupJson = $r.Content | ConvertFrom-Json
if ($dupJson.success) { Write-Host "OK - isDuplicate: $($dupJson.data.isDuplicate)" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== 21. AI Chat ===" -ForegroundColor Cyan
$r = Invoke-Api -Method Post -Path "/ai/chat" -Body @{ query = "How much did I spend on food?" } -Auth $true
Write-Host "Status: $($r.Status)"
$chatJson = $r.Content | ConvertFrom-Json
if ($chatJson.success) { Write-Host "OK - Answer received" }
else { Write-Host "FAIL: $($r.Content)" }

Write-Host "`n=== Tests Complete ===" -ForegroundColor Green
