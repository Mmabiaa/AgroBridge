from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from admin_service.services import (
    UserManagementService, ModerationService,
    SecurityMonitoringService, AnalyticsService
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Generate comprehensive admin report'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days to include in report (default: 7)'
        )

    def handle(self, *args, **options):
        """Generate admin report"""
        days = options['days']
        
        self.stdout.write('=' * 60)
        self.stdout.write(
            self.style.SUCCESS(
                f'ADMIN REPORT - Last {days} Days'
            )
        )
        self.stdout.write('=' * 60)
        self.stdout.write('')
        
        # User statistics
        self.stdout.write(self.style.HTTP_INFO('USER STATISTICS'))
        self.stdout.write('-' * 60)
        user_stats = UserManagementService.get_user_statistics()
        
        self.stdout.write(f"Total Users: {user_stats['total_users']}")
        self.stdout.write(f"Active Users: {user_stats['active_users']}")
        self.stdout.write(f"Inactive Users: {user_stats['inactive_users']}")
        self.stdout.write(f"New Users Today: {user_stats['new_users_today']}")
        self.stdout.write(f"New Users This Week: {user_stats['new_users_week']}")
        self.stdout.write(f"New Users This Month: {user_stats['new_users_month']}")
        
        if user_stats['role_distribution']:
            self.stdout.write('\nRole Distribution:')
            for role, count in user_stats['role_distribution'].items():
                self.stdout.write(f"  {role}: {count}")
        
        self.stdout.write('')
        
        # Moderation statistics
        self.stdout.write(self.style.HTTP_INFO('MODERATION STATISTICS'))
        self.stdout.write('-' * 60)
        mod_stats = ModerationService.get_moderation_statistics()
        
        self.stdout.write(f"Total Items: {mod_stats['total']}")
        self.stdout.write(f"Pending Review: {mod_stats['pending']}")
        self.stdout.write(f"Approved: {mod_stats['approved']}")
        self.stdout.write(f"Rejected: {mod_stats['rejected']}")
        self.stdout.write(f"Flagged: {mod_stats['flagged']}")
        self.stdout.write(f"Reviewed Today: {mod_stats['reviewed_today']}")
        
        if mod_stats['by_type']:
            self.stdout.write('\nBy Content Type:')
            for content_type, count in mod_stats['by_type'].items():
                self.stdout.write(f"  {content_type}: {count}")
        
        self.stdout.write('')
        
        # Security statistics
        self.stdout.write(self.style.HTTP_INFO('SECURITY STATISTICS'))
        self.stdout.write('-' * 60)
        sec_stats = SecurityMonitoringService.get_security_statistics()
        
        self.stdout.write(f"Total Incidents: {sec_stats['total_incidents']}")
        self.stdout.write(f"Open Incidents: {sec_stats['open_incidents']}")
        self.stdout.write(f"Investigating: {sec_stats['investigating']}")
        self.stdout.write(f"Resolved: {sec_stats['resolved']}")
        self.stdout.write(f"Recent (24h): {sec_stats['recent_24h']}")
        
        if sec_stats['critical_open'] > 0:
            self.stdout.write(
                self.style.ERROR(
                    f"\n⚠️  CRITICAL: {sec_stats['critical_open']} open critical incidents!"
                )
            )
        
        if sec_stats['by_severity']:
            self.stdout.write('\nBy Severity:')
            for severity, count in sec_stats['by_severity'].items():
                self.stdout.write(f"  {severity}: {count}")
        
        self.stdout.write('')
        
        # Platform health
        self.stdout.write(self.style.HTTP_INFO('PLATFORM HEALTH'))
        self.stdout.write('-' * 60)
        overview = AnalyticsService.get_dashboard_overview()
        
        health_color = {
            'excellent': self.style.SUCCESS,
            'good': self.style.SUCCESS,
            'fair': self.style.WARNING,
            'poor': self.style.ERROR
        }
        
        health_style = health_color.get(
            overview['system_health'],
            self.style.SUCCESS
        )
        
        self.stdout.write(
            health_style(f"System Health: {overview['system_health'].upper()}")
        )
        self.stdout.write(f"Pending Moderation: {overview['pending_moderation']}")
        self.stdout.write(f"Open Incidents: {overview['open_incidents']}")
        
        self.stdout.write('')
        self.stdout.write('=' * 60)
        self.stdout.write(
            self.style.SUCCESS('Report generated successfully')
        )
