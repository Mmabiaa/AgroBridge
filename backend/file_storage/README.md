# File Storage Service

Comprehensive file storage service with S3/MinIO integration, image processing, quota management, and security features.

## Features

### Core Functionality
- ✅ File upload and download
- ✅ Multiple storage backends (Local, S3, MinIO)
- ✅ File type detection and classification
- ✅ Hash-based deduplication
- ✅ Public and private file access
- ✅ File expiry management

### Image Processing
- ✅ Automatic thumbnail generation
- ✅ Multiple image variants (thumbnail, small, medium, large)
- ✅ Image optimization
- ✅ Dimension tracking

### Chunked Uploads
- ✅ Resumable uploads for large files
- ✅ Progress tracking
- ✅ Chunk validation
- ✅ Upload expiry

### Storage Quota
- ✅ Per-user storage limits
- ✅ File count limits
- ✅ Usage tracking
- ✅ Quota enforcement

### Security
- ✅ Malware scanning status tracking
- ✅ Access logging
- ✅ Permission-based access control
- ✅ Signed URLs (planned)

### Lifecycle Management
- ✅ Automatic file expiry
- ✅ File archival
- ✅ Cleanup management commands

## Models

### StoredFile
Main file metadata model with:
- File information (name, type, size, hash)
- Storage details (path, backend, bucket)
- Ownership and access control
- Status and lifecycle management
- Security scanning status
- Metadata and tags

### ImageVariant
Image processing variants:
- Multiple size variants
- Dimension tracking
- Separate storage paths

### ChunkedUpload
Resumable upload tracking:
- Chunk management
- Progress monitoring
- Upload expiry

### StorageQuota
User quota management:
- Storage limits
- File count limits
- Usage tracking

### FileAccessLog
Access logging:
- Download/view/share tracking
- IP and user agent logging
- Analytics support

## API Endpoints

### File Operations

#### Upload File
```http
POST /api/storage/files/
Content-Type: multipart/form-data

{
  "file": <file>,
  "is_public": true,
  "tags": ["tag1", "tag2"],
  "metadata": {"key": "value"},
  "expires_in_days": 30
}
```

#### List My Files
```http
GET /api/storage/files/my_files/
GET /api/storage/files/my_files/?type=IMAGE
GET /api/storage/files/my_files/?tags=tag1,tag2
```

#### Get File Details
```http
GET /api/storage/files/{file_key}/
```

#### Download File
```http
GET /api/storage/files/{file_key}/download/
```

#### Delete File
```http
DELETE /api/storage/files/{file_key}/
```

#### List Public Files
```http
GET /api/storage/files/public_files/
```

### Chunked Upload Operations

#### Initiate Upload
```http
POST /api/storage/chunked-uploads/initiate/

{
  "filename": "large_video.mp4",
  "file_size": 100000000,
  "mime_type": "video/mp4",
  "chunk_size": 5242880,
  "metadata": {}
}
```

#### Upload Chunk
```http
POST /api/storage/chunked-uploads/{upload_id}/upload_chunk/

{
  "chunk_number": 0,
  "chunk_data": <file>
}
```

#### Get Upload Status
```http
GET /api/storage/chunked-uploads/{upload_id}/status/
```

### Quota Operations

#### Get My Quota
```http
GET /api/storage/quotas/my_quota/
```

#### Recalculate Quota
```http
POST /api/storage/quotas/recalculate/
```

### Access Log Operations

#### Get Access Logs
```http
GET /api/storage/access-logs/my_files_access/
GET /api/storage/access-logs/my_files_access/?file_key={file_key}
GET /api/storage/access-logs/my_files_access/?access_type=DOWNLOAD
```

## Configuration

### Settings

Add to `settings.py`:

```python
# File Storage Configuration
FILE_STORAGE_BACKEND = 'local'  # or 's3', 'minio'
FILE_STORAGE_PATH = '/var/agrobridge/files'

# S3/MinIO Configuration (if using)
AWS_ACCESS_KEY_ID = 'your-access-key'
AWS_SECRET_ACCESS_KEY = 'your-secret-key'
AWS_STORAGE_BUCKET_NAME = 'agrobridge-files'
AWS_S3_ENDPOINT_URL = 'https://s3.amazonaws.com'  # or MinIO endpoint

# Default Quota Settings
DEFAULT_STORAGE_QUOTA = 1 * 1024 * 1024 * 1024  # 1GB
DEFAULT_MAX_FILES = 1000

# Image Processing
IMAGE_VARIANTS = {
    'THUMBNAIL': (150, 150),
    'SMALL': (400, 400),
    'MEDIUM': (800, 800),
    'LARGE': (1200, 1200),
}
```

### URL Configuration

Add to main `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ... other patterns
    path('api/storage/', include('file_storage.urls')),
]
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

## Usage Examples

### Upload a File

```python
from file_storage.services import FileStorageService
from django.core.files.uploadedfile import SimpleUploadedFile

service = FileStorageService()

file = SimpleUploadedFile(
    'photo.jpg',
    file_content,
    content_type='image/jpeg'
)

stored_file = service.upload_file(
    file=file,
    user=request.user,
    is_public=True,
    tags=['farm', 'crop'],
    metadata={'location': 'Field A'}
)
```

### Download a File

```python
from file_storage.services import FileStorageService

service = FileStorageService()

file_data, filename = service.download_file(
    file_key='abc-123',
    user=request.user,
    ip_address='192.168.1.1'
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

### Initiate Chunked Upload

```python
from file_storage.services import ChunkedUploadService

service = ChunkedUploadService()

upload = service.initiate_upload(
    user=request.user,
    filename='large_video.mp4',
    file_size=100000000,
    mime_type='video/mp4',
    chunk_size=5242880
)

# Upload chunks
for chunk_number, chunk_data in enumerate(chunks):
    service.upload_chunk(
        upload_id=upload.upload_id,
        chunk_number=chunk_number,
        chunk_data=chunk_data,
        user=request.user
    )
```

## Testing

Run tests:

```bash
python manage.py test file_storage
```

Run specific test:

```bash
python manage.py test file_storage.tests.FileStorageServiceTest
```

## Security Considerations

1. **Access Control**: Files are protected by ownership and public/private flags
2. **Quota Enforcement**: Prevents storage abuse
3. **File Validation**: Type and size validation on upload
4. **Access Logging**: All file access is logged for audit
5. **Malware Scanning**: Status tracking for security scanning (integration pending)

## Performance Optimization

1. **Deduplication**: Files with same hash are not stored twice
2. **Image Variants**: Pre-generated thumbnails for fast loading
3. **CDN Integration**: Ready for CDN delivery (configuration needed)
4. **Chunked Uploads**: Efficient handling of large files
5. **Database Indexes**: Optimized queries for file lookup

## Future Enhancements

- [ ] S3/MinIO backend implementation
- [ ] ClamAV malware scanning integration
- [ ] CDN integration for file delivery
- [ ] Signed URL generation
- [ ] Video transcoding
- [ ] Advanced image filters
- [ ] Bulk operations
- [ ] File sharing with expiry
- [ ] Folder organization

## Dependencies

```
Django>=4.2
djangorestframework>=3.14
Pillow>=10.0  # For image processing
boto3>=1.28  # For S3 (optional)
```

## Service Registration

The service automatically registers with Consul on startup:

```python
from file_storage.service_registration import register_service

register_service()
```

## Monitoring

Key metrics to monitor:
- Storage usage per user
- Upload/download rates
- Failed uploads
- Quota violations
- Access patterns
- Image processing time

## Support

For issues or questions:
- Check the API documentation
- Review test cases for examples
- Contact the development team

## License

Part of the AgroBridge platform.
