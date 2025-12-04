from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
import uuid

from .models import Farm, Field, Crop, Livestock, FarmActivity, Equipment, SatelliteImagery
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


class FieldModelTest(TestCase):
    """Test Field model functionality"""
    
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
        
        self.field_data = {
            'name': 'North Field',
            'description': 'Northern section of the farm',
            'boundary_geojson': {
                "type": "Polygon",
                "coordinates": [[
                    [-0.1870, 5.6037],
                    [-0.1860, 5.6037],
                    [-0.1860, 5.6047],
                    [-0.1870, 5.6047],
                    [-0.1870, 5.6037]
                ]]
            },
            'area_hectares': Decimal('2.50'),
            'soil_type': 'loam',
            'irrigation_type': 'drip'
        }
    
    def test_create_field(self):
        """Test field creation"""
        field = Field.objects.create(farm=self.farm, **self.field_data)
        
        self.assertEqual(field.name, 'North Field')
        self.assertEqual(field.farm, self.farm)
        self.assertEqual(field.area_hectares, Decimal('2.50'))
        self.assertEqual(field.soil_type, 'loam')
    
    def test_field_str_representation(self):
        """Test field string representation"""
        field = Field.objects.create(farm=self.farm, **self.field_data)
        self.assertEqual(str(field), 'North Field - Test Farm')
    
    def test_geojson_validation(self):
        """Test GeoJSON validation"""
        field = Field.objects.create(farm=self.farm, **self.field_data)
        is_valid, message = field.validate_geojson()
        
        self.assertTrue(is_valid)
        self.assertEqual(message, "Valid GeoJSON")
    
    def test_center_coordinates_calculation(self):
        """Test center coordinates calculation"""
        field = Field.objects.create(farm=self.farm, **self.field_data)
        center = field.center_coordinates
        
        self.assertIsNotNone(center)
        self.assertIn('latitude', center)
        self.assertIn('longitude', center)
    
    def test_invalid_geojson(self):
        """Test invalid GeoJSON validation"""
        invalid_data = self.field_data.copy()
        invalid_data['boundary_geojson'] = {
            "type": "Point",  # Should be Polygon
            "coordinates": [-0.1870, 5.6037]
        }
        
        field = Field(farm=self.farm, **invalid_data)
        is_valid, message = field.validate_geojson()
        
        self.assertFalse(is_valid)
        self.assertIn("Polygon", message)


class SatelliteImageryModelTest(TestCase):
    """Test SatelliteImagery model functionality"""
    
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
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Test Field',
            boundary_geojson={
                "type": "Polygon",
                "coordinates": [[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]
            },
            area_hectares=Decimal('2.00')
        )
        
        self.imagery_data = {
            'satellite_name': 'sentinel2',
            'imagery_type': 'optical',
            'acquisition_date': timezone.now(),
            'cloud_coverage_percentage': Decimal('15.5'),
            'resolution_meters': Decimal('10.0'),
            'image_url': 'https://example.com/image.tif'
        }
    
    def test_create_satellite_imagery(self):
        """Test satellite imagery creation"""
        imagery = SatelliteImagery.objects.create(field=self.field, **self.imagery_data)
        
        self.assertEqual(imagery.field, self.field)
        self.assertEqual(imagery.satellite_name, 'sentinel2')
        self.assertEqual(imagery.imagery_type, 'optical')
        self.assertFalse(imagery.is_processed)
    
    def test_imagery_str_representation(self):
        """Test imagery string representation"""
        imagery = SatelliteImagery.objects.create(field=self.field, **self.imagery_data)
        expected_str = f"sentinel2 - Test Field - {imagery.acquisition_date.date()}"
        self.assertEqual(str(imagery), expected_str)
    
    def test_vegetation_indices_calculation(self):
        """Test vegetation indices calculation"""
        imagery = SatelliteImagery.objects.create(field=self.field, **self.imagery_data)
        
        # Calculate indices
        indices = imagery.calculate_vegetation_indices(
            red_band=0.3,
            nir_band=0.7,
            blue_band=0.2
        )
        
        self.assertIn('ndvi_average', indices)
        self.assertIn('evi_average', indices)
        
        # NDVI should be (0.7 - 0.3) / (0.7 + 0.3) = 0.4
        self.assertAlmostEqual(indices['ndvi_average'], 0.4, places=2)
        
        # Verify data was saved
        imagery.refresh_from_db()
        self.assertAlmostEqual(imagery.ndvi_average, 0.4, places=2)
    
    def test_ndvi_property(self):
        """Test NDVI property access"""
        imagery = SatelliteImagery.objects.create(
            field=self.field,
            vegetation_indices={'ndvi_average': 0.75},
            **self.imagery_data
        )
        
        self.assertEqual(imagery.ndvi_average, 0.75)


class FieldAPITest(APITestCase):
    """Test Field API endpoints"""
    
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
        
        self.field_data = {
            'farm': str(self.farm.id),
            'name': 'North Field',
            'boundary_geojson': {
                "type": "Polygon",
                "coordinates": [[
                    [-0.1870, 5.6037],
                    [-0.1860, 5.6037],
                    [-0.1860, 5.6047],
                    [-0.1870, 5.6047],
                    [-0.1870, 5.6037]
                ]]
            },
            'area_hectares': '2.50',
            'soil_type': 'loam',
            'irrigation_type': 'drip'
        }
    
    def test_create_field(self):
        """Test field creation via API"""
        url = reverse('field-list')
        response = self.client.post(url, self.field_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Field.objects.count(), 1)
        
        field = Field.objects.first()
        self.assertEqual(field.farm, self.farm)
        self.assertEqual(field.name, 'North Field')
    
    def test_validate_boundary(self):
        """Test boundary validation endpoint"""
        field = Field.objects.create(
            farm=self.farm,
            name='Test Field',
            boundary_geojson=self.field_data['boundary_geojson'],
            area_hectares=Decimal('2.50')
        )
        
        url = reverse('field-validate-boundary', kwargs={'pk': field.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_valid'])
        self.assertIn('center_coordinates', response.data)


class SatelliteImageryAPITest(APITestCase):
    """Test SatelliteImagery API endpoints"""
    
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
        
        self.field = Field.objects.create(
            farm=self.farm,
            name='Test Field',
            boundary_geojson={
                "type": "Polygon",
                "coordinates": [[[-1, 1], [1, 1], [1, -1], [-1, -1], [-1, 1]]]
            },
            area_hectares=Decimal('2.00')
        )
        
        self.imagery_data = {
            'field': str(self.field.id),
            'satellite_name': 'sentinel2',
            'imagery_type': 'optical',
            'acquisition_date': timezone.now().isoformat(),
            'cloud_coverage_percentage': '15.5',
            'resolution_meters': '10.0',
            'image_url': 'https://example.com/image.tif'
        }
    
    def test_create_satellite_imagery(self):
        """Test satellite imagery creation via API"""
        url = reverse('satelliteimagery-list')
        response = self.client.post(url, self.imagery_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SatelliteImagery.objects.count(), 1)
        
        imagery = SatelliteImagery.objects.first()
        self.assertEqual(imagery.field, self.field)
        self.assertEqual(imagery.satellite_name, 'sentinel2')
    
    def test_process_imagery(self):
        """Test imagery processing endpoint"""
        imagery = SatelliteImagery.objects.create(
            field=self.field,
            satellite_name='sentinel2',
            imagery_type='optical',
            acquisition_date=timezone.now(),
            cloud_coverage_percentage=Decimal('10.0'),
            resolution_meters=Decimal('10.0')
        )
        
        url = reverse('satelliteimagery-process-imagery', kwargs={'pk': imagery.id})
        data = {
            'red_band': 0.3,
            'nir_band': 0.7,
            'blue_band': 0.2
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('vegetation_indices', response.data)
        
        # Verify imagery was processed
        imagery.refresh_from_db()
        self.assertTrue(imagery.is_processed)
    
    def test_analyze_crop_health(self):
        """Test crop health analysis endpoint"""
        imagery = SatelliteImagery.objects.create(
            field=self.field,
            satellite_name='sentinel2',
            imagery_type='optical',
            acquisition_date=timezone.now(),
            cloud_coverage_percentage=Decimal('10.0'),
            resolution_meters=Decimal('10.0'),
            vegetation_indices={'ndvi_average': 0.8}
        )
        
        url = reverse('satelliteimagery-analyze-crop-health', kwargs={'pk': imagery.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('crop_health_score', response.data)
        self.assertIn('stress_level', response.data)
        
        # Verify health score was calculated
        imagery.refresh_from_db()
        self.assertIsNotNone(imagery.crop_health_score)
