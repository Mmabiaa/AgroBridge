"""
URL configuration for IoT service
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'device-types', views.DeviceTypeViewSet, basename='devicetype')
router.register(r'sensor-types', views.SensorTypeViewSet, basename='sensortype')
router.register(r'devices', views.IoTDeviceViewSet, basename='device')
router.register(r'readings', views.SensorReadingViewSet, basename='reading')
router.register(r'alerts', views.DeviceAlertViewSet, basename='alert')
router.register(r'groups', views.DeviceGroupViewSet, basename='group')
router.register(r'firmware', views.FirmwareVersionViewSet, basename='firmware')
router.register(r'commands', views.DeviceCommandViewSet, basename='command')

app_name = 'iot_service'

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
]