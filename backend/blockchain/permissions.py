"""Custom permissions for blockchain service."""

from rest_framework import permissions


class IsCertificateOwner(permissions.BasePermission):
    """Permission to check if user is the certificate owner."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user owns the certificate."""
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for owner or staff
        return obj.owner == request.user or request.user.is_staff


class IsSupplyChainActor(permissions.BasePermission):
    """Permission to check if user is involved in supply chain event."""
    
    def has_object_permission(self, request, view, obj):
        """Check if user is the event actor."""
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for actor or staff
        return obj.actor == request.user or request.user.is_staff


class IsCertificationBodyAdmin(permissions.BasePermission):
    """Permission for certification body management."""
    
    def has_permission(self, request, view):
        """Only staff can manage certification bodies."""
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff
