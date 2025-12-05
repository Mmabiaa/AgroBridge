"""Serializers for file storage service."""

from rest_framework import serializers
from .models import StoredFile, ImageVariant, ChunkedUpload, StorageQuota, FileAccessLog


class ImageVariantSerializer(serializers.ModelSerializer):
    """Serializer for image variants."""
    
    url = serializers.SerializerMethodField()
    
    class Meta:
        model = ImageVariant
        fields = [
            'id', 'variant_type', 'width', 'height', 
            'file_size', 'url', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_url(self, obj):
        """Get signed URL for variant."""
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/files/{obj.file_key}/')
        return None


class StoredFileSerializer(serializers.ModelSerializer):
    """Serializer for stored files."""
    
    variants = ImageVariantSerializer(many=True, read_only=True)
    download_url = serializers.SerializerMethodField()
    uploaded_by_email = serializers.EmailField(source='uploaded_by.email', read_only=True)
    
    class Meta:
        model = StoredFile
        fields = [
            'id', 'file_key', 'original_filename', 'file_type', 
            'mime_type', 'file_size', 'file_hash', 'storage_backend',
            'uploaded_by', 'uploaded_by_email', 'is_public', 'access_count',
            'status', 'uploaded_at', 'last_accessed_at', 'expires_at',
            'scan_status', 'scanned_at', 'metadata', 'tags',
            'variants', 'download_url'
        ]
        read_only_fields = [
            'id', 'file_key', 'file_hash', 'uploaded_by', 
            'access_count', 'uploaded_at', 'last_accessed_at',
            'scan_status', 'scanned_at'
        ]
    
    def get_download_url(self, obj):
        """Get download URL for file."""
        request = self.context.get('request')
        if request and (obj.is_public or obj.uploaded_by == request.user):
            return request.build_absolute_uri(f'/api/files/{obj.file_key}/download/')
        return None


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file upload."""
    
    file = serializers.FileField()
    is_public = serializers.BooleanField(default=False)
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        default=list
    )
    metadata = serializers.JSONField(required=False, default=dict)
    expires_in_days = serializers.IntegerField(required=False, min_value=1, max_value=365)


class ChunkedUploadSerializer(serializers.ModelSerializer):
    """Serializer for chunked uploads."""
    
    progress = serializers.SerializerMethodField()
    
    class Meta:
        model = ChunkedUpload
        fields = [
            'id', 'upload_id', 'filename', 'file_size', 'mime_type',
            'chunk_size', 'total_chunks', 'uploaded_chunks', 'status',
            'progress', 'initiated_at', 'last_chunk_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'upload_id', 'uploaded_chunks', 'status',
            'initiated_at', 'last_chunk_at'
        ]
    
    def get_progress(self, obj):
        """Get upload progress percentage."""
        return obj.progress_percentage


class ChunkedUploadInitiateSerializer(serializers.Serializer):
    """Serializer for initiating chunked upload."""
    
    filename = serializers.CharField(max_length=255)
    file_size = serializers.IntegerField(min_value=1)
    mime_type = serializers.CharField(max_length=100)
    chunk_size = serializers.IntegerField(default=5242880, min_value=1048576)  # Min 1MB
    metadata = serializers.JSONField(required=False, default=dict)


class ChunkedUploadChunkSerializer(serializers.Serializer):
    """Serializer for uploading a chunk."""
    
    chunk_number = serializers.IntegerField(min_value=0)
    chunk_data = serializers.FileField()


class StorageQuotaSerializer(serializers.ModelSerializer):
    """Serializer for storage quota."""
    
    usage_percentage = serializers.SerializerMethodField()
    available_storage = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = StorageQuota
        fields = [
            'id', 'user', 'user_email', 'quota_limit', 'used_storage',
            'max_files', 'file_count', 'usage_percentage', 
            'available_storage', 'last_calculated_at'
        ]
        read_only_fields = [
            'id', 'user', 'used_storage', 'file_count', 'last_calculated_at'
        ]
    
    def get_usage_percentage(self, obj):
        """Get storage usage percentage."""
        return round(obj.usage_percentage, 2)
    
    def get_available_storage(self, obj):
        """Get available storage in bytes."""
        return obj.available_storage


class FileAccessLogSerializer(serializers.ModelSerializer):
    """Serializer for file access logs."""
    
    file_name = serializers.CharField(source='file.original_filename', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = FileAccessLog
        fields = [
            'id', 'file', 'file_name', 'user', 'user_email',
            'access_type', 'ip_address', 'user_agent', 'accessed_at'
        ]
        read_only_fields = ['id', 'accessed_at']
