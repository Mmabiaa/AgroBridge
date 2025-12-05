"""Management command to recalculate storage quotas."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from file_storage.services import QuotaService

User = get_user_model()


class Command(BaseCommand):
    """Recalculate storage quotas for all users."""
    
    help = 'Recalculate storage quotas for all users'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--user-id',
            type=int,
            help='Recalculate quota for specific user ID',
        )
    
    def handle(self, *args, **options):
        """Execute command."""
        user_id = options.get('user_id')
        service = QuotaService()
        
        if user_id:
            # Recalculate for specific user
            try:
                user = User.objects.get(id=user_id)
                quota = service.recalculate_quota(user)
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Recalculated quota for {user.email}: '
                        f'{quota.used_storage} bytes, {quota.file_count} files'
                    )
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {user_id} not found')
                )
        else:
            # Recalculate for all users
            users = User.objects.all()
            count = 0
            
            for user in users:
                quota = service.recalculate_quota(user)
                count += 1
                
                if count % 100 == 0:
                    self.stdout.write(f'Processed {count} users...')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully recalculated quotas for {count} users'
                )
            )
