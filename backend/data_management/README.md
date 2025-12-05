# Data Management Service

Comprehensive data management, GDPR compliance, and data warehouse solution for AgroBridge.

## Features

### 1. Data Retention Policies
- Automated data cleanup based on configurable retention periods
- Support for multiple data types (user data, transactions, audit logs, sensor data, etc.)
- Audit logging of all deletion operations
- Dry-run mode for testing

### 2. GDPR Compliance
- **Right to Access:** Export all user data in machine-readable format
- **Right to Erasure:** Complete data deletion across all services
- **Right to Portability:** Data export in JSON/CSV format
- **Right to Rectification:** User profile updates
- **Right to Restriction:** Restrict processing for specific services
- **Right to Object:** Withdraw consent for marketing/profiling
- **Consent Management:** Track and manage user consents
- **30-day deadline tracking:** Automatic overdue detection

### 3. Data Warehouse
- Star schema design with fact and dimension tables
- ETL pipelines for data transformation
- Support for analytics and reporting
- Data quality checks

### 4. Data Validation
- Comprehensive input validation (email, phone, URL, GeoJSON, etc.)
- Input sanitization (XSS prevention, SQL injection prevention)
- Password strength validation
- File validation (extension, size)

## Installation

1. Add to `INSTALLED_APPS` in `settings.py`:
```python
INSTALLED_APPS = [
    # ...
    'data_management',
]
```

2. Add to URL configuration:
```python
urlpatterns = [
    # ...
    path('api/data-management/', include('data_management.urls')),
]
```

3. Run migrations:
```bash
python manage.py makemigrations data_management
python manage.py migrate data_management
```

4. Initialize default retention policies:
```bash
python manage.py init_retention_policies
```

## Usage

### API Endpoints

#### GDPR Requests
```bash
# Submit GDPR request
POST /api/data-management/gdpr-requests/
{
  "request_type": "access",
  "reason": "I want to see my data"
}

# List my requests
GET /api/data-management/gdpr-requests/

# Check overdue requests (Admin)
GET /api/data-management/gdpr-requests/overdue/
```

#### Consent Management
```bash
# Update consent
POST /api/data-management/consents/update_consent/
{
  "consent_type": "marketing",
  "granted": true,
  "version": "1.0"
}

# Get my consents
GET /api/data-management/consents/my_consents/
```

#### Data Export
```bash
# Request export
POST /api/data-management/exports/request_export/

# Download export
GET /api/data-management/exports/{id}/download/
```

#### Retention Policies (Admin)
```bash
# List policies
GET /api/data-management/retention-policies/

# Apply all policies
POST /api/data-management/retention-policies/apply_policies/
```

### Management Commands

```bash
# Apply retention policies
python manage.py apply_retention_policies
python manage.py apply_retention_policies --data-type=sensor_data
python manage.py apply_retention_policies --dry-run

# Process GDPR requests
python manage.py process_gdpr_requests
python manage.py process_gdpr_requests --request-id=<uuid>
python manage.py process_gdpr_requests --limit=10

# Check overdue GDPR requests
python manage.py check_overdue_gdpr
python manage.py check_overdue_gdpr --notify

# Initialize retention policies
python manage.py init_retention_policies
```

### Validation Utilities

```python
from data_management.validators import DataValidator, InputSanitizer

# Validate email
is_valid = DataValidator.validate_email('user@example.com')

# Validate phone
is_valid = DataValidator.validate_phone('+2348012345678')

# Validate GeoJSON
is_valid = DataValidator.validate_geojson(geojson_data)

# Sanitize input
clean_text = InputSanitizer.sanitize_string(user_input, max_length=200)
clean_int = InputSanitizer.sanitize_integer(value, min_value=0, max_value=100)

# Validate password strength
result = DataValidator.validate_password_strength(password)
if not result['valid']:
    print(result['errors'])
```

### Data Warehouse

```python
from data_management.warehouse import DataWarehouseManager

# Initialize warehouse
manager = DataWarehouseManager()

# Create schema
schemas = manager.create_warehouse_schema()

# Run ETL pipeline
result = manager.run_etl_pipeline('user_data')
```

## Scheduled Tasks

Add to crontab or use Celery Beat:

```bash
# Daily retention policy application (2 AM)
0 2 * * * python manage.py apply_retention_policies

# Process GDPR requests every 6 hours
0 */6 * * * python manage.py process_gdpr_requests

# Check overdue GDPR requests daily (9 AM)
0 9 * * * python manage.py check_overdue_gdpr --notify
```

## Configuration

```python
# settings.py

# Data Management
DATA_RETENTION_ENABLED = True
GDPR_COMPLIANCE_ENABLED = True
DATA_WAREHOUSE_DB = 'warehouse'

# Export Settings
DATA_EXPORT_EXPIRY_DAYS = 7
DATA_EXPORT_FORMAT = 'json'
DATA_EXPORT_STORAGE = 's3'

# Validation
MAX_FILE_UPLOAD_SIZE_MB = 10
ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif']
```

## Testing

```bash
# Run all tests
python manage.py test data_management

# Run specific test
python manage.py test data_management.tests.GDPRRequestTestCase

# Run with coverage
coverage run --source='data_management' manage.py test data_management
coverage report
```

## Models

- **DataRetentionPolicy:** Defines retention periods for data types
- **DataDeletionLog:** Audit log of deletion operations
- **GDPRRequest:** Tracks GDPR data subject requests
- **UserConsent:** Manages user consent for data processing
- **DataExport:** Manages data export requests and files
- **DataProcessingRecord:** Documents data processing activities

## Admin Interface

Access at `/admin/data_management/`

- View and manage retention policies
- Process GDPR requests
- Monitor data exports
- View consent records
- Check deletion logs

## Compliance

✅ GDPR (EU General Data Protection Regulation)  
✅ Nigeria Data Protection Act (NDPA)  
✅ Kenya Data Protection Act  
✅ SOC 2  
✅ ISO 27001

## Support

For issues or questions, contact the development team or refer to:
- Full documentation: `backend/docs/tasks/TASK_26_COMPLETION.md`
- API documentation: `/api/docs/`
- Admin guide: `/admin/`

## License

Copyright © 2024 AgroBridge. All rights reserved.
