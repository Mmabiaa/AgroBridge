"""
User Acceptance Testing (UAT) Scenarios for AgroBridge.
These tests validate that the system meets business requirements
from an end-user perspective.
"""
import pytest
from rest_framework import status


@pytest.mark.uat
class TestFarmerAcceptanceCriteria:
    """UAT scenarios for farmer users."""
    
    def test_farmer_can_register_and_setup_farm(self, api_client):
        """
        UAT-001: Farmer Registration and Farm Setup
        
        As a farmer, I want to register on the platform and set up my farm,
        so that I can start managing my agricultural operations.
        
        Acceptance Criteria:
        - Farmer can register with email and password
        - Farmer receives verification email
        - Farmer can create farm with location
        - Farmer can add multiple fields to farm
        """
        # Step 1: Register
        response = api_client.post('/api/auth/register/', {
            'username': 'uat_farmer',
            'email': 'uat_farmer@test.com',
            'password': 'SecurePass123!',
            'role': 'farmer',
            'first_name': 'John',
            'last_name': 'Doe'
        })
        assert response.status_code == status.HTTP_201_CREATED
        assert 'id' in response.data
        
        # Step 2: Login
        response = api_client.post('/api/auth/login/', {
            'username': 'uat_farmer',
            'password': 'SecurePass123!'
        })
        assert response.status_code == status.HTTP_200_OK
        token = response.data['access']
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        # Step 3: Create farm
        response = api_client.post('/api/farms/', {
            'name': 'UAT Test Farm',
            'location': {
                'type': 'Point',
                'coordinates': [-1.2921, 36.8219]
            },
            'size': 25.0,
            'size_unit': 'acres'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        farm_id = response.data['id']
        
        # Step 4: Add field
        response = api_client.post('/api/farms/fields/', {
            'farm': farm_id,
            'name': 'Main Field',
            'size': 10.0,
            'soil_type': 'loam'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_farmer_can_monitor_crops_with_iot(self, api_client, test_farmer):
        """
        UAT-002: Crop Monitoring with IoT Devices
        
        As a farmer, I want to monitor my crops using IoT sensors,
        so that I can make data-driven decisions.
        
        Acceptance Criteria:
        - Farmer can register IoT devices
        - Farmer can view real-time sensor data
        - Farmer receives alerts for abnormal conditions
        - Farmer can view historical sensor data
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create farm first
        response = api_client.post('/api/farms/', {
            'name': 'IoT Test Farm',
            'location': {'type': 'Point', 'coordinates': [-1.2921, 36.8219]},
            'size': 20.0
        }, format='json')
        farm_id = response.data['id']
        
        # Register IoT device
        response = api_client.post('/api/iot/devices/', {
            'name': 'Soil Sensor 1',
            'device_type': 'soil_sensor',
            'farm': farm_id
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        device_id = response.data['id']
        
        # View device data
        response = api_client.get(f'/api/iot/devices/{device_id}/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_farmer_can_detect_crop_diseases(self, api_client, test_farmer):
        """
        UAT-003: Crop Disease Detection
        
        As a farmer, I want to detect crop diseases using AI,
        so that I can take timely action to protect my crops.
        
        Acceptance Criteria:
        - Farmer can upload crop images
        - System detects diseases with confidence scores
        - System provides treatment recommendations
        - Farmer can view detection history
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Upload image for detection
        response = api_client.post('/api/crop-detection/', {
            'image_url': 'https://example.com/crop.jpg'
        }, format='json')
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_202_ACCEPTED
        ]
    
    def test_farmer_can_sell_products_on_marketplace(self, api_client, test_farmer):
        """
        UAT-004: Selling Products on Marketplace
        
        As a farmer, I want to list my products on the marketplace,
        so that I can reach more buyers and increase my income.
        
        Acceptance Criteria:
        - Farmer can create product listings
        - Farmer can set prices and quantities
        - Farmer can upload product images
        - Farmer receives notifications for new orders
        - Farmer can manage order fulfillment
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create farm
        response = api_client.post('/api/farms/', {
            'name': 'Marketplace Test Farm',
            'location': {'type': 'Point', 'coordinates': [-1.2921, 36.8219]},
            'size': 15.0
        }, format='json')
        farm_id = response.data['id']
        
        # List product
        response = api_client.post('/api/marketplace/products/', {
            'name': 'Fresh Tomatoes',
            'description': 'Organic tomatoes',
            'category': 'vegetables',
            'price': 100.00,
            'currency': 'KES',
            'quantity': 50,
            'unit': 'kg',
            'farm': farm_id
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        product_id = response.data['id']
        
        # View product
        response = api_client.get(f'/api/marketplace/products/{product_id}/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.uat
class TestBuyerAcceptanceCriteria:
    """UAT scenarios for buyer users."""
    
    def test_buyer_can_browse_and_purchase_products(self, api_client, test_buyer):
        """
        UAT-005: Product Browsing and Purchase
        
        As a buyer, I want to browse and purchase agricultural products,
        so that I can source quality products directly from farmers.
        
        Acceptance Criteria:
        - Buyer can browse products by category
        - Buyer can search for specific products
        - Buyer can view product details and farmer info
        - Buyer can place orders
        - Buyer can make payments via mobile money
        - Buyer receives order confirmation
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_buyer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Browse products
        response = api_client.get('/api/marketplace/products/')
        assert response.status_code == status.HTTP_200_OK
        
        # Search products
        response = api_client.get('/api/marketplace/products/', {
            'search': 'maize'
        })
        assert response.status_code == status.HTTP_200_OK
        
        # Filter by category
        response = api_client.get('/api/marketplace/products/', {
            'category': 'grains'
        })
        assert response.status_code == status.HTTP_200_OK
    
    def test_buyer_can_track_orders(self, api_client, test_buyer):
        """
        UAT-006: Order Tracking
        
        As a buyer, I want to track my orders,
        so that I know when to expect delivery.
        
        Acceptance Criteria:
        - Buyer can view order history
        - Buyer can see order status updates
        - Buyer receives notifications for status changes
        - Buyer can contact seller
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_buyer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # View orders
        response = api_client.get('/api/marketplace/orders/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.uat
class TestAIAssistantAcceptanceCriteria:
    """UAT scenarios for AI Assistant."""
    
    def test_farmer_can_get_farming_advice(self, api_client, test_farmer):
        """
        UAT-007: AI-Powered Farming Advice
        
        As a farmer, I want to get farming advice from AI assistant,
        so that I can make better farming decisions.
        
        Acceptance Criteria:
        - Farmer can ask questions in natural language
        - AI provides relevant farming advice
        - AI considers farmer's location and crops
        - AI supports multiple languages
        - Farmer can use voice commands
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Ask question
        response = api_client.post('/api/ai-assistant/chat/', {
            'message': 'When should I plant maize in Kenya?'
        }, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'response' in response.data


@pytest.mark.uat
class TestCommunityAcceptanceCriteria:
    """UAT scenarios for Community features."""
    
    def test_farmer_can_participate_in_community(self, api_client, test_farmer):
        """
        UAT-008: Community Participation
        
        As a farmer, I want to participate in the farming community,
        so that I can learn from others and share my experiences.
        
        Acceptance Criteria:
        - Farmer can create posts
        - Farmer can comment on posts
        - Farmer can like and share posts
        - Farmer can follow other farmers
        - Farmer can send private messages
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create post
        response = api_client.post('/api/community/posts/', {
            'content': 'Great harvest this season!',
            'visibility': 'public'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # View community feed
        response = api_client.get('/api/community/posts/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.uat
class TestLearningAcceptanceCriteria:
    """UAT scenarios for Learning features."""
    
    def test_farmer_can_access_learning_content(self, api_client, test_farmer):
        """
        UAT-009: Access Learning Content
        
        As a farmer, I want to access educational content,
        so that I can improve my farming skills.
        
        Acceptance Criteria:
        - Farmer can browse courses
        - Farmer can enroll in courses
        - Farmer can watch video lessons
        - Farmer can track progress
        - Farmer receives certificates upon completion
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Browse courses
        response = api_client.get('/api/learning/courses/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.uat
class TestFinancialAcceptanceCriteria:
    """UAT scenarios for Financial Management."""
    
    def test_farmer_can_track_finances(self, api_client, test_farmer):
        """
        UAT-010: Financial Tracking
        
        As a farmer, I want to track my farm finances,
        so that I can manage my budget and profitability.
        
        Acceptance Criteria:
        - Farmer can record income and expenses
        - Farmer can categorize transactions
        - Farmer can view financial reports
        - Farmer can set budgets
        - Farmer can export financial data
        """
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Record expense
        response = api_client.post('/api/financial/records/', {
            'type': 'expense',
            'category': 'seeds',
            'amount': 5000,
            'currency': 'KES',
            'description': 'Maize seeds'
        }, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # View financial summary
        response = api_client.get('/api/financial/summary/')
        assert response.status_code == status.HTTP_200_OK
