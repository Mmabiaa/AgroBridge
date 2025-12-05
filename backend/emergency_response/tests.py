"""Tests for emergency response service."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
from datetime import timedelta
from .models import (
    EmergencyAlert, IncidentReport, AlertAcknowledgment,
    EmergencyGuideline, IncidentAnalytics
)
from .services import AlertService, IncidentService, AnalyticsService

User = get_user_model()


class EmergencyAlertModelTest(TestCase):
    """Test EmergencyAlert model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_alert_creation(self):
        """Test alert is created correctly."""
        alert = EmergencyAlert.objects.create(
            alert_number='ALERT-WEA-20231201',
            alert_type='WEATHER',
            severity='HIGH',
            title='Heavy Rain Warning',
            description='Heavy rainfall expected',
            response_guidelines='Stay indoors',
            created_by=self.user
        )
        
        self.assertEqual(alert.alert_type, 'WEATHER')
        self.assertEqual(alert.severity, 'HIGH')
        self.assertEqual(alert.status, 'DRAFT')
    
    def test_alert_str(self):
        """Test alert string representation."""
        alert = EmergencyAlert.objects.create(
            alert_number='ALERT-WEA-20231201',
            alert_type='WEATHER',
            severity='HIGH',
            title='Heavy Rain Warning',
            description='Heavy rainfall expected',
            response_guidelines='Stay indoors',
            created_by=self.user
        )
        
        expected = "ALERT-WEA-20231201 - Heavy Rain Warning"
        self.assertEqual(str(alert), expected)


class IncidentReportModelTest(TestCase):
    """Test IncidentReport model."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_report_creation(self):
        """Test report is created correctly."""
        report = IncidentReport.objects.create(
            report_number='INC-PES-20231201',
            reporter=self.user,
            incident_type='PEST',
            title='Locust Infestation',
            description='Large swarm observed',
            location_description='Northern Region'
        )
        
        self.assertEqual(report.incident_type, 'PEST')
        self.assertEqual(report.status, 'PENDING')
        self.assertEqual(report.reporter, self.user)


class AlertServiceTest(TestCase):
    """Test AlertService."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
    
    def test_generate_alert_number(self):
        """Test alert number generation."""
        alert_number = AlertService.generate_alert_number('WEATHER')
        self.assertTrue(alert_number.startswith('ALERT-WEA-'))
    
    def test_create_alert(self):
        """Test alert creation."""
        data = {
            'alert_type': 'WEATHER',
            'severity': 'HIGH',
            'title': 'Storm Warning',
            'description': 'Severe storm approaching',
            'response_guidelines': 'Seek shelter',
            'emergency_contacts': {},
            'regions': ['Northern'],
            'expires_at': timezone.now() + timedelta(days=3)
        }
        
        alert = AlertService.create_alert(self.user, data)
        
        self.assertIsNotNone(alert.alert_number)
        self.assertEqual(alert.status, 'ACTIVE')
        self.assertIsNotNone(alert.issued_at)
    
    def test_get_active_alerts(self):
        """Test getting active alerts."""
        # Create active alert
        alert = EmergencyAlert.objects.create(
            alert_number='ALERT-WEA-001',
            alert_type='WEATHER',
            severity='HIGH',
            title='Test Alert',
            description='Test',
            response_guidelines='Test',
            status='ACTIVE',
            issued_at=timezone.now(),
            created_by=self.user
        )
        
        active_alerts = AlertService.get_active_alerts()
        self.assertIn(alert, active_alerts)
    
    def test_acknowledge_alert(self):
        """Test alert acknowledgment."""
        alert = EmergencyAlert.objects.create(
            alert_number='ALERT-WEA-001',
            alert_type='WEATHER',
            severity='HIGH',
            title='Test Alert',
            description='Test',
            response_guidelines='Test',
            status='ACTIVE',
            created_by=self.user
        )
        
        ack = AlertService.acknowledge_alert(alert, self.user)
        
        self.assertEqual(ack.alert, alert)
        self.assertEqual(ack.user, self.user)
        self.assertEqual(alert.acknowledgment_count, 1)


class IncidentServiceTest(TestCase):
    """Test IncidentService."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.staff = User.objects.create_user(
            email='staff@example.com',
            password='testpass123',
            is_staff=True
        )
    
    def test_generate_report_number(self):
        """Test report number generation."""
        report_number = IncidentService.generate_report_number('PEST')
        self.assertTrue(report_number.startswith('INC-PES-'))
    
    def test_create_report(self):
        """Test report creation."""
        data = {
            'incident_type': 'PEST',
            'title': 'Pest Outbreak',
            'description': 'Locusts observed',
            'location_description': 'Northern Region',
            'region': 'Northern'
        }
        
        report = IncidentService.create_report(self.user, data)
        
        self.assertIsNotNone(report.report_number)
        self.assertEqual(report.status, 'PENDING')
        self.assertEqual(report.reporter, self.user)
    
    def test_verify_report(self):
        """Test report verification."""
        report = IncidentReport.objects.create(
            report_number='INC-PES-001',
            reporter=self.user,
            incident_type='PEST',
            title='Test Report',
            description='Test',
            location_description='Test Location'
        )
        
        verified_report = IncidentService.verify_report(report, self.staff, 'HIGH')
        
        self.assertEqual(verified_report.status, 'VERIFIED')
        self.assertEqual(verified_report.verified_by, self.staff)
        self.assertEqual(verified_report.severity_assessment, 'HIGH')
        self.assertIsNotNone(verified_report.verified_at)


class EmergencyAlertAPITest(APITestCase):
    """Test EmergencyAlert API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.staff = User.objects.create_user(
            email='staff@example.com',
            password='testpass123',
            is_staff=True
        )
        self.client.force_authenticate(user=self.staff)
    
    def test_create_alert(self):
        """Test creating an alert via API."""
        data = {
            'alert_type': 'WEATHER',
            'severity': 'HIGH',
            'title': 'Storm Warning',
            'description': 'Severe storm approaching',
            'response_guidelines': 'Seek shelter immediately',
            'emergency_contacts': {},
            'regions': ['Northern'],
            'expires_at': (timezone.now() + timedelta(days=3)).isoformat()
        }
        
        response = self.client.post('/api/emergency/alerts/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('alert_number', response.data)
    
    def test_list_alerts(self):
        """Test listing alerts."""
        EmergencyAlert.objects.create(
            alert_number='ALERT-WEA-001',
            alert_type='WEATHER',
            severity='HIGH',
            title='Test Alert',
            description='Test',
            response_guidelines='Test',
            created_by=self.staff
        )
        
        response = self.client.get('/api/emergency/alerts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_acknowledge_alert(self):
        """Test acknowledging an alert."""
        alert = EmergencyAlert.objects.create(
            alert_number='ALERT-WEA-001',
            alert_type='WEATHER',
            severity='HIGH',
            title='Test Alert',
            description='Test',
            response_guidelines='Test',
            status='ACTIVE',
            created_by=self.staff
        )
        
        response = self.client.post(
            f'/api/emergency/alerts/{alert.id}/acknowledge/',
            {'notes': 'Acknowledged'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class IncidentReportAPITest(APITestCase):
    """Test IncidentReport API endpoints."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_report(self):
        """Test creating a report via API."""
        data = {
            'incident_type': 'PEST',
            'title': 'Locust Swarm',
            'description': 'Large swarm of locusts observed',
            'location_description': 'Northern Region, near Tamale',
            'region': 'Northern',
            'latitude': '9.4034',
            'longitude': '-0.8424'
        }
        
        response = self.client.post('/api/emergency/incidents/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('report_number', response.data)
    
    def test_list_own_reports(self):
        """Test listing own reports."""
        IncidentReport.objects.create(
            report_number='INC-PES-001',
            reporter=self.user,
            incident_type='PEST',
            title='Test Report',
            description='Test',
            location_description='Test Location'
        )
        
        response = self.client.get('/api/emergency/incidents/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class AnalyticsServiceTest(TestCase):
    """Test AnalyticsService."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        # Create some test data
        for i in range(5):
            IncidentReport.objects.create(
                report_number=f'INC-PES-00{i}',
                reporter=self.user,
                incident_type='PEST',
                title=f'Test Report {i}',
                description='Test',
                location_description='Test Location',
                region='Northern',
                status='VERIFIED' if i < 3 else 'PENDING'
            )
    
    def test_generate_analytics(self):
        """Test analytics generation."""
        start_date = timezone.now().date() - timedelta(days=7)
        end_date = timezone.now().date()
        
        analytics = AnalyticsService.generate_analytics(start_date, end_date, 'Northern')
        
        self.assertEqual(analytics.total_incidents, 5)
        self.assertGreater(analytics.verification_rate, 0)
        self.assertIsInstance(analytics.incidents_by_type, dict)
