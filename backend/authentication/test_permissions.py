"""
Tests for Role-Based Access Control (RBAC) permissions
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient, APIRequestFactory
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .permissions import (
    IsVerified, IsFarmer, IsBuyer, IsPoultryKeeper, IsExpert, IsNGO, IsAdmin,
    HasFeatureAccess, HasAnyRole,
    require_verified, require_role, require_feature, require_admin
)

User = get_user_model()


class PermissionClassTest(TestCase):
    """Test permission classes"""
    
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create users with different roles
        self.farmer = User.objects.create_user(
            username='farmer', email='farmer@test.com',
            password='pass123', role='farmer', is_verified=True
        )
        self.buyer = User.objects.create_user(
            username='buyer', email='buyer@test.com',
            password='pass123', role='buyer', is_verified=True
        )
        self.poultry_keeper = User.objects.create_user(
            username='poultry', email='poultry@test.com',
            password='pass123', role='poultry_keeper', is_verified=True
        )
        self.expert = User.objects.create_user(
            username='expert', email='expert@test.com',
            password='pass123', role='expert', is_verified=True
        )
        self.ngo = User.objects.create_user(
            username='ngo', email='ngo@test.com',
            password='pass123', role='ngo', is_verified=True
        )
        self.admin = User.objects.create_user(
            username='admin', email='admin@test.com',
            password='pass123', role='admin', is_verified=True
        )
        self.unverified = User.objects.create_user(
            username='unverified', email='unverified@test.com',
            password='pass123', role='farmer', is_verified=False
        )
    
    def test_is_verified_permission(self):
        """Test IsVerified permission class"""
        permission = IsVerified()
        
        # Create mock request
        request = self.factory.get('/')
        
        # Test with verified user
        request.user = self.farmer
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with unverified user
        request.user = self.unverified
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_farmer_permission(self):
        """Test IsFarmer permission class"""
        permission = IsFarmer()
        request = self.factory.get('/')
        
        # Test with farmer
        request.user = self.farmer
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with non-farmer
        request.user = self.buyer
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_buyer_permission(self):
        """Test IsBuyer permission class"""
        permission = IsBuyer()
        request = self.factory.get('/')
        
        # Test with buyer
        request.user = self.buyer
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with non-buyer
        request.user = self.farmer
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_poultry_keeper_permission(self):
        """Test IsPoultryKeeper permission class"""
        permission = IsPoultryKeeper()
        request = self.factory.get('/')
        
        # Test with poultry keeper
        request.user = self.poultry_keeper
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with non-poultry keeper
        request.user = self.farmer
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_expert_permission(self):
        """Test IsExpert permission class"""
        permission = IsExpert()
        request = self.factory.get('/')
        
        # Test with expert
        request.user = self.expert
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with non-expert
        request.user = self.farmer
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_ngo_permission(self):
        """Test IsNGO permission class"""
        permission = IsNGO()
        request = self.factory.get('/')
        
        # Test with NGO
        request.user = self.ngo
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with non-NGO
        request.user = self.farmer
        self.assertFalse(permission.has_permission(request, None))
    
    def test_is_admin_permission(self):
        """Test IsAdmin permission class"""
        permission = IsAdmin()
        request = self.factory.get('/')
        
        # Test with admin
        request.user = self.admin
        self.assertTrue(permission.has_permission(request, None))
        
        # Test with non-admin
        request.user = self.farmer
        self.assertFalse(permission.has_permission(request, None))
    
    def test_has_feature_access_permission(self):
        """Test HasFeatureAccess permission class"""
        permission = HasFeatureAccess()
        request = self.factory.get('/')
        
        # Create mock view with required_feature
        class MockView:
            required_feature = 'use_crop_detection'
        
        view = MockView()
        
        # Test with farmer (has access)
        request.user = self.farmer
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with buyer (no access)
        request.user = self.buyer
        self.assertFalse(permission.has_permission(request, view))
    
    def test_has_any_role_permission(self):
        """Test HasAnyRole permission class"""
        permission = HasAnyRole()
        request = self.factory.get('/')
        
        # Create mock view with allowed_roles
        class MockView:
            allowed_roles = ['farmer', 'poultry_keeper']
        
        view = MockView()
        
        # Test with farmer (allowed)
        request.user = self.farmer
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with poultry keeper (allowed)
        request.user = self.poultry_keeper
        self.assertTrue(permission.has_permission(request, view))
        
        # Test with buyer (not allowed)
        request.user = self.buyer
        self.assertFalse(permission.has_permission(request, view))


class PermissionDecoratorTest(TestCase):
    """Test permission decorators for function-based views"""
    
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create test users
        self.farmer = User.objects.create_user(
            username='farmer', email='farmer@test.com',
            password='pass123', role='farmer', is_verified=True
        )
        self.buyer = User.objects.create_user(
            username='buyer', email='buyer@test.com',
            password='pass123', role='buyer', is_verified=True
        )
        self.admin = User.objects.create_user(
            username='admin', email='admin@test.com',
            password='pass123', role='admin', is_verified=True
        )
        self.unverified = User.objects.create_user(
            username='unverified', email='unverified@test.com',
            password='pass123', role='farmer', is_verified=False
        )
    
    def _create_authenticated_request(self, user):
        """Helper to create an authenticated request"""
        request = self.factory.get('/')
        # Force authentication by setting user and marking as authenticated
        request.user = user
        request._force_auth_user = user
        return request
    
    def test_require_verified_decorator(self):
        """Test require_verified decorator"""
        
        @api_view(['GET'])
        @require_verified
        def test_view(request):
            return Response({'message': 'success'})
        
        # Test with verified user
        request = self._create_authenticated_request(self.farmer)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with unverified user
        request = self._create_authenticated_request(self.unverified)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_require_role_decorator(self):
        """Test require_role decorator"""
        
        @api_view(['GET'])
        @require_role('farmer', 'poultry_keeper')
        def test_view(request):
            return Response({'message': 'success'})
        
        # Test with farmer (allowed)
        request = self._create_authenticated_request(self.farmer)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with buyer (not allowed)
        request = self._create_authenticated_request(self.buyer)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_require_feature_decorator(self):
        """Test require_feature decorator"""
        
        @api_view(['GET'])
        @require_feature('use_crop_detection')
        def test_view(request):
            return Response({'message': 'success'})
        
        # Test with farmer (has feature)
        request = self._create_authenticated_request(self.farmer)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with buyer (no feature)
        request = self._create_authenticated_request(self.buyer)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_require_admin_decorator(self):
        """Test require_admin decorator"""
        
        @api_view(['GET'])
        @require_admin
        def test_view(request):
            return Response({'message': 'success'})
        
        # Test with admin (allowed)
        request = self._create_authenticated_request(self.admin)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test with farmer (not allowed)
        request = self._create_authenticated_request(self.farmer)
        response = test_view(request)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class RoleBasedFeatureAccessTest(TestCase):
    """Test role-based feature access"""
    
    def setUp(self):
        # Create users with different roles
        self.farmer = User.objects.create_user(
            username='farmer', email='farmer@test.com',
            password='pass123', role='farmer'
        )
        self.buyer = User.objects.create_user(
            username='buyer', email='buyer@test.com',
            password='pass123', role='buyer'
        )
        self.admin = User.objects.create_user(
            username='admin', email='admin@test.com',
            password='pass123', role='admin'
        )
    
    def test_farmer_feature_access(self):
        """Test farmer can access farming features"""
        self.assertTrue(self.farmer.can_access_feature('view_dashboard'))
        self.assertTrue(self.farmer.can_access_feature('use_crop_detection'))
        self.assertTrue(self.farmer.can_access_feature('view_marketplace'))
        self.assertTrue(self.farmer.can_access_feature('use_agrigpt'))
        self.assertTrue(self.farmer.can_access_feature('use_iot_sensors'))
    
    def test_buyer_feature_access(self):
        """Test buyer has limited feature access"""
        self.assertTrue(self.buyer.can_access_feature('view_dashboard'))
        self.assertTrue(self.buyer.can_access_feature('view_marketplace'))
        self.assertTrue(self.buyer.can_access_feature('place_orders'))
        
        # Buyer should not have access to farming features
        self.assertFalse(self.buyer.can_access_feature('use_crop_detection'))
        self.assertFalse(self.buyer.can_access_feature('use_iot_sensors'))
        self.assertFalse(self.buyer.can_access_feature('use_satellite_integration'))
    
    def test_admin_feature_access(self):
        """Test admin has access to all features"""
        self.assertTrue(self.admin.can_access_feature('view_dashboard'))
        self.assertTrue(self.admin.can_access_feature('use_crop_detection'))
        self.assertTrue(self.admin.can_access_feature('manage_users'))
        self.assertTrue(self.admin.can_access_feature('manage_system'))
        self.assertTrue(self.admin.can_access_feature('view_admin_dashboard'))
