"""Permissions for export documentation service."""

from rest_framework import permissions


class IsDocumentOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of a document or admins to access it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.is_staff:
            return True
        
        # Check if user owns the document
        if hasattr(obj, 'user'):
            return obj.user == request.user
        
        # For related objects, check the document owner
        if hasattr(obj, 'document'):
            return obj.document.user == request.user
        
        return False


class CanApproveDocuments(permissions.BasePermission):
    """
    Permission to approve/reject documents.
    Only staff members can approve documents.
    """
    
    def has_permission(self, request, view):
        return request.user.is_staff


class CanManageTemplates(permissions.BasePermission):
    """
    Permission to manage document templates.
    Only staff members can manage templates.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff


class CanManageComplianceRules(permissions.BasePermission):
    """
    Permission to manage compliance rules.
    Only staff members can manage rules.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_staff
