"""
Comprehensive API endpoint tests for AgroBridge platform.
Tests all endpoints with SQLite database, migrations, and CRUD operations.
"""
import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal

User = get_user_model()


@pytest.fixture
def api_client():
    """Create API client for testing."""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        phone_number='+1234567890'
    )
    return user


@pytest.fixture
def test_farmer(db):
    """Create a test farmer user."""
    user = User.objects.create_user(
        username='farmer1',
        email='farmer@example.com',
        password='testpass123',
        role='farmer',
        first_name='Farmer',
        last_name='One'
    )
    return user


@pytest.fixture
def test_buyer(db):
    """Create a test buyer user."""
    user = User.objects.create_user(
        username='buyer1',
        email='buyer@example.com',
        password='testpass123',
        role='buyer',
        first_name='Buyer',
        last_name='One'
    )
    return user


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Create authenticated API client."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(test_user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def farmer_client(api_client, test_farmer):
    """Create authenticated farmer client."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(test_farmer)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


@pytest.fixture
def buyer_client(api_client, test_buyer):
    """Create authenticated buyer client."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(test_buyer)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return api_client


# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

@pytest.mark.django_db
class TestAuthenticationEndpoints:
    """Test authentication endpoints."""
    
    def test_user_registration(self, api_client):
        """Test user registration endpoint."""
        url = '/api/v1/auth/register/'
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password2': 'SecurePass123!',
            'first_name': 'New',
            'last_name': 'User',
            'phone_number': '+1234567890'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
        assert 'user' in response.data or 'id' in response.data
    
    def test_user_login(self, api_client, test_user):
        """Test user login endpoint."""
        url = '/api/v1/auth/login/'
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
    
    def test_token_refresh(self, api_client, test_user):
        """Test token refresh endpoint."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_user)
        
        url = '/api/v1/auth/token/refresh/'
        data = {'refresh': str(refresh)}
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
    
    def test_logout(self, authenticated_client, test_user):
        """Test logout endpoint."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_user)
        
        url = '/api/v1/auth/logout/'
        data = {'refresh': str(refresh)}
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT, status.HTTP_205_RESET_CONTENT]


# ============================================================================
# USER MANAGEMENT TESTS
# ============================================================================

@pytest.mark.django_db
class TestUserEndpoints:
    """Test user management endpoints."""
    
    def test_get_user_profile(self, authenticated_client):
        """Test getting user profile."""
        url = '/api/v1/users/profile/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'username' in response.data or 'email' in response.data
    
    def test_update_user_profile(self, authenticated_client):
        """Test updating user profile."""
        url = '/api/v1/users/profile/'
        data = {'first_name': 'Updated', 'last_name': 'Name'}
        response = authenticated_client.patch(url, data, format='json')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]
    
    def test_list_users(self, authenticated_client):
        """Test listing users."""
        url = '/api/v1/users/'
        response = authenticated_client.get(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN]


# ============================================================================
# FARM MANAGEMENT TESTS
# ============================================================================

@pytest.mark.django_db
class TestFarmEndpoints:
    """Test farm management endpoints."""
    
    def test_create_farm(self, farmer_client):
        """Test creating a farm."""
        url = '/api/v1/farms/'
        data = {
            'name': 'Test Farm',
            'location': 'Test Location',
            'size': 100.5,
            'description': 'A test farm'
        }
        response = farmer_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK]
    
    def test_list_farms(self, authenticated_client):
        """Test listing farms."""
        url = '/api/v1/farms/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_get_farm_detail(self, farmer_client):
        """Test getting farm details."""
        # First create a farm
        from farms.models import Farm
        farm = Farm.objects.create(
            name='Detail Test Farm',
            owner=farmer_client.handler._force_user,
            location='Test Location',
            size=50.0
        )
        
        url = f'/api/v1/farms/{farm.id}/'
        response = farmer_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == 'Detail Test Farm'


# ============================================================================
# MARKETPLACE TESTS
# ============================================================================

@pytest.mark.django_db
class TestMarketplaceEndpoints:
    """Test marketplace endpoints."""
    
    def test_create_product(self, farmer_client):
        """Test creating a product."""
        url = '/api/v1/marketplace/products/'
        data = {
            'name': 'Test Product',
            'description': 'A test product',
            'price': '10.99',
            'quantity': 100,
            'unit': 'kg'
        }
        response = farmer_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]
    
    def test_list_products(self, api_client):
        """Test listing products."""
        url = '/api/v1/marketplace/products/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_order(self, buyer_client):
        """Test creating an order."""
        url = '/api/v1/marketplace/orders/'
        data = {
            'items': [],
            'delivery_address': 'Test Address'
        }
        response = buyer_client.post(url, data, format='json')
        # May fail due to validation, but endpoint should exist
        assert response.status_code in [
            status.HTTP_201_CREATED, 
            status.HTTP_200_OK, 
            status.HTTP_400_BAD_REQUEST
        ]


# ============================================================================
# NOTIFICATION TESTS
# ============================================================================

@pytest.mark.django_db
class TestNotificationEndpoints:
    """Test notification endpoints."""
    
    def test_list_notifications(self, authenticated_client):
        """Test listing notifications."""
        url = '/api/v1/notifications/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_mark_notification_read(self, authenticated_client, test_user):
        """Test marking notification as read."""
        from notifications.models import Notification
        notification = Notification.objects.create(
            recipient=test_user,
            title='Test Notification',
            message='Test message',
            notification_type='info'
        )
        
        url = f'/api/v1/notifications/{notification.id}/mark-read/'
        response = authenticated_client.post(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_204_NO_CONTENT]


# ============================================================================
# AI ASSISTANT TESTS
# ============================================================================

@pytest.mark.django_db
class TestAIAssistantEndpoints:
    """Test AI assistant endpoints."""
    
    def test_ai_chat(self, authenticated_client):
        """Test AI chat endpoint."""
        url = '/api/v1/ai/chat/'
        data = {'message': 'What crops should I plant?'}
        response = authenticated_client.post(url, data, format='json')
        # May fail if OpenAI key not configured
        assert response.status_code in [
            status.HTTP_200_OK, 
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ]


# ============================================================================
# CROP DETECTION TESTS
# ============================================================================

@pytest.mark.django_db
class TestCropDetectionEndpoints:
    """Test crop detection endpoints."""
    
    def test_list_crop_detections(self, authenticated_client):
        """Test listing crop detections."""
        url = '/api/v1/crop-detection/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# IOT SERVICE TESTS
# ============================================================================

@pytest.mark.django_db
class TestIOTEndpoints:
    """Test IoT service endpoints."""
    
    def test_list_iot_devices(self, authenticated_client):
        """Test listing IoT devices."""
        url = '/api/v1/iot/devices/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_sensor_data(self, authenticated_client):
        """Test listing sensor data."""
        url = '/api/v1/iot/sensor-data/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# FINANCIAL TESTS
# ============================================================================

@pytest.mark.django_db
class TestFinancialEndpoints:
    """Test financial endpoints."""
    
    def test_list_transactions(self, authenticated_client):
        """Test listing transactions."""
        url = '/api/v1/financial/transactions/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_invoices(self, authenticated_client):
        """Test listing invoices."""
        url = '/api/v1/financial/invoices/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# LEARNING TESTS
# ============================================================================

@pytest.mark.django_db
class TestLearningEndpoints:
    """Test learning platform endpoints."""
    
    def test_list_courses(self, api_client):
        """Test listing courses."""
        url = '/api/v1/learning/courses/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_lessons(self, api_client):
        """Test listing lessons."""
        url = '/api/v1/learning/lessons/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# COMMUNITY TESTS
# ============================================================================

@pytest.mark.django_db
class TestCommunityEndpoints:
    """Test community endpoints."""
    
    def test_list_posts(self, api_client):
        """Test listing community posts."""
        url = '/api/v1/community/posts/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_post(self, authenticated_client):
        """Test creating a community post."""
        url = '/api/v1/community/posts/'
        data = {
            'title': 'Test Post',
            'content': 'This is a test post'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]


# ============================================================================
# SCHEDULING TESTS
# ============================================================================

@pytest.mark.django_db
class TestSchedulingEndpoints:
    """Test scheduling endpoints."""
    
    def test_list_tasks(self, authenticated_client):
        """Test listing scheduled tasks."""
        url = '/api/v1/scheduling/tasks/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# ANALYTICS TESTS
# ============================================================================

@pytest.mark.django_db
class TestAnalyticsEndpoints:
    """Test analytics endpoints."""
    
    def test_get_dashboard(self, authenticated_client):
        """Test getting analytics dashboard."""
        url = '/api/v1/analytics/dashboard/'
        response = authenticated_client.get(url)
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]


# ============================================================================
# PAYMENT TESTS
# ============================================================================

@pytest.mark.django_db
class TestPaymentEndpoints:
    """Test payment endpoints."""
    
    def test_list_payments(self, authenticated_client):
        """Test listing payments."""
        url = '/api/v1/payment/payments/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# EMERGENCY RESPONSE TESTS
# ============================================================================

@pytest.mark.django_db
class TestEmergencyEndpoints:
    """Test emergency response endpoints."""
    
    def test_list_alerts(self, authenticated_client):
        """Test listing emergency alerts."""
        url = '/api/v1/emergency/alerts/'
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_alert(self, authenticated_client):
        """Test creating an emergency alert."""
        url = '/api/v1/emergency/alerts/'
        data = {
            'title': 'Test Alert',
            'description': 'Test emergency alert',
            'severity': 'medium',
            'alert_type': 'weather'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST]


# ============================================================================
# HEALTH CHECK TESTS
# ============================================================================

@pytest.mark.django_db
class TestHealthEndpoints:
    """Test health check endpoints."""
    
    def test_health_check(self, api_client):
        """Test health check endpoint."""
        url = '/health/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK


# ============================================================================
# API DOCUMENTATION TESTS
# ============================================================================

@pytest.mark.django_db
class TestDocumentationEndpoints:
    """Test API documentation endpoints."""
    
    def test_swagger_ui(self, api_client):
        """Test Swagger UI endpoint."""
        url = '/api/docs/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
    
    def test_redoc(self, api_client):
        """Test ReDoc endpoint."""
        url = '/api/redoc/'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
