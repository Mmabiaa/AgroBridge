from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.utils import timezone
import uuid
from .models import User
from django.conf import settings
from django.core.mail import send_mail




class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 
            'role', 'first_name', 'last_name', 'phone'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirm': {'write_only': True},
            'email': {'required': True},
            'phone': {'required': False, 'allow_blank': True},
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
            'role': {'required': False},
        }
    
    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value
    
    def validate_email(self, value):
        """Check if email already exists"""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()
    
    def validate(self, data):
        """Cross-field validation"""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })
        return data
    
    def create(self, validated_data):
        """Create user"""
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        
        # Set defaults
        validated_data.setdefault('role', 'farmer')
        validated_data.setdefault('first_name', '')
        validated_data.setdefault('last_name', '')
        
        # Clean up empty values
        if not validated_data.get('phone'):
            validated_data.pop('phone', None)
        
        # Create user
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


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
                # Use filter().first() instead of get() to handle duplicates
                user_obj = User.objects.filter(email=username.lower()).first()
                if user_obj:
                    user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        else:
            user = authenticate(username=username, password=password)
        
        if user and user.is_active:
            data['user'] = user
        else:
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
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_permissions(self, obj):
        """Get user permissions based on role"""
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
            'admin': ['*']
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


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for changing password"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
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
            pass
        return value.lower()
    
    def save(self):
        """Generate and send password reset token"""
        if hasattr(self, 'user'):
            reset_token = str(uuid.uuid4())
            self.user.password_reset_token = reset_token
            self.user.password_reset_expires = timezone.now() + timezone.timedelta(hours=1)
            self.user.save()
            
            # Try to send email, but don't crash if it fails
            email_sent = self.send_reset_email()
            
            if not email_sent:
                # Log this for debugging, but don't stop the process
                print(f"⚠️  Password reset token generated but email failed: {reset_token}")
                # You could also log this to a file or monitoring service
            
            return self.user
    
    def send_reset_email(self):
        """Send password reset email to user"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{self.user.password_reset_token}"
    
    subject = 'Reset Your AgroBridge Password'
    
    # Plain text version
    message = f"""Dear {self.user.first_name or 'User'},

You have requested to reset your password for your AgroBridge account. 
Click the link below to create a new password:

{reset_url}

This password reset link will expire in 1 hour.

If you did not request this password reset, please ignore this email. 
Your account remains secure.

Best regards,
The AgroBridge Team
"""
    
    # HTML version (for better email clients)
    html_message = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }}
        .button {{
            display: inline-block;
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
        }}
        .footer {{
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h2>Password Reset Request</h2>
        <p>Dear {self.user.first_name or 'User'},</p>
        <p>You have requested to reset your password for your AgroBridge account.</p>
        <p>Click the button below to create a new password:</p>
        <p style="text-align: center;">
            <a href="{reset_url}" class="button">Reset Password</a>
        </p>
        <p>Or copy and paste this link in your browser:<br>
        <code>{reset_url}</code></p>
        <p><strong>Note:</strong> This password reset link will expire in 1 hour.</p>
        <p>If you did not request this password reset, please ignore this email. Your account remains secure.</p>
        <div class="footer">
            <p>Best regards,<br>The AgroBridge Team</p>
        </div>
    </div>
</body>
</html>
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[self.user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"✅ Password reset email sent to: {self.user.email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {self.user.email}: {e}")
        # Don't raise the exception - return False instead
        # This prevents the 500 error but still logs the issue
        return False


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset"""
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=6)  # Changed from new_password
    password_confirm = serializers.CharField(write_only=True)  # Changed from new_password_confirm
    
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
    
    def validate(self, data):
        """Cross-field validation"""
        if data['password'] != data['password_confirm']:  # Updated field names
            raise serializers.ValidationError({
                'password_confirm': 'Password confirmation does not match.'
            })
        return data
    
    def save(self):
        """Reset user password"""
        self.user.set_password(self.validated_data['password'])  # Updated field name
        self.user.password_reset_token = None
        self.user.password_reset_expires = None
        self.user.save()
        return self.user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer to add additional claims"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['is_verified'] = user.is_verified
        token['email_verified'] = user.email_verified
        token['profile_completed'] = user.profile_completed
        return token