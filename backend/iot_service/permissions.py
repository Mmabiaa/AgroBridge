"""
Permissions for IoT service
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.owner == request.user


class IsDeviceOwner(permissions.BasePermission):
    """
    Permission to check if user owns the device related to the object
    """

    def has_object_permission(self, request, view, obj):
        # Check if object has a device attribute
        if hasattr(obj, 'device'):
            return obj.device.owner == request.user
        
        # Check if object has a device_id attribute (for readings, alerts, etc.)
        if hasattr(obj, 'device_id'):
            from .models import IoTDevice
            try:
                device = IoTDevice.objects.get(id=obj.device_id)
                return device.owner == request.user
            except IoTDevice.DoesNotExist:
                return False
        
        return False


class CanManageIoTDevices(permissions.BasePermission):
    """
    Permission to check if user can manage IoT devices
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['farmer', 'admin', 'expert']
        )


class IsAdminOrExpert(permissions.BasePermission):
    """
    Permission to check if user is admin or expert
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['admin', 'expert']
        )


class CanAccessDeviceData(permissions.BasePermission):
    """
    Permission to check if user can access device data
    """

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Users can access their own device data
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        # For device-related objects, check device ownership
        if hasattr(obj, 'device'):
            return obj.device.owner == request.user
        
        return False


class CanManageFirmware(permissions.BasePermission):
    """
    Permission to manage firmware versions
    """

    def has_permission(self, request, view):
        # Only admins can manage firmware
        return (
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )