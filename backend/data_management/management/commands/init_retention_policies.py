"""
Management command to initialize default data retention policies.

Usage:
    python manage.py init_retention_policies
"""
from django.core.management.base import BaseCommand
from data_management.models import DataRetentionPolicy


class Command(BaseCommand):
    help = 'Initialize default data retention policies'

    def handle(self, *args, **options):
        policies = [
            {
                'data_type': 'user_data',
                'retention_days': 2555,  # 7 years
                'description': 'User account data retained for 7 years after account deletion',
            },
            {
                'data_type': 'transaction',
                'retention_days': 2555,  # 7 years
                'description': 'Financial transaction records retained for 7 years for compliance',
            },
            {
                'data_type': 'audit_log',
                'retention_days': 2555,  # 7 years
                'description': 'Audit logs retained for 7 years as per regulations',
            },
            {
                'data_type': 'sensor_data',
                'retention_days': 730,  # 2 years
                'description': 'IoT sensor data retained for 2 years',
            },
            {
                'data_type': 'marketplace',
                'retention_days': 1095,  # 3 years
                'description': 'Marketplace listings and orders retained for 3 years',
            },
            {
                'data_type': 'communication',
                'retention_days': 365,  # 1 year
                'description': 'Messages and communications retained for 1 year',
            },
            {
                'data_type': 'analytics',
                'retention_days': 730,  # 2 years
                'description': 'Analytics data retained for 2 years',
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for policy_data in policies:
            policy, created = DataRetentionPolicy.objects.update_or_create(
                data_type=policy_data['data_type'],
                defaults={
                    'retention_days': policy_data['retention_days'],
                    'description': policy_data['description'],
                    'status': 'active'
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created policy: {policy.data_type}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated policy: {policy.data_type}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nInitialized {created_count} new policies, updated {updated_count} existing policies'
            )
        )
