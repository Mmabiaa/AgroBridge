"""
Management command to process pending GDPR requests.

Usage:
    python manage.py process_gdpr_requests
    python manage.py process_gdpr_requests --request-id=<uuid>
"""
from django.core.management.base import BaseCommand
from data_management.services import GDPRService
from data_management.models import GDPRRequest


class Command(BaseCommand):
    help = 'Process pending GDPR requests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--request-id',
            type=str,
            help='Process specific request by ID',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=10,
            help='Maximum number of requests to process',
        )

    def handle(self, *args, **options):
        request_id = options.get('request_id')
        limit = options.get('limit', 10)
        
        service = GDPRService()
        
        if request_id:
            try:
                gdpr_request = GDPRRequest.objects.get(id=request_id)
                self.stdout.write(f'Processing request {request_id}...')
                
                result = service.process_request(gdpr_request)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Request processed successfully: {result.get("message")}'
                    )
                )
                
            except GDPRRequest.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Request {request_id} not found')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing request: {str(e)}')
                )
        else:
            pending_requests = GDPRRequest.objects.filter(
                status='pending'
            ).order_by('requested_at')[:limit]
            
            if not pending_requests:
                self.stdout.write('No pending GDPR requests found')
                return
            
            self.stdout.write(
                f'Processing {pending_requests.count()} pending requests...'
            )
            
            success_count = 0
            error_count = 0
            
            for gdpr_request in pending_requests:
                try:
                    result = service.process_request(gdpr_request)
                    success_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ {gdpr_request.user.email} - {gdpr_request.get_request_type_display()}'
                        )
                    )
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(
                            f'✗ {gdpr_request.user.email} - Error: {str(e)}'
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'\nProcessed {success_count} requests successfully, {error_count} errors'
                )
            )
