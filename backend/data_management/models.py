"""
Data Management Service Models

Handles data retention policies, GDPR compliance, and data lifecycle management.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()


class DataRetentionPolicy(models.Model):
    """Defines retention policies for different data types."""
    
    DATA_TYPES = [
        ('user_data', 'User Data'),
        ('transaction', 'Transaction Data'),
        ('audit_log', 'Audit Logs'),
        ('sensor_data', 'Sensor Data'),
        ('marketplace', 'Marketplace Data'),
        ('communication', 'Communication Data'),
        ('analytics', 'Analytics Data'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_type = models.CharField(max_length=50, choices=DATA_TYPES, unique=True)
    retention_days = models.IntegerField(help_text="Number of days to retain data")
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_retention_policies'
        verbose_name = 'Data Retention Policy'
        verbose_name_plural = 'Data Retention Policies'
    
    def __str__(self):
        return f"{self.get_data_type_display()} - {self.retention_days} days"


class DataDeletionLog(models.Model):
    """Tracks data deletion operations for audit purposes."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    data_type = models.CharField(max_length=50)
    records_deleted = models.IntegerField(default=0)
    deletion_date = models.DateTimeField(auto_now_add=True)
    policy = models.ForeignKey(DataRetentionPolicy, on_delete=models.SET_NULL, null=True)
    details = models.JSONField(default=dict, help_text="Additional deletion details")
    
    class Meta:
        db_table = 'data_deletion_logs'
        ordering = ['-deletion_date']
        indexes = [
            models.Index(fields=['-deletion_date']),
            models.Index(fields=['data_type']),
        ]
    
    def __str__(self):
        return f"Deleted {self.records_deleted} {self.data_type} records on {self.deletion_date}"


class GDPRRequest(models.Model):
    """Manages GDPR data subject requests."""
    
    REQUEST_TYPES = [
        ('access', 'Right to Access'),
        ('erasure', 'Right to Erasure'),
        ('portability', 'Data Portability'),
        ('rectification', 'Right to Rectification'),
        ('restriction', 'Restriction of Processing'),
        ('objection', 'Right to Object'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='gdpr_requests')
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    result_data = models.JSONField(default=dict, help_text="Result of the request")
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'gdpr_requests'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['user', '-requested_at']),
            models.Index(fields=['status']),
            models.Index(fields=['request_type']),
        ]
    
    def __str__(self):
        return f"{self.get_request_type_display()} - {self.user.email} ({self.status})"
    
    @property
    def is_overdue(self):
        """Check if request is overdue (30 days as per GDPR)."""
        if self.status == 'completed':
            return False
        deadline = self.requested_at + timedelta(days=30)
        return timezone.now() > deadline


class UserConsent(models.Model):
    """Manages user consent for data processing."""
    
    CONSENT_TYPES = [
        ('marketing', 'Marketing Communications'),
        ('analytics', 'Analytics and Tracking'),
        ('third_party', 'Third-party Data Sharing'),
        ('profiling', 'Automated Profiling'),
        ('location', 'Location Data'),
        ('biometric', 'Biometric Data'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='consents')
    consent_type = models.CharField(max_length=50, choices=CONSENT_TYPES)
    granted = models.BooleanField(default=False)
    granted_at = models.DateTimeField(null=True, blank=True)
    withdrawn_at = models.DateTimeField(null=True, blank=True)
    version = models.CharField(max_length=20, help_text="Version of consent terms")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        db_table = 'user_consents'
        unique_together = [['user', 'consent_type', 'version']]
        ordering = ['-granted_at']
        indexes = [
            models.Index(fields=['user', 'consent_type']),
            models.Index(fields=['granted']),
        ]
    
    def __str__(self):
        status = "Granted" if self.granted else "Withdrawn"
        return f"{self.user.email} - {self.get_consent_type_display()} ({status})"
    
    def withdraw(self):
        """Withdraw consent."""
        self.granted = False
        self.withdrawn_at = timezone.now()
        self.save()


class DataExport(models.Model):
    """Tracks data export requests and files."""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='data_exports')
    gdpr_request = models.OneToOneField(GDPRRequest, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(default=0, help_text="File size in bytes")
    format = models.CharField(max_length=20, default='json', choices=[('json', 'JSON'), ('csv', 'CSV'), ('zip', 'ZIP')])
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    download_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'data_exports'
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['user', '-requested_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Data Export for {self.user.email} - {self.status}"
    
    @property
    def is_expired(self):
        """Check if export has expired."""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False


class DataProcessingRecord(models.Model):
    """Records data processing activities for compliance."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_name = models.CharField(max_length=100)
    data_category = models.CharField(max_length=100)
    processing_purpose = models.TextField()
    legal_basis = models.CharField(max_length=100)
    data_subjects = models.CharField(max_length=200)
    retention_period = models.CharField(max_length=100)
    recipients = models.TextField(help_text="Who receives the data")
    transfers = models.TextField(blank=True, help_text="International data transfers")
    security_measures = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'data_processing_records'
        ordering = ['service_name']
    
    def __str__(self):
        return f"{self.service_name} - {self.data_category}"
