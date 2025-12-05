# AgroBridge Django Setup and Testing Guide

## Complete Setup Instructions

### Prerequisites

1. **Python 3.11+** installed
2. **Git** installed
3. **PostgreSQL** (optional, SQLite works for development)
4. **Redis** (optional, for caching and WebSockets)
5. **Node.js** (for frontend, if testing full stack)

### Step 1: Quick Setup (Recommended)

Run the automated setup script:

```powershell
# Windows PowerShell
cd backend
.\setup_django_full.ps1

# With superuser creation
.\setup_django_full.ps1 -CreateSuperuser

# Skip migrations (if already done)
.\setup_django_full.ps1 -SkipMigrations
```

This script will:
- ✅ Check Python installation
- ✅ Create/activate virtual environment
- ✅ Install all dependencies
- ✅ Setup environment configuration
- ✅ Create required directories
- ✅ Run database migrations
- ✅ Collect static files
- ✅ Verify Django configuration

### Step 2: Manual Setup (Alternative)

If you prefer manual setup:

```powershell
# 1. Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 2. Upgrade pip
python -m pip install --upgrade pip

# 3. Install dependencies
pip install -r requirements.txt
pip install -r requirements-database.txt
pip install -r requirements-messaging.txt
pip install -r requirements-test.txt
pip install psycopg2-binary

# 4. Setup environment
copy .env.development .env

# 5. Create directories
mkdir logs, media, staticfiles

# 6. Run migrations
python manage.py makemigrations
python manage.py migrate

# 7. Collect static files
python manage.py collectstatic --noinput

# 8. Create superuser
python manage.py createsuperuser
```

### Step 3: Verify Installation

```powershell
# Check Django configuration
python manage.py check

# Show installed apps
python manage.py showmigrations

# Test database connection
python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('Database OK')"
```

## Running the Application

### Start Development Server

```powershell
# Standard server
python manage.py runserver

# Custom port
python manage.py runserver 8080

# All interfaces (for network access)
python manage.py runserver 0.0.0.0:8000
```

### Access Points

Once the server is running:

- **API Root**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation (Swagger)**: http://localhost:8000/swagger/
- **API Documentation (ReDoc)**: http://localhost:8000/redoc/
- **Health Check**: http://localhost:8000/health/

## Testing All Endpoints

### Automated Endpoint Testing

Run the comprehensive endpoint test script:

```powershell
# Test all endpoints
.\test_all_endpoints.ps1

# Test with verbose output
.\test_all_endpoints.ps1 -Verbose

# Test against different server
.\test_all_endpoints.ps1 -BaseUrl "http://localhost:8080"
```

This will test:
- ✅ Health and system endpoints
- ✅ Authentication endpoints
- ✅ User management endpoints
- ✅ Farm management endpoints
- ✅ Marketplace endpoints
- ✅ AI assistant endpoints
- ✅ Crop detection endpoints
- ✅ IoT service endpoints
- ✅ Notification endpoints
- ✅ Learning platform endpoints
- ✅ Community endpoints
- ✅ Scheduling endpoints
- ✅ Financial management endpoints
- ✅ Payment endpoints
- ✅ Analytics endpoints

### Manual API Testing

#### 1. Health Check

```powershell
curl http://localhost:8000/health/
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-05T...",
  "services": {
    "database": "healthy",
    "cache": "healthy"
  }
}
```

#### 2. Register User

```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "SecurePass123!"
    first_name = "Test"
    last_name = "User"
    role = "farmer"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register/" -Method POST -Body $body -ContentType "application/json"
```

#### 3. Login

```powershell
$body = @{
    username = "testuser"
    password = "SecurePass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/login/" -Method POST -Body $body -ContentType "application/json"
$token = $response.access
```

#### 4. Access Protected Endpoint

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/api/users/profile/" -Headers $headers
```

## Running Tests

### Unit Tests

```powershell
cd tests

# Run all tests
python -m pytest -v

# Run specific test types
python -m pytest -m unit -v
python -m pytest -m integration -v
python -m pytest -m e2e -v

# Run with coverage
python -m pytest --cov=backend --cov-report=html
```

### Comprehensive Test Suite

```powershell
cd tests

# Run all tests with reports
.\run_all_tests.ps1

# With chaos tests
$env:RUN_CHAOS_TESTS="true"
.\run_all_tests.ps1

# With load tests
$env:RUN_LOAD_TESTS="true"
.\run_all_tests.ps1
```

### Load Testing

```powershell
cd tests/load

# Quick load test
locust -f locustfile.py --host=http://localhost:8000 --users=50 --spawn-rate=5 --run-time=2m --headless

# Interactive load test (opens web UI)
locust -f locustfile.py --host=http://localhost:8000
# Then open http://localhost:8089
```

## Verifying Functionality

### Check All Services

```powershell
# 1. Database
python manage.py dbshell
# Type \q to exit

# 2. Migrations
python manage.py showmigrations

# 3. Static files
Test-Path staticfiles

# 4. Media files
Test-Path media

# 5. Logs
Test-Path logs
```

### Test Each Service

#### Authentication Service
```powershell
# Register
curl -X POST http://localhost:8000/api/auth/register/ -H "Content-Type: application/json" -d '{\"username\":\"test\",\"email\":\"test@test.com\",\"password\":\"pass123\"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ -H "Content-Type: application/json" -d '{\"username\":\"test\",\"password\":\"pass123\"}'
```

#### Farm Service
```powershell
# List farms (requires auth)
curl http://localhost:8000/api/farms/ -H "Authorization: Bearer YOUR_TOKEN"
```

#### Marketplace Service
```powershell
# List products (public)
curl http://localhost:8000/api/marketplace/products/
```

#### Learning Service
```powershell
# List courses (public)
curl http://localhost:8000/api/learning/courses/
```

#### Community Service
```powershell
# List posts (public)
curl http://localhost:8000/api/community/posts/
```

## Troubleshooting

### Common Issues

#### 1. Module Not Found Errors

```powershell
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

#### 2. Database Errors

```powershell
# Reset database (WARNING: Deletes all data)
Remove-Item db.sqlite3
python manage.py migrate
```

#### 3. Migration Conflicts

```powershell
# Reset migrations
python manage.py migrate --fake-initial
```

#### 4. Static Files Not Found

```powershell
# Recollect static files
python manage.py collectstatic --clear --noinput
```

#### 5. Port Already in Use

```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
python manage.py runserver 8080
```

### Debug Mode

Enable detailed error messages:

```powershell
# In .env file
DEBUG=True
LOG_LEVEL=DEBUG
```

### Check Logs

```powershell
# View Django logs
Get-Content logs/agrobridge.log -Tail 50

# Follow logs in real-time
Get-Content logs/agrobridge.log -Wait
```

## Performance Testing

### 1. Response Time Test

```powershell
Measure-Command { Invoke-WebRequest http://localhost:8000/api/ }
```

### 2. Concurrent Requests

```powershell
# Using Apache Bench (if installed)
ab -n 1000 -c 10 http://localhost:8000/api/

# Using PowerShell
1..100 | ForEach-Object -Parallel {
    Invoke-WebRequest http://localhost:8000/api/
} -ThrottleLimit 10
```

### 3. Database Query Performance

```python
# In Django shell
python manage.py shell

from django.db import connection
from django.test.utils import CaptureQueriesContext

with CaptureQueriesContext(connection) as queries:
    # Your code here
    pass

print(f"Number of queries: {len(queries)}")
for query in queries:
    print(f"{query['time']}s: {query['sql']}")
```

## Production Checklist

Before deploying to production:

- [ ] Set `DEBUG=False` in .env
- [ ] Change `SECRET_KEY` to a secure random value
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for caching
- [ ] Configure email backend (SMTP)
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Run security checks
- [ ] Load test the application
- [ ] Set up CI/CD pipeline

## Security Checks

```powershell
# Check for security issues
python manage.py check --deploy

# Run security scanner
bandit -r . -ll

# Check dependencies for vulnerabilities
safety check
```

## Useful Commands

```powershell
# Create new app
python manage.py startapp app_name

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell

# Database shell
python manage.py dbshell

# Show URLs
python manage.py show_urls

# Clear cache
python manage.py clear_cache

# Run specific test
python manage.py test app_name.tests.test_file.TestClass.test_method
```

## Next Steps

1. ✅ Complete setup using `setup_django_full.ps1`
2. ✅ Start development server
3. ✅ Test all endpoints using `test_all_endpoints.ps1`
4. ✅ Run comprehensive tests using `run_all_tests.ps1`
5. ✅ Create test data and verify functionality
6. ✅ Review API documentation at /swagger/
7. ✅ Test frontend integration
8. ✅ Perform load testing
9. ✅ Review security settings
10. ✅ Prepare for deployment

## Support

For issues or questions:
- Check logs in `logs/agrobridge.log`
- Review Django documentation
- Check API documentation at /swagger/
- Review test results in `test_results_*/`

## Summary

This guide provides complete instructions for:
- ✅ Setting up Django environment
- ✅ Installing all dependencies
- ✅ Running database migrations
- ✅ Testing all API endpoints
- ✅ Running comprehensive tests
- ✅ Troubleshooting common issues
- ✅ Performance testing
- ✅ Production preparation

Follow the steps in order for a smooth setup experience!
