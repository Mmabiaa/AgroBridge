from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import UserProfile, UserActivity
from .serializers import UserProfileSerializer, UserProfileUpdateSerializer, UserActivitySerializer

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
                ip_address=get_client_ip(request)
            )
            
            # Return full profile data
            full_serializer = UserProfileSerializer(profile)
            return Response(full_serializer.data, status=status.HTTP_200_OK)
        
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
    from authentication.models import User
    user = get_object_or_404(User, id=user_id)
    
    # Only return public information
    public_data = {
        'id': user.id,
        'username': user.username,
        'role': user.role,
        'farm_experience': getattr(user.profile, 'farm_experience', 0),
        'specialization': getattr(user.profile, 'specialization', ''),
    }
    
    return Response(public_data, status=status.HTTP_200_OK)

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