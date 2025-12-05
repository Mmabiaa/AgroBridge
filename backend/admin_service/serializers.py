from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import (
    SystemConfiguration, FeatureFlag, ModerationQueue,
    AuditLog, SecurityIncident, PlatformMetrics, UserActivity
)

User = get_user_model()


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for user management"""
    role = serializers.CharField(source='profile.role', read_only=True)
    is_verified = serializers.BooleanField(source='profile.is_verified', read_only=True)
    last_login_formatted = serializers.DateTimeField(source='last_login', format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_active', 'is_staff', 'is_superuser', 'role', 'is_verified',
            'date_joined', 'last_login', 'last_login_formatted'
        ]
        read_only_fields = ['date_joined', 'last_login']


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for system configuration"""
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)

    class Meta:
        model = SystemConfiguration
        fields = [
            'id', 'key', 'value', 'description', 'category',
            'is_sensitive', 'created_at', 'updated_at',
            'updated_by', 'updated_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def to_representation(self, instance):
        """Hide sensitive values"""
        data = super().to_representation(instance)
        if instance.is_sensitive:
            data['value'] = '***HIDDEN***'
        return data


class FeatureFlagSerializer(serializers.ModelSerializer):
    """Serializer for feature flags"""
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    target_user_count = serializers.IntegerField(source='target_users.count', read_only=True)

    class Meta:
        model = FeatureFlag
        fields = [
            'id', 'name', 'description', 'is_enabled',
            'rollout_percentage', 'target_users', 'target_user_count',
            'created_at', 'updated_at', 'created_by', 'created_by_name'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ModerationQueueSerializer(serializers.ModelSerializer):
    """Serializer for moderation queue"""
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = ModerationQueue
        fields = [
            'id', 'content_type', 'content_type_name', 'object_id',
            'moderation_type', 'status', 'priority',
            'reported_by', 'reported_by_name', 'report_reason',
            'automated_flags', 'reviewed_by', 'reviewed_by_name',
            'review_notes', 'reviewed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class ModerationActionSerializer(serializers.Serializer):
    """Serializer for moderation actions"""
    action = serializers.ChoiceField(choices=['approve', 'reject', 'flag'])
    review_notes = serializers.CharField(required=False, allow_blank=True)


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    content_type_name = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'action_type',
            'content_type', 'content_type_name', 'object_id',
            'description', 'changes', 'metadata',
            'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class SecurityIncidentSerializer(serializers.ModelSerializer):
    """Serializer for security incidents"""
    affected_user_name = serializers.CharField(source='affected_user.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)

    class Meta:
        model = SecurityIncident
        fields = [
            'id', 'incident_type', 'severity', 'status',
            'description', 'affected_user', 'affected_user_name',
            'detection_method', 'indicators',
            'assigned_to', 'assigned_to_name',
            'investigation_notes', 'resolution',
            'detected_at', 'resolved_at', 'updated_at'
        ]
        read_only_fields = ['detected_at', 'updated_at']


class PlatformMetricsSerializer(serializers.ModelSerializer):
    """Serializer for platform metrics"""
    class Meta:
        model = PlatformMetrics
        fields = [
            'id', 'metric_name', 'metric_value', 'metric_unit',
            'category', 'metadata', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class UserActivitySerializer(serializers.ModelSerializer):
    """Serializer for user activity"""
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'user_name', 'activity_type',
            'details', 'ip_address', 'user_agent', 'timestamp'
        ]
        read_only_fields = ['timestamp']


class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics"""
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    new_users_today = serializers.IntegerField()
    pending_moderation = serializers.IntegerField()
    open_incidents = serializers.IntegerField()
    system_health = serializers.CharField()


class UserRoleUpdateSerializer(serializers.Serializer):
    """Serializer for updating user roles"""
    role = serializers.ChoiceField(choices=['farmer', 'buyer', 'expert', 'admin'])


class BulkModerationSerializer(serializers.Serializer):
    """Serializer for bulk moderation actions"""
    item_ids = serializers.ListField(child=serializers.IntegerField())
    action = serializers.ChoiceField(choices=['approve', 'reject', 'flag'])
    review_notes = serializers.CharField(required=False, allow_blank=True)
