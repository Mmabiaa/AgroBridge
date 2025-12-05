"""
Analytics Service Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class DashboardMetric(models.Model):
    """
    Store calculated dashboard metrics for caching
    """
    METRIC_TYPES = [
        ('farm_performance', 'Farm Performance'),
        ('marketplace_stats', 'Marketplace Statistics'),
        ('user_activity', 'User Activity'),
        ('financial_summary', 'Financial Summary'),
        ('system_health', 'System Health'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='metrics')
    
    # Metric data stored as JSON
    data = models.JSONField(default=dict)
    
    # Time period for the metric
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Metadata
    calculated_at = models.DateTimeField(auto_now=True)
    is_cached = models.BooleanField(default=True)
    cache_expires_at = models.DateTimeField()
    
    class Meta:
        ordering = ['-calculated_at']
        indexes = [
            models.Index(fields=['metric_type', 'user']),
            models.Index(fields=['calculated_at']),
            models.Index(fields=['cache_expires_at']),
        ]
    
    def __str__(self):
        user_str = f" for {self.user.username}" if self.user else ""
        return f"{self.get_metric_type_display()}{user_str}"
    
    @property
    def is_expired(self):
        """Check if cached metric has expired"""
        return timezone.now() > self.cache_expires_at


class PredictionModel(models.Model):
    """
    Track ML prediction models and their performance
    """
    MODEL_TYPES = [
        ('yield_prediction', 'Yield Prediction'),
        ('weather_forecast', 'Weather Forecast'),
        ('price_prediction', 'Price Prediction'),
        ('disease_detection', 'Disease Detection'),
        ('demand_forecast', 'Demand Forecast'),
    ]
    
    STATUS_CHOICES = [
        ('training', 'Training'),
        ('active', 'Active'),
        ('testing', 'Testing'),
        ('deprecated', 'Deprecated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    model_type = models.CharField(max_length=50, choices=MODEL_TYPES)
    version = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='training')
    
    # Model metadata
    description = models.TextField(blank=True)
    algorithm = models.CharField(max_length=100, blank=True)
    hyperparameters = models.JSONField(default=dict)
    
    # Performance metrics
    accuracy = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    precision = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    recall = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    f1_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    mae = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)  # Mean Absolute Error
    rmse = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)  # Root Mean Square Error
    
    # Training data
    training_data_size = models.IntegerField(default=0)
    training_started_at = models.DateTimeField(null=True, blank=True)
    training_completed_at = models.DateTimeField(null=True, blank=True)
    
    # Deployment
    deployed_at = models.DateTimeField(null=True, blank=True)
    deprecated_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['model_type', 'version']
        indexes = [
            models.Index(fields=['model_type', 'status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} v{self.version} ({self.get_status_display()})"


class Prediction(models.Model):
    """
    Store predictions made by ML models
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    model = models.ForeignKey(PredictionModel, on_delete=models.CASCADE, related_name='predictions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='predictions')
    
    # Input data
    input_data = models.JSONField(default=dict)
    
    # Prediction results
    prediction_value = models.JSONField(default=dict)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=4, null=True, blank=True)
    
    # Actual outcome (for model evaluation)
    actual_value = models.JSONField(default=dict, null=True, blank=True)
    is_accurate = models.BooleanField(null=True, blank=True)
    
    # Metadata
    predicted_at = models.DateTimeField(auto_now_add=True)
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-predicted_at']
        indexes = [
            models.Index(fields=['model', 'user']),
            models.Index(fields=['predicted_at']),
        ]
    
    def __str__(self):
        return f"Prediction by {self.model.name} at {self.predicted_at}"


class Report(models.Model):
    """
    Generated reports for users
    """
    REPORT_TYPES = [
        ('farm_performance', 'Farm Performance Report'),
        ('financial_summary', 'Financial Summary'),
        ('crop_analysis', 'Crop Analysis'),
        ('marketplace_insights', 'Marketplace Insights'),
        ('custom', 'Custom Report'),
    ]
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports')
    
    # Report details
    report_type = models.CharField(max_length=50, choices=REPORT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Report parameters
    parameters = models.JSONField(default=dict)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Output
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='pdf')
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.IntegerField(default=0)  # in bytes
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    generated_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['report_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"


class Insight(models.Model):
    """
    Actionable insights generated from analytics
    """
    INSIGHT_TYPES = [
        ('recommendation', 'Recommendation'),
        ('warning', 'Warning'),
        ('opportunity', 'Opportunity'),
        ('alert', 'Alert'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='insights')
    
    # Insight details
    insight_type = models.CharField(max_length=50, choices=INSIGHT_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Action items
    recommended_actions = models.JSONField(default=list)
    
    # Context
    context_data = models.JSONField(default=dict)
    source_metric = models.CharField(max_length=100, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    is_acted_upon = models.BooleanField(default=False)
    dismissed_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['priority']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"
