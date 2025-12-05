"""Database models for file storage service."""

import uuid
import hashlib
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from django.utils import timezone

User = get_user_model()


class StoredFile(models.Model):
    """Metadata for stored files."""
    
    FILE_TYPES = [
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
        ('DOCUMENT', 'Document'),
        ('AUDIO', 'Audio'),
        ('ARCHIVE', 'Archive'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('UPLOADING', 'Uploading'),
        ('PROCESSING', 'Processing'),
        ('AVAILABLE', 'Available'),
        ('ARCHIVED', 'Archived'),
        ('DELETED', 'Deleted'),
        ('QUARANTINED', 'Quarantined'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file_key = models.CharField(max_length=255, unique=True, db_index=True)
    
    # File information
    original_filename = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES)
    mime_type = models.CharField(max_length=100)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    file_hash = models.CharField(max_length=64, help_text="SHA-256 hash")
    
    # Storage information
    storage_path = models.CharField(max_length=500)
    storage_backend = models.CharField(max_length=50, default='s3')
    bucket_name = models.CharField(max_length=100, blank=True)
    
    # Ownership and access
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_files')
    is_public = models.BooleanField(default=False)
    access_count = models.IntegerField(default=0)
    
    # Status and lifecycle
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPLOADING')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    # Security
    scan_status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('SCANNING', 'Scanning'),
        ('CLEAN', 'Clean'),
        ('INFECTED', 'Infected'),
        ('ERROR', 'Error'),
    ])
    scan_result = models.JSONField(default=dict, blank=True)
    scanned_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'stored_files'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['uploaded_by', 'status']),
            models.Index(fields=['file_type', 'status']),
            models.Index(fields=['file_hash']),
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.original_filename} ({self.file_key})"


class ImageVariant(models.Model):
    """Image variants (thumbnails, different sizes)."""
    
    VARIANT_TYPES = [
        ('THUMBNAIL', 'Thumbnail'),
        ('SMALL', 'Small'),
        ('MEDIUM', 'Medium'),
        ('LARGE', 'Large'),
        ('ORIGINAL', 'Original'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    original_file = models.ForeignKey(StoredFile, on_delete=models.CASCADE, related_name='variants')
    
    variant_type = models.CharField(max_length=20, choices=VARIANT_TYPES)
    width = models.IntegerField()
    height = models.IntegerField()
    file_size = models.BigIntegerField()
    
    storage_path = models.CharField(max_length=500)
    file_key = models.CharField(max_length=255, unique=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'image_variants'
        unique_together = ['original_file', 'variant_type']
        ordering = ['variant_type']
        indexes = [
            models.Index(fields=['original_file', 'variant_type']),
        ]
    
    def __str__(self):
        return f"{self.original_file.original_filename} - {self.variant_type}"


class ChunkedUpload(models.Model):
    """Track chunked/resumable uploads."""
    
    STATUS_CHOICES = [
        ('INITIATED', 'Initiated'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('EXPIRED', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    upload_id = models.CharField(max_length=255, unique=True)
    
    # File information
    filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    mime_type = models.CharField(max_length=100)
    
    # Upload tracking
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chunked_uploads')
    chunk_size = models.IntegerField(default=5242880)  # 5MB default
    total_chunks = models.IntegerField()
    uploaded_chunks = models.JSONField(default=list)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATED')
    completed_file = models.ForeignKey(StoredFile, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Metadata
    storage_path = models.CharField(max_length=500, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    initiated_at = models.DateTimeField(auto_now_add=True)
    last_chunk_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'chunked_uploads'
        ordering = ['-initiated_at']
        indexes = [
            models.Index(fields=['uploaded_by', 'status']),
            models.Index(fields=['upload_id']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.filename} - {self.status}"
    
    @property
    def progress_percentage(self):
        """Calculate upload progress percentage."""
        if self.total_chunks == 0:
            return 0
        return (len(self.uploaded_chunks) / self.total_chunks) * 100


class StorageQuota(models.Model):
    """Storage quota tracking for users."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='storage_quota')
    
    # Quota limits (in bytes)
    quota_limit = models.BigIntegerField(default=1073741824)  # 1GB default
    used_storage = models.BigIntegerField(default=0)
    
    # File count limits
    max_files = models.IntegerField(default=1000)
    file_count = models.IntegerField(default=0)
    
    # Timestamps
    last_calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'storage_quotas'
    
    def __str__(self):
        return f"{self.user.email} - {self.used_storage}/{self.quota_limit} bytes"
    
    @property
    def usage_percentage(self):
        """Calculate storage usage percentage."""
        if self.quota_limit == 0:
            return 0
        return (self.used_storage / self.quota_limit) * 100
    
    @property
    def available_storage(self):
        """Calculate available storage."""
        return max(0, self.quota_limit - self.used_storage)
    
    def has_space_for(self, file_size):
        """Check if user has space for a file."""
        return self.available_storage >= file_size and self.file_count < self.max_files


class FileAccessLog(models.Model):
    """Log file access for analytics and security."""
    
    ACCESS_TYPES = [
        ('DOWNLOAD', 'Download'),
        ('VIEW', 'View'),
        ('SHARE', 'Share'),
        ('DELETE', 'Delete'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.ForeignKey(StoredFile, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    access_type = models.CharField(max_length=20, choices=ACCESS_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    accessed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'file_access_logs'
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['file', 'accessed_at']),
            models.Index(fields=['user', 'accessed_at']),
        ]
    
    def __str__(self):
        return f"{self.access_type} - {self.file.original_filename}"
