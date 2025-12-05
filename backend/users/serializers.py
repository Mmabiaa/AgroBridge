from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import UserProfile, UserActivity, UserPreferences, DataExportRequest, DataDeletionRequest

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    full_name = serializers.CharField(read_only=True)
    location_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'phone', 'role', 'full_name', 'location_display',
            'first_name', 'last_name', 'date_of_birth', 'profile_picture', 'bio',
            'address', 'city', 'state', 'country', 'zip_code', 'latitude', 'longitude',
            'farm_experience', 'specialization', 'farm_size',
            'website', 'social_media_links',
            'profile_visibility', 'show_location', 'show_contact_info',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name', 'location_display']

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'profile_picture', 'bio',
            'address', 'city', 'state', 'country', 'zip_code', 'latitude', 'longitude',
            'farm_experience', 'specialization', 'farm_size',
            'website', 'social_media_links',
            'profile_visibility', 'show_location', 'show_contact_info'
        ]
    
    def validate_social_media_links(self, value):
        """Validate social media links format"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Social media links must be a dictionary")
        
        allowed_platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok']
        for platform, url in value.items():
            if platform not in allowed_platforms:
                raise serializers.ValidationError(f"Platform '{platform}' is not supported")
            if url and not url.startswith(('http://', 'https://')):
                raise serializers.ValidationError(f"Invalid URL for {platform}")
        
        return value

class UserPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreferences
        fields = [
            'email_notifications', 'sms_notifications', 'push_notifications', 'newsletter_subscription',
            'marketplace_notifications', 'order_notifications', 'farm_alerts', 'weather_alerts',
            'price_alerts', 'community_notifications',
            'language', 'timezone', 'currency',
            'data_sharing_consent', 'marketing_consent', 'analytics_consent',
            'dnd_enabled', 'dnd_start_time', 'dnd_end_time',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ['activity_type', 'description', 'ip_address', 'created_at']
        read_only_fields = ['created_at']

class PublicUserProfileSerializer(serializers.ModelSerializer):
    """Serializer for public profile information"""
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    full_name = serializers.CharField(read_only=True)
    location_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'role', 'full_name', 'profile_picture', 'bio',
            'specialization', 'farm_experience', 'location_display',
            'website', 'social_media_links'
        ]
    
    def to_representation(self, instance):
        """Filter fields based on privacy settings"""
        data = super().to_representation(instance)
        
        # Remove sensitive information based on privacy settings
        if not instance.show_location:
            data.pop('location_display', None)
        
        if not instance.show_contact_info:
            data.pop('website', None)
            data.pop('social_media_links', None)
        
        return data

class UserSearchSerializer(serializers.ModelSerializer):
    """Serializer for user search results"""
    username = serializers.CharField(source='user.username', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    full_name = serializers.CharField(read_only=True)
    location_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'role', 'full_name', 'profile_picture',
            'specialization', 'farm_experience', 'location_display'
        ]

class DataExportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataExportRequest
        fields = [
            'id', 'export_type', 'status', 'download_url', 'expires_at',
            'requested_at', 'completed_at'
        ]
        read_only_fields = ['id', 'status', 'download_url', 'expires_at', 'requested_at', 'completed_at']

class DataDeletionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataDeletionRequest
        fields = [
            'id', 'reason', 'delete_profile', 'delete_activity', 'delete_content',
            'anonymize_data', 'status', 'admin_notes', 'requested_at', 'processed_at'
        ]
        read_only_fields = ['id', 'status', 'admin_notes', 'requested_at', 'processed_at']