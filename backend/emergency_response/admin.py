"""Django admin configuration for emergency response service."""

from django.contrib import admin
from .models import (
    EmergencyAlert, IncidentReport, AlertAcknowledgment,
    EmergencyGuideline, IncidentAnalytics
)


class AlertAcknowledgmentInline(admin.TabularInline):
    """Inline admin for alert acknowledgments."""
    
    model = AlertAcknowledgment
    extra = 0
    readonly_fields = ['user', 'acknowledged_at']
    can_delete = False


@admin.register(EmergencyAlert)
class EmergencyAlertAdmin(admin.ModelAdmin):
    """Admin interface for emergency alerts."""
    
    list_display = [
        'alert_number', 'alert_type', 'severity', 'title',
        'status', 'issued_at', 'broadcast_count', 'acknowledgment_count'
    ]
    list_filter = [
        'alert_type', 'severity', 'status', 'country',
        'issued_at', 'created_at'
    ]
    search_fields = ['alert_number', 'title', 'description']
    readonly_fields = [
        'id', 'alert_number', 'created_by', 'created_at', 'updated_at',
        'broadcast_count', 'view_count', 'acknowledgment_count'
    ]
    inlines = [AlertAcknowledgmentInline]
    
    fieldsets = (
        ('Alert Information', {
            'fields': ('id', 'alert_number', 'alert_type', 'severity', 'title', 'description')
        }),
        ('Geographic Targeting', {
            'fields': ('country', 'regions', 'districts', 'coordinates')
        }),
        ('Response Information', {
            'fields': ('response_guidelines', 'emergency_contacts', 'resources')
        }),
        ('Status', {
            'fields': ('status', 'issued_at', 'expires_at', 'resolved_at')
        }),
        ('Metrics', {
            'fields': ('broadcast_count', 'view_count', 'acknowledgment_count')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['broadcast_alerts', 'resolve_alerts', 'cancel_alerts']
    
    def broadcast_alerts(self, request, queryset):
        """Broadcast selected alerts."""
        from .services import BroadcastService
        
        count = 0
        for alert in queryset.filter(status='ACTIVE'):
            BroadcastService.broadcast_alert(alert, ['websocket', 'push'])
            count += 1
        
        self.message_user(request, f"{count} alert(s) broadcasted.")
    broadcast_alerts.short_description = "Broadcast selected alerts"
    
    def resolve_alerts(self, request, queryset):
        """Resolve selected alerts."""
        from .services import AlertService
        
        count = 0
        for alert in queryset.filter(status='ACTIVE'):
            AlertService.resolve_alert(alert)
            count += 1
        
        self.message_user(request, f"{count} alert(s) resolved.")
    resolve_alerts.short_description = "Resolve selected alerts"
    
    def cancel_alerts(self, request, queryset):
        """Cancel selected alerts."""
        updated = queryset.filter(status__in=['DRAFT', 'ACTIVE']).update(status='CANCELLED')
        self.message_user(request, f"{updated} alert(s) cancelled.")
    cancel_alerts.short_description = "Cancel selected alerts"


@admin.register(IncidentReport)
class IncidentReportAdmin(admin.ModelAdmin):
    """Admin interface for incident reports."""
    
    list_display = [
        'report_number', 'incident_type', 'title', 'reporter',
        'region', 'status', 'reported_at'
    ]
    list_filter = [
        'incident_type', 'status', 'severity_assessment',
        'region', 'reported_at'
    ]
    search_fields = ['report_number', 'title', 'description', 'reporter__email']
    readonly_fields = [
        'id', 'report_number', 'reporter', 'reported_at', 'updated_at',
        'verified_by', 'verified_at'
    ]
    
    fieldsets = (
        ('Report Information', {
            'fields': ('id', 'report_number', 'incident_type', 'title', 'description')
        }),
        ('Reporter', {
            'fields': ('reporter', 'reporter_contact', 'reported_at')
        }),
        ('Location', {
            'fields': ('location_description', 'latitude', 'longitude', 'region', 'district')
        }),
        ('Evidence', {
            'fields': ('photos', 'additional_data')
        }),
        ('Status & Response', {
            'fields': (
                'status', 'severity_assessment', 'verified_by', 'verified_at',
                'related_alert', 'response_notes', 'resolved_at'
            )
        }),
        ('Metadata', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['verify_reports', 'reject_reports', 'resolve_reports']
    
    def verify_reports(self, request, queryset):
        """Verify selected reports."""
        from .services import IncidentService
        
        count = 0
        for report in queryset.filter(status='PENDING'):
            IncidentService.verify_report(report, request.user)
            count += 1
        
        self.message_user(request, f"{count} report(s) verified.")
    verify_reports.short_description = "Verify selected reports"
    
    def reject_reports(self, request, queryset):
        """Reject selected reports."""
        updated = queryset.filter(status='PENDING').update(status='REJECTED')
        self.message_user(request, f"{updated} report(s) rejected.")
    reject_reports.short_description = "Reject selected reports"
    
    def resolve_reports(self, request, queryset):
        """Resolve selected reports."""
        from django.utils import timezone
        updated = queryset.filter(status__in=['PENDING', 'VERIFIED', 'INVESTIGATING']).update(
            status='RESOLVED',
            resolved_at=timezone.now()
        )
        self.message_user(request, f"{updated} report(s) resolved.")
    resolve_reports.short_description = "Resolve selected reports"


@admin.register(AlertAcknowledgment)
class AlertAcknowledgmentAdmin(admin.ModelAdmin):
    """Admin interface for alert acknowledgments."""
    
    list_display = ['alert', 'user', 'acknowledged_at']
    list_filter = ['acknowledged_at']
    search_fields = ['alert__alert_number', 'user__email']
    readonly_fields = ['id', 'alert', 'user', 'acknowledged_at']
    
    def has_add_permission(self, request):
        return False


@admin.register(EmergencyGuideline)
class EmergencyGuidelineAdmin(admin.ModelAdmin):
    """Admin interface for emergency guidelines."""
    
    list_display = ['guideline_type', 'title', 'is_active', 'created_at']
    list_filter = ['guideline_type', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'guideline_type', 'title', 'description')
        }),
        ('Guidelines', {
            'fields': ('immediate_actions', 'safety_measures', 'resources_needed')
        }),
        ('Contacts & Support', {
            'fields': ('emergency_contacts', 'support_services')
        }),
        ('Geographic Relevance', {
            'fields': ('applicable_regions',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(IncidentAnalytics)
class IncidentAnalyticsAdmin(admin.ModelAdmin):
    """Admin interface for incident analytics."""
    
    list_display = [
        'period_start', 'period_end', 'region',
        'total_incidents', 'total_alerts', 'generated_at'
    ]
    list_filter = ['period_start', 'period_end', 'region', 'generated_at']
    readonly_fields = [
        'id', 'period_start', 'period_end', 'region',
        'total_incidents', 'incidents_by_type', 'incidents_by_severity',
        'total_alerts', 'alerts_by_type', 'average_response_time',
        'verification_rate', 'resolution_rate', 'acknowledgment_rate',
        'common_patterns', 'recommendations', 'generated_at'
    ]
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
