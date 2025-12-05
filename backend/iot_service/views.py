"""
API views for IoT service functionality
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Max
from django.utils import timezone
from django.shortcuts import get_object_or_404
import logging
from datetime import timedelta

from .models import (
    DeviceType, IoTDevice, SensorType, SensorReading, 
    DeviceAlert, DeviceGroup, FirmwareVersion, DeviceCommand
)
from .serializers import (
    DeviceTypeSerializer, IoTDeviceSerializer, IoTDeviceListSerializer,
    SensorTypeSerializer, SensorReadingSerializer, SensorReadingCreateSerializer,
    BatchSensorReadingSerializer, DeviceAlertSerializer, DeviceGroupSerializer,
    FirmwareVersionSerializer, DeviceCommandSerializer, DeviceStatusSerializer,
    DeviceAnalyticsSerializer, AlertAcknowledgeSerializer, DeviceConfigurationSerializer
)
from .permissions import IsOwnerOrReadOnly, CanManageIoTDevices, IsDeviceOwner

logger = logging.getLogger(__name__)


class DeviceTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing device types
    """
    serializer_class = DeviceTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'manufacturer', 'is_active']
    search_fields = ['name', 'manufacturer', 'model_number']
    ordering_fields = ['name', 'manufacturer', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter active device types"""
        return DeviceType.objects.filter(is_active=True)


class SensorTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing sensor types
    """
    serializer_class = SensorTypeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['measurement_unit', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'measurement_unit', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter active sensor types"""
        return SensorType.objects.filter(is_active=True)


class IoTDeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IoT devices
    """
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'device_type', 'connectivity_type', 'farm', 'field']
    search_fields = ['name', 'device_id', 'location_description']
    ordering_fields = ['name', 'registered_at', 'last_seen', 'battery_level']
    ordering = ['-registered_at']
    
    def get_queryset(self):
        """Filter devices for current user"""
        return IoTDevice.objects.filter(
            owner=self.request.user
        ).select_related('device_type', 'farm', 'field')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return IoTDeviceListSerializer
        return IoTDeviceSerializer
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a device"""
        device = self.get_object()
        device.activate()
        
        return Response({
            'message': f'Device {device.name} activated successfully',
            'status': device.status
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a device"""
        device = self.get_object()
        device.deactivate()
        
        return Response({
            'message': f'Device {device.name} deactivated successfully',
            'status': device.status
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update device status and metadata"""
        device = self.get_object()
        serializer = DeviceStatusSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update device fields
        for field, value in serializer.validated_data.items():
            setattr(device, field, value)
        
        device.update_last_seen()
        device.save()
        
        return Response({
            'message': 'Device status updated successfully',
            'device': IoTDeviceSerializer(device).data
        })
    
    @action(detail=True, methods=['post'])
    def configure(self, request, pk=None):
        """Update device configuration"""
        device = self.get_object()
        serializer = DeviceConfigurationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update configuration
        for field, value in serializer.validated_data.items():
            setattr(device, field, value)
        
        device.save()
        
        return Response({
            'message': 'Device configuration updated successfully',
            'configuration': device.configuration
        })
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get device analytics"""
        device = self.get_object()
        
        # Calculate analytics
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        
        readings_count = SensorReading.objects.filter(
            device=device,
            timestamp__gte=last_24h
        ).count()
        
        last_reading = SensorReading.objects.filter(
            device=device
        ).order_by('-timestamp').first()
        
        alerts_count = DeviceAlert.objects.filter(
            device=device,
            status='active'
        ).count()
        
        analytics_data = {
            'device_id': device.id,
            'device_name': device.name,
            'uptime_percentage': device.uptime_percentage,
            'total_readings': readings_count,
            'last_reading_time': last_reading.timestamp if last_reading else None,
            'battery_level': device.battery_level or 0,
            'signal_strength': device.signal_strength or -100,
            'alert_count': alerts_count,
            'status': device.status
        }
        
        serializer = DeviceAnalyticsSerializer(analytics_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard overview of all user devices"""
        devices = self.get_queryset()
        
        total_devices = devices.count()
        active_devices = devices.filter(status='active').count()
        online_devices = sum(1 for device in devices if device.is_online)
        
        # Recent alerts
        recent_alerts = DeviceAlert.objects.filter(
            device__owner=request.user,
            status='active'
        ).order_by('-created_at')[:10]
        
        # Recent readings
        recent_readings = SensorReading.objects.filter(
            device__owner=request.user
        ).order_by('-timestamp')[:20]
        
        return Response({
            'summary': {
                'total_devices': total_devices,
                'active_devices': active_devices,
                'online_devices': online_devices,
                'offline_devices': total_devices - online_devices,
            },
            'recent_alerts': DeviceAlertSerializer(recent_alerts, many=True).data,
            'recent_readings': SensorReadingSerializer(recent_readings, many=True).data
        })


class SensorReadingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing sensor readings
    """
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAuthenticated, IsDeviceOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['device', 'sensor_type', 'quality']
    ordering_fields = ['timestamp', 'received_at', 'value']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        """Filter readings for user's devices"""
        return SensorReading.objects.filter(
            device__owner=self.request.user
        ).select_related('device', 'sensor_type')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return SensorReadingCreateSerializer
        return SensorReadingSerializer
    
    @action(detail=False, methods=['post'])
    def batch_upload(self, request):
        """Upload multiple sensor readings at once"""
        serializer = BatchSensorReadingSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        device_id = serializer.validated_data['device_id']
        readings_data = serializer.validated_data['readings']
        
        try:
            device = IoTDevice.objects.get(
                device_id=device_id,
                owner=request.user
            )
        except IoTDevice.DoesNotExist:
            return Response(
                {'error': 'Device not found or not owned by user'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Process readings
        created_readings = []
        errors = []
        
        for i, reading_data in enumerate(readings_data):
            try:
                # Get sensor type
                sensor_type = SensorType.objects.get(name=reading_data['sensor_type'])
                
                # Create reading
                reading = SensorReading.objects.create(
                    device=device,
                    sensor_type=sensor_type,
                    value=reading_data['value'],
                    raw_value=reading_data.get('raw_value'),
                    timestamp=reading_data['timestamp'],
                    metadata=reading_data.get('metadata', {})
                )
                
                # Validate reading
                reading.validate_reading()
                created_readings.append(reading)
                
            except SensorType.DoesNotExist:
                errors.append(f"Reading {i}: Sensor type '{reading_data['sensor_type']}' not found")
            except Exception as e:
                errors.append(f"Reading {i}: {str(e)}")
        
        # Update device last seen
        device.update_last_seen()
        
        return Response({
            'message': f'Processed {len(readings_data)} readings',
            'created': len(created_readings),
            'errors': len(errors),
            'error_details': errors[:10]  # Limit error details
        })
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest readings for each sensor type per device"""
        device_id = request.query_params.get('device_id')
        
        if device_id:
            try:
                device = IoTDevice.objects.get(id=device_id, owner=request.user)
                queryset = self.get_queryset().filter(device=device)
            except IoTDevice.DoesNotExist:
                return Response(
                    {'error': 'Device not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            queryset = self.get_queryset()
        
        # Get latest reading for each device-sensor combination
        latest_readings = []
        devices = queryset.values_list('device', flat=True).distinct()
        
        for device_id in devices:
            device_readings = queryset.filter(device_id=device_id)
            sensor_types = device_readings.values_list('sensor_type', flat=True).distinct()
            
            for sensor_type_id in sensor_types:
                latest = device_readings.filter(
                    sensor_type_id=sensor_type_id
                ).order_by('-timestamp').first()
                
                if latest:
                    latest_readings.append(latest)
        
        serializer = self.get_serializer(latest_readings, many=True)
        return Response(serializer.data)


class DeviceAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing device alerts
    """
    serializer_class = DeviceAlertSerializer
    permission_classes = [IsAuthenticated, IsDeviceOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['device', 'alert_type', 'severity', 'status']
    ordering_fields = ['created_at', 'severity']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter alerts for user's devices"""
        return DeviceAlert.objects.filter(
            device__owner=self.request.user
        ).select_related('device', 'acknowledged_by')
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert"""
        alert = self.get_object()
        serializer = AlertAcknowledgeSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        alert.acknowledge(request.user)
        
        # Add notes to metadata if provided
        notes = serializer.validated_data.get('notes')
        if notes:
            alert.metadata['acknowledgment_notes'] = notes
            alert.save(update_fields=['metadata'])
        
        return Response({
            'message': 'Alert acknowledged successfully',
            'alert': DeviceAlertSerializer(alert).data
        })
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve an alert"""
        alert = self.get_object()
        alert.resolve()
        
        return Response({
            'message': 'Alert resolved successfully',
            'alert': DeviceAlertSerializer(alert).data
        })
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active alerts"""
        active_alerts = self.get_queryset().filter(status='active')
        serializer = self.get_serializer(active_alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get alert summary statistics"""
        queryset = self.get_queryset()
        
        summary = {
            'total_alerts': queryset.count(),
            'active_alerts': queryset.filter(status='active').count(),
            'critical_alerts': queryset.filter(
                status='active',
                severity='critical'
            ).count(),
            'alerts_by_type': list(
                queryset.values('alert_type').annotate(
                    count=Count('id')
                ).order_by('-count')
            ),
            'alerts_by_severity': list(
                queryset.filter(status='active').values('severity').annotate(
                    count=Count('id')
                ).order_by('-count')
            )
        }
        
        return Response(summary)


class DeviceGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing device groups
    """
    serializer_class = DeviceGroupSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter groups for current user"""
        return DeviceGroup.objects.filter(
            owner=self.request.user
        ).prefetch_related('devices')
    
    @action(detail=True, methods=['post'])
    def add_device(self, request, pk=None):
        """Add device to group"""
        group = self.get_object()
        device_id = request.data.get('device_id')
        
        if not device_id:
            return Response(
                {'error': 'device_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            device = IoTDevice.objects.get(id=device_id, owner=request.user)
            group.devices.add(device)
            
            return Response({
                'message': f'Device {device.name} added to group {group.name}',
                'devices_count': group.devices.count()
            })
        except IoTDevice.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_device(self, request, pk=None):
        """Remove device from group"""
        group = self.get_object()
        device_id = request.data.get('device_id')
        
        if not device_id:
            return Response(
                {'error': 'device_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            device = IoTDevice.objects.get(id=device_id, owner=request.user)
            group.devices.remove(device)
            
            return Response({
                'message': f'Device {device.name} removed from group {group.name}',
                'devices_count': group.devices.count()
            })
        except IoTDevice.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class FirmwareVersionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing firmware versions
    """
    serializer_class = FirmwareVersionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['device_type', 'status']
    ordering_fields = ['version', 'released_at', 'created_at']
    ordering = ['-released_at']
    
    def get_queryset(self):
        """Filter firmware versions"""
        return FirmwareVersion.objects.select_related('device_type')
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest stable firmware for each device type"""
        device_type_id = request.query_params.get('device_type')
        
        if device_type_id:
            queryset = self.get_queryset().filter(
                device_type_id=device_type_id,
                status='stable'
            ).order_by('-released_at')[:1]
        else:
            # Get latest for all device types
            device_types = DeviceType.objects.filter(is_active=True)
            latest_versions = []
            
            for device_type in device_types:
                latest = self.get_queryset().filter(
                    device_type=device_type,
                    status='stable'
                ).order_by('-released_at').first()
                
                if latest:
                    latest_versions.append(latest)
            
            queryset = latest_versions
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class DeviceCommandViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing device commands
    """
    serializer_class = DeviceCommandSerializer
    permission_classes = [IsAuthenticated, IsDeviceOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['device', 'command_type', 'status']
    ordering_fields = ['created_at', 'expires_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter commands for user's devices"""
        return DeviceCommand.objects.filter(
            device__owner=self.request.user
        ).select_related('device', 'created_by')
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a pending command"""
        command = self.get_object()
        
        if command.status != 'pending':
            return Response(
                {'error': 'Command is not in pending state'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if command.is_expired:
            command.mark_failed('Command expired')
            return Response(
                {'error': 'Command has expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark as sent (in production, this would trigger actual device communication)
        command.mark_sent()
        
        return Response({
            'message': 'Command sent to device',
            'command': DeviceCommandSerializer(command).data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark command as completed (called by device)"""
        command = self.get_object()
        response_data = request.data.get('response_data', {})
        
        command.mark_completed(response_data)
        
        return Response({
            'message': 'Command marked as completed',
            'command': DeviceCommandSerializer(command).data
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending commands for a device"""
        device_id = request.query_params.get('device_id')
        
        if not device_id:
            return Response(
                {'error': 'device_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            device = IoTDevice.objects.get(id=device_id, owner=request.user)
            pending_commands = self.get_queryset().filter(
                device=device,
                status='pending'
            ).exclude(expires_at__lt=timezone.now())
            
            serializer = self.get_serializer(pending_commands, many=True)
            return Response(serializer.data)
            
        except IoTDevice.DoesNotExist:
            return Response(
                {'error': 'Device not found'},
                status=status.HTTP_404_NOT_FOUND
            )