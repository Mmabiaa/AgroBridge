"""
Data Management Service Admin Interface
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    DataRetentionPolicy, DataDeletionLog, GDPRRequest,
    UserConsent, DataExport, DataProcessingRecord
)


@admin.register(DataRetentionPolicy)
class DataRetentionPolicyAdmin(admin.ModelAdmin):
    """Admin interface for data retention policies."""
    
    list_display = ['data_type', 'retention_days', 'status', 'created_at', 'updated_at']
    list_filter = ['status', 'data_type']
    search_fields = ['data_type', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Policy Information', {
            'fields': ('id', 'data_type', 'retention_days', 'description')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DataDeletionLog)
class DataDeletionLogAdmin(admin.ModelAdmin):
    """Admin interface for data deletion logs."""
    
    list_display = ['data_type', 'records_deleted', 'deletion_date', 'policy']
    list_filter = ['data_type', 'deletion_date']
    search_fields = ['data_type']
    readonly_fields = ['id', 'deletion_date', 'details']
    date_hierarchy = 'deletion_date'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(GDPRRequest)
class GDPRRequestAdmin(admin.ModelAdmin):
    """Admin interface for GDPR requests."""
    
    list_display = [
        'user', 'request_type', 'status', 'requested_at',
        'is_overdue_display', 'processed_at', 'completed_at'
    ]
    list_filter = ['request_type', 'status', 'requested_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['id', 'user', 'requested_at', 'is_overdue']
    date_hierarchy = 'requested_at'
    
    fieldsets = (
        ('Request Information', {
            'fields': ('id', 'user', 'request_type', 'reason')
        }),
        ('Status', {
            'fields': ('status', 'is_overdue')
        }),
        ('Processing', {
            'fields': ('requested_at', 'processed_at', 'completed_at', 'result_data', 'notes')
        }),
    )
    
    def is_overdue_display(self, obj):
        """Display overdue status with color."""
        if obj.is_overdue:
            return format_html('<span style="color: red;">⚠ Overdue</span>')
        return format_html('<span style="color: green;">✓ On Time</span>')
    is_overdue_display.short_description = 'Overdue Status'
    
    actions = ['mark_as_processing', 'mark_as_completed']
    
    def mark_as_processing(self, request, queryset):
        """Mark selected requests as processing."""
        from django.utils import timezone
        updated = queryset.update(status='processing', processed_at=timezone.now())
        self.message_user(request, f'{updated} requests marked as processing.')
    mark_as_processing.short_description = 'Mark as processing'
    
    def mark_as_completed(self, request, queryset):
        """Mark selected requests as completed."""
        from django.utils import timezone
        updated = queryset.update(status='completed', completed_at=timezone.now())
        self.message_user(request, f'{updated} requests marked as completed.')
    mark_as_completed.short_description = 'Mark as completed'


@admin.register(UserConsent)
class UserConsentAdmin(admin.ModelAdmin):
    """Admin interface for user consents."""
    
    list_display = ['user', 'consent_type', 'granted', 'granted_at', 'withdrawn_at', 'version']
    list_filter = ['consent_type', 'granted', 'granted_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['id', 'granted_at', 'withdrawn_at']
    date_hierarchy = 'granted_at'
    
    fieldsets = (
        ('Consent Information', {
            'fields': ('id', 'user', 'consent_type', 'version')
        }),
        ('Status', {
            'fields': ('granted', 'granted_at', 'withdrawn_at')
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DataExport)
class DataExportAdmin(admin.ModelAdmin):
    """Admin interface for data exports."""
    
    list_display = [
        'user', 'status', 'format', 'file_size_display',
        'requested_at', 'completed_at', 'download_count', 'is_expired_display'
    ]
    list_filter = ['status', 'format', 'requested_at']
    search_fields = ['user__email', 'user__username']
    readonly_fields = [
        'id', 'user', 'gdpr_request', 'file_path', 'file_size',
        'requested_at', 'completed_at', 'download_count', 'is_expired'
    ]
    date_hierarchy = 'requested_at'
    
    fieldsets = (
        ('Export Information', {
            'fields': ('id', 'user', 'gdpr_request', 'status', 'format')
        }),
        ('File Details', {
            'fields': ('file_path', 'file_size')
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'completed_at', 'expires_at', 'is_expired')
        }),
        ('Usage', {
            'fields': ('download_count',)
        }),
    )
    
    def file_size_display(self, obj):
        """Display file size in human-readable format."""
        if obj.file_size:
            size_mb = obj.file_size / (1024 * 1024)
            return f"{size_mb:.2f} MB"
        return "N/A"
    file_size_display.short_description = 'File Size'
    
    def is_expired_display(self, obj):
        """Display expiry status with color."""
        if obj.is_expired:
            return format_html('<span style="color: red;">Expired</span>')
        return format_html('<span style="color: green;">Active</span>')
    is_expired_display.short_description = 'Expiry Status'
    
    def has_add_permission(self, request):
        return False


@admin.register(DataProcessingRecord)
class DataProcessingRecordAdmin(admin.ModelAdmin):
    """Admin interface for data processing records."""
    
    list_display = [
        'service_name', 'data_category', 'processing_purpose',
        'legal_basis', 'retention_period', 'created_at'
    ]
    list_filter = ['service_name', 'legal_basis', 'created_at']
    search_fields = ['service_name', 'data_category', 'processing_purpose']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Service Information', {
            'fields': ('id', 'service_name', 'data_category')
        }),
        ('Processing Details', {
            'fields': ('processing_purpose', 'legal_basis', 'data_subjects', 'retention_period')
        }),
        ('Data Sharing', {
            'fields': ('recipients', 'transfers')
        }),
        ('Security', {
            'fields': ('security_measures',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
