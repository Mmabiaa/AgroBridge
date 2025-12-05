#!/bin/bash
# Comprehensive test runner for AgroBridge
# Runs all test suites: unit, integration, e2e, load, and chaos tests

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        AgroBridge Comprehensive Test Suite                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV="${TEST_ENV:-test}"
COVERAGE_THRESHOLD="${COVERAGE_THRESHOLD:-80}"
RESULTS_DIR="test_results_$(date +%Y%m%d_%H%M%S)"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to print section header
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_section "Checking Prerequisites"

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed"
    exit 1
fi
print_success "Python 3 found"

if ! command -v pytest &> /dev/null; then
    print_warning "pytest not found, installing..."
    pip install pytest pytest-django pytest-cov pytest-xdist
fi
print_success "pytest found"

# Set up test environment
print_section "Setting Up Test Environment"

export DJANGO_SETTINGS_MODULE=backend.settings
export DATABASE_URL="postgresql://test:test@localhost:5432/test_agrobridge"
export REDIS_URL="redis://localhost:6379/1"
export RABBITMQ_URL="amqp://test:test@localhost:5672/"
export TESTING=true

print_success "Environment configured"

# Run database migrations
print_section "Preparing Test Database"

python manage.py migrate --settings=backend.settings --database=default --run-syncdb
print_success "Database migrations completed"

# Test Suite 1: Unit Tests
print_section "Running Unit Tests"

pytest tests/ \
    -m "unit" \
    --cov=backend \
    --cov-report=html:"$RESULTS_DIR/coverage_html" \
    --cov-report=xml:"$RESULTS_DIR/coverage.xml" \
    --cov-report=term-missing \
    --junitxml="$RESULTS_DIR/unit_tests.xml" \
    --maxfail=5 \
    -v \
    || { print_error "Unit tests failed"; exit 1; }

print_success "Unit tests passed"

# Check coverage threshold
COVERAGE=$(python3 << EOF
import xml.etree.ElementTree as ET
tree = ET.parse('$RESULTS_DIR/coverage.xml')
root = tree.getroot()
coverage = float(root.attrib['line-rate']) * 100
print(f"{coverage:.2f}")
EOF
)

echo "Code coverage: $COVERAGE%"
if (( $(echo "$COVERAGE < $COVERAGE_THRESHOLD" | bc -l) )); then
    print_error "Coverage $COVERAGE% is below threshold $COVERAGE_THRESHOLD%"
    exit 1
fi
print_success "Coverage threshold met"

# Test Suite 2: Integration Tests
print_section "Running Integration Tests"

pytest tests/ \
    -m "integration" \
    --junitxml="$RESULTS_DIR/integration_tests.xml" \
    -v \
    || { print_error "Integration tests failed"; exit 1; }

print_success "Integration tests passed"

# Test Suite 3: End-to-End Tests
print_section "Running End-to-End Tests"

pytest tests/e2e/ \
    -m "e2e" \
    --junitxml="$RESULTS_DIR/e2e_tests.xml" \
    -v \
    || { print_error "E2E tests failed"; exit 1; }

print_success "End-to-end tests passed"

# Test Suite 4: Security Tests
print_section "Running Security Tests"

# Bandit security scan
bandit -r backend/ \
    -f json \
    -o "$RESULTS_DIR/bandit_report.json" \
    || print_warning "Security issues found (see report)"

# Safety dependency check
safety check \
    --json \
    --output "$RESULTS_DIR/safety_report.json" \
    || print_warning "Vulnerable dependencies found (see report)"

print_success "Security scans completed"

# Test Suite 5: Performance Tests
print_section "Running Performance Tests"

# Run simple performance benchmarks
pytest tests/ \
    -m "performance" \
    --benchmark-only \
    --benchmark-json="$RESULTS_DIR/benchmark.json" \
    || print_warning "Performance tests completed with warnings"

print_success "Performance tests completed"

# Test Suite 6: Chaos Engineering Tests (optional)
if [ "$RUN_CHAOS_TESTS" = "true" ]; then
    print_section "Running Chaos Engineering Tests"
    
    pytest tests/chaos/ \
        -m "chaos" \
        --junitxml="$RESULTS_DIR/chaos_tests.xml" \
        -v \
        || print_warning "Some chaos tests failed (expected)"
    
    print_success "Chaos tests completed"
else
    print_warning "Chaos tests skipped (set RUN_CHAOS_TESTS=true to run)"
fi

# Test Suite 7: Load Tests (optional)
if [ "$RUN_LOAD_TESTS" = "true" ]; then
    print_section "Running Load Tests"
    
    if command -v locust &> /dev/null; then
        cd tests/load
        ./run_load_tests.sh
        cd ../..
        print_success "Load tests completed"
    else
        print_warning "Locust not installed, skipping load tests"
    fi
else
    print_warning "Load tests skipped (set RUN_LOAD_TESTS=true to run)"
fi

# Generate test report
print_section "Generating Test Report"

python3 << EOF
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from datetime import datetime

results_dir = Path("$RESULTS_DIR")
report = {
    "test_date": datetime.now().isoformat(),
    "environment": "$TEST_ENV",
    "coverage_threshold": $COVERAGE_THRESHOLD,
    "actual_coverage": $COVERAGE,
    "test_suites": {}
}

# Parse JUnit XML files
for xml_file in results_dir.glob("*_tests.xml"):
    suite_name = xml_file.stem
    tree = ET.parse(xml_file)
    root = tree.getroot()
    
    testsuite = root if root.tag == 'testsuite' else root.find('testsuite')
    if testsuite is not None:
        report["test_suites"][suite_name] = {
            "tests": int(testsuite.get("tests", 0)),
            "failures": int(testsuite.get("failures", 0)),
            "errors": int(testsuite.get("errors", 0)),
            "skipped": int(testsuite.get("skipped", 0)),
            "time": float(testsuite.get("time", 0))
        }

# Calculate totals
totals = {
    "tests": sum(s["tests"] for s in report["test_suites"].values()),
    "failures": sum(s["failures"] for s in report["test_suites"].values()),
    "errors": sum(s["errors"] for s in report["test_suites"].values()),
    "skipped": sum(s["skipped"] for s in report["test_suites"].values()),
    "passed": 0
}
totals["passed"] = totals["tests"] - totals["failures"] - totals["errors"] - totals["skipped"]
report["totals"] = totals

# Save report
with open(results_dir / "test_report.json", "w") as f:
    json.dump(report, f, indent=2)

# Print summary
print("\n" + "="*60)
print("TEST SUMMARY")
print("="*60)
print(f"Total Tests: {totals['tests']}")
print(f"Passed: {totals['passed']}")
print(f"Failed: {totals['failures']}")
print(f"Errors: {totals['errors']}")
print(f"Skipped: {totals['skipped']}")
print(f"Coverage: $COVERAGE%")
print("="*60)

# Determine overall status
if totals['failures'] > 0 or totals['errors'] > 0:
    print("\n❌ TESTS FAILED")
    exit(1)
else:
    print("\n✅ ALL TESTS PASSED")
EOF

TEST_STATUS=$?

# Clean up
print_section "Cleaning Up"

# Remove test database
python manage.py flush --no-input --settings=backend.settings || true

print_success "Cleanup completed"

# Final summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Results                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "Reports:"
echo "  - Test Report: $RESULTS_DIR/test_report.json"
echo "  - Coverage HTML: $RESULTS_DIR/coverage_html/index.html"
echo "  - Coverage XML: $RESULTS_DIR/coverage.xml"
echo "  - Security Report: $RESULTS_DIR/bandit_report.json"
echo "  - Dependency Report: $RESULTS_DIR/safety_report.json"
echo ""

if [ $TEST_STATUS -eq 0 ]; then
    print_success "All tests passed successfully!"
    exit 0
else
    print_error "Some tests failed. Check the reports for details."
    exit 1
fi
