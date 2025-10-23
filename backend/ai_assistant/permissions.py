"""
Custom permissions for AI assistant
"""
from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has permission to access the view
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the specific object
        """
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            # For conversations and messages, only owner can read
            if hasattr(obj, 'user'):
                return obj.user == request.user or request.user.is_staff
            elif hasattr(obj, 'conversation'):
                return obj.conversation.user == request.user or request.user.is_staff
            return True
        
        # Write permissions are only allowed to the owner
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_staff
        elif hasattr(obj, 'conversation'):
            return obj.conversation.user == request.user or request.user.is_staff
        
        return request.user.is_staff


class CanAccessAIFeatures(permissions.BasePermission):
    """
    Permission that checks if user can access AI features based on their role
    """
    
    def has_permission(self, request, view):
        """
        Check if user can access AI features
        """
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Check if user's role allows AI features
        allowed_roles = ['farmer', 'poultry_keeper', 'expert', 'ngo', 'admin']
        return request.user.role in allowed_roles
    
    def has_object_permission(self, request, view, obj):
        """
        Check object-level permissions
        """
        # Users can only access their own AI data
        if hasattr(obj, 'user'):
            return obj.user == request.user or request.user.is_staff
        elif hasattr(obj, 'conversation'):
            return obj.conversation.user == request.user or request.user.is_staff
        
        return request.user.is_staff


class IsKnowledgeBaseEditor(permissions.BasePermission):
    """
    Permission for editing knowledge base articles
    """
    
    def has_permission(self, request, view):
        """
        Check if user can edit knowledge base
        """
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Only experts, NGOs, and admins can edit knowledge base
        allowed_roles = ['expert', 'ngo', 'admin']
        return request.user.role in allowed_roles or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        """
        Check object-level permissions for knowledge base
        """
        # Read permissions for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions for experts, NGOs, and admins
        allowed_roles = ['expert', 'ngo', 'admin']
        return request.user.role in allowed_roles or request.user.is_staff