"""
Notification Service Models

This module defines the data models for the notification service,
including notifications, user preferences, and delivery tracking.
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()


class NotificationType(models.TextChoices):
    """Types of notifications"""
    SYSTEM = 'system', 'System'
    ALERT = 'alert', 'Alert'
    REMINDER = 'reminder', 'Reminder'
    SOCIAL = 'social', 'Social'
    MARKETING = 'marketing', 'Marketing'
    EMERGENCY = 'emergency', 'Emergency'
    IOT_ALERT = 'iot_alert', 'IoT Alert'
    CROP_DISEASE = 'crop_disease', 'Crop Disease'
    WEATHER = 'weather', 'Weather'
    MARKETPLACE = 'marketplace', 'Marketplace'
    PAYMENT = 'payment', 'Payment'
    LEARNING = 'learning', 'Learning'
    COMMUNITY = 'community', 'Community'


class NotificationPriority(models.IntegerChoices):
    """Notification priority levels"""
    LOW = 1, 'Low'
    NORMAL = 5, 'Normal'
    HIGH = 8, 'High'
    CRITICAL = 10, 'Critical'


class DeliveryChannel(models.TextChoices):
    """Notification delivery channels"""
    WEBSOCKET = 'websocket', 'WebSocket'
    PUSH = 'push', 'Push Notification'
    EMAIL = 'email', 'Email'
    SMS = 'sms', 'SMS'
    IN_APP = 'in_app', 'In-App'


class DeliveryStatus(models.TextChoices):
    """Delivery status options"""
    PENDING = 'pending', 'Pending'
    SENT = 'sent', 'Sent'
    DELIVERED = 'delivered', 'Delivered'
    FAILED = 'failed', 'Failed'
    READ = 'read', 'Read'


class Notification(models.Model):
    """
    Core notification model
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Recipients
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        help_text='Target user for this notification'
    )
    
    # Content
    title = models.CharField(
        max_length=200,
        help_text='Notification title'
    )
    message = models.TextField(
        help_text='Notification message content'
    )
    
    # Classification
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
        help_text='Type of notification'
    )
    priority = models.IntegerField(
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text='Notification priority (1-10)'
    )
    
    # Metadata
    data = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional notification data'
    )
    action_url = models.URLField(
        blank=True,
        null=True,
        help_text='URL to navigate to when notification is clicked'
    )
    
    # Delivery settings
    channels = models.JSONField(
        default=list,
        help_text='List of delivery channels to use'
    )
    
    # Scheduling
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When to send the notification (null for immediate)'
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the notification expires'
    )
    
    # Status tracking
    is_read = models.BooleanField(
        default=False,
        help_text='Whether the user has read this notification'
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the notification was read'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
            models.Index(fields=['is_read', '-created_at']),
            models.Index(fields=['scheduled_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
    
    def is_expired(self):
        """Check if notification has expired"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False
    
    def should_send_now(self):
        """Check if notification should be sent now"""
        if self.scheduled_at:
            return timezone.now() >= self.scheduled_at
        return True


class NotificationDelivery(models.Model):
    """
    Tracks delivery attempts for each notification channel
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='deliveries'
    )
    
    channel = models.CharField(
        max_length=20,
        choices=DeliveryChannel.choices,
        help_text='Delivery channel used'
    )
    
    status = models.CharField(
        max_length=20,
        choices=DeliveryStatus.choices,
        default=DeliveryStatus.PENDING,
        help_text='Delivery status'
    )
    
    # Delivery details
    external_id = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text='External service message ID'
    )
    
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text='Error message if delivery failed'
    )
    
    retry_count = models.IntegerField(
        default=0,
        help_text='Number of retry attempts'
    )
    
    # Timestamps
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the message was sent'
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the message was delivered'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_deliveries'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['notification', 'channel']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['channel', 'status']),
        ]
        unique_together = ['notification', 'channel']
    
    def __str__(self):
        return f"{self.notification.title} - {self.channel} - {self.status}"


class UserNotificationPreferences(models.Model):
    """
    User preferences for notification delivery
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Channel preferences
    enable_websocket = models.BooleanField(
        default=True,
        help_text='Enable real-time WebSocket notifications'
    )
    enable_push = models.BooleanField(
        default=True,
        help_text='Enable push notifications'
    )
    enable_email = models.BooleanField(
        default=True,
        help_text='Enable email notifications'
    )
    enable_sms = models.BooleanField(
        default=False,
        help_text='Enable SMS notifications'
    )
    
    # Type preferences
    notification_types = models.JSONField(
        default=dict,
        help_text='Preferences for each notification type'
    )
    
    # Do not disturb settings
    dnd_enabled = models.BooleanField(
        default=False,
        help_text='Enable do not disturb mode'
    )
    dnd_start_time = models.TimeField(
        null=True,
        blank=True,
        help_text='Do not disturb start time'
    )
    dnd_end_time = models.TimeField(
        null=True,
        blank=True,
        help_text='Do not disturb end time'
    )
    
    # Device tokens for push notifications
    fcm_tokens = models.JSONField(
        default=list,
        blank=True,
        help_text='Firebase Cloud Messaging tokens'
    )
    
    # Contact information
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Phone number for SMS notifications'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_notification_preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"
    
    def is_dnd_active(self):
        """Check if do not disturb is currently active"""
        if not self.dnd_enabled or not self.dnd_start_time or not self.dnd_end_time:
            return False
        
        now = timezone.now().time()
        
        # Handle overnight DND (e.g., 22:00 to 06:00)
        if self.dnd_start_time > self.dnd_end_time:
            return now >= self.dnd_start_time or now <= self.dnd_end_time
        else:
            return self.dnd_start_time <= now <= self.dnd_end_time
    
    def should_receive_notification(self, notification_type: str, channel: str) -> bool:
        """
        Check if user should receive a notification of given type via given channel
        """
        # Check if channel is enabled
        channel_enabled = getattr(self, f'enable_{channel}', False)
        if not channel_enabled:
            return False
        
        # Check type preferences
        type_prefs = self.notification_types.get(notification_type, {})
        if not type_prefs.get('enabled', True):
            return False
        
        # Check channel-specific type preferences
        channel_pref = type_prefs.get('channels', {}).get(channel, True)
        if not channel_pref:
            return False
        
        # Check do not disturb (except for critical notifications)
        if notification_type != NotificationType.EMERGENCY and self.is_dnd_active():
            return False
        
        return True


class NotificationTemplate(models.Model):
    """
    Templates for different types of notifications
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Template name'
    )
    
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        help_text='Type of notification this template is for'
    )
    
    # Template content
    title_template = models.CharField(
        max_length=200,
        help_text='Title template with placeholders'
    )
    message_template = models.TextField(
        help_text='Message template with placeholders'
    )
    
    # Channel-specific templates
    email_subject_template = models.CharField(
        max_length=200,
        blank=True,
        help_text='Email subject template'
    )
    email_body_template = models.TextField(
        blank=True,
        help_text='Email body template (HTML)'
    )
    sms_template = models.CharField(
        max_length=160,
        blank=True,
        help_text='SMS template (160 chars max)'
    )
    
    # Settings
    default_channels = models.JSONField(
        default=list,
        help_text='Default channels for this template'
    )
    default_priority = models.IntegerField(
        choices=NotificationPriority.choices,
        default=NotificationPriority.NORMAL,
        help_text='Default priority for this template'
    )
    
    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this template is active'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def render(self, context: dict) -> dict:
        """
        Render template with given context
        
        Args:
            context: Dictionary of variables to substitute
            
        Returns:
            Dictionary with rendered content
        """
        from django.template import Template, Context
        
        # Render title and message
        title = Template(self.title_template).render(Context(context))
        message = Template(self.message_template).render(Context(context))
        
        result = {
            'title': title,
            'message': message,
        }
        
        # Render channel-specific content
        if self.email_subject_template:
            result['email_subject'] = Template(self.email_subject_template).render(Context(context))
        
        if self.email_body_template:
            result['email_body'] = Template(self.email_body_template).render(Context(context))
        
        if self.sms_template:
            result['sms_message'] = Template(self.sms_template).render(Context(context))
        
        return result