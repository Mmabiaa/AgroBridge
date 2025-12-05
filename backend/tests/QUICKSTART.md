# AgroBridge Testing - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd backend
pip install -r requirements-test.txt
```

### Step 2: Set Environment Variables
```bash
# Linux/Mac
export DJANGO_SETTINGS_MODULE=backend.settings
export DATABASE_URL=postgresql://test:test@localhost:5432/test_agrobridge
export TESTING=true

# Windows PowerShell
$env:DJANGO_SETTINGS_MODULE="backend.settings"
$env:DATABASE_URL="postgresql://test:test@localhost:5432/test_agrobridge"
$env:TESTING="true"
```

### Step 3: Run Tests
```bash
# Linux/Mac
cd tests
chmod +x run_all_tests.sh
./run_all_tests.sh

# Windows
cd tests
.\run_all_tests.ps1
```

## 📊 Quick Test Commands

### Run Specific Test Types
```bash
# Unit tests only (fast)
pytest -m unit

# Integration tests
pytest -m integration

# End-to-end tests
pytest tests/e2e/

# User acceptance tests
pytest tests/uat/
```

### Run with Coverage
```bash
pytest --cov=backend --cov-report=html
# Open htmlcov/index.html in browser
```

### Run Specific Test File
```bash
pytest tests/e2e/test_user_workflows.py -v
```

## 🔥 Load Testing

### Quick Load Test
```bash
cd tests/load
locust -f locustfile.py --host=http://localhost:8000 --users=50 --spawn-rate=5 --run-time=2m --headless
```

### Interactive Load Test
```bash
cd tests/load
locust -f locustfile.py --host=http://localhost:8000
# Open http://localhost:8089 in browser
```

## 🎯 Common Test Scenarios

### Test Farmer Workflow
```bash
pytest tests/e2e/test_user_workflows.py::TestFarmerWorkflow::test_farmer_complete_workflow -v
```

### Test Buyer Workflow
```bash
pytest tests/e2e/test_user_workflows.py::TestBuyerWorkflow::test_buyer_purchase_workflow -v
```

### Test Chaos Scenarios
```bash
pytest tests/chaos/test_chaos_engineering.py::TestDatabaseFailures -v
```

## 📈 View Test Results

### Coverage Report
```bash
pytest --cov=backend --cov-report=html
open htmlcov/index.html  # Mac
start htmlcov/index.html  # Windows
```

### Test Report
After running tests, check:
- `test_results_*/test_report.json` - Overall summary
- `test_results_*/coverage_html/` - Coverage details
- `test_results_*/bandit_report.json` - Security issues
- `test_results_*/safety_report.json` - Dependency vulnerabilities

## 🐛 Debugging Tests

### Run with Verbose Output
```bash
pytest -v -s
```

### Run Last Failed Tests
```bash
pytest --lf
```

### Drop into Debugger on Failure
```bash
pytest --pdb
```

### Show Test Duration
```bash
pytest --durations=10
```

## ⚡ Speed Up Tests

### Run in Parallel
```bash
pytest -n auto  # Use all CPU cores
pytest -n 4     # Use 4 workers
```

### Skip Slow Tests
```bash
pytest -m "not slow"
```

### Run Only Failed Tests
```bash
pytest --lf  # Last failed
pytest --ff  # Failed first
```

## 🔒 Security Testing

### Quick Security Scan
```bash
# Code security
bandit -r backend/ -ll

# Dependency vulnerabilities
safety check
```

## 📝 Test Markers

Use markers to filter tests:
```bash
pytest -m unit          # Unit tests
pytest -m integration   # Integration tests
pytest -m e2e           # End-to-end tests
pytest -m uat           # User acceptance tests
pytest -m chaos         # Chaos engineering
pytest -m smoke         # Quick smoke tests
pytest -m security      # Security tests
pytest -m "not slow"    # Skip slow tests
```

## 🎓 Learn More

- Full documentation: `backend/tests/README.md`
- Implementation details: `backend/docs/tasks/TASK_30_COMPLETION.md`
- Summary: `backend/tests/IMPLEMENTATION_SUMMARY.md`

## 💡 Tips

1. **Start with unit tests** - They're fast and catch most issues
2. **Run smoke tests** before committing - `pytest -m smoke`
3. **Check coverage** regularly - Aim for 80%+
4. **Use fixtures** - Reuse test setup code
5. **Mock external services** - Keep tests fast and reliable

## 🆘 Need Help?

- Check `backend/tests/README.md` for detailed documentation
- Review test logs in `test_results_*/`
- Check CI/CD workflow logs in GitHub Actions
- Contact the development team

## ✅ Quick Validation

Run this to verify your setup:
```bash
pytest --collect-only  # List all tests without running
pytest -m smoke -v     # Run quick smoke tests
```
