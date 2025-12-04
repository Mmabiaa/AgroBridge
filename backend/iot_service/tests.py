"""
Tests for IoT service
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta
import json

from .models import (
    DeviceType, IoTDevice, SensorType, SensorReading, 
    DeviceAlert, DeviceGroup, FirmwareVersion, DeviceCommand
)

User = get_user_model()


class IoTServiceModelTests(TestCase):
    """Test IoT service models"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            role='farmer'
        )
        
        self.device_type = DeviceType.objects.create(
            name='Test Sensor',
            category='sensor',
            manufacturer='TestCorp',
            model_number='TS-001',
            supported_sensors=['temperature', 'humidity'],
            communication_protocols=['wifi', 'lora'],
            power_requirements={'battery': '3.7V Li-ion', 'consumption': '50mA'}
        )
        
        self.sensor_type = SensorType.objects.create(
            name='temperature',
            description='Temperature sensor',
            measurement_unit='celsius',
            min_value=-40.0,
            max_value=85.0,
            default_min_threshold=5.0,
            default_max_threshold=35.0
        )
    
    def test_device_type_creation(self):
        """Test DeviceType model creation"""
        self.assertEqual(self.device_type.name, 'Test Sensor')
        self.assertEqual(self.device_type.category, 'sensor')
        self.assertEqual(self.device_type.manufacturer, 'TestCorp')
        self.assertTrue(self.device_type.is_active)
        self.assertIn('temperature', self.device_type.supported_sensors)
    
    def test_sensor_type_creation(self):
        """Test SensorType model creation"""
        self.assertEqual(self.sensor_type.name, 'temperature')
        self.assertEqual(self.sensor_type.measurement_unit, 'celsius')
        self.assertEqual(self.sensor_type.min_value, -40.0)
        self.assertEqual(self.sensor_type.max_value, 85.0)
        self.assertTrue(self.sensor_type.is_active)
    
    def test_iot_device_creation(self):
        """Test IoTDevice model creation"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi',
            latitude=40.7128,
            longitude=-74.0060
        )
        
        self.assertEqual(device.device_id, 'TEST001')
        self.assertEqual(device.name, 'Test Device')
        self.assertEqual(device.owner, self.user)
        self.assertEqual(device.status, 'inactive')
        self.assertFalse(device.is_online)
    
    def test_device_activation(self):
        """Test device activation"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        device.activate()
        self.assertEqual(device.status, 'active')
        self.assertIsNotNone(device.activated_at)
    
    def test_sensor_reading_creation(self):
        """Test SensorReading model creation"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        reading = SensorReading.objects.create(
            device=device,
            sensor_type=self.sensor_type,
            value=25.5,
            timestamp=timezone.now()
        )
        
        self.assertEqual(reading.device, device)
        self.assertEqual(reading.sensor_type, self.sensor_type)
        self.assertEqual(reading.value, 25.5)
        self.assertEqual(reading.quality, 'good')
        self.assertTrue(reading.is_recent)
    
    def test_sensor_reading_validation(self):
        """Test sensor reading validation"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        # Test valid reading
        valid_reading = SensorReading.objects.create(
            device=device,
            sensor_type=self.sensor_type,
            value=25.5,
            timestamp=timezone.now()
        )
        valid_reading.validate_reading()
        self.assertEqual(valid_reading.quality, 'good')
        
        # Test invalid reading (too high)
        invalid_reading = SensorReading.objects.create(
            device=device,
            sensor_type=self.sensor_type,
            value=100.0,  # Above max_value of 85.0
            timestamp=timezone.now()
        )
        invalid_reading.validate_reading()
        self.assertEqual(invalid_reading.quality, 'invalid')
        self.assertIn('above maximum', invalid_reading.validation_notes)
    
    def test_device_alert_creation(self):
        """Test DeviceAlert model creation"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        alert = DeviceAlert.objects.create(
            device=device,
            alert_type='threshold',
            severity='high',
            title='Temperature too high',
            message='Temperature reading of 40°C exceeds threshold'
        )
        
        self.assertEqual(alert.device, device)
        self.assertEqual(alert.alert_type, 'threshold')
        self.assertEqual(alert.severity, 'high')
        self.assertEqual(alert.status, 'active')
        self.assertTrue(alert.is_active)
    
    def test_alert_acknowledgment(self):
        """Test alert acknowledgment"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        alert = DeviceAlert.objects.create(
            device=device,
            alert_type='threshold',
            severity='high',
            title='Temperature too high',
            message='Temperature reading exceeds threshold'
        )
        
        alert.acknowledge(self.user)
        self.assertEqual(alert.status, 'acknowledged')
        self.assertEqual(alert.acknowledged_by, self.user)
        self.assertIsNotNone(alert.acknowledged_at)
    
    def test_device_group_creation(self):
        """Test DeviceGroup model creation"""
        device1 = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device 1',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi',
            status='active'
        )
        
        device2 = IoTDevice.objects.create(
            device_id='TEST002',
            name='Test Device 2',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi',
            status='active'
        )
        
        group = DeviceGroup.objects.create(
            name='Test Group',
            description='A test device group',
            owner=self.user
        )
        
        group.devices.add(device1, device2)
        
        self.assertEqual(group.name, 'Test Group')
        self.assertEqual(group.owner, self.user)
        self.assertEqual(group.devices.count(), 2)
        self.assertEqual(group.active_devices_count, 2)
    
    def test_firmware_version_creation(self):
        """Test FirmwareVersion model creation"""
        firmware = FirmwareVersion.objects.create(
            device_type=self.device_type,
            version='1.0.0',
            description='Initial firmware version',
            file_url='https://example.com/firmware.bin',
            file_size=1024000,
            checksum='abc123def456',
            status='stable',
            released_at=timezone.now()
        )
        
        self.assertEqual(firmware.version, '1.0.0')
        self.assertEqual(firmware.device_type, self.device_type)
        self.assertEqual(firmware.status, 'stable')
    
    def test_device_command_creation(self):
        """Test DeviceCommand model creation"""
        device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        command = DeviceCommand.objects.create(
            device=device,
            command_type='restart',
            command_data={'reason': 'maintenance'},
            created_by=self.user,
            expires_at=timezone.now() + timedelta(hours=1)
        )
        
        self.assertEqual(command.device, device)
        self.assertEqual(command.command_type, 'restart')
        self.assertEqual(command.status, 'pending')
        self.assertEqual(command.created_by, self.user)
        self.assertFalse(command.is_expired)


class IoTDeviceAPITests(APITestCase):
    """Test IoT Device API endpoints"""
    
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
        
        # Create test data
        self.device_type = DeviceType.objects.create(
            name='Test Sensor',
            category='sensor',
            manufacturer='TestCorp',
            model_number='TS-001',
            supported_sensors=['temperature', 'humidity']
        )
        
        self.device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
    
    def test_list_devices(self):
        """Test listing user's devices"""
        url = reverse('iot_service:device-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['device_id'], 'TEST001')
    
    def test_create_device(self):
        """Test creating a new device"""
        url = reverse('iot_service:device-list')
        data = {
            'device_id': 'TEST002',
            'name': 'Test Device 2',
            'device_type': self.device_type.id,
            'connectivity_type': 'lora',
            'latitude': 40.7128,
            'longitude': -74.0060
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['device_id'], 'TEST002')
        self.assertEqual(response.data['owner'], self.user.id)
    
    def test_activate_device(self):
        """Test activating a device"""
        url = reverse('iot_service:device-activate', kwargs={'pk': self.device.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'active')
        
        # Verify device was activated
        self.device.refresh_from_db()
        self.assertEqual(self.device.status, 'active')
    
    def test_update_device_status(self):
        """Test updating device status"""
        url = reverse('iot_service:device-update-status', kwargs={'pk': self.device.id})
        data = {
            'status': 'active',
            'battery_level': 85,
            'signal_strength': -45
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify device was updated
        self.device.refresh_from_db()
        self.assertEqual(self.device.status, 'active')
        self.assertEqual(self.device.battery_level, 85)
        self.assertEqual(self.device.signal_strength, -45)
    
    def test_device_analytics(self):
        """Test getting device analytics"""
        url = reverse('iot_service:device-analytics', kwargs={'pk': self.device.id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('device_id', response.data)
        self.assertIn('uptime_percentage', response.data)
        self.assertIn('total_readings', response.data)
    
    def test_dashboard(self):
        """Test getting dashboard overview"""
        url = reverse('iot_service:device-dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('recent_alerts', response.data)
        self.assertIn('recent_readings', response.data)
        self.assertEqual(response.data['summary']['total_devices'], 1)


class SensorReadingAPITests(APITestCase):
    """Test Sensor Reading API endpoints"""
    
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
        
        # Create test data
        self.device_type = DeviceType.objects.create(
            name='Test Sensor',
            category='sensor',
            manufacturer='TestCorp',
            model_number='TS-001',
            supported_sensors=['temperature', 'humidity']
        )
        
        self.device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        self.sensor_type = SensorType.objects.create(
            name='temperature',
            description='Temperature sensor',
            measurement_unit='celsius',
            min_value=-40.0,
            max_value=85.0
        )
    
    def test_create_sensor_reading(self):
        """Test creating a sensor reading"""
        url = reverse('iot_service:reading-list')
        data = {
            'device': self.device.id,
            'sensor_type': self.sensor_type.id,
            'value': 25.5,
            'timestamp': timezone.now().isoformat()
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['value']), 25.5)
    
    def test_batch_upload_readings(self):
        """Test batch uploading sensor readings"""
        url = reverse('iot_service:reading-batch-upload')
        data = {
            'device_id': self.device.device_id,
            'readings': [
                {
                    'sensor_type': 'temperature',
                    'value': 25.5,
                    'timestamp': timezone.now().isoformat()
                },
                {
                    'sensor_type': 'temperature',
                    'value': 26.0,
                    'timestamp': (timezone.now() + timedelta(minutes=5)).isoformat()
                }
            ]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['created'], 2)
        self.assertEqual(response.data['errors'], 0)
    
    def test_get_latest_readings(self):
        """Test getting latest readings"""
        # Create some readings
        SensorReading.objects.create(
            device=self.device,
            sensor_type=self.sensor_type,
            value=25.5,
            timestamp=timezone.now()
        )
        
        url = reverse('iot_service:reading-latest')
        response = self.client.get(url, {'device_id': self.device.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class DeviceAlertAPITests(APITestCase):
    """Test Device Alert API endpoints"""
    
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
        
        # Create test data
        self.device_type = DeviceType.objects.create(
            name='Test Sensor',
            category='sensor',
            manufacturer='TestCorp',
            model_number='TS-001'
        )
        
        self.device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
        
        self.alert = DeviceAlert.objects.create(
            device=self.device,
            alert_type='threshold',
            severity='high',
            title='Temperature too high',
            message='Temperature exceeds threshold'
        )
    
    def test_list_alerts(self):
        """Test listing device alerts"""
        url = reverse('iot_service:alert-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_acknowledge_alert(self):
        """Test acknowledging an alert"""
        url = reverse('iot_service:alert-acknowledge', kwargs={'pk': self.alert.id})
        data = {'notes': 'Acknowledged by user'}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify alert was acknowledged
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.status, 'acknowledged')
        self.assertEqual(self.alert.acknowledged_by, self.user)
    
    def test_resolve_alert(self):
        """Test resolving an alert"""
        url = reverse('iot_service:alert-resolve', kwargs={'pk': self.alert.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify alert was resolved
        self.alert.refresh_from_db()
        self.assertEqual(self.alert.status, 'resolved')
    
    def test_get_active_alerts(self):
        """Test getting active alerts"""
        url = reverse('iot_service:alert-active')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_alert_summary(self):
        """Test getting alert summary"""
        url = reverse('iot_service:alert-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_alerts', response.data)
        self.assertIn('active_alerts', response.data)
        self.assertIn('alerts_by_type', response.data)


class DeviceGroupAPITests(APITestCase):
    """Test Device Group API endpoints"""
    
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
        
        # Create test data
        self.device_type = DeviceType.objects.create(
            name='Test Sensor',
            category='sensor',
            manufacturer='TestCorp',
            model_number='TS-001'
        )
        
        self.device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
    
    def test_create_device_group(self):
        """Test creating a device group"""
        url = reverse('iot_service:group-list')
        data = {
            'name': 'Test Group',
            'description': 'A test device group',
            'devices': [self.device.id]
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Test Group')
        self.assertEqual(response.data['owner'], self.user.id)
    
    def test_add_device_to_group(self):
        """Test adding device to group"""
        group = DeviceGroup.objects.create(
            name='Test Group',
            owner=self.user
        )
        
        url = reverse('iot_service:group-add-device', kwargs={'pk': group.id})
        data = {'device_id': self.device.id}
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['devices_count'], 1)


class DeviceCommandAPITests(APITestCase):
    """Test Device Command API endpoints"""
    
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
        
        # Create test data
        self.device_type = DeviceType.objects.create(
            name='Test Sensor',
            category='sensor',
            manufacturer='TestCorp',
            model_number='TS-001'
        )
        
        self.device = IoTDevice.objects.create(
            device_id='TEST001',
            name='Test Device',
            device_type=self.device_type,
            owner=self.user,
            connectivity_type='wifi'
        )
    
    def test_create_device_command(self):
        """Test creating a device command"""
        url = reverse('iot_service:command-list')
        data = {
            'device': self.device.id,
            'command_type': 'restart',
            'command_data': {'reason': 'maintenance'},
            'expires_at': (timezone.now() + timedelta(hours=1)).isoformat()
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['command_type'], 'restart')
        self.assertEqual(response.data['created_by'], self.user.id)
    
    def test_execute_command(self):
        """Test executing a command"""
        command = DeviceCommand.objects.create(
            device=self.device,
            command_type='restart',
            command_data={'reason': 'test'},
            created_by=self.user,
            expires_at=timezone.now() + timedelta(hours=1)
        )
        
        url = reverse('iot_service:command-execute', kwargs={'pk': command.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify command was marked as sent
        command.refresh_from_db()
        self.assertEqual(command.status, 'sent')
    
    def test_get_pending_commands(self):
        """Test getting pending commands for a device"""
        DeviceCommand.objects.create(
            device=self.device,
            command_type='restart',
            command_data={'reason': 'test'},
            created_by=self.user,
            expires_at=timezone.now() + timedelta(hours=1)
        )
        
        url = reverse('iot_service:command-pending')
        response = self.client.get(url, {'device_id': self.device.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)