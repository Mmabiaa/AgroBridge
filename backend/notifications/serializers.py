"""
Notification Service Serializers

This module defines the API serializers for the notification service.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Notification,
    NotificationDelivery,
    UserNotificationPreferences,
    NotificationTemplate,
    NotificationType,
    NotificationPriority,
    DeliveryChannel
)

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_email', 'title', 'message',
            'notification_type', 'priority', 'data', 'action_url',
            'channels', 'scheduled_at', 'expires_at', 'is_read',
            'read_at', 'created_at', 'updated_at', 'is_expired'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'read_at']
    
    def validate_channels(self, value):
        """Validate delivery channels"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Channels must be a list")
        
        valid_channels = [choice[0] for choice in DeliveryChannel.choices]
        for channel in value:
            if channel not in valid_channels:
                raise serializers.ValidationError(f"Invalid channel: {channel}")
        
        return value
    
    def validate_priority(self, value):
        """Validate priority range"""
        if not (1 <= value <= 10):
            raise serializers.ValidationError("Priority must be between 1 and 10")
        return value


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        help_text="List of user IDs to send notification to"
    )
    user_emails = serializers.ListField(
        child=serializers.EmailField(),
        write_only=True,
        required=False,
        help_text="List of user emails to send notification to"
    )
    template_name = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Template name to use for notification"
    )
    template_context = serializers.JSONField(
        write_only=True,
        required=False,
        default=dict,
        help_text="Context variables for template rendering"
    )
    
    class Meta:
        model = Notification
        fields = [
            'title', 'message', 'notification_type', 'priority',
            'data', 'action_url', 'channels', 'scheduled_at',
            'expires_at', 'user_ids', 'user_emails', 'template_name',
            'template_context'
        ]
    
    def validate(self, attrs):
        """Validate notification creation data"""
        # Must specify either user_ids, user_emails, or individual user
        has_users = any([
            attrs.get('user_ids'),
            attrs.get('user_emails'),
            attrs.get('user')
        ])
        
        if not has_users:
            raise serializers.ValidationError(
                "Must specify user_ids, user_emails, or user"
            )
        
        # If using template, template_name is required
        if attrs.get('template_context') and not attrs.get('template_name'):
            raise serializers.ValidationError(
                "template_name is required when using template_context"
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create notification(s) for specified users"""
        from .services import NotificationService
        
        # Extract user targeting data
        user_ids = validated_data.pop('user_ids', [])
        user_emails = validated_data.pop('user_emails', [])
        template_name = validated_data.pop('template_name', None)
        template_context = validated_data.pop('template_context', {})
        
        # Get target users
        users = []
        
        if user_ids:
            users.extend(User.objects.filter(id__in=user_ids))
        
        if user_emails:
            users.extend(User.objects.filter(email__in=user_emails))
        
        if validated_data.get('user'):
            users.append(validated_data.pop('user'))
        
        # Remove duplicates
        users = list(set(users))
        
        if not users:
            raise serializers.ValidationError("No valid users found")
        
        # Create notifications
        service = NotificationService()
        notifications = []
        
        for user in users:
            notification_data = validated_data.copy()
            notification_data['user'] = user
            
            if template_name:
                notification = service.create_from_template(
                    template_name=template_name,
                    user=user,
                    context=template_context,
                    **notification_data
                )
            else:
                notification = service.create_notification(**notification_data)
            
            notifications.append(notification)
        
        # Return first notification for single user, or list for multiple
        return notifications[0] if len(notifications) == 1 else notifications


class NotificationDeliverySerializer(serializers.ModelSerializer):
    """Serializer for NotificationDelivery model"""
    
    notification_title = serializers.CharField(source='notification.title', read_only=True)
    
    class Meta:
        model = NotificationDelivery
        fields = [
            'id', 'notification', 'notification_title', 'channel',
            'status', 'external_id', 'error_message', 'retry_count',
            'sent_at', 'delivered_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserNotificationPreferencesSerializer(serializers.ModelSerializer):
    """Serializer for UserNotificationPreferences model"""
    
    class Meta:
        model = UserNotificationPreferences
        fields = [
            'user', 'enable_websocket', 'enable_push', 'enable_email',
            'enable_sms', 'notification_types', 'dnd_enabled',
            'dnd_start_time', 'dnd_end_time', 'fcm_tokens',
            'phone_number', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def validate_notification_types(self, value):
        """Validate notification type preferences"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("notification_types must be a dictionary")
        
        valid_types = [choice[0] for choice in NotificationType.choices]
        
        for notification_type, prefs in value.items():
            if notification_type not in valid_types:
                raise serializers.ValidationError(f"Invalid notification type: {notification_type}")
            
            if not isinstance(prefs, dict):
                raise serializers.ValidationError(f"Preferences for {notification_type} must be a dictionary")
        
        return value
    
    def validate_fcm_tokens(self, value):
        """Validate FCM tokens"""
        if not isinstance(value, list):
            raise serializers.ValidationError("fcm_tokens must be a list")
        
        for token in value:
            if not isinstance(token, str) or len(token) < 10:
                raise serializers.ValidationError("Invalid FCM token format")
        
        return value


class NotificationTemplateSerializer(serializers.ModelSerializer):
    """Serializer for NotificationTemplate model"""
    
    class Meta:
        model = NotificationTemplate
        fields = [
            'id', 'name', 'notification_type', 'title_template',
            'message_template', 'email_subject_template',
            'email_body_template', 'sms_template', 'default_channels',
            'default_priority', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate template name uniqueness"""
        if self.instance:
            # Update case - exclude current instance
            if NotificationTemplate.objects.exclude(id=self.instance.id).filter(name=value).exists():
                raise serializers.ValidationError("Template with this name already exists")
        else:
            # Create case
            if NotificationTemplate.objects.filter(name=value).exists():
                raise serializers.ValidationError("Template with this name already exists")
        
        return value


class NotificationStatsSerializer(serializers.Serializer):
    """Serializer for notification statistics"""
    
    total_notifications = serializers.IntegerField()
    unread_notifications = serializers.IntegerField()
    notifications_by_type = serializers.DictField()
    notifications_by_priority = serializers.DictField()
    delivery_stats = serializers.DictField()
    recent_notifications = NotificationSerializer(many=True)


class BulkNotificationSerializer(serializers.Serializer):
    """Serializer for bulk notification operations"""
    
    notification_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of notification IDs"
    )
    action = serializers.ChoiceField(
        choices=['mark_read', 'mark_unread', 'delete'],
        help_text="Action to perform on notifications"
    )
    
    def validate_notification_ids(self, value):
        """Validate notification IDs exist"""
        if not value:
            raise serializers.ValidationError("notification_ids cannot be empty")
        
        existing_count = Notification.objects.filter(id__in=value).count()
        if existing_count != len(value):
            raise serializers.ValidationError("Some notification IDs do not exist")
        
        return value


class FCMTokenSerializer(serializers.Serializer):
    """Serializer for FCM token registration"""
    
    token = serializers.CharField(
        min_length=10,
        help_text="Firebase Cloud Messaging token"
    )
    device_type = serializers.ChoiceField(
        choices=['android', 'ios', 'web'],
        help_text="Type of device"
    )
    device_id = serializers.CharField(
        required=False,
        help_text="Unique device identifier"
    )