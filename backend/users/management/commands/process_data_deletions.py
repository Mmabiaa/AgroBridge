"""
Management command to process data deletion requests for GDPR compliance
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from users.models import DataDeletionRequest, UserProfile, UserActivity, UserPreferences

User = get_user_model()

class Command(BaseCommand):
    help = 'Process approved data deletion requests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--request-id',
            type=str,
            help='Process specific deletion request by ID',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        request_id = options.get('request_id')
        dry_run = options.get('dry_run', False)
        
        if request_id:
            try:
                deletion_request = DataDeletionRequest.objects.get(id=request_id)
                if deletion_request.status != 'approved':
                    self.stdout.write(
                        self.style.ERROR(f'Deletion request {request_id} is not approved')
                    )
                    return
                self.process_deletion_request(deletion_request, dry_run)
            except DataDeletionRequest.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Deletion request {request_id} not found')
                )
        else:
            # Process all approved requests
            approved_requests = DataDeletionRequest.objects.filter(status='approved')
            
            if not approved_requests.exists():
                self.stdout.write(
                    self.style.SUCCESS('No approved deletion requests to process')
                )
                return
            
            for deletion_request in approved_requests:
                self.process_deletion_request(deletion_request, dry_run)

    def process_deletion_request(self, deletion_request, dry_run=False):
        """Process a single deletion request"""
        user = deletion_request.user
        
        self.stdout.write(
            f'Processing deletion request {deletion_request.id} for user {user.username}'
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No actual deletion will occur'))
        
        try:
            with transaction.atomic():
                # Update status to processing
                if not dry_run:
                    deletion_request.status = 'processing'
                    deletion_request.save()
                
                deletion_count = 0
                
                # Delete or anonymize profile data
                if deletion_request.delete_profile:
                    try:
                        profile = user.profile
                        if dry_run:
                            self.stdout.write(f'Would delete profile for user {user.username}')
                        else:
                            profile.delete()
                            deletion_count += 1
                            self.stdout.write(f'Deleted profile for user {user.username}')
                    except UserProfile.DoesNotExist:
                        pass
                
                # Delete preferences
                try:
                    preferences = user.preferences
                    if dry_run:
                        self.stdout.write(f'Would delete preferences for user {user.username}')
                    else:
                        preferences.delete()
                        deletion_count += 1
                        self.stdout.write(f'Deleted preferences for user {user.username}')
                except UserPreferences.DoesNotExist:
                    pass
                
                # Delete or anonymize activity data
                if deletion_request.delete_activity:
                    activities = UserActivity.objects.filter(user=user)
                    activity_count = activities.count()
                    
                    if dry_run:
                        self.stdout.write(f'Would delete {activity_count} activities for user {user.username}')
                    else:
                        activities.delete()
                        deletion_count += activity_count
                        self.stdout.write(f'Deleted {activity_count} activities for user {user.username}')
                
                # Handle user account
                if deletion_request.anonymize_data:
                    # Anonymize user data instead of deleting
                    if dry_run:
                        self.stdout.write(f'Would anonymize user account {user.username}')
                    else:
                        user.username = f'deleted_user_{user.id}'
                        user.email = f'deleted_{user.id}@example.com'
                        user.first_name = ''
                        user.last_name = ''
                        user.is_active = False
                        if hasattr(user, 'phone'):
                            user.phone = ''
                        user.save()
                        self.stdout.write(f'Anonymized user account {user.username}')
                else:
                    # Delete user account completely
                    if dry_run:
                        self.stdout.write(f'Would delete user account {user.username}')
                    else:
                        username = user.username
                        user.delete()
                        deletion_count += 1
                        self.stdout.write(f'Deleted user account {username}')
                
                # Update deletion request status
                if not dry_run:
                    deletion_request.status = 'completed'
                    deletion_request.processed_at = timezone.now()
                    deletion_request.admin_notes = f'Processed successfully. {deletion_count} records deleted.'
                    deletion_request.save()
                
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f'DRY RUN: Would process deletion request {deletion_request.id}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'Successfully processed deletion request {deletion_request.id}')
                    )
                
        except Exception as e:
            if not dry_run:
                deletion_request.status = 'failed'
                deletion_request.admin_notes = f'Processing failed: {str(e)}'
                deletion_request.save()
            
            self.stdout.write(
                self.style.ERROR(f'Failed to process deletion request {deletion_request.id}: {str(e)}')
            )