# Simple API Endpoint Testing Script

$BaseUrl = "http://localhost:8000"
$passed = 0
$failed = 0

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "        AgroBridge API Endpoint Testing                    " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$Url" -UseBasicParsing -TimeoutSec 5
        Write-Host " OK ($($response.StatusCode))" -ForegroundColor Green
        $script:passed++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host " OK (401 - Auth Required)" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host " FAILED ($statusCode)" -ForegroundColor Red
            $script:failed++
        }
    }
}

# Test endpoints
Write-Host "Health & System Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Health Check" "/health/"

Write-Host "`nAuthentication Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Register" "/api/v1/auth/register/"
Test-Endpoint "Login" "/api/v1/auth/login/"

Write-Host "`nUser Endpoints:" -ForegroundColor Yellow
Test-Endpoint "User Profile" "/api/v1/users/profile/"
Test-Endpoint "User List" "/api/v1/users/"

Write-Host "`nFarm Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Farm List" "/api/v1/farms/"
Test-Endpoint "Field List" "/api/v1/farms/fields/"
Test-Endpoint "Crop List" "/api/v1/farms/crops/"

Write-Host "`nMarketplace Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Product List" "/api/v1/marketplace/products/"
Test-Endpoint "Order List" "/api/v1/marketplace/orders/"

Write-Host "`nAI Assistant Endpoints:" -ForegroundColor Yellow
Test-Endpoint "AI Chat" "/api/v1/ai/chat/"

Write-Host "`nCrop Detection Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Detection List" "/api/v1/crop-detection/"

Write-Host "`nIoT Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Device List" "/api/v1/iot/devices/"

Write-Host "`nNotification Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Notification List" "/api/v1/notifications/"

Write-Host "`nLearning Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Course List" "/api/v1/learning/courses/"
Test-Endpoint "Lesson List" "/api/v1/learning/lessons/"

Write-Host "`nCommunity Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Post List" "/api/v1/community/posts/"
Test-Endpoint "Comment List" "/api/v1/community/comments/"

Write-Host "`nScheduling Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Task List" "/api/v1/scheduling/tasks/"

Write-Host "`nFinancial Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Financial Records" "/api/v1/financial/records/"

Write-Host "`nPayment Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Payment List" "/api/v1/payment/"

Write-Host "`nAnalytics Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Dashboard" "/api/v1/analytics/dashboard/"

# Display results
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "                    Test Results                           " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

$total = $passed + $failed
Write-Host "Total Tests: $total"
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "White" })

$passRate = [math]::Round(($passed / $total) * 100, 2)
Write-Host "Pass Rate: $passRate%"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All endpoint tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some endpoint tests failed." -ForegroundColor Yellow
}
