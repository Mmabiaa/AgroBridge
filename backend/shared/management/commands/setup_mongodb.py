"""
Django management command to setup MongoDB indexes
"""
from django.core.management.base import BaseCommand
from shared.database.mongodb import setup_mongodb_indexes, MONGODB_SERVICES


class Command(BaseCommand):
    help = 'Setup MongoDB collections and indexes for all services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--service',
            type=str,
            help='Setup MongoDB for a specific service only',
        )

    def handle(self, *args, **options):
        service_name = options.get('service')
        
        if service_name:
            # Setup specific service
            self.stdout.write(f'Setting up MongoDB for service: {service_name}')
            try:
                setup_mongodb_indexes(service_name)
                self.stdout.write(
                    self.style.SUCCESS(f'✓ MongoDB setup completed for {service_name}')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to setup MongoDB for {service_name}: {e}')
                )
        else:
            # Setup all services
            self.stdout.write('Setting up MongoDB for all services...')
            success_count = 0
            fail_count = 0
            
            for service in MONGODB_SERVICES.keys():
                try:
                    setup_mongodb_indexes(service)
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ {service}')
                    )
                    success_count += 1
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'✗ {service}: {e}')
                    )
                    fail_count += 1
            
            self.stdout.write('')
            self.stdout.write(
                self.style.SUCCESS(
                    f'MongoDB setup completed: {success_count} successful, {fail_count} failed'
                )
            )
