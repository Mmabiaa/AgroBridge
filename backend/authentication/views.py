from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.contrib.auth import login, update_session_auth_hash
from django.utils import timezone
from django.core.exceptions import ValidationError
import logging

from .models import User
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserSerializer,
    UserUpdateSerializer, PasswordChangeSerializer, EmailVerificationSerializer,
    PasswordResetRequestSerializer, PasswordResetSerializer
)
try:
    from .throttles import (
        LoginRateThrottle, RegistrationRateThrottle, PasswordResetRateThrottle,
        EmailVerificationRateThrottle, UserActionRateThrottle, SecurityEventTracker
    )
except ImportError:
    # Fallback to basic throttles if custom ones are not available
    from rest_framework.throttling import AnonRateThrottle as RegistrationRateThrottle
    from rest_framework.throttling import AnonRateThrottle as LoginRateThrottle
    from rest_framework.throttling import AnonRateThrottle as PasswordResetRateThrottle
    from rest_framework.throttling import AnonRateThrottle as EmailVerificationRateThrottle
    from rest_framework.throttling import UserRateThrottle as UserActionRateThrottle
    
    class SecurityEventTracker:
        @staticmethod
        def track_failed_login(request, username):
            pass

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
# @throttle_classes([RegistrationRateThrottle])  # Temporarily disabled for debugging
def register_user(request):
    """
    Register a new user account with email verification
    """
    try:
        # Log incoming registration data (without sensitive info)
        logger.info(f"Registration attempt for user: {request.data.get('username', 'unknown')}, email: {request.data.get('email', 'unknown')}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Log successful registration
            logger.info(f"New user registered: {user.username} ({user.email})")
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Serialize user data
            user_serializer = UserSerializer(user)
            
            return Response({
                'message': 'User registered successfully. Please check your email to verify your account.',
                'user': user_serializer.data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        else:
            # Log validation errors for debugging
            logger.warning(f"Registration validation failed for {request.data.get('username', 'unknown')}: {serializer.errors}")
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Registration failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_user(request):
    """
    Authenticate user and return JWT tokens
    """
    try:
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Update last login IP and activity
            user.last_login_ip = get_client_ip(request)
            user.last_activity = timezone.now()
            user.save(update_fields=['last_login_ip', 'last_activity'])
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Serialize user data
            user_serializer = UserSerializer(user)
            
            # Log successful login
            logger.info(f"User logged in: {user.username} from {user.last_login_ip}")
            
            return Response({
                'message': 'Login successful',
                'user': user_serializer.data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Login failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """
    Refresh expired JWT token
    """
    try:
        refresh_token = request.data.get('refresh')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken(refresh_token)
        
        return Response({
            'access': str(refresh.access_token)
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.warning(f"Token refresh failed: {str(e)}")
        return Response({
            'error': 'Invalid or expired refresh token'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """
    Logout user and blacklist refresh token
    """
    try:
        refresh_token = request.data.get('refresh')
        user = request.user
        
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"Refresh token blacklisted for user: {user.username}")
            except Exception as e:
                logger.warning(f"Token blacklist failed: {str(e)}")
        
        # Optional: Broadcast logout to WebSocket (if you have channel layers)
        # await broadcast_logout(user.id)
        
        # Log logout
        logger.info(f"User logged out: {user.username}")
        
        return Response({
            'message': 'Logout successful',
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Logout error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Logout failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user profile
    """
    try:
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Failed to retrieve user information'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request):
    """
    Update current user profile
    """
    try:
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=request.method == 'PATCH'
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Log profile update
            logger.info(f"User profile updated: {user.username}")
            
            # Return updated user data
            user_serializer = UserSerializer(user)
            return Response(user_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Profile update error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Profile update failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user password
    """
    try:
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Update session auth hash to prevent logout
            update_session_auth_hash(request, user)
            
            # Log password change
            logger.info(f"Password changed for user: {user.username}")
            
            return Response({
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Password change failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request):
    """
    Verify user email address
    """
    try:
        serializer = EmailVerificationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Log email verification
            logger.info(f"Email verified for user: {user.username}")
            
            return Response({
                'message': 'Email verified successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Email verification error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Email verification failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    """Request password reset"""
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Always return the same response regardless of whether user exists
        # This prevents email enumeration attacks
        return Response({
            'message': 'If an account with this email exists, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset password with token
    """
    try:
        print(f"Reset password request data: {request.data}")  # Debugging
        
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Log password reset
            logger.info(f"Password reset for user: {user.username}")
            
            return Response({
                'message': 'Password reset successfully'
            }, status=status.HTTP_200_OK)
        
        print(f"Serializer errors: {serializer.errors}")  # Debugging
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Password reset error: {str(e)}", exc_info=True)
        return Response({
            'error': 'Password reset failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def get_client_ip(request):
    """
    Get client IP address from request
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip