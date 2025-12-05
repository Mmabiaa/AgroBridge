"""Management command to retry failed customs submissions."""

from django.core.management.base import BaseCommand
from django.utils import timezone
from export_docs.models import CustomsSubmission
from export_docs.services import CustomsIntegrationService


class Command(BaseCommand):
    """Retry failed customs submissions."""
    
    help = 'Retry failed customs submissions'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--max-retries',
            type=int,
            default=3,
            help='Maximum number of retries (default: 3)'
        )
    
    def handle(self, *args, **options):
        """Execute the command."""
        max_retries = options['max_retries']
        
        self.stdout.write('Checking for failed submissions to retry...')
        
        # Find submissions that need retry
        submissions = CustomsSubmission.objects.filter(
            status__in=['FAILED', 'RETRY'],
            retry_count__lt=max_retries,
            next_retry_at__lte=timezone.now()
        )
        
        count = submissions.count()
        
        if count > 0:
            self.stdout.write(f'Found {count} submission(s) to retry')
            
            success_count = 0
            failed_count = 0
            
            for submission in submissions:
                self.stdout.write(f'  Retrying: {submission.submission_reference}')
                
                try:
                    new_submission = CustomsIntegrationService.submit_to_customs(
                        submission.document,
                        submission.customs_system
                    )
                    
                    if new_submission.status == 'SUCCESS':
                        success_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f'    Success: {new_submission.submission_reference}')
                        )
                    else:
                        failed_count += 1
                        self.stdout.write(
                            self.style.WARNING(f'    Failed: {new_submission.error_message}')
                        )
                
                except Exception as e:
                    failed_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'    Error: {str(e)}')
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nRetry complete: {success_count} succeeded, {failed_count} failed'
                )
            )
        else:
            self.stdout.write('No submissions to retry')
