"""
Signal handlers for the users app
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out
from .models import UserProfile, UserPreferences, UserActivity

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_profile_and_preferences(sender, instance, created, **kwargs):
    """
    Automatically create UserProfile and UserPreferences when a new user is created
    """
    if created:
        # Create user profile
        UserProfile.objects.get_or_create(user=instance)
        
        # Create user preferences with default values
        UserPreferences.objects.get_or_create(user=instance)
        
        # Log user creation activity
        UserActivity.objects.create(
            user=instance,
            activity_type='profile_created',
            description='User profile and preferences created automatically',
            ip_address='system'
        )

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """
    Log user login activity
    """
    ip_address = get_client_ip_from_request(request)
    user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
    
    UserActivity.objects.create(
        user=user,
        activity_type='login',
        description='User logged in',
        ip_address=ip_address,
        user_agent=user_agent
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """
    Log user logout activity
    """
    if user and user.is_authenticated:
        ip_address = get_client_ip_from_request(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '') if request else ''
        
        UserActivity.objects.create(
            user=user,
            activity_type='logout',
            description='User logged out',
            ip_address=ip_address,
            user_agent=user_agent
        )

@receiver(post_delete, sender=UserProfile)
def log_profile_deletion(sender, instance, **kwargs):
    """
    Log when a user profile is deleted
    """
    try:
        UserActivity.objects.create(
            user=instance.user,
            activity_type='profile_deleted',
            description='User profile was deleted',
            ip_address='system'
        )
    except Exception:
        # User might be deleted already, ignore
        pass

def get_client_ip_from_request(request):
    """
    Helper function to get client IP from request
    """
    if not request:
        return 'unknown'
    
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')
    return ip