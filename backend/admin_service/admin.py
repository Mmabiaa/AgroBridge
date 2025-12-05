from django.contrib import admin
from .models import (
    SystemConfiguration, FeatureFlag, ModerationQueue,
    AuditLog, SecurityIncident, PlatformMetrics, UserActivity
)


@admin.register(SystemConfiguration)
class SystemConfigurationAdmin(admin.ModelAdmin):
    list_display = ['key', 'category', 'is_sensitive', 'updated_at', 'updated_by']
    list_filter = ['category', 'is_sensitive']
    search_fields = ['key', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_enabled', 'rollout_percentage', 'created_at']
    list_filter = ['is_enabled']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['target_users']


@admin.register(ModerationQueue)
class ModerationQueueAdmin(admin.ModelAdmin):
    list_display = ['moderation_type', 'status', 'priority', 'reported_by', 'reviewed_by', 'created_at']
    list_filter = ['status', 'moderation_type', 'priority']
    search_fields = ['report_reason', 'review_notes']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action_type', 'description', 'timestamp']
    list_filter = ['action_type', 'timestamp']
    search_fields = ['description', 'user__username']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SecurityIncident)
class SecurityIncidentAdmin(admin.ModelAdmin):
    list_display = ['incident_type', 'severity', 'status', 'affected_user', 'assigned_to', 'detected_at']
    list_filter = ['severity', 'status', 'incident_type']
    search_fields = ['description', 'affected_user__username']
    readonly_fields = ['detected_at', 'updated_at']
    date_hierarchy = 'detected_at'


@admin.register(PlatformMetrics)
class PlatformMetricsAdmin(admin.ModelAdmin):
    list_display = ['metric_name', 'metric_value', 'metric_unit', 'category', 'timestamp']
    list_filter = ['category', 'metric_name']
    search_fields = ['metric_name']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'ip_address', 'timestamp']
    list_filter = ['activity_type', 'timestamp']
    search_fields = ['user__username', 'activity_type']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
