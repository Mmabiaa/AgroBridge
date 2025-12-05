"""
Custom permissions for farm management
"""
from rest_framework import permissions


class IsFarmOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of a farm to edit it.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has permission to access the view
        """
        # Read permissions are allowed for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed for authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the specific object
        """
        # Read permissions are allowed for any authenticated user
        # if the farm is public or if the user is the owner
        if request.method in permissions.SAFE_METHODS:
            if hasattr(obj, 'farm'):
                # For related objects (Crop, Livestock, etc.)
                return (obj.farm.is_public or 
                       obj.farm.owner == request.user or 
                       request.user.is_staff)
            elif hasattr(obj, 'field'):
                # For Field-related objects (SatelliteImagery, etc.)
                return (obj.field.farm.is_public or 
                       obj.field.farm.owner == request.user or 
                       request.user.is_staff)
            elif hasattr(obj, 'owner'):
                # For Farm objects
                return (obj.is_public or 
                       obj.owner == request.user or 
                       request.user.is_staff)
            else:
                # For other objects, check if user is staff
                return request.user.is_staff
        
        # Write permissions are only allowed to the owner of the farm
        if hasattr(obj, 'farm'):
            # For related objects (Crop, Livestock, etc.)
            return obj.farm.owner == request.user or request.user.is_staff
        elif hasattr(obj, 'field'):
            # For Field-related objects (SatelliteImagery, etc.)
            return obj.field.farm.owner == request.user or request.user.is_staff
        elif hasattr(obj, 'owner'):
            # For Farm objects
            return obj.owner == request.user or request.user.is_staff
        else:
            # For other objects, check if user is staff
            return request.user.is_staff


class IsFarmOwner(permissions.BasePermission):
    """
    Permission that only allows farm owners to access their data
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user owns the farm or related object
        """
        if hasattr(obj, 'farm'):
            # For related objects (Crop, Livestock, etc.)
            return obj.farm.owner == request.user or request.user.is_staff
        elif hasattr(obj, 'owner'):
            # For Farm objects
            return obj.owner == request.user or request.user.is_staff
        else:
            # For other objects, check if user is staff
            return request.user.is_staff


class CanManageFarmActivities(permissions.BasePermission):
    """
    Permission for managing farm activities
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can manage the activity
        """
        # Farm owner can always manage activities
        if obj.farm.owner == request.user or request.user.is_staff:
            return True
        
        # Assigned user can update activity status and results
        if obj.assigned_to == request.user:
            # Only allow certain actions for assigned users
            allowed_actions = ['retrieve', 'update', 'partial_update', 'mark_completed']
            return view.action in allowed_actions
        
        return False