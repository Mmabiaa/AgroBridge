"""
Management command to apply data retention policies.

Usage:
    python manage.py apply_retention_policies
    python manage.py apply_retention_policies --data-type=sensor_data
"""
from django.core.management.base import BaseCommand
from data_management.services import DataRetentionService
from data_management.models import DataRetentionPolicy


class Command(BaseCommand):
    help = 'Apply data retention policies to clean up old data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--data-type',
            type=str,
            help='Apply policy for specific data type only',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        data_type = options.get('data_type')
        dry_run = options.get('dry_run', False)
        
        service = DataRetentionService()
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be deleted'))
        
        if data_type:
            try:
                policy = DataRetentionPolicy.objects.get(
                    data_type=data_type,
                    status='active'
                )
                self.stdout.write(f'Applying policy for {data_type}...')
                
                if not dry_run:
                    result = service.apply_policy(policy)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Deleted {result["records_deleted"]} records'
                        )
                    )
                else:
                    self.stdout.write(f'Would apply policy: {policy}')
                    
            except DataRetentionPolicy.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'No active policy found for {data_type}')
                )
        else:
            self.stdout.write('Applying all active retention policies...')
            
            if not dry_run:
                results = service.apply_all_policies()
                
                total_deleted = sum(r.get('records_deleted', 0) for r in results)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Applied {len(results)} policies, deleted {total_deleted} total records'
                    )
                )
                
                for result in results:
                    if 'error' in result:
                        self.stdout.write(
                            self.style.ERROR(
                                f'Error in {result["data_type"]}: {result["error"]}'
                            )
                        )
                    else:
                        self.stdout.write(
                            f'  {result["data_type"]}: {result["records_deleted"]} records'
                        )
            else:
                policies = DataRetentionPolicy.objects.filter(status='active')
                self.stdout.write(f'Would apply {policies.count()} policies:')
                for policy in policies:
                    self.stdout.write(f'  - {policy}')
