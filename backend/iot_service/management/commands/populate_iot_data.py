"""
Management command to populate the database with sample IoT devices and sensor data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random
from iot_service.models import DeviceType, SensorType, IoTDevice, SensorReading
from authentication.models import User


class Command(BaseCommand):
    help = 'Populate database with sample IoT devices and sensor data'

    def handle(self, *args, **options):
        self.stdout.write('Populating IoT devices and sensor data...')
        
        # Create sample device types
        device_types_data = [
            {
                'name': 'AgriSense Pro',
                'category': 'sensor',
                'manufacturer': 'FarmTech Solutions',
                'model_number': 'AS-PRO-001',
                'supported_sensors': ['temperature', 'humidity', 'soil_moisture', 'light'],
                'communication_protocols': ['wifi', 'lora'],
                'power_requirements': {
                    'battery': '3.7V Li-ion 5000mAh',
                    'consumption': '45mA average',
                    'solar': 'Optional 5W solar panel'
                },
                'firmware_version': '2.1.3'
            },
            {
                'name': 'WeatherStation Elite',
                'category': 'sensor',
                'manufacturer': 'MeteoTech',
                'model_number': 'WS-ELITE-200',
                'supported_sensors': ['temperature', 'humidity', 'pressure', 'wind_speed', 'rainfall'],
                'communication_protocols': ['wifi', 'cellular'],
                'power_requirements': {
                    'battery': '12V Lead-acid 20Ah',
                    'consumption': '120mA average',
                    'solar': '20W solar panel included'
                },
                'firmware_version': '1.8.2'
            },
            {
                'name': 'SoilGuard Monitor',
                'category': 'sensor',
                'manufacturer': 'EarthSense',
                'model_number': 'SG-MON-150',
                'supported_sensors': ['soil_moisture', 'soil_temperature', 'ph', 'ec'],
                'communication_protocols': ['lora', 'zigbee'],
                'power_requirements': {
                    'battery': '3.6V Li-SOCL2 19Ah',
                    'consumption': '15mA average',
                    'lifetime': '5+ years'
                },
                'firmware_version': '3.0.1'
            },
            {
                'name': 'IrrigationHub Smart',
                'category': 'actuator',
                'manufacturer': 'AquaTech Systems',
                'model_number': 'IH-SMART-300',
                'supported_sensors': ['flow_rate', 'pressure', 'valve_status'],
                'communication_protocols': ['wifi', 'ethernet'],
                'power_requirements': {
                    'power': '24V AC/DC 2A',
                    'backup': '12V battery backup',
                    'consumption': '500mA operating'
                },
                'firmware_version': '4.2.0'
            }
        ]
        
        created_device_types = []
        for device_data in device_types_data:
            device_type, created = DeviceType.objects.get_or_create(
                name=device_data['name'],
                manufacturer=device_data['manufacturer'],
                defaults=device_data
            )
            if created:
                created_device_types.append(device_type)
                self.stdout.write(f'Created device type: {device_type.name}')
            else:
                self.stdout.write(f'Device type already exists: {device_type.name}')
        
        # Create sample sensor types
        sensor_types_data = [
            {
                'name': 'temperature',
                'description': 'Air temperature sensor',
                'measurement_unit': 'celsius',
                'min_value': -40.0,
                'max_value': 85.0,
                'precision': 1,
                'default_min_threshold': 5.0,
                'default_max_threshold': 35.0
            },
            {
                'name': 'humidity',
                'description': 'Relative humidity sensor',
                'measurement_unit': 'percent',
                'min_value': 0.0,
                'max_value': 100.0,
                'precision': 1,
                'default_min_threshold': 30.0,
                'default_max_threshold': 80.0
            },
            {
                'name': 'soil_moisture',
                'description': 'Soil moisture content sensor',
                'measurement_unit': 'percent',
                'min_value': 0.0,
                'max_value': 100.0,
                'precision': 1,
                'default_min_threshold': 20.0,
                'default_max_threshold': 80.0
            },
            {
                'name': 'light',
                'description': 'Light intensity sensor',
                'measurement_unit': 'lux',
                'min_value': 0.0,
                'max_value': 100000.0,
                'precision': 0,
                'default_min_threshold': 1000.0,
                'default_max_threshold': 50000.0
            },
            {
                'name': 'pressure',
                'description': 'Atmospheric pressure sensor',
                'measurement_unit': 'pascal',
                'min_value': 80000.0,
                'max_value': 110000.0,
                'precision': 0,
                'default_min_threshold': 95000.0,
                'default_max_threshold': 105000.0
            },
            {
                'name': 'wind_speed',
                'description': 'Wind speed sensor',
                'measurement_unit': 'ms',
                'min_value': 0.0,
                'max_value': 50.0,
                'precision': 1,
                'default_min_threshold': 0.0,
                'default_max_threshold': 15.0
            },
            {
                'name': 'rainfall',
                'description': 'Rainfall measurement sensor',
                'measurement_unit': 'mm',
                'min_value': 0.0,
                'max_value': 500.0,
                'precision': 1,
                'default_min_threshold': 0.0,
                'default_max_threshold': 100.0
            },
            {
                'name': 'soil_temperature',
                'description': 'Soil temperature sensor',
                'measurement_unit': 'celsius',
                'min_value': -20.0,
                'max_value': 60.0,
                'precision': 1,
                'default_min_threshold': 10.0,
                'default_max_threshold': 30.0
            },
            {
                'name': 'ph',
                'description': 'Soil pH sensor',
                'measurement_unit': 'ph',
                'min_value': 0.0,
                'max_value': 14.0,
                'precision': 1,
                'default_min_threshold': 6.0,
                'default_max_threshold': 8.0
            },
            {
                'name': 'ec',
                'description': 'Electrical conductivity sensor',
                'measurement_unit': 'ms',
                'min_value': 0.0,
                'max_value': 10.0,
                'precision': 2,
                'default_min_threshold': 0.5,
                'default_max_threshold': 3.0
            }
        ]
        
        created_sensor_types = []
        for sensor_data in sensor_types_data:
            sensor_type, created = SensorType.objects.get_or_create(
                name=sensor_data['name'],
                defaults=sensor_data
            )
            if created:
                created_sensor_types.append(sensor_type)
                self.stdout.write(f'Created sensor type: {sensor_type.name}')
            else:
                self.stdout.write(f'Sensor type already exists: {sensor_type.name}')
        
        # Create sample devices for existing users
        users = User.objects.filter(role='farmer')[:3]  # Limit to first 3 farmers
        
        if not users.exists():
            self.stdout.write('No farmer users found. Creating sample devices for admin users.')
            users = User.objects.filter(is_superuser=True)[:1]
        
        created_devices = []
        device_counter = 1
        
        for user in users:
            # Create 2-3 devices per user
            num_devices = random.randint(2, 3)
            
            for i in range(num_devices):
                device_type = random.choice(DeviceType.objects.all())
                
                device_data = {
                    'device_id': f'DEV{device_counter:03d}',
                    'name': f'{device_type.name} #{device_counter}',
                    'device_type': device_type,
                    'owner': user,
                    'connectivity_type': random.choice(['wifi', 'lora', 'cellular']),
                    'latitude': round(random.uniform(5.0, 11.0), 6),  # Ghana coordinates
                    'longitude': round(random.uniform(-3.0, 1.0), 6),
                    'altitude': random.uniform(50, 500),
                    'location_description': f'Field {chr(65 + i)} - {user.username}\'s farm',
                    'configuration': {
                        'sampling_rate': random.choice([300, 600, 900, 1800]),  # seconds
                        'data_format': 'json',
                        'encryption': True
                    },
                    'sampling_interval': random.choice([300, 600, 900]),
                    'status': random.choice(['active', 'active', 'active', 'inactive']),  # Bias toward active
                    'battery_level': random.randint(20, 100),
                    'signal_strength': random.randint(-80, -30),
                    'firmware_version': device_type.firmware_version,
                    'last_seen': timezone.now() - timedelta(minutes=random.randint(1, 60))
                }
                
                device = IoTDevice.objects.create(**device_data)
                created_devices.append(device)
                device_counter += 1
                
                self.stdout.write(f'Created device: {device.name} for {user.username}')
                
                # Generate sample sensor readings for active devices
                if device.status == 'active':
                    self._generate_sample_readings(device)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated database with {len(created_device_types)} device types, '
                f'{len(created_sensor_types)} sensor types, and {len(created_devices)} devices'
            )
        )
    
    def _generate_sample_readings(self, device):
        """Generate sample sensor readings for a device"""
        # Get sensor types supported by this device
        supported_sensors = device.device_type.supported_sensors
        available_sensor_types = SensorType.objects.filter(name__in=supported_sensors)
        
        if not available_sensor_types.exists():
            return
        
        # Generate readings for the last 24 hours
        end_time = timezone.now()
        start_time = end_time - timedelta(hours=24)
        
        # Generate readings every 15-30 minutes
        current_time = start_time
        readings_created = 0
        
        while current_time <= end_time:
            for sensor_type in available_sensor_types:
                # Skip some readings randomly to simulate real-world gaps
                if random.random() < 0.1:  # 10% chance to skip
                    continue
                
                # Generate realistic values based on sensor type
                value = self._generate_realistic_value(sensor_type)
                
                # Add some noise
                noise_factor = random.uniform(0.95, 1.05)
                value *= noise_factor
                
                # Ensure value is within sensor range
                if sensor_type.min_value is not None:
                    value = max(value, sensor_type.min_value)
                if sensor_type.max_value is not None:
                    value = min(value, sensor_type.max_value)
                
                # Round to sensor precision
                value = round(value, sensor_type.precision)
                
                try:
                    SensorReading.objects.create(
                        device=device,
                        sensor_type=sensor_type,
                        value=value,
                        timestamp=current_time,
                        metadata={
                            'generated': True,
                            'quality_score': random.uniform(0.8, 1.0)
                        }
                    )
                    readings_created += 1
                except Exception as e:
                    # Skip duplicate readings
                    pass
            
            # Move to next reading time
            current_time += timedelta(minutes=random.randint(15, 30))
        
        self.stdout.write(f'  Generated {readings_created} sensor readings for {device.name}')
    
    def _generate_realistic_value(self, sensor_type):
        """Generate realistic sensor values based on sensor type"""
        sensor_ranges = {
            'temperature': (15, 35),  # Typical outdoor temperature in Ghana
            'humidity': (40, 85),     # Typical humidity range
            'soil_moisture': (25, 70), # Soil moisture percentage
            'light': (500, 80000),    # Light intensity in lux
            'pressure': (98000, 103000), # Atmospheric pressure
            'wind_speed': (0, 12),    # Wind speed in m/s
            'rainfall': (0, 50),      # Rainfall in mm
            'soil_temperature': (18, 32), # Soil temperature
            'ph': (5.5, 7.5),        # Soil pH
            'ec': (0.8, 2.5),        # Electrical conductivity
        }
        
        if sensor_type.name in sensor_ranges:
            min_val, max_val = sensor_ranges[sensor_type.name]
            return random.uniform(min_val, max_val)
        else:
            # Fallback to sensor's defined range
            min_val = sensor_type.min_value or 0
            max_val = sensor_type.max_value or 100
            return random.uniform(min_val, max_val)