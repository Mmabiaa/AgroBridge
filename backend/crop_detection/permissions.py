"""
Permissions for crop detection app
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
        return obj.user == request.user


class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """

    def has_object_permission(self, request, view, obj):
        # All permissions are only allowed to the owner of the object.
        return obj.user == request.user


class CanAccessCropDetection(permissions.BasePermission):
    """
    Permission to check if user can access crop detection features
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has crop detection access
        # This could be based on subscription tier, user role, etc.
        # For now, all authenticated users have access
        return True


class IsExpertOrAdmin(permissions.BasePermission):
    """
    Permission to check if user is an expert or admin
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role in ['expert', 'admin']
        )


class CanReviewScans(permissions.BasePermission):
    """
    Permission to check if user can review scan results
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            (request.user.is_staff or request.user.role in ['expert', 'admin'])
        )


class CanManageDiseaseDatabase(permissions.BasePermission):
    """
    Permission to check if user can manage disease database
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            (request.user.is_superuser or request.user.role in ['admin', 'expert'])
        )