# File Storage Service - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
pip install Pillow>=10.0
pip install boto3>=1.28  # Optional, for S3
```

### 2. Run Migrations

```bash
python manage.py makemigrations file_storage
python manage.py migrate file_storage
```

### 3. Create Storage Directory

```bash
mkdir -p /var/agrobridge/files
chmod 755 /var/agrobridge/files
```

### 4. Configure Settings

Add to `settings.py`:

```python
INSTALLED_APPS = [
    # ... other apps
    'file_storage',
]

# File Storage Configuration
FILE_STORAGE_BACKEND = 'local'  # or 's3', 'minio'
FILE_STORAGE_PATH = '/var/agrobridge/files'

# Default Quota Settings
DEFAULT_STORAGE_QUOTA = 1 * 1024 * 1024 * 1024  # 1GB
DEFAULT_MAX_FILES = 1000
```

### 5. Add URLs

Add to main `urls.py`:

```python
urlpatterns = [
    # ... other patterns
    path('api/storage/', include('file_storage.urls')),
]
```

## Basic Usage

### Upload a File

```python
from file_storage.services import FileStorageService
from django.core.files.uploadedfile import SimpleUploadedFile

service = FileStorageService()

file = SimpleUploadedFile('photo.jpg', file_content, content_type='image/jpeg')

stored_file = service.upload_file(
    file=file,
    user=request.user,
    is_public=True,
    tags=['farm', 'crop']
)

print(f"File uploaded: {stored_file.file_key}")
```

### Download a File

```python
from file_storage.services import FileStorageService

service = FileStorageService()

file_data, filename = service.download_file(
    file_key='abc-123',
    user=request.user
)
```

### Check Quota

```python
from file_storage.services import QuotaService

service = QuotaService()
quota = service.get_or_create_quota(user)

if quota.has_space_for(file_size):
    # Upload file
    pass
else:
    # Show quota exceeded error
    pass
```

## API Usage

### Upload File via API

```bash
curl -X POST http://localhost:8000/api/storage/files/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "is_public=true" \
  -F "tags=[\"farm\",\"crop\"]"
```

### List My Files

```bash
curl http://localhost:8000/api/storage/files/my_files/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Download File

```bash
curl http://localhost:8000/api/storage/files/{file_key}/download/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded_file.jpg
```

### Get My Quota

```bash
curl http://localhost:8000/api/storage/quotas/my_quota/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Management Commands

### Clean Up Expired Files

```bash
python manage.py cleanup_expired_files
python manage.py cleanup_expired_files --dry-run
```

### Recalculate Quotas

```bash
python manage.py recalculate_quotas
python manage.py recalculate_quotas --user-id=123
```

### Populate Test Data

```bash
python manage.py populate_file_storage_data
```

## Testing

Run all tests:

```bash
python manage.py test file_storage
```

Run specific test:

```bash
python manage.py test file_storage.tests.FileStorageServiceTest
```

## Admin Interface

Access at: `http://localhost:8000/admin/file_storage/`

Features:
- File management
- Quota monitoring
- Access log viewing
- Chunked upload tracking

## Common Tasks

### Set User Quota

```python
from file_storage.models import StorageQuota

quota = StorageQuota.objects.get(user=user)
quota.quota_limit = 5 * 1024 * 1024 * 1024  # 5GB
quota.max_files = 5000
quota.save()
```

### Make File Public

```python
from file_storage.models import StoredFile

file = StoredFile.objects.get(file_key='abc-123')
file.is_public = True
file.save()
```

### Set File Expiry

```python
from datetime import timedelta
from django.utils import timezone

file = StoredFile.objects.get(file_key='abc-123')
file.expires_at = timezone.now() + timedelta(days=30)
file.save()
```

### Get File Access Logs

```python
from file_storage.models import FileAccessLog

logs = FileAccessLog.objects.filter(
    file__file_key='abc-123'
).order_by('-accessed_at')
```

## Troubleshooting

### File Upload Fails

1. Check quota: `python manage.py recalculate_quotas --user-id=USER_ID`
2. Check storage directory permissions
3. Check file size limits
4. Check available disk space

### Image Processing Fails

1. Ensure Pillow is installed: `pip install Pillow`
2. Check image format is supported
3. Check image is not corrupted

### Quota Not Updating

Run recalculation:
```bash
python manage.py recalculate_quotas
```

## Production Deployment

### 1. Use S3/MinIO

```python
FILE_STORAGE_BACKEND = 's3'
AWS_ACCESS_KEY_ID = 'your-key'
AWS_SECRET_ACCESS_KEY = 'your-secret'
AWS_STORAGE_BUCKET_NAME = 'agrobridge-files'
```

### 2. Set Up CDN

Configure CDN to serve files from storage bucket.

### 3. Enable Malware Scanning

Install and configure ClamAV for malware scanning.

### 4. Set Up Monitoring

Monitor:
- Storage usage
- Upload/download rates
- Failed uploads
- Quota violations

### 5. Configure Backups

Set up regular backups of:
- Database (file metadata)
- Storage bucket (actual files)

## Support

For issues or questions:
- Check README.md for detailed documentation
- Review test cases for examples
- Check admin interface for file status

## Quick Reference

**Upload**: `POST /api/storage/files/`  
**Download**: `GET /api/storage/files/{key}/download/`  
**Delete**: `DELETE /api/storage/files/{key}/`  
**List**: `GET /api/storage/files/my_files/`  
**Quota**: `GET /api/storage/quotas/my_quota/`  

**Default Quota**: 1GB, 1000 files  
**Max File Size**: 100MB  
**Supported Backends**: Local, S3, MinIO  
**Image Variants**: Thumbnail, Small, Medium, Large  
