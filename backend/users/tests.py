from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
import json
import tempfile
from PIL import Image
import io

from .models import UserProfile, UserPreferences, UserActivity, DataExportRequest, DataDeletionRequest

User = get_user_model()

class UserProfileModelTest(TestCase):
    """Test UserProfile model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_profile_creation(self):
        """Test profile creation"""
        # Profile should already exist due to signal handler
        profile = self.user.profile
        
        # Update profile with test data
        profile.first_name = 'John'
        profile.last_name = 'Doe'
        profile.city = 'Accra'
        profile.country = 'Ghana'
        profile.farm_experience = 5
        profile.specialization = 'Cocoa farming'
        profile.save()
        
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.full_name, 'John Doe')
        self.assertEqual(profile.location_display, 'Accra, Ghana')
    
    def test_profile_str_method(self):
        """Test profile string representation"""
        profile = self.user.profile  # Use existing profile from signal
        self.assertEqual(str(profile), f"{self.user.username}'s Profile")

class UserPreferencesModelTest(TestCase):
    """Test UserPreferences model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_preferences_creation(self):
        """Test preferences creation with defaults"""
        # Preferences should already exist due to signal handler
        preferences = self.user.preferences
        
        self.assertTrue(preferences.email_notifications)
        self.assertFalse(preferences.sms_notifications)
        self.assertTrue(preferences.push_notifications)
        self.assertEqual(preferences.language, 'en')
        self.assertEqual(preferences.currency, 'USD')

class UserServiceAPITest(APITestCase):
    """Test User Service API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123',
            role='buyer'
        )
        
        # Create authentication token
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
    
    def test_get_user_profile(self):
        """Test getting user profile"""
        url = reverse('user-profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'testuser')
        self.assertEqual(response.data['email'], 'test@example.com')
    
    def test_update_user_profile(self):
        """Test updating user profile"""
        url = reverse('user-profile')
        data = {
            'first_name': 'John',
            'last_name': 'Doe',
            'city': 'Accra',
            'country': 'Ghana',
            'farm_experience': 5,
            'specialization': 'Cocoa farming',
            'bio': 'Experienced cocoa farmer'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'John')
        self.assertEqual(response.data['last_name'], 'Doe')
        self.assertEqual(response.data['full_name'], 'John Doe')
        
        # Check if activity was logged
        activity = UserActivity.objects.filter(
            user=self.user,
            activity_type='profile_update'
        ).first()
        self.assertIsNotNone(activity)
    
    def test_get_user_preferences(self):
        """Test getting user preferences"""
        url = reverse('user-preferences')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['email_notifications'])
        self.assertEqual(response.data['language'], 'en')
    
    def test_update_user_preferences(self):
        """Test updating user preferences"""
        url = reverse('user-preferences')
        data = {
            'email_notifications': False,
            'sms_notifications': True,
            'language': 'tw',
            'currency': 'GHS',
            'dnd_enabled': True
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['email_notifications'])
        self.assertTrue(response.data['sms_notifications'])
        self.assertEqual(response.data['language'], 'tw')
    
    def test_search_users(self):
        """Test user search functionality"""
        # Update existing profiles created by signals
        user_profile = self.user.profile
        user_profile.first_name = 'John'
        user_profile.last_name = 'Farmer'
        user_profile.city = 'Accra'
        user_profile.specialization = 'Cocoa farming'
        user_profile.farm_experience = 5
        user_profile.save()
        
        other_profile = self.other_user.profile
        other_profile.first_name = 'Jane'
        other_profile.last_name = 'Buyer'
        other_profile.city = 'Kumasi'
        other_profile.specialization = 'Crop trading'
        other_profile.farm_experience = 3
        other_profile.save()
        
        url = reverse('search-users')
        
        # Test search by name
        response = self.client.get(url, {'search': 'John'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['full_name'], 'John Farmer')
        
        # Test search by city
        response = self.client.get(url, {'city': 'Kumasi'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['full_name'], 'Jane Buyer')
        
        # Test search by role
        response = self.client.get(url, {'role': 'farmer'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search by experience range
        response = self.client.get(url, {'min_experience': '4'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['farm_experience'], 5)
    
    def test_public_profile(self):
        """Test getting public profile"""
        # Update existing profile created by signals
        profile = self.other_user.profile
        profile.first_name = 'Jane'
        profile.last_name = 'Doe'
        profile.specialization = 'Crop trading'
        profile.profile_visibility = 'public'
        profile.save()
        
        url = reverse('public-profile', kwargs={'user_id': self.other_user.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'otheruser')
        self.assertEqual(response.data['full_name'], 'Jane Doe')
    
    def test_private_profile_access(self):
        """Test accessing private profile"""
        profile = self.other_user.profile
        profile.first_name = 'Jane'
        profile.last_name = 'Doe'
        profile.profile_visibility = 'private'
        profile.save()
        
        url = reverse('public-profile', kwargs={'user_id': self.other_user.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_upload_avatar(self):
        """Test avatar upload"""
        # Create a test image
        image = Image.new('RGB', (100, 100), color='red')
        image_file = io.BytesIO()
        image.save(image_file, format='JPEG')
        image_file.seek(0)
        
        uploaded_file = SimpleUploadedFile(
            "test_avatar.jpg",
            image_file.getvalue(),
            content_type="image/jpeg"
        )
        
        url = reverse('upload-avatar')
        response = self.client.post(url, {'avatar': uploaded_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile_picture', response.data)
        
        # Check if activity was logged
        activity = UserActivity.objects.filter(
            user=self.user,
            activity_type='avatar_upload'
        ).first()
        self.assertIsNotNone(activity)
    
    def test_upload_invalid_avatar(self):
        """Test uploading invalid avatar file"""
        # Create a text file instead of image
        text_file = SimpleUploadedFile(
            "test.txt",
            b"This is not an image",
            content_type="text/plain"
        )
        
        url = reverse('upload-avatar')
        response = self.client.post(url, {'avatar': text_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_request_data_export(self):
        """Test requesting data export"""
        url = reverse('request-data-export')
        data = {'export_type': 'full'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['export_type'], 'full')
        self.assertEqual(response.data['status'], 'pending')
        
        # Check if export request was created
        export_request = DataExportRequest.objects.filter(user=self.user).first()
        self.assertIsNotNone(export_request)
        
        # Check if activity was logged
        activity = UserActivity.objects.filter(
            user=self.user,
            activity_type='data_export_request'
        ).first()
        self.assertIsNotNone(activity)
    
    def test_duplicate_export_request(self):
        """Test creating duplicate export request"""
        # Create existing request
        DataExportRequest.objects.create(
            user=self.user,
            export_type='full',
            status='pending'
        )
        
        url = reverse('request-data-export')
        data = {'export_type': 'profile'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_request_data_deletion(self):
        """Test requesting data deletion"""
        url = reverse('request-data-deletion')
        data = {
            'reason': 'No longer need the account',
            'delete_profile': True,
            'delete_activity': True,
            'delete_content': False,
            'anonymize_data': False
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')
        
        # Check if deletion request was created
        deletion_request = DataDeletionRequest.objects.filter(user=self.user).first()
        self.assertIsNotNone(deletion_request)
        self.assertTrue(deletion_request.delete_profile)
    
    def test_get_user_activities(self):
        """Test getting user activities"""
        # Clear existing activities from signals
        UserActivity.objects.filter(user=self.user).delete()
        
        # Create some activities
        UserActivity.objects.create(
            user=self.user,
            activity_type='login',
            description='User logged in',
            ip_address='127.0.0.1'
        )
        
        UserActivity.objects.create(
            user=self.user,
            activity_type='profile_update',
            description='User updated profile',
            ip_address='127.0.0.1'
        )
        
        url = reverse('user-activities')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_health_check(self):
        """Test health check endpoint"""
        url = reverse('user-service-health')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['service'], 'user-service')
        self.assertIn('status', response.data)
        self.assertIn('checks', response.data)

class UserServiceAuthenticationTest(APITestCase):
    """Test authentication requirements"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_unauthenticated_access(self):
        """Test that endpoints require authentication"""
        endpoints = [
            reverse('user-profile'),
            reverse('user-preferences'),
            reverse('user-activities'),
            reverse('search-users'),
            reverse('request-data-export'),
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class GDPRComplianceTest(TestCase):
    """Test GDPR compliance features"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Profile and preferences are created automatically by signals
        self.profile = self.user.profile
        self.profile.first_name = 'John'
        self.profile.last_name = 'Doe'
        self.profile.save()
        
        self.preferences = self.user.preferences
    
    def test_data_export_creation(self):
        """Test creating data export"""
        from users.management.commands.process_data_exports import Command
        
        # Update profile with test data
        self.profile.first_name = 'John'
        self.profile.save()
        
        export_request = DataExportRequest.objects.create(
            user=self.user,
            export_type='full'
        )
        
        command = Command()
        export_data = command.create_export_data(export_request)
        
        self.assertIn('user', export_data)
        self.assertIn('profile', export_data)
        self.assertIn('preferences', export_data)
        self.assertEqual(export_data['user']['username'], 'testuser')
        self.assertEqual(export_data['profile']['first_name'], 'John')
    
    @patch('os.makedirs')
    @patch('builtins.open')
    @patch('zipfile.ZipFile')
    @patch('os.remove')
    def test_export_file_creation(self, mock_remove, mock_zipfile, mock_open, mock_makedirs):
        """Test export file creation"""
        from users.management.commands.process_data_exports import Command
        
        export_request = DataExportRequest.objects.create(
            user=self.user,
            export_type='full'
        )
        
        command = Command()
        export_data = {'test': 'data'}
        
        # Mock file operations
        mock_open.return_value.__enter__.return_value = mock_open.return_value
        mock_zipfile.return_value.__enter__.return_value = mock_zipfile.return_value
        
        file_path = command.create_export_file(export_request, export_data)
        
        self.assertIsNotNone(file_path)
        mock_makedirs.assert_called_once()
        mock_open.assert_called()
        mock_zipfile.assert_called()
        mock_remove.assert_called_once()

class UserSignalsTest(TestCase):
    """Test user signal handlers"""
    
    def test_profile_creation_on_user_creation(self):
        """Test that profile and preferences are created when user is created"""
        user = User.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='testpass123'
        )
        
        # Check if profile was created
        self.assertTrue(hasattr(user, 'profile'))
        self.assertIsNotNone(user.profile)
        
        # Check if preferences were created
        self.assertTrue(hasattr(user, 'preferences'))
        self.assertIsNotNone(user.preferences)
        
        # Check if activity was logged
        activity = UserActivity.objects.filter(
            user=user,
            activity_type='profile_created'
        ).first()
        self.assertIsNotNone(activity)
