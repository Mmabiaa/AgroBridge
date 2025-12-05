from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = [
        ('farmer', 'Farmer'),
        ('buyer', 'Buyer'),
        ('poultry_keeper', 'Poultry Keeper'),
        ('expert', 'Agricultural Expert'),
        ('ngo', 'NGO Representative'),
        ('admin', 'Administrator'),
    ]
    
    # Contact Information
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Role and Permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='farmer')
    
    # Verification Status
    is_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True, null=True)
    phone_verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_token_expires = models.DateTimeField(blank=True, null=True)
    
    # Security Fields
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(blank=True, null=True)
    password_reset_token = models.CharField(max_length=100, blank=True, null=True)
    password_reset_expires = models.DateTimeField(blank=True, null=True)
    
    # Profile Completion
    profile_completed = models.BooleanField(default=False)
    onboarding_completed = models.BooleanField(default=False)
    
    # Preferences
    language = models.CharField(max_length=10, default='en')
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['role']),
            models.Index(fields=['is_verified']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_account_locked(self):
        """Check if account is currently locked"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def lock_account(self, duration_minutes=30):
        """Lock account for specified duration"""
        self.account_locked_until = timezone.now() + timedelta(minutes=duration_minutes)
        self.save(update_fields=['account_locked_until'])
    
    def unlock_account(self):
        """Unlock account and reset failed attempts"""
        self.account_locked_until = None
        self.failed_login_attempts = 0
        self.save(update_fields=['account_locked_until', 'failed_login_attempts'])
    
    def increment_failed_login(self):
        """Increment failed login attempts and lock if threshold reached"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:  # Lock after 5 failed attempts
            self.lock_account()
        self.save(update_fields=['failed_login_attempts'])
    
    def reset_failed_login(self):
        """Reset failed login attempts on successful login"""
        if self.failed_login_attempts > 0:
            self.failed_login_attempts = 0
            self.save(update_fields=['failed_login_attempts'])
    
    def can_access_feature(self, feature):
        """Check if user can access a specific feature based on role"""
        role_permissions = {
            'farmer': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'use_crop_detection', 'use_voice_commands', 'view_marketplace',
                'place_orders', 'view_orders', 'view_learning', 'view_community',
                'use_satellite_integration', 'use_iot_sensors', 'use_drone_integration',
                'use_ar_visualization', 'view_financial_planning', 'create_plans',
                'view_smart_scheduling'
            ],
            'poultry_keeper': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'use_crop_detection', 'use_voice_commands', 'view_marketplace',
                'place_orders', 'view_orders', 'view_learning', 'view_community',
                'use_iot_sensors', 'view_financial_planning', 'create_plans',
                'view_smart_scheduling'
            ],
            'buyer': [
                'view_dashboard', 'view_marketplace', 'place_orders', 'view_orders',
                'view_learning', 'view_community', 'view_financial_planning', 'use_voice_commands'
            ],
            'ngo': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'view_marketplace', 'view_learning', 'view_community', 'moderate_community',
                'create_content', 'edit_content', 'use_satellite_integration',
                'use_iot_sensors', 'view_financial_planning', 'manage_content', 'use_voice_commands'
            ],
            'expert': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'view_marketplace', 'view_learning', 'view_community', 'moderate_community',
                'create_content', 'edit_content', 'view_financial_planning', 'use_voice_commands'
            ],
            'admin': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'use_crop_detection', 'use_voice_commands', 'view_marketplace',
                'create_product', 'edit_product', 'delete_product', 'view_orders',
                'view_learning', 'create_content', 'edit_content', 'delete_content',
                'view_community', 'moderate_community', 'use_satellite_integration',
                'use_iot_sensors', 'use_drone_integration', 'use_ar_visualization',
                'use_blockchain', 'view_financial_planning', 'create_plans',
                'view_smart_scheduling', 'manage_users', 'manage_system',
                'view_admin_dashboard', 'manage_content', 'view_logs'
            ]
        }
        
        return feature in role_permissions.get(self.role, [])