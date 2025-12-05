# Comprehensive API Endpoint Testing Script
# Tests all AgroBridge API endpoints to verify functionality

param(
    [string]$BaseUrl = "http://localhost:8000",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        AgroBridge API Endpoint Testing                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$results = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
    Endpoints = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int[]]$ExpectedStatus = @(200, 201)
    )
    
    $results.Total++
    $fullUrl = "$BaseUrl$Url"
    
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $params = @{
            Uri = $fullUrl
            Method = $Method
            Headers = $Headers
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($ExpectedStatus -contains $response.StatusCode) {
            Write-Host " ✓" -ForegroundColor Green
            $results.Passed++
            $status = "PASSED"
        } else {
            Write-Host " ✗ (Status: $($response.StatusCode))" -ForegroundColor Red
            $results.Failed++
            $status = "FAILED"
        }
        
        if ($Verbose) {
            Write-Host "  URL: $fullUrl" -ForegroundColor Gray
            Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
            Write-Host "  Response Length: $($response.Content.Length) bytes" -ForegroundColor Gray
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($ExpectedStatus -contains $statusCode) {
            Write-Host " ✓ (Expected error: $statusCode)" -ForegroundColor Green
            $results.Passed++
            $status = "PASSED"
        } else {
            Write-Host " ✗ (Error: $($_.Exception.Message))" -ForegroundColor Red
            $results.Failed++
            $status = "FAILED"
        }
    }
    
    $results.Endpoints += @{
        Name = $Name
        Url = $Url
        Method = $Method
        Status = $status
    }
}

# Test Health and System Endpoints
Write-Host "`n━━━ Health & System Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Health Check" -Url "/health/"
Test-Endpoint -Name "API Root" -Url "/api/"
Test-Endpoint -Name "Swagger Documentation" -Url "/swagger/"
Test-Endpoint -Name "ReDoc Documentation" -Url "/redoc/"

# Test Authentication Endpoints
Write-Host "`n━━━ Authentication Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Register (No Data)" -Url "/api/auth/register/" -Method "POST" -ExpectedStatus @(400)
Test-Endpoint -Name "Login (No Data)" -Url "/api/auth/login/" -Method "POST" -ExpectedStatus @(400)
Test-Endpoint -Name "Token Refresh (No Data)" -Url "/api/auth/token/refresh/" -Method "POST" -ExpectedStatus @(400, 401)
Test-Endpoint -Name "Logout" -Url "/api/auth/logout/" -Method "POST" -ExpectedStatus @(401)

# Test User Endpoints
Write-Host "`n━━━ User Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "User Profile (Unauthorized)" -Url "/api/users/profile/" -ExpectedStatus @(401)
Test-Endpoint -Name "User List (Unauthorized)" -Url "/api/users/" -ExpectedStatus @(401)

# Test Farm Endpoints
Write-Host "`n━━━ Farm Management Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Farm List (Unauthorized)" -Url "/api/farms/" -ExpectedStatus @(401)
Test-Endpoint -Name "Field List (Unauthorized)" -Url "/api/farms/fields/" -ExpectedStatus @(401)
Test-Endpoint -Name "Crop List (Unauthorized)" -Url "/api/farms/crops/" -ExpectedStatus @(401)

# Test Marketplace Endpoints
Write-Host "`n━━━ Marketplace Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Product List" -Url "/api/marketplace/products/"
Test-Endpoint -Name "Order List (Unauthorized)" -Url "/api/marketplace/orders/" -ExpectedStatus @(401)
Test-Endpoint -Name "Review List" -Url "/api/marketplace/reviews/"

# Test AI Assistant Endpoints
Write-Host "`n━━━ AI Assistant Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "AI Chat (Unauthorized)" -Url "/api/ai-assistant/chat/" -Method "POST" -ExpectedStatus @(401)
Test-Endpoint -Name "Conversation List (Unauthorized)" -Url "/api/ai-assistant/conversations/" -ExpectedStatus @(401)

# Test Crop Detection Endpoints
Write-Host "`n━━━ Crop Detection Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Detection List (Unauthorized)" -Url "/api/crop-detection/" -ExpectedStatus @(401)
Test-Endpoint -Name "Detection Upload (Unauthorized)" -Url "/api/crop-detection/" -Method "POST" -ExpectedStatus @(401)

# Test IoT Endpoints
Write-Host "`n━━━ IoT Service Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Device List (Unauthorized)" -Url "/api/iot/devices/" -ExpectedStatus @(401)
Test-Endpoint -Name "Sensor Data (Unauthorized)" -Url "/api/iot/sensor-data/" -ExpectedStatus @(401)

# Test Notification Endpoints
Write-Host "`n━━━ Notification Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Notification List (Unauthorized)" -Url "/api/notifications/" -ExpectedStatus @(401)

# Test Learning Endpoints
Write-Host "`n━━━ Learning Platform Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Course List" -Url "/api/learning/courses/"
Test-Endpoint -Name "Lesson List" -Url "/api/learning/lessons/"
Test-Endpoint -Name "Enrollment List (Unauthorized)" -Url "/api/learning/enrollments/" -ExpectedStatus @(401)

# Test Community Endpoints
Write-Host "`n━━━ Community Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Post List" -Url "/api/community/posts/"
Test-Endpoint -Name "Comment List" -Url "/api/community/comments/"
Test-Endpoint -Name "Message List (Unauthorized)" -Url "/api/community/messages/" -ExpectedStatus @(401)

# Test Scheduling Endpoints
Write-Host "`n━━━ Scheduling Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Task List (Unauthorized)" -Url "/api/scheduling/tasks/" -ExpectedStatus @(401)

# Test Financial Endpoints
Write-Host "`n━━━ Financial Management Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Financial Records (Unauthorized)" -Url "/api/financial/records/" -ExpectedStatus @(401)
Test-Endpoint -Name "Budget List (Unauthorized)" -Url "/api/financial/budgets/" -ExpectedStatus @(401)

# Test Payment Endpoints
Write-Host "`n━━━ Payment Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Payment List (Unauthorized)" -Url "/api/payments/" -ExpectedStatus @(401)

# Test Analytics Endpoints
Write-Host "`n━━━ Analytics Endpoints ━━━" -ForegroundColor Yellow
Test-Endpoint -Name "Dashboard (Unauthorized)" -Url "/api/analytics/dashboard/" -ExpectedStatus @(401)

# Display Results
Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    Test Results                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Total Endpoints Tested: $($results.Total)" -ForegroundColor White
Write-Host "Passed: $($results.Passed)" -ForegroundColor Green
Write-Host "Failed: $($results.Failed)" -ForegroundColor $(if ($results.Failed -gt 0) { "Red" } else { "White" })
Write-Host ""

$passRate = [math]::Round(($results.Passed / $results.Total) * 100, 2)
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })
Write-Host ""

# Save results to file
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$reportFile = "api_test_results_$timestamp.json"
$results | ConvertTo-Json -Depth 10 | Out-File $reportFile
Write-Host "Detailed results saved to: $reportFile" -ForegroundColor Gray
Write-Host ""

if ($results.Failed -eq 0) {
    Write-Host "✓ All endpoint tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some endpoint tests failed. Check the results above." -ForegroundColor Red
    exit 1
}
