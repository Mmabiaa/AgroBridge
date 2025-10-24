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


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            raise serializers.ValidationError('Must include "username" and "password".')
        
        # Allow login with email or username
        user = None
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username.lower())
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        else:
            user = authenticate(username=username, password=password)
        
        if user:
            # Check if account is locked
            if user.is_account_locked:
                raise serializers.ValidationError(
                    f'Account is locked until {user.account_locked_until}. '
                    'Please try again later or contact support.'
                )
            
            if user.is_active:
                # Reset failed login attempts on successful login
                user.reset_failed_login()
                data['user'] = user
            else:
                raise serializers.ValidationError('User account is disabled.')
        else:
            # Handle failed login attempt
            try:
                if '@' in username:
                    user_obj = User.objects.get(email=username.lower())
                else:
                    user_obj = User.objects.get(username=username)
                
                user_obj.increment_failed_login()
                
                if user_obj.is_account_locked:
                    raise serializers.ValidationError(
                        'Too many failed login attempts. Account has been locked temporarily.'
                    )
            except User.DoesNotExist:
                pass
            
            raise serializers.ValidationError('Invalid credentials.')
        
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile information"""
    full_name = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone', 'first_name', 'last_name',
            'full_name', 'role', 'is_verified', 'email_verified', 'phone_verified',
            'profile_completed', 'onboarding_completed', 'language', 'timezone',
            'last_login', 'date_joined', 'permissions'
        ]
        read_only_fields = [
            'id', 'date_joined', 'last_login', 'is_verified', 
            'email_verified', 'phone_verified', 'permissions'
        ]
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_permissions(self, obj):
        """Get user permissions based on role"""
        # This would be expanded based on your permission system
        role_permissions = {
            'farmer': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'use_crop_detection', 'use_voice_commands', 'view_marketplace',
                'place_orders', 'view_orders', 'view_learning', 'view_community'
            ],
            'buyer': [
                'view_dashboard', 'view_marketplace', 'place_orders', 'view_orders',
                'view_learning', 'view_community'
            ],
            'admin': ['*']  # All permissions
        }
        return role_permissions.get(obj.role, [])


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'language', 'timezone',
            'profile_completed', 'onboarding_completed'
        ]
    
    def validate_phone(self, value):
        """Validate phone number uniqueness"""
        if value and self.instance:
            if User.objects.filter(phone=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError("A user with this phone number already exists.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Password confirmation does not match.'
            })
        return data
    
    def save(self):
        """Change user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification"""
    token = serializers.CharField()
    
    def validate_token(self, value):
        """Validate verification token"""
        try:
            user = User.objects.get(
                email_verification_token=value,
                verification_token_expires__gt=timezone.now()
            )
            self.user = user
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired verification token.')
        return value
    
    def save(self):
        """Mark email as verified"""
        self.user.email_verified = True
        self.user.is_verified = True
        self.user.email_verification_token = None
        self.user.verification_token_expires = None
        self.user.save()
        return self.user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists"""
        try:
            user = User.objects.get(email=value.lower())
            self.user = user
        except User.DoesNotExist:
            # Don't reveal if email exists or not for security
            pass
        return value.lower()
    
    def save(self):
        """Generate and send password reset token"""
        if hasattr(self, 'user'):
            # Generate reset token
            reset_token = str(uuid.uuid4())
            self.user.password_reset_token = reset_token
            self.user.password_reset_expires = timezone.now() + timezone.timedelta(hours=1)
            self.user.save()
            
            # Send reset email
            self.send_reset_email(self.user)
    
    def send_reset_email(self, user):
        """Send password reset email"""
        subject = 'Reset your AgroBridge password'
        message = f'''
        You requested a password reset for your AgroBridge account.
        
        Click the link below to reset your password:
        {settings.FRONTEND_URL}/reset-password/{user.password_reset_token}
        
        This link will expire in 1 hour.
        
        If you didn't request this, please ignore this email.
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
            print(f"Failed to send reset email: {e}")


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset"""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_token(self, value):
        """Validate reset token"""
        try:
            user = User.objects.get(
                password_reset_token=value,
                password_reset_expires__gt=timezone.now()
            )
            self.user = user
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid or expired reset token.')
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Password confirmation does not match.'
            })
        return data
    
    def save(self):
        """Reset user password"""
        self.user.set_password(self.validated_data['new_password'])
        self.user.password_reset_token = None
        self.user.password_reset_expires = None
        self.user.save()
        return self.user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer to add additional claims
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        token['email_verified'] = user.email_verified
        token['profile_completed'] = user.profile_completed
        token['permissions'] = cls.get_user_permissions(user)
        
        return token
    
    @staticmethod
    def get_user_permissions(user):
        """Get user permissions based on role"""
        role_permissions = {
            'farmer': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'use_crop_detection', 'use_voice_commands', 'view_marketplace',
                'place_orders', 'view_orders', 'view_learning', 'view_community'
            ],
            'poultry_keeper': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'use_crop_detection', 'use_voice_commands', 'view_marketplace',
                'place_orders', 'view_orders', 'view_learning', 'view_community'
            ],
            'buyer': [
                'view_dashboard', 'view_marketplace', 'place_orders', 'view_orders',
                'view_learning', 'view_community'
            ],
            'ngo': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'view_marketplace', 'view_learning', 'view_community', 'moderate_community'
            ],
            'expert': [
                'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
                'view_marketplace', 'view_learning', 'view_community', 'moderate_community'
            ],
            'admin': ['*']  # All permissions
        }
        return role_permissions.get(user.role, [])