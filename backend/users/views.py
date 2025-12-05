from rest_framework import status, generics, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
import json
import os
from django.conf import settings
from .models import UserProfile, UserActivity, UserPreferences, DataExportRequest, DataDeletionRequest
from .serializers import (
    UserProfileSerializer, UserProfileUpdateSerializer, UserActivitySerializer,
    UserPreferencesSerializer, PublicUserProfileSerializer, UserSearchSerializer,
    DataExportRequestSerializer, DataDeletionRequestSerializer
)

User = get_user_model()

class UserSearchPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get or update current user's profile
    """
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = UserProfileUpdateSerializer(
            profile, 
            data=request.data, 
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Log profile update activity
            UserActivity.objects.create(
                user=request.user,
                activity_type='profile_update',
                description='User updated their profile',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            # Return full profile data
            full_serializer = UserProfileSerializer(profile)
            return Response(full_serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_preferences(request):
    """
    Get or update current user's preferences
    """
    # Get or create user preferences
    preferences, created = UserPreferences.objects.get_or_create(user=request.user)
    
    if request.method == 'GET':
        serializer = UserPreferencesSerializer(preferences)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'PUT':
        serializer = UserPreferencesSerializer(
            preferences,
            data=request.data,
            partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            
            # Log preferences update activity
            UserActivity.objects.create(
                user=request.user,
                activity_type='preferences_update',
                description='User updated their preferences',
                ip_address=get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activities(request):
    """
    Get current user's activity history
    """
    activities = UserActivity.objects.filter(user=request.user)[:50]  # Last 50 activities
    serializer = UserActivitySerializer(activities, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def public_profile(request, user_id):
    """
    Get public profile information for a user
    """
    user = get_object_or_404(User, id=user_id)
    
    try:
        profile = user.profile
        
        # Check privacy settings
        if profile.profile_visibility == 'private':
            return Response(
                {'error': 'This profile is private'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # For friends-only profiles, you might want to check friendship status
        # For now, we'll treat it as public
        
        serializer = PublicUserProfileSerializer(profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except UserProfile.DoesNotExist:
        # Return basic user info if no profile exists
        public_data = {
            'id': user.id,
            'username': user.username,
            'role': user.role,
        }
        return Response(public_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """
    Search and discover users with filtering and pagination
    """
    queryset = UserProfile.objects.select_related('user').filter(
        profile_visibility='public'
    )
    
    # Search by name or username
    search_query = request.GET.get('search', '')
    if search_query:
        queryset = queryset.filter(
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query) |
            Q(user__username__icontains=search_query) |
            Q(specialization__icontains=search_query)
        )
    
    # Filter by location
    city = request.GET.get('city', '')
    if city:
        queryset = queryset.filter(city__icontains=city)
    
    state = request.GET.get('state', '')
    if state:
        queryset = queryset.filter(state__icontains=state)
    
    country = request.GET.get('country', '')
    if country:
        queryset = queryset.filter(country__icontains=country)
    
    # Filter by role
    role = request.GET.get('role', '')
    if role:
        queryset = queryset.filter(user__role=role)
    
    # Filter by specialization
    specialization = request.GET.get('specialization', '')
    if specialization:
        queryset = queryset.filter(specialization__icontains=specialization)
    
    # Filter by experience range
    min_experience = request.GET.get('min_experience', '')
    if min_experience:
        try:
            queryset = queryset.filter(farm_experience__gte=int(min_experience))
        except ValueError:
            pass
    
    max_experience = request.GET.get('max_experience', '')
    if max_experience:
        try:
            queryset = queryset.filter(farm_experience__lte=int(max_experience))
        except ValueError:
            pass
    
    # Ordering
    ordering = request.GET.get('ordering', '-created_at')
    valid_orderings = ['created_at', '-created_at', 'farm_experience', '-farm_experience', 'first_name', '-first_name']
    if ordering in valid_orderings:
        queryset = queryset.order_by(ordering)
    
    # Pagination
    paginator = UserSearchPagination()
    page = paginator.paginate_queryset(queryset, request)
    
    if page is not None:
        serializer = UserSearchSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    serializer = UserSearchSerializer(queryset, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_data_export(request):
    """
    Request data export for GDPR compliance
    """
    export_type = request.data.get('export_type', 'full')
    
    if export_type not in ['full', 'profile', 'activity']:
        return Response(
            {'error': 'Invalid export type'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if there's already a pending request
    existing_request = DataExportRequest.objects.filter(
        user=request.user,
        status__in=['pending', 'processing']
    ).first()
    
    if existing_request:
        return Response(
            {'error': 'You already have a pending export request'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create new export request
    export_request = DataExportRequest.objects.create(
        user=request.user,
        export_type=export_type
    )
    
    # Log the request
    UserActivity.objects.create(
        user=request.user,
        activity_type='data_export_request',
        description=f'User requested {export_type} data export',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    # In a real implementation, you would queue this for background processing
    # For now, we'll just return the request details
    
    serializer = DataExportRequestSerializer(export_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_requests(request):
    """
    Get user's data export requests
    """
    requests = DataExportRequest.objects.filter(user=request.user).order_by('-requested_at')
    serializer = DataExportRequestSerializer(requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_data_deletion(request):
    """
    Request data deletion for GDPR compliance
    """
    # Check if there's already a pending request
    existing_request = DataDeletionRequest.objects.filter(
        user=request.user,
        status__in=['pending', 'approved', 'processing']
    ).first()
    
    if existing_request:
        return Response(
            {'error': 'You already have a pending deletion request'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = DataDeletionRequestSerializer(data=request.data)
    
    if serializer.is_valid():
        deletion_request = serializer.save(user=request.user)
        
        # Log the request
        UserActivity.objects.create(
            user=request.user,
            activity_type='data_deletion_request',
            description='User requested data deletion',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def deletion_requests(request):
    """
    Get user's data deletion requests
    """
    requests = DataDeletionRequest.objects.filter(user=request.user).order_by('-requested_at')
    serializer = DataDeletionRequestSerializer(requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """
    Upload user avatar/profile picture
    """
    if 'avatar' not in request.FILES:
        return Response(
            {'error': 'No avatar file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    avatar_file = request.FILES['avatar']
    
    # Validate file size (max 5MB)
    if avatar_file.size > 5 * 1024 * 1024:
        return Response(
            {'error': 'File size too large. Maximum size is 5MB'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if avatar_file.content_type not in allowed_types:
        return Response(
            {'error': 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Delete old avatar if exists
    if profile.profile_picture:
        try:
            os.remove(profile.profile_picture.path)
        except (OSError, ValueError):
            pass  # File doesn't exist or path is invalid
    
    # Save new avatar
    profile.profile_picture = avatar_file
    profile.save()
    
    # Log avatar upload activity
    UserActivity.objects.create(
        user=request.user,
        activity_type='avatar_upload',
        description='User uploaded new avatar',
        ip_address=get_client_ip(request),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )
    
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for service monitoring
    """
    from django.db import connection
    from django.core.cache import cache
    
    health_status = {
        'service': 'user-service',
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'checks': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = 'healthy'
    except Exception as e:
        health_status['checks']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Cache check
    try:
        cache.set('health_check', 'test', 30)
        cache.get('health_check')
        health_status['checks']['cache'] = 'healthy'
    except Exception as e:
        health_status['checks']['cache'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'
    
    # Model checks
    try:
        UserProfile.objects.count()
        health_status['checks']['models'] = 'healthy'
    except Exception as e:
        health_status['checks']['models'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    status_code = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(health_status, status=status_code)

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