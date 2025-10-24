from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import uuid
import re
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'phone', 'password', 'password_confirm', 
            'role', 'first_name', 'last_name', 'language', 'timezone'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
            'email': {'required': True},
            'phone': {'required': False, 'allow_blank': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'role': {'required': False},
            'language': {'required': False},
            'timezone': {'required': False},
        }
    
    def validate_email(self, value):
        """Validate email uniqueness and format"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()
    
    def validate_username(self, value):
        """Validate username format and uniqueness"""
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_phone(self, value):
        """Validate phone number format"""
        if value and value.strip():  # Only validate if phone is provided and not empty
            # Basic phone number validation
            phone_pattern = r'^\+?[\d\s\-\(\)]{10,15}$'
            if not re.match(phone_pattern, value):
                raise serializers.ValidationError("Enter a valid phone number.")
            
            # Check uniqueness
            if User.objects.filter(phone=value).exists():
                raise serializers.ValidationError("A user with this phone number already exists.")
        return value if value and value.strip() else None
    
    def validate_password(self, value):
        """Validate password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create user with email verification token"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Set default values for optional fields
        validated_data.setdefault('role', 'farmer')
        validated_data.setdefault('language', 'en')
        validated_data.setdefault('timezone', 'UTC')
        
        # Clean up empty string values
        if not validated_data.get('phone'):
            validated_data.pop('phone', None)
        # Don't remove first_name and last_name as they are required by frontend
        # if not validated_data.get('first_name'):
        #     validated_data.pop('first_name', None)
        # if not validated_data.get('last_name'):
        #     validated_data.pop('last_name', None)
        
        # Generate email verification token
        email_verification_token = str(uuid.uuid4())
        validated_data['email_verification_token'] = email_verification_token
        validated_data['verification_token_expires'] = timezone.now() + timezone.timedelta(hours=24)
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Send verification email (in production, use a proper email service)
        self.send_verification_email(user)
        
        return user
    
    def send_verification_email(self, user):
        """Send email verification email"""
        # In production, use a proper email template and service
        subject = 'Verify your AgroBridge account'
        message = f'''
        Welcome to AgroBridge!
        
        Please verify your email address by clicking the link below:
        {settings.FRONTEND_URL}/verify-email/{user.email_verification_token}
        
        This link will expire in 24 hours.
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            # Log the error but don't fail registration
            print(f"Failed to send verification email: {e}")