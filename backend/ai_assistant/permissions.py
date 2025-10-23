"""
Permissions for AI assistant app
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


class CanAccessAIFeatures(permissions.BasePermission):
    """
    Permission to check if user can access AI features
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has AI access (could be based on subscription, role, etc.)
        # For now, all authenticated users have access
        return True


class CanUseVoiceFeatures(permissions.BasePermission):
    """
    Permission to check if user can use voice features
    """

    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Check if user has voice feature access
        # This could be based on subscription tier, user role, etc.
        # For now, all authenticated users have access
        return True


class CanAccessKnowledgeBase(permissions.BasePermission):
    """
    Permission to check if user can access knowledge base
    """

    def has_permission(self, request, view):
        # Knowledge base is accessible to all authenticated users
        return request.user.is_authenticated


class CanManageKnowledgeBase(permissions.BasePermission):
    """
    Permission to check if user can manage knowledge base entries
    """

    def has_permission(self, request, view):
        # Only staff/admin users can manage knowledge base
        return request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.is_superuser or
            getattr(request.user, 'role', '') in ['admin', 'expert']
        )