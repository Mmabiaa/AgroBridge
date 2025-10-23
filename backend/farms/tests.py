from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
import uuid

from .models import Farm, Crop, Livestock, FarmActivity, Equipment
from .analytics import FarmAnalytics, FarmPerformanceMonitor

User = get_user_model()


class FarmModelTest(TestCase):
    """Test Farm model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.farm_data = {
            'name': 'Test Farm',
            'description': 'A test farm for testing',
            'location': {'latitude': 5.6037, 'longitude': -0.1870, 'address': 'Accra, Ghana'},
            'size_hectares': Decimal('10.50'),
            'farm_type': 'mixed',
            'established_date': date(2020, 1, 1),
            'certification': 'organic'
        }
    
    def test_create_farm(self):
        """Test farm creation"""
        farm = Farm.objects.create(owner=self.user, **self.farm_data)
        
        self.assertEqual(farm.name, 'Test Farm')
        self.assertEqual(farm.owner, self.user)
        self.assertEqual(farm.size_hectares, Decimal('10.50'))
        self.assertEqual(farm.farm_type, 'mixed')
        self.assertTrue(farm.is_active)
        self.assertFalse(farm.is_public)
    
    def test_farm_str_representation(self):
        """Test farm string representation"""
        farm = Farm.objects.create(owner=self.user, **self.farm_data)
        self.assertEqual(str(farm), 'Test Farm (farmer1)')
    
    def test_farm_age_calculation(self):
        """Test farm age calculation"""
        farm = Farm.objects.create(owner=self.user, **self.farm_data)
        expected_age = (timezone.now().date() - farm.established_date).days // 365
        self.assertEqual(farm.farm_age_years, expected_age)


class CropModelTest(TestCase):
    """Test Crop model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={},
            size_hectares=Decimal('10.00'),
            farm_type='crop',
            established_date=date(2020, 1, 1)
        )
        
        self.crop_data = {
            'name': 'Tomatoes',
            'variety': 'Roma',
            'planting_date': date.today(),
            'expected_harvest_date': date.today() + timedelta(days=90),
            'area_hectares': Decimal('2.50'),
            'status': 'planted',
            'season': 'dry',
            'expected_yield_kg': Decimal('5000.00')
        }
    
    def test_create_crop(self):
        """Test crop creation"""
        crop = Crop.objects.create(farm=self.farm, **self.crop_data)
        
        self.assertEqual(crop.name, 'Tomatoes')
        self.assertEqual(crop.farm, self.farm)
        self.assertEqual(crop.area_hectares, Decimal('2.50'))
        self.assertEqual(crop.status, 'planted')
    
    def test_days_to_harvest_calculation(self):
        """Test days to harvest calculation"""
        crop = Crop.objects.create(farm=self.farm, **self.crop_data)
        expected_days = (crop.expected_harvest_date - timezone.now().date()).days
        self.assertEqual(crop.days_to_harvest, expected_days)
    
    def test_growth_stage_percentage(self):
        """Test growth stage percentage calculation"""
        crop = Crop.objects.create(farm=self.farm, **self.crop_data)
        
        # Should be a percentage between 0 and 100
        percentage = crop.growth_stage_percentage
        self.assertGreaterEqual(percentage, 0)
        self.assertLessEqual(percentage, 100)
    
    def test_yield_efficiency_calculation(self):
        """Test yield efficiency calculation"""
        crop_data = self.crop_data.copy()
        crop_data['status'] = 'harvested'
        crop_data['actual_yield_kg'] = Decimal('4500.00')
        
        crop = Crop.objects.create(farm=self.farm, **crop_data)
        
        expected_efficiency = (crop.actual_yield_kg / crop.expected_yield_kg) * 100
        self.assertEqual(crop.yield_efficiency, expected_efficiency)


class FarmAPITest(APITestCase):
    """Test Farm API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.other_user = User.objects.create_user(
            username='farmer2',
            email='farmer2@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.farm_data = {
            'name': 'Test Farm',
            'description': 'A test farm',
            'location': {'latitude': 5.6037, 'longitude': -0.1870},
            'size_hectares': '10.50',
            'farm_type': 'mixed',
            'established_date': '2020-01-01',
            'certification': 'organic'
        }
    
    def test_create_farm(self):
        """Test farm creation via API"""
        url = reverse('farm-list')
        response = self.client.post(url, self.farm_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Farm.objects.count(), 1)
        
        farm = Farm.objects.first()
        self.assertEqual(farm.owner, self.user)
        self.assertEqual(farm.name, 'Test Farm')
    
    def test_list_user_farms(self):
        """Test listing user's farms"""
        # Create farms for both users
        Farm.objects.create(
            owner=self.user,
            name='User Farm',
            location={},
            size_hectares=Decimal('5.00'),
            farm_type='crop',
            established_date=date(2020, 1, 1)
        )
        
        Farm.objects.create(
            owner=self.other_user,
            name='Other Farm',
            location={},
            size_hectares=Decimal('3.00'),
            farm_type='livestock',
            established_date=date(2020, 1, 1),
            is_public=False
        )
        
        url = reverse('farm-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'User Farm')
    
    def test_farm_permissions(self):
        """Test farm access permissions"""
        # Create farm owned by other user
        other_farm = Farm.objects.create(
            owner=self.other_user,
            name='Other Farm',
            location={},
            size_hectares=Decimal('3.00'),
            farm_type='livestock',
            established_date=date(2020, 1, 1),
            is_public=False
        )
        
        # Try to access other user's private farm
        url = reverse('farm-detail', kwargs={'pk': other_farm.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Make farm public and try again
        other_farm.is_public = True
        other_farm.save()
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_farm_analytics(self):
        """Test farm analytics endpoint"""
        farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={},
            size_hectares=Decimal('10.00'),
            farm_type='mixed',
            established_date=date(2020, 1, 1)
        )
        
        url = reverse('farm-analytics', kwargs={'pk': farm.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('farm_overview', response.data)
        self.assertIn('crop_analytics', response.data)
        self.assertIn('livestock_analytics', response.data)
    
    def test_farm_dashboard(self):
        """Test farm dashboard endpoint"""
        Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={},
            size_hectares=Decimal('10.00'),
            farm_type='mixed',
            established_date=date(2020, 1, 1)
        )
        
        url = reverse('farm-dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overview', response.data)
        self.assertIn('alerts', response.data)
        self.assertIn('summary', response.data)


class CropAPITest(APITestCase):
    """Test Crop API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={},
            size_hectares=Decimal('10.00'),
            farm_type='crop',
            established_date=date(2020, 1, 1)
        )
        
        self.crop_data = {
            'farm': str(self.farm.id),
            'name': 'Tomatoes',
            'variety': 'Roma',
            'planting_date': date.today().isoformat(),
            'expected_harvest_date': (date.today() + timedelta(days=90)).isoformat(),
            'area_hectares': '2.50',
            'status': 'planted',
            'season': 'dry',
            'expected_yield_kg': '5000.00'
        }
    
    def test_create_crop(self):
        """Test crop creation via API"""
        url = reverse('crop-list')
        response = self.client.post(url, self.crop_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Crop.objects.count(), 1)
        
        crop = Crop.objects.first()
        self.assertEqual(crop.farm, self.farm)
        self.assertEqual(crop.name, 'Tomatoes')
    
    def test_update_crop_status(self):
        """Test updating crop status"""
        crop = Crop.objects.create(
            farm=self.farm,
            name='Tomatoes',
            planting_date=date.today(),
            expected_harvest_date=date.today() + timedelta(days=90),
            area_hectares=Decimal('2.50'),
            status='planted',
            season='dry'
        )
        
        url = reverse('crop-update-status', kwargs={'pk': crop.id})
        response = self.client.post(url, {'status': 'growing'}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        crop.refresh_from_db()
        self.assertEqual(crop.status, 'growing')
    
    def test_record_harvest(self):
        """Test recording harvest data"""
        crop = Crop.objects.create(
            farm=self.farm,
            name='Tomatoes',
            planting_date=date.today() - timedelta(days=90),
            expected_harvest_date=date.today(),
            area_hectares=Decimal('2.50'),
            status='fruiting',
            season='dry',
            expected_yield_kg=Decimal('5000.00')
        )
        
        url = reverse('crop-record-harvest', kwargs={'pk': crop.id})
        response = self.client.post(url, {
            'actual_yield_kg': '4500.00',
            'harvest_date': date.today().isoformat()
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        crop.refresh_from_db()
        self.assertEqual(crop.status, 'harvested')
        self.assertEqual(crop.actual_yield_kg, Decimal('4500.00'))


class FarmAnalyticsTest(TestCase):
    """Test farm analytics functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={},
            size_hectares=Decimal('10.00'),
            farm_type='mixed',
            established_date=date(2020, 1, 1)
        )
        
        # Create some test data
        self.crop = Crop.objects.create(
            farm=self.farm,
            name='Tomatoes',
            planting_date=date.today() - timedelta(days=30),
            expected_harvest_date=date.today() + timedelta(days=60),
            area_hectares=Decimal('2.50'),
            status='growing',
            season='dry',
            expected_yield_kg=Decimal('5000.00')
        )
        
        self.livestock = Livestock.objects.create(
            farm=self.farm,
            animal_type='chickens',
            breed='Rhode Island Red',
            count=50,
            purpose='eggs',
            health_status='good',
            acquisition_date=date.today() - timedelta(days=60)
        )
    
    def test_farm_analytics_creation(self):
        """Test creating FarmAnalytics instance"""
        analytics = FarmAnalytics(farm=self.farm)
        self.assertEqual(analytics.farm, self.farm)
    
    def test_get_farm_overview(self):
        """Test getting farm overview"""
        analytics = FarmAnalytics(farm=self.farm)
        overview = analytics.get_farm_overview()
        
        self.assertEqual(overview['total_farms'], 1)
        self.assertEqual(overview['total_area'], Decimal('10.00'))
        self.assertEqual(overview['active_farms'], 1)
    
    def test_get_crop_analytics(self):
        """Test getting crop analytics"""
        analytics = FarmAnalytics(farm=self.farm)
        crop_data = analytics.get_crop_analytics()
        
        self.assertEqual(crop_data['total_crops'], 1)
        self.assertEqual(crop_data['total_area'], Decimal('2.50'))
        self.assertIn('growing', crop_data['status_breakdown'])
    
    def test_get_livestock_analytics(self):
        """Test getting livestock analytics"""
        analytics = FarmAnalytics(farm=self.farm)
        livestock_data = analytics.get_livestock_analytics()
        
        self.assertEqual(livestock_data['total_livestock_groups'], 1)
        self.assertEqual(livestock_data['total_animals'], 50)
        self.assertIn('chickens', livestock_data['type_breakdown'])


class FarmPerformanceMonitorTest(TestCase):
    """Test farm performance monitoring"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer1@test.com',
            password='testpass123'
        )
        
        self.farm = Farm.objects.create(
            owner=self.user,
            name='Test Farm',
            location={},
            size_hectares=Decimal('10.00'),
            farm_type='mixed',
            established_date=date(2020, 1, 1)
        )
    
    def test_performance_monitor_creation(self):
        """Test creating FarmPerformanceMonitor instance"""
        monitor = FarmPerformanceMonitor(self.farm)
        self.assertEqual(monitor.farm, self.farm)
    
    def test_overdue_activity_alert(self):
        """Test alert for overdue activities"""
        # Create overdue activity
        FarmActivity.objects.create(
            farm=self.farm,
            activity_type='watering',
            title='Water crops',
            description='Water the tomato crops',
            scheduled_date=timezone.now() - timedelta(days=1),
            status='planned'
        )
        
        monitor = FarmPerformanceMonitor(self.farm)
        alerts = monitor.get_performance_alerts()
        
        # Should have an alert for overdue activity
        overdue_alerts = [a for a in alerts if a['category'] == 'activities']
        self.assertTrue(len(overdue_alerts) > 0)
        self.assertEqual(overdue_alerts[0]['type'], 'warning')
    
    def test_harvest_ready_alert(self):
        """Test alert for crops ready for harvest"""
        # Create crop ready for harvest
        Crop.objects.create(
            farm=self.farm,
            name='Tomatoes',
            planting_date=date.today() - timedelta(days=90),
            expected_harvest_date=date.today() + timedelta(days=1),
            area_hectares=Decimal('2.50'),
            status='fruiting',
            season='dry'
        )
        
        monitor = FarmPerformanceMonitor(self.farm)
        alerts = monitor.get_performance_alerts()
        
        # Should have an alert for harvest ready
        harvest_alerts = [a for a in alerts if a['category'] == 'crops']
        self.assertTrue(len(harvest_alerts) > 0)
        self.assertEqual(harvest_alerts[0]['type'], 'info')
    
    def test_productivity_metrics(self):
        """Test productivity metrics calculation"""
        # Create completed crop with yield data
        Crop.objects.create(
            farm=self.farm,
            name='Tomatoes',
            planting_date=date.today() - timedelta(days=120),
            expected_harvest_date=date.today() - timedelta(days=30),
            actual_harvest_date=date.today() - timedelta(days=30),
            area_hectares=Decimal('2.50'),
            status='harvested',
            season='dry',
            expected_yield_kg=Decimal('5000.00'),
            actual_yield_kg=Decimal('4500.00')
        )
        
        monitor = FarmPerformanceMonitor(self.farm)
        metrics = monitor.get_productivity_metrics()
        
        self.assertIsNotNone(metrics['yield_efficiency'])
        self.assertGreaterEqual(metrics['yield_efficiency'], 0)
        self.assertEqual(metrics['total_farm_area'], Decimal('10.00'))
