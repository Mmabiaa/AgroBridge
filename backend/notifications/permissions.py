"""
Notification Service Permissions

This module defines custom permissions for the notification service.
"""

from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission that allows access to owners of the object or admin users.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the object or is admin
        """
        # Admin users have full access
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user owns the notification
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # Check if user owns the notification (for delivery objects)
        if hasattr(obj, 'notification'):
            return obj.notification.user == request.user
        
        return False


class IsAdminUser(permissions.BasePermission):
    """
    Permission that only allows access to admin users.
    """
    
    def has_permission(self, request, view):
        """Check if user is admin"""
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )


class IsOwner(permissions.BasePermission):
    """
    Permission that only allows access to owners of the object.
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user owns the object"""
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        if hasattr(obj, 'notification'):
            return obj.notification.user == request.user
        
        return False


class CanSendNotifications(permissions.BasePermission):
    """
    Permission that allows sending notifications.
    Only admin users or service accounts can send notifications.
    """
    
    def has_permission(self, request, view):
        """Check if user can send notifications"""
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Admin users can send notifications
        if request.user.is_staff or request.user.is_superuser:
            return True
        
        # Check if user has specific permission to send notifications
        return request.user.has_perm('notifications.add_notification')


class CanManageTemplates(permissions.BasePermission):
    """
    Permission that allows managing notification templates.
    Only admin users can manage templates.
    """
    
    def has_permission(self, request, view):
        """Check if user can manage templates"""
        return (
            request.user and 
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.is_superuser)
        )