from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import AuditLog, UserActivity, PlatformMetrics
from django.utils import timezone

User = get_user_model()


@receiver(post_save, sender=User)
def log_user_changes(sender, instance, created, **kwargs):
    """Log user creation and updates"""
    if created:
        AuditLog.objects.create(
            user=instance,
            action_type='create',
            description=f'New user registered: {instance.username}',
            metadata={
                'user_id': instance.id,
                'email': instance.email
            }
        )
        
        # Track user activity
        UserActivity.objects.create(
            user=instance,
            activity_type='registration',
            details={'email': instance.email}
        )
        
        # Update platform metrics
        total_users = User.objects.count()
        PlatformMetrics.objects.create(
            metric_name='total_users',
            metric_value=total_users,
            metric_unit='count',
            category='users'
        )


@receiver(pre_delete, sender=User)
def log_user_deletion(sender, instance, **kwargs):
    """Log user deletion"""
    AuditLog.objects.create(
        user=None,
        action_type='delete',
        description=f'User deleted: {instance.username}',
        metadata={
            'user_id': instance.id,
            'email': instance.email
        }
    )
