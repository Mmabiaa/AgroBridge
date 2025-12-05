"""
Custom permissions for scheduling service
"""
from rest_framework import permissions


class IsTaskOwnerOrAssigned(permissions.BasePermission):
    """
    Permission that allows task owners and assigned users to access tasks
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user is owner or assigned to task"""
        # Task owner has full access
        if obj.user == request.user:
            return True
        
        # Assigned users can view and update (but not delete)
        if request.user in obj.assigned_to.all():
            if request.method in permissions.SAFE_METHODS:
                return True
            # Assigned users can mark tasks complete or update status
            if request.method in ['PATCH', 'PUT']:
                return True
            return False
        
        # Staff can access all tasks
        return request.user.is_staff


class IsTemplateOwner(permissions.BasePermission):
    """
    Permission that allows template owners to edit their templates
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated"""
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """Check if user is owner of template"""
        # Read permissions for public templates or owned templates
        if request.method in permissions.SAFE_METHODS:
            return obj.is_public or obj.user == request.user or request.user.is_staff
        
        # Write permissions only for owner
        return obj.user == request.user or request.user.is_staff
