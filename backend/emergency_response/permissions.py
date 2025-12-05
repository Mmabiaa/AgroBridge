"""Permissions for emergency response service."""

from rest_framework import permissions


class IsStaffOrReadOnly(permissions.BasePermission):
    """
    Permission to only allow staff to create/edit, but anyone to read.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff


class IsReporterOrStaff(permissions.BasePermission):
    """
    Permission to only allow reporters to view their own reports or staff to view all.
    """
    
    def has_object_permission(self, request, view, obj):
        # Staff can do anything
        if request.user.is_staff:
            return True
        
        # Reporters can only view/edit their own reports
        if hasattr(obj, 'reporter'):
            return obj.reporter == request.user
        
        return False
