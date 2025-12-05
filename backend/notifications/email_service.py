"""
Email Notification Service

This module handles email notification delivery using Django's email backend
and Celery for asynchronous processing.
"""

import logging
from typing import Dict, Any, Optional, List
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags
from .models import Notification

logger = logging.getLogger(__name__)

# Email configuration
DEFAULT_FROM_EMAIL = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@agrobridge.com')
EMAIL_BACKEND = getattr(settings, 'EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')


def send_email_notification(notification: Notification) -> bool:
    """
    Send email notification
    
    Args:
        notification: Notification to send via email
        
    Returns:
        True if sent successfully
    """
    try:
        user = notification.user
        
        # Get email subject and body
        subject = _get_email_subject(notification)
        html_body = _get_email_body(notification)
        text_body = strip_tags(html_body)
        
        # Create email message
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        
        # Attach HTML version
        email.attach_alternative(html_body, "text/html")
        
        # Send email
        email.send()
        
        logger.info(f"Email notification {notification.id} sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email notification {notification.id}: {e}")
        return False


def send_bulk_email(
    subject: str,
    message: str,
    recipient_list: List[str],
    html_message: Optional[str] = None,
    from_email: Optional[str] = None
) -> bool:
    """
    Send bulk email to multiple recipients
    
    Args:
        subject: Email subject
        message: Email message (text)
        recipient_list: List of recipient email addresses
        html_message: HTML version of message
        from_email: Sender email address
        
    Returns:
        True if sent successfully
    """
    try:
        if not from_email:
            from_email = DEFAULT_FROM_EMAIL
        
        if html_message:
            # Send HTML email
            for recipient in recipient_list:
                email = EmailMultiAlternatives(
                    subject=subject,
                    body=message,
                    from_email=from_email,
                    to=[recipient],
                )
                email.attach_alternative(html_message, "text/html")
                email.send()
        else:
            # Send plain text email
            send_mail(
                subject=subject,
                message=message,
                from_email=from_email,
                recipient_list=recipient_list,
                fail_silently=False,
            )
        
        logger.info(f"Bulk email sent to {len(recipient_list)} recipients")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send bulk email: {e}")
        return False


def _get_email_subject(notification: Notification) -> str:
    """
    Generate email subject for notification
    
    Args:
        notification: Notification instance
        
    Returns:
        Email subject string
    """
    # Check if notification has template-rendered subject
    if hasattr(notification, '_email_subject'):
        return notification._email_subject
    
    # Generate subject based on notification type
    type_prefixes = {
        'system': '[AgroBridge]',
        'alert': '[Alert]',
        'reminder': '[Reminder]',
        'emergency': '[URGENT]',
        'iot_alert': '[IoT Alert]',
        'crop_disease': '[Crop Alert]',
        'weather': '[Weather]',
        'marketplace': '[Marketplace]',
        'payment': '[Payment]',
        'learning': '[Learning]',
        'community': '[Community]',
        'social': '[Social]',
        'marketing': '[AgroBridge]',
    }
    
    prefix = type_prefixes.get(notification.notification_type, '[AgroBridge]')
    return f"{prefix} {notification.title}"


def _get_email_body(notification: Notification) -> str:
    """
    Generate email body for notification
    
    Args:
        notification: Notification instance
        
    Returns:
        HTML email body
    """
    # Check if notification has template-rendered body
    if hasattr(notification, '_email_body'):
        return notification._email_body
    
    # Use default email template
    context = {
        'notification': notification,
        'user': notification.user,
        'title': notification.title,
        'message': notification.message,
        'action_url': notification.action_url,
        'data': notification.data,
        'site_name': 'AgroBridge',
        'site_url': getattr(settings, 'SITE_URL', 'https://agrobridge.com'),
    }
    
    try:
        # Try to render specific template for notification type
        template_name = f'notifications/email/{notification.notification_type}.html'
        return render_to_string(template_name, context)
    except:
        # Fall back to default template
        return render_to_string('notifications/email/default.html', context)


def send_welcome_email(user) -> bool:
    """
    Send welcome email to new user
    
    Args:
        user: User instance
        
    Returns:
        True if sent successfully
    """
    try:
        subject = "Welcome to AgroBridge!"
        
        context = {
            'user': user,
            'site_name': 'AgroBridge',
            'site_url': getattr(settings, 'SITE_URL', 'https://agrobridge.com'),
        }
        
        html_message = render_to_string('notifications/email/welcome.html', context)
        text_message = strip_tags(html_message)
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        logger.info(f"Welcome email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {user.email}: {e}")
        return False


def send_password_reset_email(user, reset_token: str) -> bool:
    """
    Send password reset email
    
    Args:
        user: User instance
        reset_token: Password reset token
        
    Returns:
        True if sent successfully
    """
    try:
        subject = "Reset Your AgroBridge Password"
        
        context = {
            'user': user,
            'reset_token': reset_token,
            'reset_url': f"{getattr(settings, 'SITE_URL', 'https://agrobridge.com')}/reset-password/{reset_token}",
            'site_name': 'AgroBridge',
        }
        
        html_message = render_to_string('notifications/email/password_reset.html', context)
        text_message = strip_tags(html_message)
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        logger.info(f"Password reset email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user.email}: {e}")
        return False


def send_verification_email(user, verification_token: str) -> bool:
    """
    Send email verification email
    
    Args:
        user: User instance
        verification_token: Email verification token
        
    Returns:
        True if sent successfully
    """
    try:
        subject = "Verify Your AgroBridge Email"
        
        context = {
            'user': user,
            'verification_token': verification_token,
            'verification_url': f"{getattr(settings, 'SITE_URL', 'https://agrobridge.com')}/verify-email/{verification_token}",
            'site_name': 'AgroBridge',
        }
        
        html_message = render_to_string('notifications/email/email_verification.html', context)
        text_message = strip_tags(html_message)
        
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_message,
            from_email=DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        
        email.attach_alternative(html_message, "text/html")
        email.send()
        
        logger.info(f"Verification email sent to {user.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send verification email to {user.email}: {e}")
        return False