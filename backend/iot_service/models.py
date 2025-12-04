"""
IoT service models for device management and sensor data
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid
import json

User = get_user_model()


class DeviceType(models.Model):
    """
    Types of IoT devices supported by the platform
    """
    CATEGORY_CHOICES = [
        ('sensor', 'Sensor Device'),
        ('actuator', 'Actuator Device'),
        ('gateway', 'Gateway Device'),
        ('hybrid', 'Hybrid Device'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    manufacturer = models.CharField(max_length=100)
    model_number = models.CharField(max_length=50)
    
    # Technical specifications
    supported_sensors = models.JSONField(
        default=list,
        help_text="List of sensor types this device supports"
    )
    communication_protocols = models.JSONField(
        default=list,
        help_text="Supported communication protocols (WiFi, LoRa, etc.)"
    )
    power_requirements = models.JSONField(
        default=dict,
        help_text="Power consumption and battery specifications"
    )
    
    # Firmware information
    firmware_version = models.CharField(max_length=20, blank=True)
    update_url = models.URLField(blank=True, help_text="Firmware update endpoint")
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['manufacturer']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.manufacturer} {self.name}"


class IoTDevice(models.Model):
    """
    Individual IoT devices registered in the system
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('maintenance', 'Under Maintenance'),
        ('error', 'Error State'),
        ('offline', 'Offline'),
    ]
    
    CONNECTIVITY_CHOICES = [
        ('wifi', 'WiFi'),
        ('lora', 'LoRa'),
        ('cellular', 'Cellular'),
        ('ethernet', 'Ethernet'),
        ('bluetooth', 'Bluetooth'),
        ('zigbee', 'ZigBee'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Device identification
    device_id = models.CharField(max_length=100, unique=True, help_text="Unique device identifier")
    name = models.CharField(max_length=200)
    device_type = models.ForeignKey(DeviceType, on_delete=models.CASCADE, related_name='devices')
    
    # Ownership and location
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='iot_devices')
    farm = models.ForeignKey('farms.Farm', on_delete=models.CASCADE, related_name='iot_devices', null=True, blank=True)
    field = models.ForeignKey('farms.Field', on_delete=models.SET_NULL, null=True, blank=True, related_name='iot_devices')
    
    # Location data
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    altitude = models.FloatField(null=True, blank=True, help_text="Altitude in meters")
    location_description = models.CharField(max_length=200, blank=True)
    
    # Device configuration
    configuration = models.JSONField(
        default=dict,
        help_text="Device-specific configuration parameters"
    )
    sampling_interval = models.IntegerField(
        default=300,
        help_text="Data sampling interval in seconds"
    )
    
    # Connectivity
    connectivity_type = models.CharField(max_length=20, choices=CONNECTIVITY_CHOICES)
    network_config = models.JSONField(
        default=dict,
        help_text="Network configuration (IP, gateway, etc.)"
    )
    
    # Status and health
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    battery_level = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Battery level percentage"
    )
    signal_strength = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(-120), MaxValueValidator(0)],
        help_text="Signal strength in dBm"
    )
    
    # Firmware
    firmware_version = models.CharField(max_length=20, blank=True)
    last_firmware_update = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    last_seen = models.DateTimeField(null=True, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    activated_at = models.DateTimeField(null=True, blank=True)
    
    # Maintenance
    maintenance_schedule = models.JSONField(
        default=dict,
        help_text="Maintenance schedule and history"
    )
    
    class Meta:
        ordering = ['-registered_at']
        indexes = [
            models.Index(fields=['device_id']),
            models.Index(fields=['owner']),
            models.Index(fields=['status']),
            models.Index(fields=['device_type']),
            models.Index(fields=['last_seen']),
            models.Index(fields=['farm']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.device_id})"
    
    @property
    def is_online(self):
        """Check if device is considered online"""
        if not self.last_seen:
            return False
        
        # Consider device offline if no data received in last 10 minutes
        offline_threshold = timezone.now() - timezone.timedelta(minutes=10)
        return self.last_seen > offline_threshold
    
    @property
    def uptime_percentage(self):
        """Calculate device uptime percentage for last 24 hours"""
        if not self.activated_at:
            return 0
        
        # Simple calculation - in production, this would use actual uptime data
        if self.status == 'active' and self.is_online:
            return 95.0  # Mock uptime
        elif self.status == 'active':
            return 85.0
        else:
            return 0.0
    
    def update_last_seen(self):
        """Update the last seen timestamp"""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])
    
    def activate(self):
        """Activate the device"""
        self.status = 'active'
        self.activated_at = timezone.now()
        self.save(update_fields=['status', 'activated_at'])
    
    def deactivate(self):
        """Deactivate the device"""
        self.status = 'inactive'
        self.save(update_fields=['status'])


class SensorType(models.Model):
    """
    Types of sensors and their specifications
    """
    MEASUREMENT_UNITS = [
        ('celsius', 'Celsius (°C)'),
        ('fahrenheit', 'Fahrenheit (°F)'),
        ('percent', 'Percentage (%)'),
        ('ppm', 'Parts Per Million (ppm)'),
        ('ph', 'pH Level'),
        ('lux', 'Lux'),
        ('pascal', 'Pascal (Pa)'),
        ('meter', 'Meter (m)'),
        ('mm', 'Millimeter (mm)'),
        ('ms', 'Meter per Second (m/s)'),
        ('degree', 'Degree (°)'),
        ('volt', 'Volt (V)'),
        ('ampere', 'Ampere (A)'),
        ('watt', 'Watt (W)'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    measurement_unit = models.CharField(max_length=20, choices=MEASUREMENT_UNITS)
    
    # Value ranges
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    precision = models.IntegerField(default=2, help_text="Decimal places for readings")
    
    # Thresholds for alerts
    default_min_threshold = models.FloatField(null=True, blank=True)
    default_max_threshold = models.FloatField(null=True, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.measurement_unit})"


class SensorReading(models.Model):
    """
    Individual sensor readings from IoT devices
    """
    QUALITY_CHOICES = [
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('poor', 'Poor'),
        ('invalid', 'Invalid'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Device and sensor information
    device = models.ForeignKey(IoTDevice, on_delete=models.CASCADE, related_name='sensor_readings')
    sensor_type = models.ForeignKey(SensorType, on_delete=models.CASCADE, related_name='readings')
    
    # Reading data
    value = models.FloatField()
    raw_value = models.FloatField(null=True, blank=True, help_text="Raw sensor value before calibration")
    quality = models.CharField(max_length=10, choices=QUALITY_CHOICES, default='good')
    
    # Metadata
    timestamp = models.DateTimeField(db_index=True)
    received_at = models.DateTimeField(auto_now_add=True)
    
    # Additional context
    metadata = models.JSONField(
        default=dict,
        help_text="Additional sensor metadata (calibration, environmental conditions, etc.)"
    )
    
    # Data validation
    is_validated = models.BooleanField(default=False)
    validation_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', 'timestamp']),
            models.Index(fields=['sensor_type', 'timestamp']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['received_at']),
            models.Index(fields=['quality']),
        ]
        
        # Ensure we don't have duplicate readings
        unique_together = ['device', 'sensor_type', 'timestamp']
    
    def __str__(self):
        return f"{self.device.name} - {self.sensor_type.name}: {self.value} at {self.timestamp}"
    
    @property
    def is_recent(self):
        """Check if reading is from the last hour"""
        one_hour_ago = timezone.now() - timezone.timedelta(hours=1)
        return self.timestamp > one_hour_ago
    
    def validate_reading(self):
        """Validate the sensor reading against expected ranges"""
        if self.sensor_type.min_value is not None and self.value < self.sensor_type.min_value:
            self.quality = 'invalid'
            self.validation_notes = f"Value {self.value} below minimum {self.sensor_type.min_value}"
        elif self.sensor_type.max_value is not None and self.value > self.sensor_type.max_value:
            self.quality = 'invalid'
            self.validation_notes = f"Value {self.value} above maximum {self.sensor_type.max_value}"
        else:
            self.quality = 'good'
            self.validation_notes = ""
        
        self.is_validated = True
        self.save(update_fields=['quality', 'validation_notes', 'is_validated'])


class DeviceAlert(models.Model):
    """
    Alerts generated by IoT devices based on sensor readings or device status
    """
    ALERT_TYPE_CHOICES = [
        ('threshold', 'Threshold Violation'),
        ('device_offline', 'Device Offline'),
        ('low_battery', 'Low Battery'),
        ('sensor_failure', 'Sensor Failure'),
        ('connectivity', 'Connectivity Issue'),
        ('maintenance', 'Maintenance Required'),
        ('firmware', 'Firmware Update Available'),
    ]
    
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
        ('dismissed', 'Dismissed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Alert identification
    device = models.ForeignKey(IoTDevice, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPE_CHOICES)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES)
    
    # Alert content
    title = models.CharField(max_length=200)
    message = models.TextField()
    
    # Related data
    sensor_reading = models.ForeignKey(
        SensorReading, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='alerts'
    )
    threshold_value = models.FloatField(null=True, blank=True)
    actual_value = models.FloatField(null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    acknowledged_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='acknowledged_alerts'
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional data
    metadata = models.JSONField(
        default=dict,
        help_text="Additional alert context and data"
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['device', 'status']),
            models.Index(fields=['alert_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.device.name} - {self.title} ({self.severity})"
    
    def acknowledge(self, user):
        """Acknowledge the alert"""
        self.status = 'acknowledged'
        self.acknowledged_by = user
        self.acknowledged_at = timezone.now()
        self.save(update_fields=['status', 'acknowledged_by', 'acknowledged_at'])
    
    def resolve(self):
        """Mark alert as resolved"""
        self.status = 'resolved'
        self.resolved_at = timezone.now()
        self.save(update_fields=['status', 'resolved_at'])
    
    @property
    def is_active(self):
        """Check if alert is still active"""
        return self.status == 'active'


class DeviceGroup(models.Model):
    """
    Groups of IoT devices for management and monitoring
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Ownership
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_groups')
    
    # Devices in this group
    devices = models.ManyToManyField(IoTDevice, related_name='groups', blank=True)
    
    # Group configuration
    configuration = models.JSONField(
        default=dict,
        help_text="Group-wide configuration settings"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['owner', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.devices.count()} devices)"
    
    @property
    def active_devices_count(self):
        """Count of active devices in the group"""
        return self.devices.filter(status='active').count()
    
    @property
    def online_devices_count(self):
        """Count of online devices in the group"""
        return sum(1 for device in self.devices.all() if device.is_online)


class FirmwareVersion(models.Model):
    """
    Firmware versions available for IoT devices
    """
    STATUS_CHOICES = [
        ('development', 'Development'),
        ('testing', 'Testing'),
        ('stable', 'Stable'),
        ('deprecated', 'Deprecated'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Version information
    device_type = models.ForeignKey(DeviceType, on_delete=models.CASCADE, related_name='firmware_versions')
    version = models.CharField(max_length=20)
    build_number = models.CharField(max_length=50, blank=True)
    
    # Firmware details
    description = models.TextField()
    changelog = models.TextField(blank=True)
    file_url = models.URLField(help_text="URL to firmware file")
    file_size = models.BigIntegerField(help_text="File size in bytes")
    checksum = models.CharField(max_length=64, help_text="SHA-256 checksum")
    
    # Status and compatibility
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='development')
    min_hardware_version = models.CharField(max_length=20, blank=True)
    compatible_versions = models.JSONField(
        default=list,
        help_text="List of compatible firmware versions for upgrade"
    )
    
    # Release information
    released_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['device_type', 'version']
        indexes = [
            models.Index(fields=['device_type', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['released_at']),
        ]
    
    def __str__(self):
        return f"{self.device_type.name} v{self.version}"
    
    @property
    def is_latest(self):
        """Check if this is the latest stable version for the device type"""
        latest = FirmwareVersion.objects.filter(
            device_type=self.device_type,
            status='stable'
        ).order_by('-released_at').first()
        
        return latest and latest.id == self.id


class DeviceCommand(models.Model):
    """
    Commands sent to IoT devices
    """
    COMMAND_TYPE_CHOICES = [
        ('config_update', 'Configuration Update'),
        ('firmware_update', 'Firmware Update'),
        ('restart', 'Restart Device'),
        ('calibrate', 'Calibrate Sensors'),
        ('data_sync', 'Sync Data'),
        ('custom', 'Custom Command'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('acknowledged', 'Acknowledged'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('timeout', 'Timeout'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Command details
    device = models.ForeignKey(IoTDevice, on_delete=models.CASCADE, related_name='commands')
    command_type = models.CharField(max_length=20, choices=COMMAND_TYPE_CHOICES)
    command_data = models.JSONField(help_text="Command parameters and data")
    
    # Execution tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    sent_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results
    response_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_commands')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Command expiration time")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['device', 'status']),
            models.Index(fields=['command_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.command_type} for {self.device.name}"
    
    def mark_sent(self):
        """Mark command as sent"""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at'])
    
    def mark_completed(self, response_data=None):
        """Mark command as completed"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        if response_data:
            self.response_data = response_data
        self.save(update_fields=['status', 'completed_at', 'response_data'])
    
    def mark_failed(self, error_message):
        """Mark command as failed"""
        self.status = 'failed'
        self.error_message = error_message
        self.save(update_fields=['status', 'error_message'])
    
    @property
    def is_expired(self):
        """Check if command has expired"""
        return timezone.now() > self.expires_at