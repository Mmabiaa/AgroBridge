from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import (
    ModerationQueue, AuditLog, SecurityIncident,
    PlatformMetrics, UserActivity
)

User = get_user_model()


class UserManagementService:
    """Service for user management operations"""
    
    @staticmethod
    def activate_user(user, admin):
        """Activate a user account"""
        user.is_active = True
        user.save()
        
        # Log the action
        AuditLog.objects.create(
            user=admin,
            action_type='update',
            description=f"Activated user {user.username}",
            changes={'is_active': {'from': False, 'to': True}},
            metadata={'target_user_id': user.id}
        )
        
        return {
            'success': True,
            'message': f'User {user.username} has been activated'
        }
    
    @staticmethod
    def deactivate_user(user, admin):
        """Deactivate a user account"""
        user.is_active = False
        user.save()
        
        # Log the action
        AuditLog.objects.create(
            user=admin,
            action_type='update',
            description=f"Deactivated user {user.username}",
            changes={'is_active': {'from': True, 'to': False}},
            metadata={'target_user_id': user.id}
        )
        
        return {
            'success': True,
            'message': f'User {user.username} has been deactivated'
        }
    
    @staticmethod
    def update_user_role(user, new_role, admin):
        """Update user role"""
        if not hasattr(user, 'profile'):
            return {
                'success': False,
                'message': 'User profile not found'
            }
        
        old_role = user.profile.role
        user.profile.role = new_role
        user.profile.save()
        
        # Log the action
        AuditLog.objects.create(
            user=admin,
            action_type='permission_change',
            description=f"Changed role for user {user.username}",
            changes={'role': {'from': old_role, 'to': new_role}},
            metadata={'target_user_id': user.id}
        )
        
        return {
            'success': True,
            'message': f'User role updated to {new_role}'
        }
    
    @staticmethod
    def get_user_statistics():
        """Get user statistics"""
        now = timezone.now()
        today = now.date()
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_week = User.objects.filter(
            date_joined__gte=now - timedelta(days=7)
        ).count()
        new_users_month = User.objects.filter(
            date_joined__gte=now - timedelta(days=30)
        ).count()
        
        # Get role distribution
        role_distribution = {}
        if hasattr(User, 'profile'):
            from users.models import UserProfile
            role_distribution = dict(
                UserProfile.objects.values('role').annotate(count=Count('role'))
                .values_list('role', 'count')
            )
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'new_users_today': new_users_today,
            'new_users_week': new_users_week,
            'new_users_month': new_users_month,
            'role_distribution': role_distribution
        }


class ModerationService:
    """Service for content moderation"""
    
    @staticmethod
    def moderate_content(item, action, moderator, notes=''):
        """Moderate a content item"""
        status_map = {
            'approve': 'approved',
            'reject': 'rejected',
            'flag': 'flagged'
        }
        
        item.status = status_map.get(action, 'pending')
        item.reviewed_by = moderator
        item.review_notes = notes
        item.reviewed_at = timezone.now()
        item.save()
        
        # Log the action
        AuditLog.objects.create(
            user=moderator,
            action_type='moderation',
            description=f"Moderated {item.moderation_type} - {action}",
            changes={'status': {'to': item.status}},
            metadata={
                'moderation_queue_id': item.id,
                'action': action
            }
        )
        
        return {
            'success': True,
            'message': f'Content {action}ed successfully',
            'item_id': item.id,
            'new_status': item.status
        }
    
    @staticmethod
    def bulk_moderate(item_ids, action, moderator, notes=''):
        """Bulk moderate content items"""
        items = ModerationQueue.objects.filter(id__in=item_ids)
        count = items.count()
        
        status_map = {
            'approve': 'approved',
            'reject': 'rejected',
            'flag': 'flagged'
        }
        
        new_status = status_map.get(action, 'pending')
        items.update(
            status=new_status,
            reviewed_by=moderator,
            review_notes=notes,
            reviewed_at=timezone.now()
        )
        
        # Log the action
        AuditLog.objects.create(
            user=moderator,
            action_type='moderation',
            description=f"Bulk moderated {count} items - {action}",
            metadata={
                'item_ids': item_ids,
                'action': action,
                'count': count
            }
        )
        
        return {
            'success': True,
            'message': f'{count} items {action}ed successfully',
            'count': count
        }
    
    @staticmethod
    def get_moderation_statistics():
        """Get moderation statistics"""
        total = ModerationQueue.objects.count()
        pending = ModerationQueue.objects.filter(status='pending').count()
        approved = ModerationQueue.objects.filter(status='approved').count()
        rejected = ModerationQueue.objects.filter(status='rejected').count()
        flagged = ModerationQueue.objects.filter(status='flagged').count()
        
        # Get by type
        by_type = dict(
            ModerationQueue.objects.values('moderation_type')
            .annotate(count=Count('id'))
            .values_list('moderation_type', 'count')
        )
        
        # Get recent activity
        today = timezone.now().date()
        reviewed_today = ModerationQueue.objects.filter(
            reviewed_at__date=today
        ).count()
        
        return {
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'flagged': flagged,
            'by_type': by_type,
            'reviewed_today': reviewed_today
        }


class SecurityMonitoringService:
    """Service for security monitoring"""
    
    @staticmethod
    def get_security_statistics():
        """Get security statistics"""
        total_incidents = SecurityIncident.objects.count()
        open_incidents = SecurityIncident.objects.filter(status='open').count()
        investigating = SecurityIncident.objects.filter(status='investigating').count()
        resolved = SecurityIncident.objects.filter(status='resolved').count()
        
        # Get by severity
        by_severity = dict(
            SecurityIncident.objects.values('severity')
            .annotate(count=Count('id'))
            .values_list('severity', 'count')
        )
        
        # Get recent incidents
        last_24h = timezone.now() - timedelta(hours=24)
        recent_incidents = SecurityIncident.objects.filter(
            detected_at__gte=last_24h
        ).count()
        
        # Get critical open incidents
        critical_open = SecurityIncident.objects.filter(
            severity='critical',
            status__in=['open', 'investigating']
        ).count()
        
        return {
            'total_incidents': total_incidents,
            'open_incidents': open_incidents,
            'investigating': investigating,
            'resolved': resolved,
            'by_severity': by_severity,
            'recent_24h': recent_incidents,
            'critical_open': critical_open
        }
    
    @staticmethod
    def track_failed_login(user, ip_address, user_agent):
        """Track failed login attempt"""
        # Check for multiple failed attempts
        recent_failures = UserActivity.objects.filter(
            user=user,
            activity_type='failed_login',
            timestamp__gte=timezone.now() - timedelta(minutes=15)
        ).count()
        
        # Log the activity
        UserActivity.objects.create(
            user=user,
            activity_type='failed_login',
            ip_address=ip_address,
            user_agent=user_agent,
            details={'attempt_count': recent_failures + 1}
        )
        
        # Create security incident if threshold exceeded
        if recent_failures >= 5:
            SecurityIncident.objects.create(
                incident_type='brute_force_attempt',
                severity='medium',
                description=f'Multiple failed login attempts for user {user.username}',
                affected_user=user,
                detection_method='automated',
                indicators={
                    'failed_attempts': recent_failures + 1,
                    'ip_address': ip_address,
                    'time_window': '15 minutes'
                }
            )


class AnalyticsService:
    """Service for analytics and reporting"""
    
    @staticmethod
    def get_dashboard_overview():
        """Get dashboard overview statistics"""
        now = timezone.now()
        today = now.date()
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        pending_moderation = ModerationQueue.objects.filter(status='pending').count()
        open_incidents = SecurityIncident.objects.filter(
            status__in=['open', 'investigating']
        ).count()
        
        # Determine system health
        if open_incidents == 0 and pending_moderation < 10:
            system_health = 'excellent'
        elif open_incidents < 5 and pending_moderation < 50:
            system_health = 'good'
        elif open_incidents < 10:
            system_health = 'fair'
        else:
            system_health = 'poor'
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'new_users_today': new_users_today,
            'pending_moderation': pending_moderation,
            'open_incidents': open_incidents,
            'system_health': system_health
        }
    
    @staticmethod
    def get_user_growth(days=30):
        """Get user growth over time"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        growth_data = []
        current_date = start_date
        
        while current_date <= end_date:
            count = User.objects.filter(date_joined__date=current_date).count()
            growth_data.append({
                'date': current_date.isoformat(),
                'new_users': count
            })
            current_date += timedelta(days=1)
        
        return {
            'period': f'{days} days',
            'data': growth_data
        }
    
    @staticmethod
    def get_platform_health():
        """Get platform health metrics"""
        # Get latest metrics
        latest_metrics = {}
        for metric in PlatformMetrics.objects.order_by('-timestamp')[:20]:
            if metric.metric_name not in latest_metrics:
                latest_metrics[metric.metric_name] = {
                    'value': metric.metric_value,
                    'unit': metric.metric_unit,
                    'timestamp': metric.timestamp.isoformat()
                }
        
        return latest_metrics
    
    @staticmethod
    def get_error_rates(hours=24):
        """Get error rates over time"""
        start_time = timezone.now() - timedelta(hours=hours)
        
        # Get error logs from audit logs
        error_logs = AuditLog.objects.filter(
            timestamp__gte=start_time,
            description__icontains='error'
        )
        
        # Group by hour
        error_data = []
        current_time = start_time
        
        while current_time <= timezone.now():
            next_hour = current_time + timedelta(hours=1)
            count = error_logs.filter(
                timestamp__gte=current_time,
                timestamp__lt=next_hour
            ).count()
            
            error_data.append({
                'timestamp': current_time.isoformat(),
                'error_count': count
            })
            current_time = next_hour
        
        return {
            'period': f'{hours} hours',
            'data': error_data
        }
