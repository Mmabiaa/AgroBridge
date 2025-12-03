"""
Role-Based Access Control (RBAC) Permissions

This module provides permission classes and decorators for enforcing
role-based access control across the authentication service.
"""

from rest_framework import permissions
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


class IsVerified(permissions.BasePermission):
    """
    Permission class to check if user is verified
    """
    message = "Your account must be verified to access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_verified


class IsFarmer(permissions.BasePermission):
    """
    Permission class to check if user is a farmer
    """
    message = "Only farmers can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'farmer'


class IsBuyer(permissions.BasePermission):
    """
    Permission class to check if user is a buyer
    """
    message = "Only buyers can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'buyer'


class IsPoultryKeeper(permissions.BasePermission):
    """
    Permission class to check if user is a poultry keeper
    """
    message = "Only poultry keepers can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'poultry_keeper'


class IsExpert(permissions.BasePermission):
    """
    Permission class to check if user is an expert
    """
    message = "Only agricultural experts can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'expert'


class IsNGO(permissions.BasePermission):
    """
    Permission class to check if user is an NGO representative
    """
    message = "Only NGO representatives can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'ngo'


class IsAdmin(permissions.BasePermission):
    """
    Permission class to check if user is an admin
    """
    message = "Only administrators can access this resource."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'admin'


class HasFeatureAccess(permissions.BasePermission):
    """
    Permission class to check if user has access to a specific feature
    
    Usage:
        class MyView(APIView):
            permission_classes = [HasFeatureAccess]
            required_feature = 'use_crop_detection'
    """
    message = "You don't have permission to access this feature."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        required_feature = getattr(view, 'required_feature', None)
        if not required_feature:
            logger.warning(f"View {view.__class__.__name__} uses HasFeatureAccess but doesn't define required_feature")
            return False
        
        return request.user.can_access_feature(required_feature)


class HasAnyRole(permissions.BasePermission):
    """
    Permission class to check if user has any of the specified roles
    
    Usage:
        class MyView(APIView):
            permission_classes = [HasAnyRole]
            allowed_roles = ['farmer', 'poultry_keeper']
    """
    message = "You don't have the required role to access this resource."
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        allowed_roles = getattr(view, 'allowed_roles', [])
        if not allowed_roles:
            logger.warning(f"View {view.__class__.__name__} uses HasAnyRole but doesn't define allowed_roles")
            return False
        
        return request.user.role in allowed_roles


# Decorator functions for function-based views

def require_verified(view_func):
    """
    Decorator to require verified user for function-based views
    
    Usage:
        @api_view(['GET'])
        @permission_classes([IsAuthenticated])
        @require_verified
        def my_view(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user exists and is authenticated
        if not hasattr(request, 'user') or request.user is None or request.user.is_anonymous:
            return Response(
                {'error': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if not request.user.is_verified:
            return Response(
                {'error': 'Your account must be verified to access this resource.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper


def require_role(*roles):
    """
    Decorator to require specific role(s) for function-based views
    
    Usage:
        @api_view(['GET'])
        @permission_classes([IsAuthenticated])
        @require_role('farmer', 'poultry_keeper')
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user exists and is authenticated
            if not hasattr(request, 'user') or request.user is None or request.user.is_anonymous:
                return Response(
                    {'error': 'Authentication required.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if request.user.role not in roles:
                return Response(
                    {'error': f'Only {", ".join(roles)} can access this resource.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_feature(feature_name):
    """
    Decorator to require specific feature access for function-based views
    
    Usage:
        @api_view(['GET'])
        @permission_classes([IsAuthenticated])
        @require_feature('use_crop_detection')
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Check if user exists and is authenticated
            if not hasattr(request, 'user') or request.user is None or request.user.is_anonymous:
                return Response(
                    {'error': 'Authentication required.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if not request.user.can_access_feature(feature_name):
                return Response(
                    {'error': f'You don\'t have permission to access the {feature_name} feature.'},
                    status=status.HTTP_403_FORBIDDEN
                )
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_admin(view_func):
    """
    Decorator to require admin role for function-based views
    
    Usage:
        @api_view(['GET'])
        @permission_classes([IsAuthenticated])
        @require_admin
        def my_view(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Check if user exists and is authenticated
        if not hasattr(request, 'user') or request.user is None or request.user.is_anonymous:
            return Response(
                {'error': 'Authentication required.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can access this resource.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper
