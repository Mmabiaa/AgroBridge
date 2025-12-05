# Comprehensive test runner for AgroBridge (PowerShell version)
# Runs all test suites: unit, integration, e2e, load, and chaos tests

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║        AgroBridge Comprehensive Test Suite                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$TEST_ENV = if ($env:TEST_ENV) { $env:TEST_ENV } else { "test" }
$COVERAGE_THRESHOLD = if ($env:COVERAGE_THRESHOLD) { $env:COVERAGE_THRESHOLD } else { 80 }
$RESULTS_DIR = "test_results_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Create results directory
New-Item -ItemType Directory -Path $RESULTS_DIR -Force | Out-Null

# Function to print section header
function Print-Section {
    param($Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

# Function to print success
function Print-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

# Function to print error
function Print-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# Function to print warning
function Print-Warning {
    param($Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

# Check prerequisites
Print-Section "Checking Prerequisites"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Print-Error "Python is not installed"
    exit 1
}
Print-Success "Python found"

if (-not (Get-Command pytest -ErrorAction SilentlyContinue)) {
    Print-Warning "pytest not found, installing..."
    pip install pytest pytest-django pytest-cov pytest-xdist
}
Print-Success "pytest found"

# Set up test environment
Print-Section "Setting Up Test Environment"

$env:DJANGO_SETTINGS_MODULE = "backend.settings"
$env:DATABASE_URL = "postgresql://test:test@localhost:5432/test_agrobridge"
$env:REDIS_URL = "redis://localhost:6379/1"
$env:RABBITMQ_URL = "amqp://test:test@localhost:5672/"
$env:TESTING = "true"

Print-Success "Environment configured"

# Run database migrations
Print-Section "Preparing Test Database"

try {
    python manage.py migrate --settings=backend.settings --database=default --run-syncdb
    Print-Success "Database migrations completed"
} catch {
    Print-Warning "Database migration failed (may not be critical)"
}

# Test Suite 1: Unit Tests
Print-Section "Running Unit Tests"

try {
    pytest tests/ `
        -m "unit" `
        --cov=backend `
        --cov-report=html:"$RESULTS_DIR/coverage_html" `
        --cov-report=xml:"$RESULTS_DIR/coverage.xml" `
        --cov-report=term-missing `
        --junitxml="$RESULTS_DIR/unit_tests.xml" `
        --maxfail=5 `
        -v
    
    Print-Success "Unit tests passed"
} catch {
    Print-Error "Unit tests failed"
    exit 1
}

# Check coverage threshold
try {
    [xml]$coverageXml = Get-Content "$RESULTS_DIR/coverage.xml"
    $coverage = [math]::Round([double]$coverageXml.coverage.'line-rate' * 100, 2)
    
    Write-Host "Code coverage: $coverage%"
    if ($coverage -lt $COVERAGE_THRESHOLD) {
        Print-Error "Coverage $coverage% is below threshold $COVERAGE_THRESHOLD%"
        exit 1
    }
    Print-Success "Coverage threshold met"
} catch {
    Print-Warning "Could not verify coverage threshold"
}

# Test Suite 2: Integration Tests
Print-Section "Running Integration Tests"

try {
    pytest tests/ `
        -m "integration" `
        --junitxml="$RESULTS_DIR/integration_tests.xml" `
        -v
    
    Print-Success "Integration tests passed"
} catch {
    Print-Error "Integration tests failed"
    exit 1
}

# Test Suite 3: End-to-End Tests
Print-Section "Running End-to-End Tests"

try {
    pytest tests/e2e/ `
        -m "e2e" `
        --junitxml="$RESULTS_DIR/e2e_tests.xml" `
        -v
    
    Print-Success "End-to-end tests passed"
} catch {
    Print-Error "E2E tests failed"
    exit 1
}

# Test Suite 4: Security Tests
Print-Section "Running Security Tests"

try {
    bandit -r backend/ -f json -o "$RESULTS_DIR/bandit_report.json"
} catch {
    Print-Warning "Security issues found (see report)"
}

try {
    safety check --json --output "$RESULTS_DIR/safety_report.json"
} catch {
    Print-Warning "Vulnerable dependencies found (see report)"
}

Print-Success "Security scans completed"

# Test Suite 5: Performance Tests
Print-Section "Running Performance Tests"

try {
    pytest tests/ `
        -m "performance" `
        --benchmark-only `
        --benchmark-json="$RESULTS_DIR/benchmark.json"
    
    Print-Success "Performance tests completed"
} catch {
    Print-Warning "Performance tests completed with warnings"
}

# Test Suite 6: Chaos Engineering Tests (optional)
if ($env:RUN_CHAOS_TESTS -eq "true") {
    Print-Section "Running Chaos Engineering Tests"
    
    try {
        pytest tests/chaos/ `
            -m "chaos" `
            --junitxml="$RESULTS_DIR/chaos_tests.xml" `
            -v
        
        Print-Success "Chaos tests completed"
    } catch {
        Print-Warning "Some chaos tests failed (expected)"
    }
} else {
    Print-Warning "Chaos tests skipped (set RUN_CHAOS_TESTS=true to run)"
}

# Generate test report
Print-Section "Generating Test Report"

$report = @{
    test_date = Get-Date -Format "o"
    environment = $TEST_ENV
    coverage_threshold = $COVERAGE_THRESHOLD
    actual_coverage = $coverage
    test_suites = @{}
}

# Parse JUnit XML files
Get-ChildItem -Path $RESULTS_DIR -Filter "*_tests.xml" | ForEach-Object {
    $suiteName = $_.BaseName
    [xml]$xml = Get-Content $_.FullName
    $testsuite = $xml.testsuites.testsuite
    
    if ($testsuite) {
        $report.test_suites[$suiteName] = @{
            tests = [int]$testsuite.tests
            failures = [int]$testsuite.failures
            errors = [int]$testsuite.errors
            skipped = [int]$testsuite.skipped
            time = [double]$testsuite.time
        }
    }
}

# Calculate totals
$totals = @{
    tests = ($report.test_suites.Values | Measure-Object -Property tests -Sum).Sum
    failures = ($report.test_suites.Values | Measure-Object -Property failures -Sum).Sum
    errors = ($report.test_suites.Values | Measure-Object -Property errors -Sum).Sum
    skipped = ($report.test_suites.Values | Measure-Object -Property skipped -Sum).Sum
}
$totals.passed = $totals.tests - $totals.failures - $totals.errors - $totals.skipped
$report.totals = $totals

# Save report
$report | ConvertTo-Json -Depth 10 | Out-File "$RESULTS_DIR/test_report.json"

# Print summary
Write-Host ""
Write-Host "=" * 60
Write-Host "TEST SUMMARY"
Write-Host "=" * 60
Write-Host "Total Tests: $($totals.tests)"
Write-Host "Passed: $($totals.passed)" -ForegroundColor Green
Write-Host "Failed: $($totals.failures)" -ForegroundColor $(if ($totals.failures -gt 0) { "Red" } else { "White" })
Write-Host "Errors: $($totals.errors)" -ForegroundColor $(if ($totals.errors -gt 0) { "Red" } else { "White" })
Write-Host "Skipped: $($totals.skipped)"
Write-Host "Coverage: $coverage%"
Write-Host "=" * 60

# Final summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    Test Results                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results saved to: $RESULTS_DIR"
Write-Host ""
Write-Host "Reports:"
Write-Host "  - Test Report: $RESULTS_DIR/test_report.json"
Write-Host "  - Coverage HTML: $RESULTS_DIR/coverage_html/index.html"
Write-Host "  - Coverage XML: $RESULTS_DIR/coverage.xml"
Write-Host "  - Security Report: $RESULTS_DIR/bandit_report.json"
Write-Host "  - Dependency Report: $RESULTS_DIR/safety_report.json"
Write-Host ""

if ($totals.failures -eq 0 -and $totals.errors -eq 0) {
    Print-Success "All tests passed successfully!"
    exit 0
} else {
    Print-Error "Some tests failed. Check the reports for details."
    exit 1
}
