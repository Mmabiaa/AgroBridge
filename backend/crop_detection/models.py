"""
Crop detection models for image analysis and disease identification
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid
import json

User = get_user_model()


class Disease(models.Model):
    """
    Disease information database
    """
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    CATEGORY_CHOICES = [
        ('fungal', 'Fungal Disease'),
        ('bacterial', 'Bacterial Disease'),
        ('viral', 'Viral Disease'),
        ('pest', 'Pest Damage'),
        ('nutrient', 'Nutrient Deficiency'),
        ('environmental', 'Environmental Stress'),
        ('genetic', 'Genetic Disorder'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic information
    name = models.CharField(max_length=200)
    scientific_name = models.CharField(max_length=200, blank=True)
    common_names = models.JSONField(default=list, help_text="List of common names")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    
    # Description and symptoms
    description = models.TextField()
    symptoms = models.TextField(help_text="Detailed symptoms description")
    visual_indicators = models.JSONField(default=list, help_text="List of visual indicators")
    
    # Affected crops
    affected_crops = models.JSONField(default=list, help_text="List of crops this disease affects")
    
    # Severity and spread
    typical_severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    spread_rate = models.CharField(max_length=50, blank=True, help_text="How quickly it spreads")
    seasonal_pattern = models.CharField(max_length=100, blank=True)
    
    # Environmental factors
    favorable_conditions = models.JSONField(
        default=dict, 
        help_text="Environmental conditions that favor this disease"
    )
    
    # Prevention and management
    prevention_methods = models.TextField(blank=True)
    organic_treatments = models.TextField(blank=True)
    chemical_treatments = models.TextField(blank=True)
    
    # Images and references
    reference_images = models.JSONField(default=list, help_text="URLs to reference images")
    external_links = models.JSONField(default=list, help_text="External reference links")
    
    # Metadata
    confidence_threshold = models.FloatField(
        default=0.7,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Minimum confidence score for AI detection"
    )
    
    # Status and versioning
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_diseases'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['typical_severity']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.category})"
    
    @property
    def is_severe(self):
        """Check if disease is considered severe"""
        return self.typical_severity in ['high', 'critical']


class Treatment(models.Model):
    """
    Treatment recommendations for diseases
    """
    TREATMENT_TYPE_CHOICES = [
        ('preventive', 'Preventive'),
        ('curative', 'Curative'),
        ('supportive', 'Supportive'),
        ('emergency', 'Emergency'),
    ]
    
    METHOD_CHOICES = [
        ('organic', 'Organic'),
        ('chemical', 'Chemical'),
        ('biological', 'Biological'),
        ('cultural', 'Cultural Practice'),
        ('mechanical', 'Mechanical'),
        ('integrated', 'Integrated Approach'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Associated disease
    disease = models.ForeignKey(Disease, on_delete=models.CASCADE, related_name='treatments')
    
    # Treatment details
    name = models.CharField(max_length=200)
    treatment_type = models.CharField(max_length=20, choices=TREATMENT_TYPE_CHOICES)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    
    # Instructions
    description = models.TextField()
    detailed_instructions = models.TextField()
    application_method = models.TextField(blank=True)
    
    # Timing and frequency
    timing = models.CharField(max_length=200, help_text="When to apply treatment")
    frequency = models.CharField(max_length=100, help_text="How often to apply")
    duration = models.CharField(max_length=100, help_text="Treatment duration")
    
    # Materials and dosage
    materials_needed = models.JSONField(default=list, help_text="List of materials/chemicals needed")
    dosage_instructions = models.TextField(blank=True)
    
    # Effectiveness and safety
    effectiveness_rating = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)],
        help_text="Effectiveness rating (0-5)"
    )
    safety_precautions = models.TextField(blank=True)
    environmental_impact = models.TextField(blank=True)
    
    # Cost and availability
    estimated_cost = models.CharField(max_length=100, blank=True)
    availability = models.CharField(max_length=100, blank=True)
    
    # Conditions and limitations
    suitable_crops = models.JSONField(default=list, help_text="Crops this treatment is suitable for")
    weather_conditions = models.CharField(max_length=200, blank=True)
    growth_stage = models.CharField(max_length=100, blank=True)
    
    # Success metrics
    expected_results = models.TextField(blank=True)
    success_indicators = models.JSONField(default=list)
    
    # Status
    is_recommended = models.BooleanField(default=True)
    requires_expert = models.BooleanField(default=False, help_text="Requires expert consultation")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-effectiveness_rating', 'name']
        indexes = [
            models.Index(fields=['disease']),
            models.Index(fields=['treatment_type']),
            models.Index(fields=['method']),
            models.Index(fields=['effectiveness_rating']),
        ]
    
    def __str__(self):
        return f"{self.name} for {self.disease.name}"
    
    @property
    def is_organic(self):
        """Check if treatment is organic"""
        return self.method == 'organic'
    
    @property
    def is_highly_effective(self):
        """Check if treatment is highly effective"""
        return self.effectiveness_rating >= 4.0


class CropScan(models.Model):
    """
    Individual crop scan results from image analysis
    """
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('pending_review', 'Pending Review'),
    ]
    
    CROP_TYPE_CHOICES = [
        ('tomato', 'Tomato'),
        ('potato', 'Potato'),
        ('corn', 'Corn'),
        ('wheat', 'Wheat'),
        ('rice', 'Rice'),
        ('soybean', 'Soybean'),
        ('pepper', 'Pepper'),
        ('cucumber', 'Cucumber'),
        ('lettuce', 'Lettuce'),
        ('carrot', 'Carrot'),
        ('onion', 'Onion'),
        ('cabbage', 'Cabbage'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='crop_scans')
    
    # Image information
    image = models.ImageField(upload_to='crop_scans/')
    image_metadata = models.JSONField(
        default=dict, 
        help_text="Image metadata like size, format, GPS coordinates"
    )
    
    # Crop information
    crop_type = models.CharField(max_length=20, choices=CROP_TYPE_CHOICES, blank=True)
    crop_variety = models.CharField(max_length=100, blank=True)
    growth_stage = models.CharField(max_length=50, blank=True)
    
    # Location and context
    location_data = models.JSONField(
        default=dict, 
        help_text="GPS coordinates, farm location, field information"
    )
    environmental_conditions = models.JSONField(
        default=dict,
        help_text="Weather, soil conditions, etc. at time of scan"
    )
    
    # Analysis results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    
    # AI detection results
    detected_diseases = models.JSONField(
        default=list,
        help_text="List of detected diseases with confidence scores"
    )
    health_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        help_text="Overall plant health score (0-100)"
    )
    
    # Analysis metadata
    model_version = models.CharField(max_length=50, blank=True)
    processing_time_ms = models.IntegerField(default=0)
    confidence_scores = models.JSONField(
        default=dict,
        help_text="Confidence scores for different aspects of analysis"
    )
    
    # Recommendations
    recommended_treatments = models.ManyToManyField(
        Treatment,
        blank=True,
        related_name='recommended_scans'
    )
    ai_recommendations = models.JSONField(
        default=list,
        help_text="AI-generated recommendations"
    )
    
    # User feedback
    user_confirmed_disease = models.ForeignKey(
        Disease,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_confirmed_scans',
        help_text="Disease confirmed by user"
    )
    user_feedback = models.TextField(blank=True)
    accuracy_rating = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="User rating of scan accuracy (1-5)"
    )
    
    # Follow-up
    follow_up_scans = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        related_name='original_scan'
    )
    treatment_applied = models.JSONField(
        default=list,
        help_text="Treatments applied by user"
    )
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['crop_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['health_score']),
        ]
    
    def __str__(self):
        return f"Scan {self.id} - {self.crop_type} by {self.user.username}"
    
    @property
    def is_healthy(self):
        """Check if crop appears healthy"""
        return self.health_score and self.health_score >= 80
    
    @property
    def needs_attention(self):
        """Check if crop needs immediate attention"""
        return self.health_score and self.health_score < 50
    
    @property
    def has_diseases(self):
        """Check if any diseases were detected"""
        return len(self.detected_diseases) > 0
    
    def mark_completed(self):
        """Mark scan as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
    
    def mark_failed(self, error_message):
        """Mark scan as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'error_message', 'completed_at'])
    
    def add_disease_detection(self, disease_id, confidence_score, affected_area=None):
        """Add a disease detection result"""
        detection = {
            'disease_id': str(disease_id),
            'confidence_score': confidence_score,
            'affected_area': affected_area,
            'detected_at': timezone.now().isoformat()
        }
        
        if not isinstance(self.detected_diseases, list):
            self.detected_diseases = []
        
        self.detected_diseases.append(detection)
        self.save(update_fields=['detected_diseases'])
    
    def get_primary_disease(self):
        """Get the disease with highest confidence score"""
        if not self.detected_diseases:
            return None
        
        primary = max(self.detected_diseases, key=lambda x: x.get('confidence_score', 0))
        try:
            return Disease.objects.get(id=primary['disease_id'])
        except Disease.DoesNotExist:
            return None


class ScanHistory(models.Model):
    """
    User's scan history and analytics
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='scan_history')
    
    # Statistics
    total_scans = models.IntegerField(default=0)
    successful_scans = models.IntegerField(default=0)
    failed_scans = models.IntegerField(default=0)
    
    # Disease detection stats
    diseases_detected = models.JSONField(
        default=dict,
        help_text="Count of each disease detected"
    )
    most_common_disease = models.ForeignKey(
        Disease,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='most_common_for_users'
    )
    
    # Crop type stats
    crops_scanned = models.JSONField(
        default=dict,
        help_text="Count of each crop type scanned"
    )
    
    # Accuracy and feedback
    average_accuracy_rating = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)]
    )
    total_feedback_count = models.IntegerField(default=0)
    
    # Health trends
    average_health_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    health_trend = models.CharField(
        max_length=20,
        choices=[
            ('improving', 'Improving'),
            ('stable', 'Stable'),
            ('declining', 'Declining'),
            ('unknown', 'Unknown'),
        ],
        default='unknown'
    )
    
    # Timestamps
    first_scan_date = models.DateTimeField(null=True, blank=True)
    last_scan_date = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Scan histories"
    
    def __str__(self):
        return f"Scan history for {self.user.username}"
    
    def update_stats(self):
        """Update statistics based on user's scans"""
        scans = CropScan.objects.filter(user=self.user)
        
        self.total_scans = scans.count()
        self.successful_scans = scans.filter(status='completed').count()
        self.failed_scans = scans.filter(status='failed').count()
        
        # Update dates
        if scans.exists():
            self.first_scan_date = scans.order_by('created_at').first().created_at
            self.last_scan_date = scans.order_by('-created_at').first().created_at
        
        # Calculate average health score
        health_scores = scans.filter(
            health_score__isnull=False
        ).values_list('health_score', flat=True)
        
        if health_scores:
            self.average_health_score = sum(health_scores) / len(health_scores)
        
        # Calculate average accuracy rating
        ratings = scans.filter(
            accuracy_rating__isnull=False
        ).values_list('accuracy_rating', flat=True)
        
        if ratings:
            self.average_accuracy_rating = sum(ratings) / len(ratings)
            self.total_feedback_count = len(ratings)
        
        self.save()
    
    @classmethod
    def get_or_create_for_user(cls, user):
        """Get or create scan history for user"""
        history, created = cls.objects.get_or_create(user=user)
        if created or history.total_scans == 0:
            history.update_stats()
        return history


class ExpertReview(models.Model):
    """
    Expert review of scan results for quality assurance
    """
    REVIEW_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('needs_revision', 'Needs Revision'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Associated scan
    scan = models.OneToOneField(CropScan, on_delete=models.CASCADE, related_name='expert_review')
    
    # Reviewer information
    reviewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='expert_reviews',
        limit_choices_to={'role__in': ['expert', 'admin']}
    )
    
    # Review details
    status = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default='pending')
    
    # Expert findings
    expert_diagnosis = models.ForeignKey(
        Disease,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expert_diagnoses'
    )
    confidence_in_ai = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Expert confidence in AI diagnosis (1-5)"
    )
    
    # Comments and feedback
    review_comments = models.TextField()
    recommendations = models.TextField(blank=True)
    
    # Corrections
    corrected_health_score = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    
    # Learning feedback
    ai_accuracy_assessment = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor'),
        ],
        blank=True
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['reviewer']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Expert review of scan {self.scan.id} by {self.reviewer.username}"