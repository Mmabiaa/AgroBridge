from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed to admin users
        return request.user and request.user.is_staff


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow superadmins.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class CanModerateContent(permissions.BasePermission):
    """
    Custom permission for content moderation.
    """
    def has_permission(self, request, view):
        return request.user and (
            request.user.is_staff or 
            hasattr(request.user, 'profile') and request.user.profile.role == 'admin'
        )
