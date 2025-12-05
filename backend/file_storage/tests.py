"""Tests for file storage service."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import StoredFile, StorageQuota, ChunkedUpload, ImageVariant
from .services import FileStorageService, ChunkedUploadService, QuotaService

User = get_user_model()


class StoredFileModelTest(TestCase):
    """Test StoredFile model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='FARMER'
        )
    
    def test_create_stored_file(self):
        """Test creating a stored file."""
        file = StoredFile.objects.create(
            file_key='test-key-123',
            original_filename='test.jpg',
            file_type='IMAGE',
            mime_type='image/jpeg',
            file_size=1024,
            file_hash='abc123',
            storage_path='/path/to/file',
            uploaded_by=self.user
        )
        
        self.assertEqual(file.original_filename, 'test.jpg')
        self.assertEqual(file.file_type, 'IMAGE')
        self.assertEqual(file.status, 'UPLOADING')
        self.assertEqual(file.scan_status, 'PENDING')


class StorageQuotaModelTest(TestCase):
    """Test StorageQuota model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='FARMER'
        )
    
    def test_create_quota(self):
        """Test creating a storage quota."""
        quota = StorageQuota.objects.create(
            user=self.user,
            quota_limit=1073741824,  # 1GB
            used_storage=536870912    # 512MB
        )
        
        self.assertEqual(quota.usage_percentage, 50.0)
        self.assertEqual(quota.available_storage, 536870912)
    
    def test_has_space_for(self):
        """Test checking available space."""
        quota = StorageQuota.objects.create(
            user=self.user,
            quota_limit=1073741824,
            used_storage=1000000000,
            max_files=100,
            file_count=50
        )
        
        self.assertTrue(quota.has_space_for(50000000))
        self.assertFalse(quota.has_space_for(100000000))


class FileStorageServiceTest(TestCase):
    """Test FileStorageService."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='FARMER'
        )
        self.service = FileStorageService()
        
        # Create quota
        StorageQuota.objects.create(
            user=self.user,
            quota_limit=10 * 1024 * 1024,  # 10MB
            max_files=100
        )
    
    def test_upload_file(self):
        """Test uploading a file."""
        file = SimpleUploadedFile(
            'test.txt',
            b'test content',
            content_type='text/plain'
        )
        
        stored_file = self.service.upload_file(
            file=file,
            user=self.user,
            is_public=True,
            tags=['test']
        )
        
        self.assertIsNotNone(stored_file)
        self.assertEqual(stored_file.original_filename, 'test.txt')
        self.assertEqual(stored_file.status, 'AVAILABLE')
        self.assertTrue(stored_file.is_public)
    
    def test_upload_exceeds_quota(self):
        """Test uploading when quota is exceeded."""
        # Set low quota
        quota = StorageQuota.objects.get(user=self.user)
        quota.quota_limit = 100
        quota.save()
        
        file = SimpleUploadedFile(
            'large.txt',
            b'x' * 1000,
            content_type='text/plain'
        )
        
        with self.assertRaises(ValueError):
            self.service.upload_file(file=file, user=self.user)
    
    def test_delete_file(self):
        """Test deleting a file."""
        file = SimpleUploadedFile(
            'test.txt',
            b'test content',
            content_type='text/plain'
        )
        
        stored_file = self.service.upload_file(file=file, user=self.user)
        file_key = stored_file.file_key
        
        success = self.service.delete_file(file_key, self.user)
        
        self.assertTrue(success)
        stored_file.refresh_from_db()
        self.assertEqual(stored_file.status, 'DELETED')


class ChunkedUploadServiceTest(TestCase):
    """Test ChunkedUploadService."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='FARMER'
        )
        self.service = ChunkedUploadService()
        
        # Create quota
        StorageQuota.objects.create(
            user=self.user,
            quota_limit=100 * 1024 * 1024,  # 100MB
            max_files=100
        )
    
    def test_initiate_upload(self):
        """Test initiating a chunked upload."""
        upload = self.service.initiate_upload(
            user=self.user,
            filename='large_file.mp4',
            file_size=50000000,
            mime_type='video/mp4',
            chunk_size=5242880
        )
        
        self.assertIsNotNone(upload)
        self.assertEqual(upload.filename, 'large_file.mp4')
        self.assertEqual(upload.status, 'INITIATED')
        self.assertEqual(upload.total_chunks, 10)


class FileStorageAPITest(APITestCase):
    """Test file storage API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='FARMER'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create quota
        StorageQuota.objects.create(
            user=self.user,
            quota_limit=10 * 1024 * 1024,
            max_files=100
        )
    
    def test_upload_file_api(self):
        """Test file upload via API."""
        file = SimpleUploadedFile(
            'test.txt',
            b'test content',
            content_type='text/plain'
        )
        
        response = self.client.post(
            '/api/storage/files/',
            {
                'file': file,
                'is_public': True,
                'tags': ['test']
            },
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('file_key', response.data)
    
    def test_list_my_files(self):
        """Test listing user's files."""
        response = self.client.get('/api/storage/files/my_files/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_quota(self):
        """Test getting storage quota."""
        response = self.client.get('/api/storage/quotas/my_quota/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('quota_limit', response.data)
        self.assertIn('used_storage', response.data)


class QuotaServiceTest(TestCase):
    """Test QuotaService."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='FARMER'
        )
        self.service = QuotaService()
    
    def test_get_or_create_quota(self):
        """Test getting or creating quota."""
        quota = self.service.get_or_create_quota(self.user)
        
        self.assertIsNotNone(quota)
        self.assertEqual(quota.user, self.user)
    
    def test_recalculate_quota(self):
        """Test recalculating quota."""
        # Create some files
        StoredFile.objects.create(
            file_key='test1',
            original_filename='test1.txt',
            file_type='DOCUMENT',
            mime_type='text/plain',
            file_size=1000,
            file_hash='hash1',
            storage_path='/path1',
            uploaded_by=self.user,
            status='AVAILABLE'
        )
        
        StoredFile.objects.create(
            file_key='test2',
            original_filename='test2.txt',
            file_type='DOCUMENT',
            mime_type='text/plain',
            file_size=2000,
            file_hash='hash2',
            storage_path='/path2',
            uploaded_by=self.user,
            status='AVAILABLE'
        )
        
        quota = self.service.recalculate_quota(self.user)
        
        self.assertEqual(quota.used_storage, 3000)
        self.assertEqual(quota.file_count, 2)
