"""
Serializers for IoT service models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import (
    DeviceType, IoTDevice, SensorType, SensorReading, 
    DeviceAlert, DeviceGroup, FirmwareVersion, DeviceCommand
)

User = get_user_model()


class DeviceTypeSerializer(serializers.ModelSerializer):
    """Serializer for DeviceType model"""
    devices_count = serializers.ReadOnlyField(source='devices.count')
    
    class Meta:
        model = DeviceType
        fields = [
            'id', 'name', 'category', 'manufacturer', 'model_number',
            'supported_sensors', 'communication_protocols', 'power_requirements',
            'firmware_version', 'update_url', 'is_active', 'devices_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'devices_count']


class SensorTypeSerializer(serializers.ModelSerializer):
    """Serializer for SensorType model"""
    
    class Meta:
        model = SensorType
        fields = [
            'id', 'name', 'description', 'measurement_unit',
            'min_value', 'max_value', 'precision',
            'default_min_threshold', 'default_max_threshold',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class IoTDeviceSerializer(serializers.ModelSerializer):
    """Serializer for IoTDevice model"""
    device_type_name = serializers.ReadOnlyField(source='device_type.name')
    owner_name = serializers.ReadOnlyField(source='owner.username')
    farm_name = serializers.ReadOnlyField(source='farm.name')
    field_name = serializers.ReadOnlyField(source='field.name')
    is_online = serializers.ReadOnlyField()
    uptime_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = IoTDevice
        fields = [
            'id', 'device_id', 'name', 'device_type', 'device_type_name',
            'owner', 'owner_name', 'farm', 'farm_name', 'field', 'field_name',
            'latitude', 'longitude', 'altitude', 'location_description',
            'configuration', 'sampling_interval', 'connectivity_type', 'network_config',
            'status', 'battery_level', 'signal_strength', 'firmware_version',
            'last_firmware_update', 'last_seen', 'registered_at', 'activated_at',
            'maintenance_schedule', 'is_online', 'uptime_percentage'
        ]
        read_only_fields = [
            'id', 'registered_at', 'last_seen', 'is_online', 'uptime_percentage',
            'owner'
        ]
    
    def create(self, validated_data):
        """Create IoT device with owner from request"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class IoTDeviceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing IoT devices"""
    device_type_name = serializers.ReadOnlyField(source='device_type.name')
    is_online = serializers.ReadOnlyField()
    
    class Meta:
        model = IoTDevice
        fields = [
            'id', 'device_id', 'name', 'device_type_name', 'status',
            'battery_level', 'signal_strength', 'is_online', 'last_seen'
        ]


class SensorReadingSerializer(serializers.ModelSerializer):
    """Serializer for SensorReading model"""
    device_name = serializers.ReadOnlyField(source='device.name')
    sensor_type_name = serializers.ReadOnlyField(source='sensor_type.name')
    sensor_unit = serializers.ReadOnlyField(source='sensor_type.measurement_unit')
    is_recent = serializers.ReadOnlyField()
    
    class Meta:
        model = SensorReading
        fields = [
            'id', 'device', 'device_name', 'sensor_type', 'sensor_type_name',
            'sensor_unit', 'value', 'raw_value', 'quality', 'timestamp',
            'received_at', 'metadata', 'is_validated', 'validation_notes',
            'is_recent'
        ]
        read_only_fields = [
            'id', 'received_at', 'is_validated', 'validation_notes', 'is_recent'
        ]


class SensorReadingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating sensor readings"""
    
    class Meta:
        model = SensorReading
        fields = [
            'device', 'sensor_type', 'value', 'raw_value', 'timestamp', 'metadata'
        ]
    
    def validate(self, data):
        """Validate sensor reading data"""
        device = data['device']
        sensor_type = data['sensor_type']
        
        # Check if device supports this sensor type
        if sensor_type.name not in device.device_type.supported_sensors:
            raise serializers.ValidationError(
                f"Device {device.name} does not support sensor type {sensor_type.name}"
            )
        
        # Validate timestamp is not in the future
        if data['timestamp'] > timezone.now():
            raise serializers.ValidationError("Timestamp cannot be in the future")
        
        return data
    
    def create(self, validated_data):
        """Create sensor reading and validate it"""
        reading = super().create(validated_data)
        reading.validate_reading()
        return reading


class BatchSensorReadingSerializer(serializers.Serializer):
    """Serializer for batch sensor reading uploads"""
    device_id = serializers.CharField()
    readings = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
        max_length=1000
    )
    
    def validate_readings(self, value):
        """Validate individual readings in the batch"""
        required_fields = ['sensor_type', 'value', 'timestamp']
        
        for i, reading in enumerate(value):
            for field in required_fields:
                if field not in reading:
                    raise serializers.ValidationError(
                        f"Reading {i}: Missing required field '{field}'"
                    )
        
        return value


class DeviceAlertSerializer(serializers.ModelSerializer):
    """Serializer for DeviceAlert model"""
    device_name = serializers.ReadOnlyField(source='device.name')
    acknowledged_by_name = serializers.ReadOnlyField(source='acknowledged_by.username')
    
    class Meta:
        model = DeviceAlert
        fields = [
            'id', 'device', 'device_name', 'alert_type', 'severity',
            'title', 'message', 'sensor_reading', 'threshold_value',
            'actual_value', 'status', 'acknowledged_by', 'acknowledged_by_name',
            'acknowledged_at', 'resolved_at', 'created_at', 'updated_at', 'metadata'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'acknowledged_by', 'acknowledged_at'
        ]


class DeviceGroupSerializer(serializers.ModelSerializer):
    """Serializer for DeviceGroup model"""
    owner_name = serializers.ReadOnlyField(source='owner.username')
    devices_count = serializers.ReadOnlyField(source='devices.count')
    active_devices_count = serializers.ReadOnlyField()
    online_devices_count = serializers.ReadOnlyField()
    
    class Meta:
        model = DeviceGroup
        fields = [
            'id', 'name', 'description', 'owner', 'owner_name', 'devices',
            'configuration', 'is_active', 'devices_count', 'active_devices_count',
            'online_devices_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'devices_count',
            'active_devices_count', 'online_devices_count', 'owner'
        ]
    
    def create(self, validated_data):
        """Create device group with owner from request"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class FirmwareVersionSerializer(serializers.ModelSerializer):
    """Serializer for FirmwareVersion model"""
    device_type_name = serializers.ReadOnlyField(source='device_type.name')
    is_latest = serializers.ReadOnlyField()
    
    class Meta:
        model = FirmwareVersion
        fields = [
            'id', 'device_type', 'device_type_name', 'version', 'build_number',
            'description', 'changelog', 'file_url', 'file_size', 'checksum',
            'status', 'min_hardware_version', 'compatible_versions',
            'released_at', 'created_at', 'is_latest'
        ]
        read_only_fields = ['id', 'created_at', 'is_latest']


class DeviceCommandSerializer(serializers.ModelSerializer):
    """Serializer for DeviceCommand model"""
    device_name = serializers.ReadOnlyField(source='device.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = DeviceCommand
        fields = [
            'id', 'device', 'device_name', 'command_type', 'command_data',
            'status', 'sent_at', 'acknowledged_at', 'completed_at',
            'response_data', 'error_message', 'created_by', 'created_by_name',
            'created_at', 'expires_at', 'is_expired'
        ]
        read_only_fields = [
            'id', 'status', 'sent_at', 'acknowledged_at', 'completed_at',
            'response_data', 'error_message', 'created_at', 'is_expired',
            'created_by'
        ]
    
    def create(self, validated_data):
        """Create device command with creator from request"""
        validated_data['created_by'] = self.context['request'].user
        
        # Set default expiration time if not provided
        if 'expires_at' not in validated_data:
            validated_data['expires_at'] = timezone.now() + timezone.timedelta(hours=24)
        
        return super().create(validated_data)


class DeviceStatusSerializer(serializers.Serializer):
    """Serializer for device status updates"""
    status = serializers.ChoiceField(choices=IoTDevice.STATUS_CHOICES)
    battery_level = serializers.IntegerField(min_value=0, max_value=100, required=False)
    signal_strength = serializers.IntegerField(min_value=-120, max_value=0, required=False)
    firmware_version = serializers.CharField(max_length=20, required=False)
    metadata = serializers.JSONField(required=False)


class DeviceAnalyticsSerializer(serializers.Serializer):
    """Serializer for device analytics data"""
    device_id = serializers.UUIDField()
    device_name = serializers.CharField()
    uptime_percentage = serializers.FloatField()
    total_readings = serializers.IntegerField()
    last_reading_time = serializers.DateTimeField()
    battery_level = serializers.IntegerField()
    signal_strength = serializers.IntegerField()
    alert_count = serializers.IntegerField()
    status = serializers.CharField()


class AlertAcknowledgeSerializer(serializers.Serializer):
    """Serializer for acknowledging alerts"""
    notes = serializers.CharField(max_length=500, required=False)


class DeviceConfigurationSerializer(serializers.Serializer):
    """Serializer for device configuration updates"""
    sampling_interval = serializers.IntegerField(min_value=1, required=False)
    configuration = serializers.JSONField(required=False)
    network_config = serializers.JSONField(required=False)