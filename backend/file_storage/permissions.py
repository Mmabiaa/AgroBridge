"""Permissions for file storage service."""

from rest_framework import permissions


class IsFileOwnerOrPublic(permissions.BasePermission):
    """
    Permission to only allow owners of a file to access it,
    or allow anyone to access public files.
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if user has permission to access file."""
        # Public files are accessible to everyone
        if obj.is_public:
            return True
        
        # Owner can always access their files
        if obj.uploaded_by == request.user:
            return True
        
        return False


class IsFileOwner(permissions.BasePermission):
    """Permission to only allow owners of a file to modify it."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the file owner."""
        return obj.uploaded_by == request.user
