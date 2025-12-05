"""
Signal handlers for IoT service
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import SensorReading, DeviceAlert, IoTDevice


@receiver(post_save, sender=SensorReading)
def check_sensor_thresholds(sender, instance, created, **kwargs):
    """
    Check sensor readings against thresholds and create alerts if needed
    """
    if not created:
        return
    
    sensor_type = instance.sensor_type
    device = instance.device
    
    # Check if reading violates thresholds
    alert_needed = False
    alert_type = 'threshold'
    severity = 'medium'
    threshold_value = None
    
    if (sensor_type.default_min_threshold is not None and 
        instance.value < sensor_type.default_min_threshold):
        alert_needed = True
        threshold_value = sensor_type.default_min_threshold
        severity = 'high' if instance.value < threshold_value * 0.8 else 'medium'
        
    elif (sensor_type.default_max_threshold is not None and 
          instance.value > sensor_type.default_max_threshold):
        alert_needed = True
        threshold_value = sensor_type.default_max_threshold
        severity = 'high' if instance.value > threshold_value * 1.2 else 'medium'
    
    if alert_needed:
        # Check if there's already an active alert for this condition
        existing_alert = DeviceAlert.objects.filter(
            device=device,
            alert_type=alert_type,
            status='active',
            sensor_reading__sensor_type=sensor_type
        ).first()
        
        if not existing_alert:
            # Create new alert
            title = f"{sensor_type.name} threshold violation"
            message = (
                f"Sensor reading of {instance.value} {sensor_type.measurement_unit} "
                f"violates threshold of {threshold_value} {sensor_type.measurement_unit}"
            )
            
            DeviceAlert.objects.create(
                device=device,
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=message,
                sensor_reading=instance,
                threshold_value=threshold_value,
                actual_value=instance.value,
                metadata={
                    'sensor_type': sensor_type.name,
                    'auto_generated': True
                }
            )


@receiver(pre_save, sender=IoTDevice)
def check_device_status_changes(sender, instance, **kwargs):
    """
    Monitor device status changes and create alerts for offline devices
    """
    if instance.pk:  # Only for existing devices
        try:
            old_instance = IoTDevice.objects.get(pk=instance.pk)
            
            # Check if device went offline
            if (old_instance.status == 'active' and 
                instance.status in ['offline', 'error']):
                
                # Create offline alert
                DeviceAlert.objects.create(
                    device=instance,
                    alert_type='device_offline',
                    severity='high',
                    title=f"Device {instance.name} went offline",
                    message=f"Device {instance.name} ({instance.device_id}) is no longer responding",
                    metadata={
                        'previous_status': old_instance.status,
                        'new_status': instance.status,
                        'auto_generated': True
                    }
                )
            
            # Check for low battery
            if (instance.battery_level is not None and 
                instance.battery_level <= 20 and
                (old_instance.battery_level is None or old_instance.battery_level > 20)):
                
                severity = 'critical' if instance.battery_level <= 10 else 'high'
                
                DeviceAlert.objects.create(
                    device=instance,
                    alert_type='low_battery',
                    severity=severity,
                    title=f"Low battery on {instance.name}",
                    message=f"Device {instance.name} battery level is {instance.battery_level}%",
                    actual_value=instance.battery_level,
                    metadata={
                        'battery_level': instance.battery_level,
                        'auto_generated': True
                    }
                )
                
        except IoTDevice.DoesNotExist:
            pass


@receiver(post_save, sender=SensorReading)
def update_device_last_seen(sender, instance, created, **kwargs):
    """
    Update device last_seen timestamp when new readings are received
    """
    if created:
        device = instance.device
        if not device.last_seen or instance.timestamp > device.last_seen:
            device.last_seen = instance.timestamp
            device.save(update_fields=['last_seen'])