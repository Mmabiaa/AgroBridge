"""
Data Management Service Tests
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status

from .models import (
    DataRetentionPolicy, DataDeletionLog, GDPRRequest,
    UserConsent, DataExport, DataProcessingRecord
)
from .services import DataRetentionService, GDPRService, DataExportService

User = get_user_model()


class DataRetentionPolicyTestCase(TestCase):
    """Test cases for data retention policies."""
    
    def setUp(self):
        self.policy = DataRetentionPolicy.objects.create(
            data_type='sensor_data',
            retention_days=730,
            description='Test policy',
            status='active'
        )
    
    def test_policy_creation(self):
        """Test creating a retention policy."""
        self.assertEqual(self.policy.data_type, 'sensor_data')
        self.assertEqual(self.policy.retention_days, 730)
        self.assertEqual(self.policy.status, 'active')
    
    def test_policy_string_representation(self):
        """Test string representation of policy."""
        expected = f"Sensor Data - 730 days"
        self.assertEqual(str(self.policy), expected)


class GDPRRequestTestCase(TestCase):
    """Test cases for GDPR requests."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.gdpr_request = GDPRRequest.objects.create(
            user=self.user,
            request_type='access',
            reason='I want to see my data'
        )
    
    def test_gdpr_request_creation(self):
        """Test creating a GDPR request."""
        self.assertEqual(self.gdpr_request.user, self.user)
        self.assertEqual(self.gdpr_request.request_type, 'access')
        self.assertEqual(self.gdpr_request.status, 'pending')
    
    def test_is_overdue(self):
        """Test overdue detection."""
        # New request should not be overdue
        self.assertFalse(self.gdpr_request.is_overdue)
        
        # Make request old
        self.gdpr_request.requested_at = timezone.now() - timedelta(days=31)
        self.gdpr_request.save()
        self.assertTrue(self.gdpr_request.is_overdue)
        
        # Completed requests are never overdue
        self.gdpr_request.status = 'completed'
        self.gdpr_request.save()
        self.assertFalse(self.gdpr_request.is_overdue)


class UserConsentTestCase(TestCase):
    """Test cases for user consents."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.consent = UserConsent.objects.create(
            user=self.user,
            consent_type='marketing',
            granted=True,
            granted_at=timezone.now(),
            version='1.0'
        )
    
    def test_consent_creation(self):
        """Test creating a consent."""
        self.assertEqual(self.consent.user, self.user)
        self.assertEqual(self.consent.consent_type, 'marketing')
        self.assertTrue(self.consent.granted)
    
    def test_withdraw_consent(self):
        """Test withdrawing consent."""
        self.consent.withdraw()
        self.assertFalse(self.consent.granted)
        self.assertIsNotNone(self.consent.withdrawn_at)


class DataExportTestCase(TestCase):
    """Test cases for data exports."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.export = DataExport.objects.create(
            user=self.user,
            status='completed',
            file_path='/exports/test.json',
            file_size=1024,
            expires_at=timezone.now() + timedelta(days=7)
        )
    
    def test_export_creation(self):
        """Test creating a data export."""
        self.assertEqual(self.export.user, self.user)
        self.assertEqual(self.export.status, 'completed')
    
    def test_is_expired(self):
        """Test expiry detection."""
        # Should not be expired
        self.assertFalse(self.export.is_expired)
        
        # Make it expired
        self.export.expires_at = timezone.now() - timedelta(days=1)
        self.export.save()
        self.assertTrue(self.export.is_expired)


class DataRetentionServiceTestCase(TestCase):
    """Test cases for data retention service."""
    
    def setUp(self):
        self.service = DataRetentionService()
        self.policy = DataRetentionPolicy.objects.create(
            data_type='sensor_data',
            retention_days=30,
            description='Test policy',
            status='active'
        )
    
    def test_apply_policy(self):
        """Test applying a retention policy."""
        result = self.service.apply_policy(self.policy)
        
        self.assertIn('policy_id', result)
        self.assertIn('data_type', result)
        self.assertIn('records_deleted', result)
        self.assertEqual(result['data_type'], 'sensor_data')


class GDPRServiceTestCase(TestCase):
    """Test cases for GDPR service."""
    
    def setUp(self):
        self.service = GDPRService()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_process_access_request(self):
        """Test processing an access request."""
        gdpr_request = GDPRRequest.objects.create(
            user=self.user,
            request_type='access'
        )
        
        result = self.service.process_request(gdpr_request)
        
        self.assertIn('message', result)
        self.assertIn('export_id', result)
        gdpr_request.refresh_from_db()
        self.assertEqual(gdpr_request.status, 'completed')


class DataExportServiceTestCase(TestCase):
    """Test cases for data export service."""
    
    def setUp(self):
        self.service = DataExportService()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_export_request(self):
        """Test creating an export request."""
        export = self.service.create_export_request(self.user)
        
        self.assertEqual(export.user, self.user)
        self.assertIn(export.status, ['pending', 'processing', 'completed'])


class DataManagementAPITestCase(APITestCase):
    """Test cases for data management API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_gdpr_request(self):
        """Test creating a GDPR request via API."""
        url = '/api/data-management/gdpr-requests/'
        data = {
            'request_type': 'access',
            'reason': 'I want to see my data'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['request_type'], 'access')
    
    def test_update_consent(self):
        """Test updating consent via API."""
        url = '/api/data-management/consents/update_consent/'
        data = {
            'consent_type': 'marketing',
            'granted': True,
            'version': '1.0'
        }
        
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['granted'])
    
    def test_request_data_export(self):
        """Test requesting data export via API."""
        url = '/api/data-management/exports/request_export/'
        
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user'], self.user.id)
