"""Management command to populate file storage test data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from file_storage.models import StorageQuota
from file_storage.services import FileStorageService

User = get_user_model()


class Command(BaseCommand):
    """Populate file storage with test data."""
    
    help = 'Populate file storage with test data'
    
    def handle(self, *args, **options):
        """Execute command."""
        self.stdout.write('Populating file storage test data...')
        
        # Get or create test user
        user, created = User.objects.get_or_create(
            email='farmer@test.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Farmer',
                'role': 'FARMER'
            }
        )
        
        if created:
            user.set_password('testpass123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created test user: {user.email}'))
        
        # Create storage quota
        quota, created = StorageQuota.objects.get_or_create(
            user=user,
            defaults={
                'quota_limit': 5 * 1024 * 1024 * 1024,  # 5GB
                'max_files': 5000
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('Created storage quota'))
        
        # Create test files
        service = FileStorageService()
        
        test_files = [
            {
                'name': 'test_image.jpg',
                'content': b'fake image content',
                'content_type': 'image/jpeg',
                'tags': ['test', 'image']
            },
            {
                'name': 'test_document.pdf',
                'content': b'fake pdf content',
                'content_type': 'application/pdf',
                'tags': ['test', 'document']
            },
            {
                'name': 'test_video.mp4',
                'content': b'fake video content',
                'content_type': 'video/mp4',
                'tags': ['test', 'video']
            }
        ]
        
        for file_data in test_files:
            uploaded_file = SimpleUploadedFile(
                file_data['name'],
                file_data['content'],
                content_type=file_data['content_type']
            )
            
            try:
                stored_file = service.upload_file(
                    file=uploaded_file,
                    user=user,
                    is_public=True,
                    tags=file_data['tags'],
                    metadata={'test': True}
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created test file: {stored_file.original_filename}'
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Failed to create {file_data["name"]}: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('File storage test data populated successfully')
        )
