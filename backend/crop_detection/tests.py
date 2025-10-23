"""
Tests for crop detection app
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch, MagicMock
from PIL import Image
import io
import json
import uuid
from datetime import timedelta
from django.utils import timezone

from .models import Disease, Treatment, CropScan, ScanHistory, ExpertReview
from .image_analysis import ImageAnalysisService

User = get_user_model()


class CropDetectionModelTests(TestCase):
    """Test crop detection models"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        
        self.expert_user = User.objects.create_user(
            username='expert',
            email='expert@example.com',
            password='expertpass123',
            role='expert'
        )
    
    def test_disease_creation(self):
        """Test Disease model creation"""
        disease = Disease.objects.create(
            name='Test Disease',
            scientific_name='Testus diseaseus',
            category='fungal',
            description='A test disease for testing purposes',
            symptoms='Test symptoms',
            affected_crops=['tomato', 'pepper'],
            typical_severity='medium'
        )
        
        self.assertEqual(disease.name, 'Test Disease')
        self.assertEqual(disease.category, 'fungal')
        self.assertEqual(disease.typical_severity, 'medium')
        self.assertTrue(disease.is_active)
        self.assertFalse(disease.is_severe)
        self.assertIsInstance(disease.id, uuid.UUID)
    
    def test_disease_is_severe_property(self):
        """Test Disease is_severe property"""
        severe_disease = Disease.objects.create(
            name='Severe Disease',
            category='fungal',
            description='A severe disease',
            symptoms='Severe symptoms',
            affected_crops=['tomato'],
            typical_severity='high'
        )
        
        self.assertTrue(severe_disease.is_severe)
    
    def test_treatment_creation(self):
        """Test Treatment model creation"""
        disease = Disease.objects.create(
            name='Test Disease',
            category='fungal',
            description='Test disease',
            symptoms='Test symptoms',
            affected_crops=['tomato']
        )
        
        treatment = Treatment.objects.create(
            disease=disease,
            name='Test Treatment',
            treatment_type='curative',
            method='organic',
            description='A test treatment',
            detailed_instructions='Apply as needed',
            effectiveness_rating=4.0
        )
        
        self.assertEqual(treatment.disease, disease)
        self.assertEqual(treatment.name, 'Test Treatment')
        self.assertEqual(treatment.effectiveness_rating, 4.0)
        self.assertTrue(treatment.is_organic)
        self.assertTrue(treatment.is_highly_effective)
    
    def test_crop_scan_creation(self):
        """Test CropScan model creation"""
        # Create a simple test image
        image = Image.new('RGB', (100, 100), color='red')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_file = SimpleUploadedFile(
            "test_image.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        
        scan = CropScan.objects.create(
            user=self.user,
            image=image_file,
            crop_type='tomato',
            status='processing'
        )
        
        self.assertEqual(scan.user, self.user)
        self.assertEqual(scan.crop_type, 'tomato')
        self.assertEqual(scan.status, 'processing')
        self.assertFalse(scan.has_diseases)
        self.assertIsInstance(scan.id, uuid.UUID)
    
    def test_crop_scan_health_properties(self):
        """Test CropScan health-related properties"""
        scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            health_score=85.0
        )
        
        self.assertTrue(scan.is_healthy)
        self.assertFalse(scan.needs_attention)
        
        # Test unhealthy scan
        unhealthy_scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            health_score=40.0
        )
        
        self.assertFalse(unhealthy_scan.is_healthy)
        self.assertTrue(unhealthy_scan.needs_attention)
    
    def test_crop_scan_disease_detection(self):
        """Test adding disease detection to scan"""
        disease = Disease.objects.create(
            name='Test Disease',
            category='fungal',
            description='Test disease',
            symptoms='Test symptoms',
            affected_crops=['tomato']
        )
        
        scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato'
        )
        
        scan.add_disease_detection(disease.id, 0.85, 25.0)
        
        self.assertTrue(scan.has_diseases)
        self.assertEqual(len(scan.detected_diseases), 1)
        self.assertEqual(scan.detected_diseases[0]['confidence_score'], 0.85)
    
    def test_scan_history_creation(self):
        """Test ScanHistory model creation and updates"""
        history = ScanHistory.objects.create(user=self.user)
        
        self.assertEqual(history.user, self.user)
        self.assertEqual(history.total_scans, 0)
        
        # Create some scans
        CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            status='completed',
            health_score=80.0,
            accuracy_rating=4
        )
        
        CropScan.objects.create(
            user=self.user,
            crop_type='pepper',
            status='failed'
        )
        
        # Update statistics
        history.update_stats()
        
        self.assertEqual(history.total_scans, 2)
        self.assertEqual(history.successful_scans, 1)
        self.assertEqual(history.failed_scans, 1)
        self.assertEqual(history.average_health_score, 80.0)
        self.assertEqual(history.average_accuracy_rating, 4.0)
    
    def test_expert_review_creation(self):
        """Test ExpertReview model creation"""
        disease = Disease.objects.create(
            name='Test Disease',
            category='fungal',
            description='Test disease',
            symptoms='Test symptoms',
            affected_crops=['tomato']
        )
        
        scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato'
        )
        
        review = ExpertReview.objects.create(
            scan=scan,
            reviewer=self.expert_user,
            expert_diagnosis=disease,
            confidence_in_ai=4,
            review_comments='Good detection accuracy'
        )
        
        self.assertEqual(review.scan, scan)
        self.assertEqual(review.reviewer, self.expert_user)
        self.assertEqual(review.expert_diagnosis, disease)
        self.assertEqual(review.confidence_in_ai, 4)


class ImageAnalysisServiceTests(TestCase):
    """Test ImageAnalysisService functionality"""
    
    def setUp(self):
        self.service = ImageAnalysisService()
        
        # Create test disease
        self.disease = Disease.objects.create(
            name='Test Blight',
            category='fungal',
            description='Test disease',
            symptoms='Test symptoms',
            affected_crops=['tomato', 'pepper']
        )
        
        # Create test treatment
        self.treatment = Treatment.objects.create(
            disease=self.disease,
            name='Test Treatment',
            treatment_type='curative',
            method='organic',
            description='Test treatment',
            effectiveness_rating=4.0
        )
    
    def create_test_image(self):
        """Create a test image file"""
        image = Image.new('RGB', (200, 200), color='green')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_file = SimpleUploadedFile(
            "test_crop.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
        return image_file
    
    def test_image_validation_success(self):
        """Test successful image validation"""
        image_file = self.create_test_image()
        
        is_valid, error_message = self.service.validate_image(image_file)
        
        self.assertTrue(is_valid)
        self.assertEqual(error_message, "")
    
    def test_image_validation_too_large(self):
        """Test image validation with oversized file"""
        # Create a mock file that's too large
        large_file = MagicMock()
        large_file.size = 15 * 1024 * 1024  # 15MB
        large_file.content_type = 'image/jpeg'
        
        is_valid, error_message = self.service.validate_image(large_file)
        
        self.assertFalse(is_valid)
        self.assertIn('too large', error_message)
    
    def test_image_validation_wrong_format(self):
        """Test image validation with wrong format"""
        wrong_format_file = MagicMock()
        wrong_format_file.size = 1024
        wrong_format_file.content_type = 'text/plain'
        
        is_valid, error_message = self.service.validate_image(wrong_format_file)
        
        self.assertFalse(is_valid)
        self.assertIn('Unsupported', error_message)
    
    def test_analyze_image_success(self):
        """Test successful image analysis"""
        image_file = self.create_test_image()
        
        result = self.service.analyze_image(
            image_file=image_file,
            crop_type='tomato'
        )
        
        self.assertTrue(result['success'])
        self.assertIn('crop_type', result)
        self.assertIn('health_score', result)
        self.assertIn('detected_diseases', result)
        self.assertIn('recommendations', result)
        self.assertIn('confidence_scores', result)
        self.assertIn('processing_time_ms', result)
        
        # Check health score is valid
        self.assertGreaterEqual(result['health_score'], 0)
        self.assertLessEqual(result['health_score'], 100)
    
    def test_get_supported_crops(self):
        """Test getting supported crops"""
        crops = self.service.get_supported_crops()
        
        self.assertIsInstance(crops, list)
        self.assertIn('tomato', crops)
        self.assertIn('pepper', crops)
        self.assertGreater(len(crops), 0)


class DiseaseAPITests(APITestCase):
    """Test Disease API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test diseases
        self.disease1 = Disease.objects.create(
            name='Tomato Blight',
            category='fungal',
            description='A fungal disease affecting tomatoes',
            symptoms='Brown spots on leaves',
            affected_crops=['tomato'],
            typical_severity='high'
        )
        
        self.disease2 = Disease.objects.create(
            name='Pepper Spot',
            category='bacterial',
            description='A bacterial disease affecting peppers',
            symptoms='Dark spots on fruits',
            affected_crops=['pepper'],
            typical_severity='medium'
        )
    
    def test_list_diseases(self):
        """Test listing diseases"""
        url = reverse('crop_detection:disease-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_disease(self):
        """Test retrieving specific disease"""
        url = reverse('crop_detection:disease-detail', kwargs={'pk': self.disease1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Tomato Blight')
        self.assertEqual(response.data['category'], 'fungal')
    
    def test_search_diseases(self):
        """Test disease search"""
        url = reverse('crop_detection:disease-search')
        response = self.client.get(url, {'query': 'tomato'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Tomato Blight')
    
    def test_filter_diseases_by_category(self):
        """Test filtering diseases by category"""
        url = reverse('crop_detection:disease-search')
        response = self.client.get(url, {'category': 'fungal'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['category'], 'fungal')
    
    def test_filter_diseases_by_crop(self):
        """Test filtering diseases by crop type"""
        url = reverse('crop_detection:disease-search')
        response = self.client.get(url, {'crop_type': 'pepper'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Pepper Spot')
    
    def test_get_disease_categories(self):
        """Test getting disease categories"""
        url = reverse('crop_detection:disease-categories')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        
        categories = [item['category'] for item in response.data]
        self.assertIn('fungal', categories)
        self.assertIn('bacterial', categories)


class TreatmentAPITests(APITestCase):
    """Test Treatment API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create test disease and treatments
        self.disease = Disease.objects.create(
            name='Test Disease',
            category='fungal',
            description='Test disease',
            symptoms='Test symptoms',
            affected_crops=['tomato']
        )
        
        self.treatment1 = Treatment.objects.create(
            disease=self.disease,
            name='Organic Treatment',
            treatment_type='curative',
            method='organic',
            description='Organic treatment method',
            effectiveness_rating=4.0,
            suitable_crops=['tomato']
        )
        
        self.treatment2 = Treatment.objects.create(
            disease=self.disease,
            name='Chemical Treatment',
            treatment_type='curative',
            method='chemical',
            description='Chemical treatment method',
            effectiveness_rating=4.5,
            suitable_crops=['tomato']
        )
    
    def test_list_treatments(self):
        """Test listing treatments"""
        url = reverse('crop_detection:treatment-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_treatment(self):
        """Test retrieving specific treatment"""
        url = reverse('crop_detection:treatment-detail', kwargs={'pk': self.treatment1.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Organic Treatment')
        self.assertEqual(response.data['method'], 'organic')
    
    def test_recommend_treatments(self):
        """Test treatment recommendation endpoint"""
        url = reverse('crop_detection:treatment-recommend')
        data = {
            'disease_id': str(self.disease.id),
            'crop_type': 'tomato',
            'organic_only': False
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('disease', response.data)
        self.assertIn('treatments', response.data)
        self.assertEqual(len(response.data['treatments']), 2)
    
    def test_recommend_organic_only(self):
        """Test organic-only treatment recommendations"""
        url = reverse('crop_detection:treatment-recommend')
        data = {
            'disease_id': str(self.disease.id),
            'crop_type': 'tomato',
            'organic_only': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['treatments']), 1)
        self.assertEqual(response.data['treatments'][0]['method'], 'organic')


class CropScanAPITests(APITestCase):
    """Test CropScan API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def create_test_image(self):
        """Create a test image file"""
        image = Image.new('RGB', (200, 200), color='green')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        return SimpleUploadedFile(
            "test_crop.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
    
    def test_create_crop_scan(self):
        """Test creating a crop scan"""
        url = reverse('crop_detection:scan-list')
        image_file = self.create_test_image()
        
        data = {
            'image': image_file,
            'crop_type': 'tomato',
            'location_data': {'lat': 40.7128, 'lng': -74.0060}
        }
        
        with patch('crop_detection.views.CropScanViewSet._process_scan'):
            response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['crop_type'], 'tomato')
        self.assertEqual(response.data['user'], self.user.id)
    
    def test_list_user_scans(self):
        """Test listing user's scans"""
        # Create test scan
        scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            status='completed',
            health_score=85.0
        )
        
        url = reverse('crop_detection:scan-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], str(scan.id))
    
    def test_retrieve_scan(self):
        """Test retrieving specific scan"""
        scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            status='completed',
            health_score=85.0
        )
        
        url = reverse('crop_detection:scan-detail', kwargs={'pk': scan.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['crop_type'], 'tomato')
        self.assertEqual(response.data['health_score'], 85.0)
    
    def test_provide_scan_feedback(self):
        """Test providing feedback on scan"""
        disease = Disease.objects.create(
            name='Test Disease',
            category='fungal',
            description='Test disease',
            symptoms='Test symptoms',
            affected_crops=['tomato']
        )
        
        scan = CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            status='completed'
        )
        
        url = reverse('crop_detection:scan-feedback', kwargs={'pk': scan.id})
        data = {
            'user_confirmed_disease': str(disease.id),
            'accuracy_rating': 4,
            'user_feedback': 'Good detection'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check scan was updated
        scan.refresh_from_db()
        self.assertEqual(scan.user_confirmed_disease, disease)
        self.assertEqual(scan.accuracy_rating, 4)
        self.assertEqual(scan.user_feedback, 'Good detection')
    
    def test_scan_statistics(self):
        """Test getting scan statistics"""
        # Create test scans
        CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            status='completed',
            health_score=80.0,
            accuracy_rating=4
        )
        
        CropScan.objects.create(
            user=self.user,
            crop_type='pepper',
            status='failed'
        )
        
        url = reverse('crop_detection:scan-statistics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_scans'], 2)
        self.assertEqual(response.data['successful_scans'], 1)
        self.assertEqual(response.data['failed_scans'], 1)
        self.assertEqual(response.data['success_rate'], 50.0)


class ImageAnalysisAPITests(APITestCase):
    """Test Image Analysis API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def create_test_image(self):
        """Create a test image file"""
        image = Image.new('RGB', (200, 200), color='green')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        return SimpleUploadedFile(
            "test_crop.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )
    
    def test_analyze_image(self):
        """Test image analysis without saving scan"""
        url = reverse('crop_detection:analysis-analyze')
        image_file = self.create_test_image()
        
        data = {
            'image': image_file,
            'crop_type': 'tomato'
        }
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('health_score', response.data)
        self.assertIn('detected_diseases', response.data)
        self.assertIn('recommendations', response.data)
    
    def test_get_supported_crops(self):
        """Test getting supported crops"""
        url = reverse('crop_detection:analysis-supported-crops')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('supported_crops', response.data)
        self.assertIsInstance(response.data['supported_crops'], list)
    
    def test_analyze_invalid_image(self):
        """Test analyzing invalid image"""
        url = reverse('crop_detection:analysis-analyze')
        
        # Create invalid file
        invalid_file = SimpleUploadedFile(
            "test.txt",
            b"not an image",
            content_type="text/plain"
        )
        
        data = {'image': invalid_file}
        
        response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class ScanHistoryAPITests(APITestCase):
    """Test ScanHistory API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        
        # Get JWT token
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    
    def test_get_scan_history_summary(self):
        """Test getting scan history summary"""
        # Create some scans
        CropScan.objects.create(
            user=self.user,
            crop_type='tomato',
            status='completed',
            health_score=80.0,
            accuracy_rating=4
        )
        
        CropScan.objects.create(
            user=self.user,
            crop_type='pepper',
            status='completed',
            health_score=90.0,
            accuracy_rating=5
        )
        
        url = reverse('crop_detection:history-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_scans'], 2)
        self.assertEqual(response.data['successful_scans'], 2)
        self.assertEqual(response.data['average_health_score'], 85.0)
        self.assertEqual(response.data['average_accuracy_rating'], 4.5)
