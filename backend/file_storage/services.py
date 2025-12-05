"""Business logic for file storage service."""

import hashlib
import mimetypes
import uuid
from datetime import timedelta
from io import BytesIO
from typing import Optional, Tuple, BinaryIO

from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from django.utils import timezone
from django.db import transaction
from PIL import Image

from .models import (
    StoredFile, ImageVariant, ChunkedUpload, 
    StorageQuota, FileAccessLog
)


class StorageBackend:
    """Abstract storage backend interface."""
    
    def upload_file(self, file_data: BinaryIO, file_key: str) -> str:
        """Upload file and return storage path."""
        raise NotImplementedError
    
    def download_file(self, file_key: str) -> bytes:
        """Download file data."""
        raise NotImplementedError
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file."""
        raise NotImplementedError
    
    def get_signed_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Get signed URL for file access."""
        raise NotImplementedError


class LocalStorageBackend(StorageBackend):
    """Local filesystem storage backend for development."""
    
    def __init__(self):
        self.storage_path = getattr(settings, 'FILE_STORAGE_PATH', '/tmp/agrobridge_files')
    
    def upload_file(self, file_data: BinaryIO, file_key: str) -> str:
        """Upload file to local storage."""
        import os
        os.makedirs(self.storage_path, exist_ok=True)
        file_path = os.path.join(self.storage_path, file_key)
        
        with open(file_path, 'wb') as f:
            for chunk in file_data.chunks() if hasattr(file_data, 'chunks') else [file_data.read()]:
                f.write(chunk)
        
        return file_path
    
    def download_file(self, file_key: str) -> bytes:
        """Download file from local storage."""
        import os
        file_path = os.path.join(self.storage_path, file_key)
        
        with open(file_path, 'rb') as f:
            return f.read()
    
    def delete_file(self, file_key: str) -> bool:
        """Delete file from local storage."""
        import os
        file_path = os.path.join(self.storage_path, file_key)
        
        try:
            os.remove(file_path)
            return True
        except FileNotFoundError:
            return False
    
    def get_signed_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Get URL for file access (local path)."""
        return f"/media/files/{file_key}"


class FileStorageService:
    """Service for file storage operations."""
    
    ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    
    def __init__(self):
        self.backend = self._get_storage_backend()
    
    def _get_storage_backend(self) -> StorageBackend:
        """Get configured storage backend."""
        backend_type = getattr(settings, 'FILE_STORAGE_BACKEND', 'local')
        
        if backend_type == 'local':
            return LocalStorageBackend()
        # Add S3/MinIO backends here
        return LocalStorageBackend()
    
    def _calculate_file_hash(self, file_data: BinaryIO) -> str:
        """Calculate SHA-256 hash of file."""
        sha256 = hashlib.sha256()
        
        if hasattr(file_data, 'chunks'):
            for chunk in file_data.chunks():
                sha256.update(chunk)
            file_data.seek(0)  # Reset file pointer
        else:
            sha256.update(file_data.read())
            file_data.seek(0)
        
        return sha256.hexdigest()
    
    def _detect_file_type(self, mime_type: str) -> str:
        """Detect file type from MIME type."""
        if mime_type.startswith('image/'):
            return 'IMAGE'
        elif mime_type.startswith('video/'):
            return 'VIDEO'
        elif mime_type.startswith('audio/'):
            return 'AUDIO'
        elif mime_type in ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            return 'DOCUMENT'
        elif mime_type in ['application/zip', 'application/x-rar-compressed']:
            return 'ARCHIVE'
        return 'OTHER'
    
    @transaction.atomic
    def upload_file(
        self, 
        file: UploadedFile, 
        user, 
        is_public: bool = False,
        tags: list = None,
        metadata: dict = None,
        expires_in_days: Optional[int] = None
    ) -> StoredFile:
        """Upload a file."""
        # Check quota
        quota = StorageQuota.objects.get_or_create(user=user)[0]
        if not quota.has_space_for(file.size):
            raise ValueError("Storage quota exceeded")
        
        # Validate file size
        if file.size > self.MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds maximum allowed size of {self.MAX_FILE_SIZE} bytes")
        
        # Calculate file hash
        file_hash = self._calculate_file_hash(file)
        
        # Check for duplicate
        existing_file = StoredFile.objects.filter(
            file_hash=file_hash,
            uploaded_by=user
        ).first()
        
        if existing_file:
            return existing_file
        
        # Generate unique file key
        file_key = f"{uuid.uuid4()}"
        mime_type = file.content_type or mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        file_type = self._detect_file_type(mime_type)
        
        # Upload to storage backend
        storage_path = self.backend.upload_file(file, file_key)
        
        # Calculate expiry
        expires_at = None
        if expires_in_days:
            expires_at = timezone.now() + timedelta(days=expires_in_days)
        
        # Create database record
        stored_file = StoredFile.objects.create(
            file_key=file_key,
            original_filename=file.name,
            file_type=file_type,
            mime_type=mime_type,
            file_size=file.size,
            file_hash=file_hash,
            storage_path=storage_path,
            storage_backend='local',  # TODO: Make dynamic
            uploaded_by=user,
            is_public=is_public,
            status='PROCESSING',
            tags=tags or [],
            metadata=metadata or {},
            expires_at=expires_at
        )
        
        # Update quota
        quota.used_storage += file.size
        quota.file_count += 1
        quota.save()
        
        # Process image if applicable
        if file_type == 'IMAGE':
            self._process_image(stored_file, file)
        
        # Mark as available
        stored_file.status = 'AVAILABLE'
        stored_file.save()
        
        return stored_file
    
    def _process_image(self, stored_file: StoredFile, file: UploadedFile):
        """Process image and create variants."""
        try:
            image = Image.open(file)
            
            # Define variant sizes
            variants = {
                'THUMBNAIL': (150, 150),
                'SMALL': (400, 400),
                'MEDIUM': (800, 800),
                'LARGE': (1200, 1200),
            }
            
            for variant_type, size in variants.items():
                self._create_image_variant(stored_file, image, variant_type, size)
        
        except Exception as e:
            # Log error but don't fail upload
            print(f"Error processing image: {e}")
    
    def _create_image_variant(
        self, 
        stored_file: StoredFile, 
        image: Image.Image, 
        variant_type: str, 
        size: Tuple[int, int]
    ):
        """Create an image variant."""
        # Create thumbnail
        img_copy = image.copy()
        img_copy.thumbnail(size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = BytesIO()
        img_format = image.format or 'JPEG'
        img_copy.save(output, format=img_format, quality=85, optimize=True)
        output.seek(0)
        
        # Generate variant key
        variant_key = f"{stored_file.file_key}_{variant_type.lower()}"
        
        # Upload variant
        storage_path = self.backend.upload_file(output, variant_key)
        
        # Create variant record
        ImageVariant.objects.create(
            original_file=stored_file,
            variant_type=variant_type,
            width=img_copy.width,
            height=img_copy.height,
            file_size=output.tell(),
            storage_path=storage_path,
            file_key=variant_key
        )
    
    def get_file(self, file_key: str, user=None) -> Optional[StoredFile]:
        """Get file by key."""
        try:
            file = StoredFile.objects.get(file_key=file_key)
            
            # Check access permissions
            if not file.is_public and file.uploaded_by != user:
                return None
            
            return file
        except StoredFile.DoesNotExist:
            return None
    
    def download_file(self, file_key: str, user, ip_address: str = None, user_agent: str = None) -> Tuple[bytes, str]:
        """Download file data."""
        file = self.get_file(file_key, user)
        if not file:
            raise ValueError("File not found or access denied")
        
        # Log access
        FileAccessLog.objects.create(
            file=file,
            user=user,
            access_type='DOWNLOAD',
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Update access tracking
        file.access_count += 1
        file.last_accessed_at = timezone.now()
        file.save(update_fields=['access_count', 'last_accessed_at'])
        
        # Download from storage
        file_data = self.backend.download_file(file_key)
        
        return file_data, file.original_filename
    
    @transaction.atomic
    def delete_file(self, file_key: str, user) -> bool:
        """Delete a file."""
        file = self.get_file(file_key, user)
        if not file:
            return False
        
        # Update quota
        quota = StorageQuota.objects.get(user=user)
        quota.used_storage -= file.file_size
        quota.file_count -= 1
        quota.save()
        
        # Delete from storage
        self.backend.delete_file(file_key)
        
        # Delete variants
        for variant in file.variants.all():
            self.backend.delete_file(variant.file_key)
        
        # Mark as deleted
        file.status = 'DELETED'
        file.save()
        
        return True


class ChunkedUploadService:
    """Service for chunked/resumable uploads."""
    
    @transaction.atomic
    def initiate_upload(
        self,
        user,
        filename: str,
        file_size: int,
        mime_type: str,
        chunk_size: int = 5242880,
        metadata: dict = None
    ) -> ChunkedUpload:
        """Initiate a chunked upload."""
        # Check quota
        quota = StorageQuota.objects.get_or_create(user=user)[0]
        if not quota.has_space_for(file_size):
            raise ValueError("Storage quota exceeded")
        
        # Calculate total chunks
        total_chunks = (file_size + chunk_size - 1) // chunk_size
        
        # Create upload record
        upload = ChunkedUpload.objects.create(
            upload_id=str(uuid.uuid4()),
            filename=filename,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=user,
            chunk_size=chunk_size,
            total_chunks=total_chunks,
            status='INITIATED',
            metadata=metadata or {},
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        return upload
    
    @transaction.atomic
    def upload_chunk(
        self,
        upload_id: str,
        chunk_number: int,
        chunk_data: bytes,
        user
    ) -> ChunkedUpload:
        """Upload a chunk."""
        upload = ChunkedUpload.objects.get(upload_id=upload_id, uploaded_by=user)
        
        if upload.status not in ['INITIATED', 'IN_PROGRESS']:
            raise ValueError("Upload is not in progress")
        
        if chunk_number in upload.uploaded_chunks:
            raise ValueError("Chunk already uploaded")
        
        # Store chunk (simplified - in production, use proper storage)
        # TODO: Implement proper chunk storage
        
        # Update upload record
        upload.uploaded_chunks.append(chunk_number)
        upload.status = 'IN_PROGRESS'
        upload.last_chunk_at = timezone.now()
        upload.save()
        
        # Check if complete
        if len(upload.uploaded_chunks) == upload.total_chunks:
            self._complete_upload(upload)
        
        return upload
    
    def _complete_upload(self, upload: ChunkedUpload):
        """Complete a chunked upload."""
        # TODO: Assemble chunks and create StoredFile
        upload.status = 'COMPLETED'
        upload.completed_at = timezone.now()
        upload.save()


class QuotaService:
    """Service for storage quota management."""
    
    def get_or_create_quota(self, user) -> StorageQuota:
        """Get or create quota for user."""
        quota, created = StorageQuota.objects.get_or_create(user=user)
        return quota
    
    def recalculate_quota(self, user) -> StorageQuota:
        """Recalculate user's storage usage."""
        quota = self.get_or_create_quota(user)
        
        # Calculate actual usage
        files = StoredFile.objects.filter(
            uploaded_by=user,
            status__in=['AVAILABLE', 'PROCESSING']
        )
        
        total_size = sum(f.file_size for f in files)
        file_count = files.count()
        
        quota.used_storage = total_size
        quota.file_count = file_count
        quota.save()
        
        return quota
