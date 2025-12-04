"""
Community Service Signals
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Post, Comment, Like, Follow, Message, ContentReport


@receiver(post_save, sender=Post)
def post_created(sender, instance, created, **kwargs):
    """Handle post creation."""
    if created:
        # Send notification to followers
        try:
            from notifications.services import NotificationService
            followers = Follow.objects.filter(following=instance.author).values_list('follower_id', flat=True)
            
            for follower_id in followers:
                NotificationService.create_notification(
                    user_id=follower_id,
                    notification_type='new_post',
                    title='New Post',
                    message=f'{instance.author.first_name or instance.author.email} shared a new post',
                    data={
                        'post_id': instance.id,
                        'author_id': instance.author.id
                    }
                )
        except Exception as e:
            print(f"Failed to send post notification: {e}")


@receiver(post_save, sender=Comment)
def comment_created(sender, instance, created, **kwargs):
    """Handle comment creation."""
    if created:
        # Notify post author
        if instance.author != instance.post.author:
            try:
                from notifications.services import NotificationService
                NotificationService.create_notification(
                    user_id=instance.post.author.id,
                    notification_type='new_comment',
                    title='New Comment',
                    message=f'{instance.author.first_name or instance.author.email} commented on your post',
                    data={
                        'post_id': instance.post.id,
                        'comment_id': instance.id,
                        'author_id': instance.author.id
                    }
                )
            except Exception as e:
                print(f"Failed to send comment notification: {e}")


@receiver(post_save, sender=Like)
def like_created(sender, instance, created, **kwargs):
    """Handle like creation."""
    if created:
        try:
            from notifications.services import NotificationService
            
            if instance.content_type == 'post':
                post = Post.objects.get(id=instance.object_id)
                if instance.user != post.author:
                    NotificationService.create_notification(
                        user_id=post.author.id,
                        notification_type='new_like',
                        title='New Like',
                        message=f'{instance.user.first_name or instance.user.email} liked your post',
                        data={
                            'post_id': post.id,
                            'user_id': instance.user.id
                        }
                    )
            elif instance.content_type == 'comment':
                comment = Comment.objects.get(id=instance.object_id)
                if instance.user != comment.author:
                    NotificationService.create_notification(
                        user_id=comment.author.id,
                        notification_type='new_like',
                        title='New Like',
                        message=f'{instance.user.first_name or instance.user.email} liked your comment',
                        data={
                            'comment_id': comment.id,
                            'post_id': comment.post.id,
                            'user_id': instance.user.id
                        }
                    )
        except Exception as e:
            print(f"Failed to send like notification: {e}")


@receiver(post_save, sender=Follow)
def follow_created(sender, instance, created, **kwargs):
    """Handle follow creation."""
    if created:
        try:
            from notifications.services import NotificationService
            NotificationService.create_notification(
                user_id=instance.following.id,
                notification_type='new_follower',
                title='New Follower',
                message=f'{instance.follower.first_name or instance.follower.email} started following you',
                data={
                    'follower_id': instance.follower.id
                }
            )
        except Exception as e:
            print(f"Failed to send follow notification: {e}")


@receiver(post_save, sender=Message)
def message_created(sender, instance, created, **kwargs):
    """Handle message creation."""
    if created:
        try:
            from notifications.services import NotificationService
            # Notify all participants except sender
            participants = instance.conversation.participants.exclude(id=instance.sender.id)
            
            for participant in participants:
                NotificationService.create_notification(
                    user_id=participant.id,
                    notification_type='new_message',
                    title='New Message',
                    message=f'{instance.sender.first_name or instance.sender.email} sent you a message',
                    data={
                        'conversation_id': instance.conversation.id,
                        'message_id': instance.id,
                        'sender_id': instance.sender.id
                    },
                    priority='high'
                )
        except Exception as e:
            print(f"Failed to send message notification: {e}")


@receiver(post_save, sender=ContentReport)
def content_report_created(sender, instance, created, **kwargs):
    """Handle content report creation."""
    if created:
        try:
            from notifications.services import NotificationService
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            # Notify all staff members
            staff_users = User.objects.filter(is_staff=True)
            for staff_user in staff_users:
                NotificationService.create_notification(
                    user_id=staff_user.id,
                    notification_type='content_report',
                    title='New Content Report',
                    message=f'New {instance.content_type} report: {instance.reason}',
                    data={
                        'report_id': instance.id,
                        'content_type': instance.content_type,
                        'object_id': instance.object_id,
                        'reason': instance.reason
                    },
                    priority='high'
                )
        except Exception as e:
            print(f"Failed to send report notification: {e}")
