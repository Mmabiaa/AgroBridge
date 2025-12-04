from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='profile'
    )
    
    # Personal Information
    first_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to='profile_pictures/', 
        null=True, 
        blank=True
    )
    bio = models.TextField(max_length=500, blank=True, help_text="Short bio about the user")
    
    # Location Information
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip_code = models.CharField(max_length=20, blank=True)
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)]
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)]
    )
    
    # Agricultural Specific Fields
    farm_experience = models.IntegerField(default=0)  # Years of experience
    specialization = models.CharField(max_length=200, blank=True)
    farm_size = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Farm size in hectares"
    )
    
    # Social Information
    website = models.URLField(blank=True)
    social_media_links = models.JSONField(default=dict, blank=True)
    
    # Privacy Settings
    profile_visibility = models.CharField(
        max_length=20,
        choices=[
            ('public', 'Public'),
            ('friends', 'Friends Only'),
            ('private', 'Private')
        ],
        default='public'
    )
    show_location = models.BooleanField(default=True)
    show_contact_info = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['city', 'state', 'country']),
            models.Index(fields=['specialization']),
            models.Index(fields=['farm_experience']),
        ]
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def location_display(self):
        """Return formatted location string"""
        parts = [self.city, self.state, self.country]
        return ", ".join([part for part in parts if part])


class UserPreferences(models.Model):
    """User notification and display preferences"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    
    # Notification Preferences
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    newsletter_subscription = models.BooleanField(default=True)
    
    # Specific Notification Types
    marketplace_notifications = models.BooleanField(default=True)
    order_notifications = models.BooleanField(default=True)
    farm_alerts = models.BooleanField(default=True)
    weather_alerts = models.BooleanField(default=True)
    price_alerts = models.BooleanField(default=True)
    community_notifications = models.BooleanField(default=True)
    
    # Display Preferences
    language = models.CharField(
        max_length=10,
        choices=[
            ('en', 'English'),
            ('tw', 'Twi'),
            ('ha', 'Hausa'),
            ('fr', 'French'),
        ],
        default='en'
    )
    timezone = models.CharField(max_length=50, default='UTC')
    currency = models.CharField(
        max_length=3,
        choices=[
            ('USD', 'US Dollar'),
            ('GHS', 'Ghana Cedi'),
            ('NGN', 'Nigerian Naira'),
            ('EUR', 'Euro'),
        ],
        default='USD'
    )
    
    # Privacy Preferences
    data_sharing_consent = models.BooleanField(default=False)
    marketing_consent = models.BooleanField(default=False)
    analytics_consent = models.BooleanField(default=True)
    
    # Do Not Disturb Settings
    dnd_enabled = models.BooleanField(default=False)
    dnd_start_time = models.TimeField(null=True, blank=True)
    dnd_end_time = models.TimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Preferences"


class DataExportRequest(models.Model):
    """GDPR compliance - data export requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='export_requests'
    )
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    export_type = models.CharField(
        max_length=20,
        choices=[
            ('full', 'Full Data Export'),
            ('profile', 'Profile Data Only'),
            ('activity', 'Activity Data Only'),
        ],
        default='full'
    )
    
    file_path = models.CharField(max_length=500, blank=True)
    download_url = models.URLField(blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Export request {self.id} for {self.user.username}"


class DataDeletionRequest(models.Model):
    """GDPR compliance - data deletion requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='deletion_requests'
    )
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reason = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    # Deletion options
    delete_profile = models.BooleanField(default=True)
    delete_activity = models.BooleanField(default=True)
    delete_content = models.BooleanField(default=True)
    anonymize_data = models.BooleanField(default=False)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
    
    def __str__(self):
        return f"Deletion request {self.id} for {self.user.username}"

class UserActivity(models.Model):
    ACTIVITY_TYPES = [
        ('login', 'User Login'),
        ('logout', 'User Logout'),
        ('profile_update', 'Profile Update'),
        ('preferences_update', 'Preferences Update'),
        ('password_change', 'Password Change'),
        ('avatar_upload', 'Avatar Upload'),
        ('product_view', 'Product View'),
        ('search', 'Search Activity'),
        ('data_export_request', 'Data Export Request'),
        ('data_deletion_request', 'Data Deletion Request'),
        ('profile_view', 'Profile View'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='activities'
    )
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "User Activities"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.activity_type} - {self.created_at}"