"""
Admin configuration for IoT service models
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    DeviceType, IoTDevice, SensorType, SensorReading, 
    DeviceAlert, DeviceGroup, FirmwareVersion, DeviceCommand
)


@admin.register(DeviceType)
class DeviceTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'manufacturer', 'model_number', 
        'firmware_version', 'devices_count', 'is_active'
    ]
    list_filter = ['category', 'manufacturer', 'is_active', 'created_at']
    search_fields = ['name', 'manufacturer', 'model_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'manufacturer', 'model_number')
        }),
        ('Technical Specifications', {
            'fields': ('supported_sensors', 'communication_protocols', 'power_requirements')
        }),
        ('Firmware', {
            'fields': ('firmware_version', 'update_url')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def devices_count(self, obj):
        return obj.devices.count()
    devices_count.short_description = 'Devices'


@admin.register(SensorType)
class SensorTypeAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'measurement_unit', 'min_value', 'max_value', 
        'default_min_threshold', 'default_max_threshold', 'is_active'
    ]
    list_filter = ['measurement_unit', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['id', 'created_at']


@admin.register(IoTDevice)
class IoTDeviceAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'device_id', 'device_type', 'owner', 'status', 
        'battery_level', 'is_online_display', 'last_seen'
    ]
    list_filter = [
        'status', 'device_type', 'connectivity_type', 'registered_at'
    ]
    search_fields = ['name', 'device_id', 'owner__username', 'location_description']
    readonly_fields = ['id', 'registered_at', 'last_seen', 'is_online']
    
    fieldsets = (
        ('Device Information', {
            'fields': ('device_id', 'name', 'device_type', 'owner')
        }),
        ('Location', {
            'fields': ('farm', 'field', 'latitude', 'longitude', 'altitude', 'location_description')
        }),
        ('Configuration', {
            'fields': ('configuration', 'sampling_interval')
        }),
        ('Connectivity', {
            'fields': ('connectivity_type', 'network_config')
        }),
        ('Status', {
            'fields': ('status', 'battery_level', 'signal_strength')
        }),
        ('Firmware', {
            'fields': ('firmware_version', 'last_firmware_update')
        }),
        ('Maintenance', {
            'fields': ('maintenance_schedule',)
        }),
        ('Timestamps', {
            'fields': ('registered_at', 'activated_at', 'last_seen')
        }),
    )
    
    def is_online_display(self, obj):
        if obj.is_online:
            return format_html('<span style="color: green;">●</span> Online')
        else:
            return format_html('<span style="color: red;">●</span> Offline')
    is_online_display.short_description = 'Status'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'device_type', 'owner', 'farm', 'field'
        )


@admin.register(SensorReading)
class SensorReadingAdmin(admin.ModelAdmin):
    list_display = [
        'device', 'sensor_type', 'value', 'quality', 
        'timestamp', 'is_validated'
    ]
    list_filter = [
        'sensor_type', 'quality', 'is_validated', 'timestamp', 'received_at'
    ]
    search_fields = ['device__name', 'device__device_id', 'sensor_type__name']
    readonly_fields = ['id', 'received_at', 'is_recent']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Reading Information', {
            'fields': ('device', 'sensor_type', 'value', 'raw_value')
        }),
        ('Quality', {
            'fields': ('quality', 'is_validated', 'validation_notes')
        }),
        ('Timestamps', {
            'fields': ('timestamp', 'received_at')
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'device', 'sensor_type'
        )


@admin.register(DeviceAlert)
class DeviceAlertAdmin(admin.ModelAdmin):
    list_display = [
        'device', 'alert_type', 'severity', 'title', 
        'status', 'created_at', 'acknowledged_by'
    ]
    list_filter = [
        'alert_type', 'severity', 'status', 'created_at'
    ]
    search_fields = ['device__name', 'title', 'message']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Alert Information', {
            'fields': ('device', 'alert_type', 'severity', 'title', 'message')
        }),
        ('Related Data', {
            'fields': ('sensor_reading', 'threshold_value', 'actual_value')
        }),
        ('Status', {
            'fields': ('status', 'acknowledged_by', 'acknowledged_at', 'resolved_at')
        }),
        ('Metadata', {
            'fields': ('metadata',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    actions = ['mark_resolved']
    
    def mark_resolved(self, request, queryset):
        """Mark selected alerts as resolved"""
        updated = queryset.filter(status__in=['active', 'acknowledged']).update(
            status='resolved'
        )
        self.message_user(request, f"Marked {updated} alerts as resolved.")
    mark_resolved.short_description = "Mark selected alerts as resolved"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'device', 'acknowledged_by', 'sensor_reading'
        )


@admin.register(DeviceGroup)
class DeviceGroupAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'owner', 'devices_count', 'active_devices_count', 'is_active'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description', 'owner__username']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['devices']
    
    fieldsets = (
        ('Group Information', {
            'fields': ('name', 'description', 'owner')
        }),
        ('Devices', {
            'fields': ('devices',)
        }),
        ('Configuration', {
            'fields': ('configuration',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def devices_count(self, obj):
        return obj.devices.count()
    devices_count.short_description = 'Total Devices'
    
    def active_devices_count(self, obj):
        return obj.active_devices_count
    active_devices_count.short_description = 'Active Devices'


@admin.register(FirmwareVersion)
class FirmwareVersionAdmin(admin.ModelAdmin):
    list_display = [
        'device_type', 'version', 'status', 'file_size_mb', 
        'released_at', 'is_latest'
    ]
    list_filter = ['device_type', 'status', 'released_at', 'created_at']
    search_fields = ['version', 'description', 'device_type__name']
    readonly_fields = ['id', 'created_at', 'is_latest']
    
    fieldsets = (
        ('Version Information', {
            'fields': ('device_type', 'version', 'build_number', 'description')
        }),
        ('Firmware File', {
            'fields': ('file_url', 'file_size', 'checksum')
        }),
        ('Compatibility', {
            'fields': ('status', 'min_hardware_version', 'compatible_versions')
        }),
        ('Release Information', {
            'fields': ('changelog', 'released_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    def file_size_mb(self, obj):
        if obj.file_size:
            return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return "N/A"
    file_size_mb.short_description = 'File Size'


@admin.register(DeviceCommand)
class DeviceCommandAdmin(admin.ModelAdmin):
    list_display = [
        'device', 'command_type', 'status', 'created_by', 
        'created_at', 'expires_at', 'is_expired'
    ]
    list_filter = ['command_type', 'status', 'created_at']
    search_fields = ['device__name', 'device__device_id', 'created_by__username']
    readonly_fields = [
        'id', 'created_at', 'sent_at', 'acknowledged_at', 
        'completed_at', 'is_expired'
    ]
    
    fieldsets = (
        ('Command Information', {
            'fields': ('device', 'command_type', 'command_data', 'created_by')
        }),
        ('Execution', {
            'fields': ('status', 'sent_at', 'acknowledged_at', 'completed_at')
        }),
        ('Results', {
            'fields': ('response_data', 'error_message')
        }),
        ('Timing', {
            'fields': ('created_at', 'expires_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'device', 'created_by'
        )