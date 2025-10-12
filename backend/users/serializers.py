from rest_framework import serializers
from django.conf import settings
from .models import UserProfile, UserActivity

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'username', 'email', 'phone', 'role',
            'first_name', 'last_name', 'date_of_birth', 'profile_picture',
            'address', 'city', 'state', 'country', 'zip_code',
            'farm_experience', 'specialization', 'farm_size',
            'email_notifications', 'sms_notifications', 'newsletter_subscription',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'first_name', 'last_name', 'date_of_birth', 'profile_picture',
            'address', 'city', 'state', 'country', 'zip_code',
            'farm_experience', 'specialization', 'farm_size',
            'email_notifications', 'sms_notifications', 'newsletter_subscription'
        ]

class UserActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivity
        fields = ['activity_type', 'description', 'ip_address', 'created_at']
        read_only_fields = ['created_at']