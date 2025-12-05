"""Database models for emergency response service."""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField

User = get_user_model()


class EmergencyAlert(models.Model):
    """Emergency alerts for farmers and agricultural communities."""
    
    ALERT_TYPES = [
        ('WEATHER', 'Weather Alert'),
        ('PEST', 'Pest Outbreak'),
        ('DISEASE', 'Disease Outbreak'),
        ('FLOOD', 'Flood Warning'),
        ('DROUGHT', 'Drought Warning'),
        ('FIRE', 'Fire Alert'),
        ('SECURITY', 'Security Threat'),
        ('MARKET', 'Market Disruption'),
        ('OTHER', 'Other Emergency'),
    ]
    
    SEVERITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('RESOLVED', 'Resolved'),
        ('EXPIRED', 'Expired'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert_number = models.CharField(max_length=50, unique=True)
    
    # Alert details
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_LEVELS)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Geographic targeting
    country = models.CharField(max_length=3, default='GHA')
    regions = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    districts = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    coordinates = models.JSONField(null=True, blank=True, help_text="GeoJSON polygon for affected area")
    
    # Guidelines and actions
    response_guidelines = models.TextField(help_text="What people should do")
    emergency_contacts = models.JSONField(default=dict, help_text="Emergency contact information")
    resources = models.JSONField(default=list, blank=True, help_text="Available resources and support")
    
    # Status and timing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    issued_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_alerts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Broadcasting tracking
    broadcast_count = models.IntegerField(default=0)
    view_count = models.IntegerField(default=0)
    acknowledgment_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'emergency_alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['alert_type', 'severity']),
            models.Index(fields=['status', 'issued_at']),
            models.Index(fields=['country']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.alert_number} - {self.title}"


class IncidentReport(models.Model):
    """User-reported incidents and emergencies."""
    
    INCIDENT_TYPES = [
        ('WEATHER', 'Weather Event'),
        ('PEST', 'Pest Infestation'),
        ('DISEASE', 'Disease Outbreak'),
        ('FLOOD', 'Flooding'),
        ('DROUGHT', 'Drought'),
        ('FIRE', 'Fire'),
        ('THEFT', 'Theft/Security'),
        ('ACCIDENT', 'Accident'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('VERIFIED', 'Verified'),
        ('INVESTIGATING', 'Under Investigation'),
        ('RESOLVED', 'Resolved'),
        ('REJECTED', 'Rejected'),
        ('DUPLICATE', 'Duplicate'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report_number = models.CharField(max_length=50, unique=True)
    
    # Reporter information
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='incident_reports')
    reporter_contact = models.CharField(max_length=20, blank=True)
    
    # Incident details
    incident_type = models.CharField(max_length=20, choices=INCIDENT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    severity_assessment = models.CharField(max_length=20, choices=EmergencyAlert.SEVERITY_LEVELS, blank=True)
    
    # Location
    location_description = models.CharField(max_length=200)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    region = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    
    # Evidence
    photos = ArrayField(models.URLField(), default=list, blank=True)
    additional_data = models.JSONField(default=dict, blank=True)
    
    # Status and response
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_incidents')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Related alert
    related_alert = models.ForeignKey(EmergencyAlert, on_delete=models.SET_NULL, null=True, blank=True, related_name='related_reports')
    
    # Response tracking
    response_notes = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    reported_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'incident_reports'
        ordering = ['-reported_at']
        indexes = [
            models.Index(fields=['incident_type', 'status']),
            models.Index(fields=['reporter', 'reported_at']),
            models.Index(fields=['region', 'district']),
            models.Index(fields=['status', 'reported_at']),
        ]
    
    def __str__(self):
        return f"{self.report_number} - {self.title}"


class AlertAcknowledgment(models.Model):
    """Track user acknowledgments of emergency alerts."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert = models.ForeignKey(EmergencyAlert, on_delete=models.CASCADE, related_name='acknowledgments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='alert_acknowledgments')
    
    acknowledged_at = models.DateTimeField(auto_now_add=True)
    location = models.JSONField(null=True, blank=True, help_text="User location when acknowledged")
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'alert_acknowledgments'
        unique_together = ['alert', 'user']
        ordering = ['-acknowledged_at']
        indexes = [
            models.Index(fields=['alert', 'acknowledged_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} acknowledged {self.alert.alert_number}"


class EmergencyGuideline(models.Model):
    """Emergency response guidelines and procedures."""
    
    GUIDELINE_TYPES = [
        ('WEATHER', 'Weather Emergency'),
        ('PEST', 'Pest Management'),
        ('DISEASE', 'Disease Control'),
        ('FLOOD', 'Flood Response'),
        ('DROUGHT', 'Drought Management'),
        ('FIRE', 'Fire Safety'),
        ('SECURITY', 'Security Protocol'),
        ('GENERAL', 'General Emergency'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guideline_type = models.CharField(max_length=20, choices=GUIDELINE_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Guidelines content
    immediate_actions = models.JSONField(help_text="List of immediate actions to take")
    safety_measures = models.JSONField(help_text="Safety precautions")
    resources_needed = models.JSONField(default=list, blank=True)
    
    # Contact information
    emergency_contacts = models.JSONField(default=dict)
    support_services = models.JSONField(default=list, blank=True)
    
    # Geographic relevance
    applicable_regions = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    
    # Metadata
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'emergency_guidelines'
        ordering = ['guideline_type', 'title']
        indexes = [
            models.Index(fields=['guideline_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_guideline_type_display()} - {self.title}"


class IncidentAnalytics(models.Model):
    """Analytics and patterns for incident response."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Time period
    period_start = models.DateField()
    period_end = models.DateField()
    region = models.CharField(max_length=100, blank=True)
    
    # Incident statistics
    total_incidents = models.IntegerField(default=0)
    incidents_by_type = models.JSONField(default=dict)
    incidents_by_severity = models.JSONField(default=dict)
    
    # Alert statistics
    total_alerts = models.IntegerField(default=0)
    alerts_by_type = models.JSONField(default=dict)
    average_response_time = models.DurationField(null=True, blank=True)
    
    # Effectiveness metrics
    verification_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    resolution_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    acknowledgment_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Patterns and insights
    common_patterns = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    # Metadata
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'incident_analytics'
        ordering = ['-period_end']
        unique_together = ['period_start', 'period_end', 'region']
        indexes = [
            models.Index(fields=['period_start', 'period_end']),
            models.Index(fields=['region']),
        ]
    
    def __str__(self):
        return f"Analytics: {self.period_start} to {self.period_end}"
