# AgroBridge Testing Guide

## Quick Start

### Install Testing Dependencies
```bash
pip install -r requirements-test.txt
```

### Run All Tests
```bash
cd backend/tests
chmod +x run_all_tests.sh
./run_all_tests.sh
```

## Test Types

### 1. Unit Tests
Test individual components in isolation.

```bash
# Run all unit tests
pytest -m unit

# Run with coverage
pytest -m unit --cov=backend --cov-report=html

# Run specific service tests
pytest authentication/tests/ -m unit
```

### 2. Integration Tests
Test interactions between services.

```bash
# Run all integration tests
pytest -m integration

# Run with verbose output
pytest -m integration -v
```

### 3. End-to-End Tests
Test complete user workflows.

```bash
# Run all E2E tests
pytest tests/e2e/ -m e2e

# Run specific workflow
pytest tests/e2e/test_user_workflows.py::TestFarmerWorkflow -v
```

### 4. User Acceptance Tests (UAT)
Validate business requirements.

```bash
# Run all UAT scenarios
pytest tests/uat/ -m uat

# Run specific UAT
pytest tests/uat/test_scenarios.py::TestFarmerAcceptanceCriteria -v
```

### 5. Load Tests
Test system performance under load.

```bash
cd tests/load

# Run with default settings (100 users, 5 minutes)
./run_load_tests.sh

# Run with custom settings
LOAD_TEST_HOST=http://localhost:8000 \
LOAD_TEST_USERS=500 \
LOAD_TEST_SPAWN_RATE=20 \
LOAD_TEST_RUN_TIME=10m \
./run_load_tests.sh

# Run interactive load test
locust -f locustfile.py --host=http://localhost:8000
# Then open http://localhost:8089 in browser
```

### 6. Chaos Engineering Tests
Test system resilience.

```bash
# Run all chaos tests
pytest tests/chaos/ -m chaos

# Run specific chaos scenario
pytest tests/chaos/test_chaos_engineering.py::TestDatabaseFailures -v
```

### 7. Security Tests
Run security scans.

```bash
# Run Bandit security scan
bandit -r backend/ -f json -o security_report.json

# Run Safety dependency check
safety check --json --output safety_report.json

# Run both in test suite
pytest -m security
```

### 8. Performance Tests
Run performance benchmarks.

```bash
# Run performance benchmarks
pytest -m performance --benchmark-only

# Save benchmark results
pytest -m performance --benchmark-only --benchmark-json=benchmark.json
```

## Test Markers

Use markers to run specific test categories:

```bash
pytest -m unit          # Unit tests
pytest -m integration   # Integration tests
pytest -m e2e           # End-to-end tests
pytest -m uat           # User acceptance tests
pytest -m load          # Load tests
pytest -m chaos         # Chaos engineering tests
pytest -m slow          # Slow running tests
pytest -m smoke         # Quick smoke tests
pytest -m security      # Security tests
```

## Coverage Reports

### Generate Coverage Report
```bash
# HTML report (interactive)
pytest --cov=backend --cov-report=html
open htmlcov/index.html

# Terminal report
pytest --cov=backend --cov-report=term-missing

# XML report (for CI)
pytest --cov=backend --cov-report=xml
```

### Check Coverage Threshold
```bash
# Fail if coverage below 80%
pytest --cov=backend --cov-fail-under=80
```

## Parallel Test Execution

Run tests in parallel for faster execution:

```bash
# Run with 4 workers
pytest -n 4

# Run with auto-detected CPU count
pytest -n auto
```

## Test Filtering

### Run Specific Tests
```bash
# By file
pytest tests/e2e/test_user_workflows.py

# By class
pytest tests/e2e/test_user_workflows.py::TestFarmerWorkflow

# By method
pytest tests/e2e/test_user_workflows.py::TestFarmerWorkflow::test_farmer_complete_workflow

# By keyword
pytest -k "farmer"
```

### Skip Slow Tests
```bash
pytest -m "not slow"
```

## Environment Variables

Set these for testing:

```bash
export DJANGO_SETTINGS_MODULE=backend.settings
export DATABASE_URL=postgresql://test:test@localhost:5432/test_agrobridge
export REDIS_URL=redis://localhost:6379/1
export RABBITMQ_URL=amqp://test:test@localhost:5672/
export TESTING=true
```

## CI/CD Integration

Tests run automatically on:
- Every push to main, develop, or feature branches
- Every pull request
- Scheduled daily runs

### GitHub Actions Workflow
See `.github/workflows/ci-build-test.yml`

### Quality Gates
- All tests must pass
- Coverage ≥ 80%
- No high-severity security issues
- No critical linting errors

## Debugging Tests

### Run with Verbose Output
```bash
pytest -v
```

### Show Print Statements
```bash
pytest -s
```

### Drop into Debugger on Failure
```bash
pytest --pdb
```

### Run Last Failed Tests
```bash
pytest --lf
```

### Show Test Duration
```bash
pytest --durations=10
```

## Test Data

### Using Fixtures
```python
def test_with_user(test_user):
    assert test_user.username is not None
```

### Using Faker
```python
from faker import Faker
fake = Faker()

def test_with_fake_data():
    email = fake.email()
    name = fake.name()
```

## Mocking

### Mock External Services
```python
from unittest.mock import patch

@patch('requests.post')
def test_external_api(mock_post):
    mock_post.return_value.status_code = 200
    # Test code here
```

### Mock Time
```python
from freezegun import freeze_time

@freeze_time("2024-01-01")
def test_time_dependent():
    # Test code here
```

## Common Issues

### Database Connection Errors
```bash
# Ensure PostgreSQL is running
docker-compose up -d postgres

# Run migrations
python manage.py migrate --settings=backend.settings
```

### Import Errors
```bash
# Ensure PYTHONPATH is set
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Permission Errors
```bash
# Make scripts executable
chmod +x tests/run_all_tests.sh
chmod +x tests/load/run_load_tests.sh
```

## Best Practices

1. **Write Descriptive Test Names**: Use clear, descriptive names that explain what is being tested
2. **One Assertion Per Test**: Keep tests focused on a single behavior
3. **Use Fixtures**: Reuse common setup code with fixtures
4. **Mock External Dependencies**: Don't rely on external services in tests
5. **Keep Tests Fast**: Optimize test execution time
6. **Clean Up After Tests**: Ensure tests don't leave side effects
7. **Test Edge Cases**: Don't just test the happy path
8. **Document Complex Tests**: Add docstrings explaining test purpose

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Django Testing](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Locust Documentation](https://docs.locust.io/)
- [Chaos Engineering Principles](https://principlesofchaos.org/)

## Support

For issues or questions:
1. Check this documentation
2. Review test logs in `test_results_*/`
3. Check CI/CD workflow logs
4. Contact the development team
