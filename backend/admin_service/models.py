from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone

User = get_user_model()


class SystemConfiguration(models.Model):
    """System-wide configuration settings"""
    key = models.CharField(max_length=255, unique=True, db_index=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, db_index=True)
    is_sensitive = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='config_updates')

    class Meta:
        db_table = 'admin_system_configuration'
        ordering = ['category', 'key']
        indexes = [
            models.Index(fields=['category', 'key']),
        ]

    def __str__(self):
        return f"{self.category}.{self.key}"


class FeatureFlag(models.Model):
    """Feature flags for gradual rollout and A/B testing"""
    name = models.CharField(max_length=255, unique=True, db_index=True)
    description = models.TextField()
    is_enabled = models.BooleanField(default=False)
    rollout_percentage = models.IntegerField(default=0, help_text="Percentage of users to enable (0-100)")
    target_users = models.ManyToManyField(User, blank=True, related_name='feature_flags')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_flags')

    class Meta:
        db_table = 'admin_feature_flags'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({'enabled' if self.is_enabled else 'disabled'})"

    def is_enabled_for_user(self, user):
        """Check if feature is enabled for specific user"""
        if not self.is_enabled:
            return False
        if self.target_users.filter(id=user.id).exists():
            return True
        if self.rollout_percentage >= 100:
            return True
        if self.rollout_percentage <= 0:
            return False
        # Use user ID for consistent rollout
        return (user.id % 100) < self.rollout_percentage


class ModerationQueue(models.Model):
    """Queue for content moderation"""
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('flagged', 'Flagged for Review'),
    ]

    CONTENT_TYPE_CHOICES = [
        ('post', 'Community Post'),
        ('comment', 'Comment'),
        ('product', 'Marketplace Product'),
        ('review', 'Product Review'),
        ('message', 'Private Message'),
    ]

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    moderation_type = models.CharField(max_length=50, choices=CONTENT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    priority = models.IntegerField(default=0, help_text="Higher priority items reviewed first")
    
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='reported_content')
    report_reason = models.TextField()
    automated_flags = models.JSONField(default=dict, help_text="Automated detection flags")
    
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_content')
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_moderation_queue'
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['-priority', '-created_at']),
        ]

    def __str__(self):
        return f"{self.moderation_type} - {self.status}"


class AuditLog(models.Model):
    """Comprehensive audit logging for all admin actions"""
    ACTION_TYPES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('permission_change', 'Permission Change'),
        ('config_change', 'Configuration Change'),
        ('moderation', 'Moderation Action'),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='audit_logs')
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES, db_index=True)
    
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    description = models.TextField()
    changes = models.JSONField(default=dict, help_text="Before/after values")
    metadata = models.JSONField(default=dict, help_text="Additional context")
    
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'admin_audit_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action_type', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.user} - {self.action_type} at {self.timestamp}"


class SecurityIncident(models.Model):
    """Track security incidents and threats"""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('false_positive', 'False Positive'),
    ]

    incident_type = models.CharField(max_length=100, db_index=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open', db_index=True)
    
    description = models.TextField()
    affected_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='security_incidents')
    
    detection_method = models.CharField(max_length=100)
    indicators = models.JSONField(default=dict)
    
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_incidents')
    investigation_notes = models.TextField(blank=True)
    resolution = models.TextField(blank=True)
    
    detected_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_security_incidents'
        ordering = ['-severity', '-detected_at']
        indexes = [
            models.Index(fields=['status', '-detected_at']),
            models.Index(fields=['severity', '-detected_at']),
        ]

    def __str__(self):
        return f"{self.incident_type} - {self.severity}"


class PlatformMetrics(models.Model):
    """Store aggregated platform metrics"""
    metric_name = models.CharField(max_length=255, db_index=True)
    metric_value = models.FloatField()
    metric_unit = models.CharField(max_length=50)
    category = models.CharField(max_length=100, db_index=True)
    metadata = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'admin_platform_metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_name', '-timestamp']),
            models.Index(fields=['category', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.metric_name}: {self.metric_value} {self.metric_unit}"


class UserActivity(models.Model):
    """Track user activity for analytics"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_activities')
    activity_type = models.CharField(max_length=100, db_index=True)
    details = models.JSONField(default=dict)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'admin_user_activity'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['activity_type', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.user} - {self.activity_type}"
