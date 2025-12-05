"""
Payment Service Permissions
"""
from rest_framework import permissions


class IsTransactionOwner(permissions.BasePermission):
    """
    Permission to check if user is part of the transaction
    """
    
    def has_object_permission(self, request, view, obj):
        # Allow if user is the payer or recipient
        return obj.user == request.user or obj.recipient == request.user


class IsDisputeParty(permissions.BasePermission):
    """
    Permission to check if user is part of the dispute
    """
    
    def has_object_permission(self, request, view, obj):
        # Allow if user raised the dispute or is the defendant
        return obj.raised_by == request.user or obj.against == request.user


class IsEscrowParty(permissions.BasePermission):
    """
    Permission to check if user is part of the escrow
    """
    
    def has_object_permission(self, request, view, obj):
        # Allow if user is buyer or seller
        return obj.buyer == request.user or obj.seller == request.user
