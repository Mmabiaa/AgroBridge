"""Admin interface for file storage service."""

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    StoredFile, ImageVariant, ChunkedUpload,
    StorageQuota, FileAccessLog
)


@admin.register(StoredFile)
class StoredFileAdmin(admin.ModelAdmin):
    """Admin interface for stored files."""
    
    list_display = [
        'original_filename', 'file_type', 'file_size_display',
        'uploaded_by', 'status', 'scan_status', 'is_public',
        'access_count', 'uploaded_at'
    ]
    list_filter = [
        'file_type', 'status', 'scan_status', 'is_public',
        'storage_backend', 'uploaded_at'
    ]
    search_fields = [
        'original_filename', 'file_key', 'uploaded_by__email',
        'tags', 'file_hash'
    ]
    readonly_fields = [
        'id', 'file_key', 'file_hash', 'uploaded_at',
        'last_accessed_at', 'scanned_at', 'file_size_display',
        'storage_path'
    ]
    fieldsets = (
        ('File Information', {
            'fields': (
                'id', 'file_key', 'original_filename', 'file_type',
                'mime_type', 'file_size_display', 'file_hash'
            )
        }),
        ('Storage', {
            'fields': (
                'storage_path', 'storage_backend', 'bucket_name'
            )
        }),
        ('Ownership & Access', {
            'fields': (
                'uploaded_by', 'is_public', 'access_count',
                'last_accessed_at'
            )
        }),
        ('Status & Lifecycle', {
            'fields': (
                'status', 'uploaded_at', 'archived_at', 'expires_at'
            )
        }),
        ('Security', {
            'fields': (
                'scan_status', 'scan_result', 'scanned_at'
            )
        }),
        ('Metadata', {
            'fields': ('metadata', 'tags'),
            'classes': ('collapse',)
        }),
    )
    
    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} TB"
    file_size_display.short_description = 'File Size'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('uploaded_by')


@admin.register(ImageVariant)
class ImageVariantAdmin(admin.ModelAdmin):
    """Admin interface for image variants."""
    
    list_display = [
        'original_file', 'variant_type', 'dimensions',
        'file_size_display', 'created_at'
    ]
    list_filter = ['variant_type', 'created_at']
    search_fields = ['original_file__original_filename', 'file_key']
    readonly_fields = ['id', 'file_key', 'created_at', 'dimensions']
    
    def dimensions(self, obj):
        """Display image dimensions."""
        return f"{obj.width} x {obj.height}"
    dimensions.short_description = 'Dimensions'
    
    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} GB"
    file_size_display.short_description = 'File Size'


@admin.register(ChunkedUpload)
class ChunkedUploadAdmin(admin.ModelAdmin):
    """Admin interface for chunked uploads."""
    
    list_display = [
        'filename', 'uploaded_by', 'status', 'progress_display',
        'file_size_display', 'initiated_at', 'expires_at'
    ]
    list_filter = ['status', 'initiated_at', 'expires_at']
    search_fields = ['filename', 'upload_id', 'uploaded_by__email']
    readonly_fields = [
        'id', 'upload_id', 'initiated_at', 'last_chunk_at',
        'completed_at', 'progress_display'
    ]
    
    def progress_display(self, obj):
        """Display upload progress."""
        progress = obj.progress_percentage
        color = 'green' if progress == 100 else 'orange' if progress > 50 else 'red'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, progress
        )
    progress_display.short_description = 'Progress'
    
    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} TB"
    file_size_display.short_description = 'File Size'


@admin.register(StorageQuota)
class StorageQuotaAdmin(admin.ModelAdmin):
    """Admin interface for storage quotas."""
    
    list_display = [
        'user', 'usage_display', 'file_count_display',
        'quota_limit_display', 'last_calculated_at'
    ]
    search_fields = ['user__email']
    readonly_fields = [
        'id', 'used_storage', 'file_count', 'last_calculated_at',
        'usage_display', 'available_display'
    ]
    
    def usage_display(self, obj):
        """Display storage usage."""
        percentage = obj.usage_percentage
        color = 'red' if percentage > 90 else 'orange' if percentage > 75 else 'green'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, percentage
        )
    usage_display.short_description = 'Usage'
    
    def file_count_display(self, obj):
        """Display file count."""
        return f"{obj.file_count} / {obj.max_files}"
    file_count_display.short_description = 'Files'
    
    def quota_limit_display(self, obj):
        """Display quota limit in human-readable format."""
        size = obj.quota_limit
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} TB"
    quota_limit_display.short_description = 'Quota Limit'
    
    def available_display(self, obj):
        """Display available storage."""
        size = obj.available_storage
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.2f} {unit}"
            size /= 1024.0
        return f"{size:.2f} TB"
    available_display.short_description = 'Available'


@admin.register(FileAccessLog)
class FileAccessLogAdmin(admin.ModelAdmin):
    """Admin interface for file access logs."""
    
    list_display = [
        'file', 'user', 'access_type', 'ip_address', 'accessed_at'
    ]
    list_filter = ['access_type', 'accessed_at']
    search_fields = [
        'file__original_filename', 'user__email', 'ip_address'
    ]
    readonly_fields = ['id', 'accessed_at']
    date_hierarchy = 'accessed_at'
    
    def get_queryset(self, request):
        """Optimize queryset."""
        return super().get_queryset(request).select_related('file', 'user')
