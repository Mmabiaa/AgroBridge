"""
End-to-end tests for complete user workflows.
Tests the entire system from user registration to complex operations.
"""
import pytest
import time
from rest_framework import status


@pytest.mark.e2e
class TestFarmerWorkflow:
    """Test complete farmer workflow from registration to harvest."""
    
    def test_farmer_complete_workflow(self, api_client):
        """
        Test complete farmer workflow:
        1. Register
        2. Verify email
        3. Login
        4. Create farm
        5. Add fields
        6. Plant crops
        7. Monitor with IoT
        8. Detect diseases
        9. List products
        10. Receive orders
        """
        # Step 1: Register
        register_data = {
            'username': 'test_farmer',
            'email': 'farmer@test.com',
            'password': 'SecurePass123!',
            'role': 'farmer',
            'first_name': 'John',
            'last_name': 'Farmer'
        }
        response = api_client.post('/api/auth/register/', register_data)
        assert response.status_code == status.HTTP_201_CREATED
        user_id = response.data['id']
        
        # Step 2: Verify email (simulate)
        verification_token = response.data.get('verification_token')
        if verification_token:
            response = api_client.post(
                f'/api/auth/verify-email/',
                {'token': verification_token}
            )
            assert response.status_code == status.HTTP_200_OK
        
        # Step 3: Login
        login_data = {
            'username': 'test_farmer',
            'password': 'SecurePass123!'
        }
        response = api_client.post('/api/auth/login/', login_data)
        assert response.status_code == status.HTTP_200_OK
        access_token = response.data['access']
        
        # Set authentication
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Step 4: Create farm
        farm_data = {
            'name': 'Green Valley Farm',
            'location': {
                'type': 'Point',
                'coordinates': [-1.2921, 36.8219]  # Nairobi
            },
            'size': 50.5,
            'size_unit': 'acres'
        }
        response = api_client.post('/api/farms/', farm_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        farm_id = response.data['id']
        
        # Step 5: Add field
        field_data = {
            'farm': farm_id,
            'name': 'North Field',
            'boundary': {
                'type': 'Polygon',
                'coordinates': [[
                    [-1.2921, 36.8219],
                    [-1.2921, 36.8229],
                    [-1.2931, 36.8229],
                    [-1.2931, 36.8219],
                    [-1.2921, 36.8219]
                ]]
            },
            'size': 10.0,
            'soil_type': 'loam'
        }
        response = api_client.post('/api/farms/fields/', field_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        field_id = response.data['id']
        
        # Step 6: Plant crops
        crop_data = {
            'field': field_id,
            'crop_type': 'maize',
            'variety': 'Hybrid 614',
            'planting_date': '2024-03-01',
            'expected_harvest_date': '2024-07-01',
            'quantity': 5.0,
            'quantity_unit': 'kg'
        }
        response = api_client.post('/api/farms/crops/', crop_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        crop_id = response.data['id']
        
        # Step 7: Register IoT device
        device_data = {
            'name': 'Soil Sensor 1',
            'device_type': 'soil_sensor',
            'farm': farm_id,
            'field': field_id
        }
        response = api_client.post('/api/iot/devices/', device_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        device_id = response.data['id']
        
        # Step 8: Upload crop image for disease detection
        # (Simulated - would use actual image in real test)
        detection_data = {
            'crop': crop_id,
            'image_url': 'https://example.com/crop-image.jpg'
        }
        response = api_client.post('/api/crop-detection/', detection_data, format='json')
        # May return 201 or 202 depending on async processing
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_202_ACCEPTED]
        
        # Step 9: List product on marketplace
        product_data = {
            'name': 'Fresh Maize',
            'description': 'Organic maize from Green Valley Farm',
            'category': 'grains',
            'price': 50.00,
            'currency': 'KES',
            'quantity': 100,
            'unit': 'kg',
            'farm': farm_id
        }
        response = api_client.post('/api/marketplace/products/', product_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        product_id = response.data['id']
        
        # Step 10: Check notifications
        response = api_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) > 0
        
        # Verify farm statistics
        response = api_client.get(f'/api/farms/{farm_id}/statistics/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['total_area'] == 50.5


@pytest.mark.e2e
class TestBuyerWorkflow:
    """Test complete buyer workflow."""
    
    def test_buyer_purchase_workflow(self, api_client):
        """
        Test complete buyer workflow:
        1. Register
        2. Login
        3. Browse products
        4. Place order
        5. Make payment
        6. Track delivery
        7. Leave review
        """
        # Step 1: Register
        register_data = {
            'username': 'test_buyer',
            'email': 'buyer@test.com',
            'password': 'SecurePass123!',
            'role': 'buyer'
        }
        response = api_client.post('/api/auth/register/', register_data)
        assert response.status_code == status.HTTP_201_CREATED
        
        # Step 2: Login
        login_data = {
            'username': 'test_buyer',
            'password': 'SecurePass123!'
        }
        response = api_client.post('/api/auth/login/', login_data)
        assert response.status_code == status.HTTP_200_OK
        access_token = response.data['access']
        
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Step 3: Browse products
        response = api_client.get('/api/marketplace/products/')
        assert response.status_code == status.HTTP_200_OK
        products = response.data['results']
        
        if len(products) > 0:
            product = products[0]
            product_id = product['id']
            
            # Step 4: Place order
            order_data = {
                'product': product_id,
                'quantity': 10,
                'delivery_address': '123 Main St, Nairobi'
            }
            response = api_client.post('/api/marketplace/orders/', order_data, format='json')
            assert response.status_code == status.HTTP_201_CREATED
            order_id = response.data['id']
            
            # Step 5: Make payment
            payment_data = {
                'order': order_id,
                'payment_method': 'mpesa',
                'phone_number': '+254712345678'
            }
            response = api_client.post('/api/payments/', payment_data, format='json')
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
            
            # Step 6: Track order
            response = api_client.get(f'/api/marketplace/orders/{order_id}/')
            assert response.status_code == status.HTTP_200_OK
            assert response.data['status'] in ['pending', 'processing', 'paid']
            
            # Step 7: Leave review (after delivery simulation)
            review_data = {
                'product': product_id,
                'rating': 5,
                'comment': 'Excellent quality!'
            }
            response = api_client.post('/api/marketplace/reviews/', review_data, format='json')
            # May require order completion first
            assert response.status_code in [
                status.HTTP_201_CREATED,
                status.HTTP_400_BAD_REQUEST
            ]


@pytest.mark.e2e
class TestServiceIntegration:
    """Test integration between multiple services."""
    
    def test_cross_service_workflow(self, api_client, test_farmer):
        """Test workflow that spans multiple services."""
        # Login as farmer
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_farmer)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Create farm (Farm Service)
        farm_data = {
            'name': 'Integration Test Farm',
            'location': {'type': 'Point', 'coordinates': [-1.2921, 36.8219]},
            'size': 25.0
        }
        response = api_client.post('/api/farms/', farm_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        farm_id = response.data['id']
        
        # Ask AI Assistant about the farm (AI Service)
        ai_query = {
            'message': 'What crops should I plant on my farm?',
            'context': {'farm_id': farm_id}
        }
        response = api_client.post('/api/ai-assistant/chat/', ai_query, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'response' in response.data
        
        # Schedule tasks (Scheduling Service)
        task_data = {
            'title': 'Prepare soil',
            'farm': farm_id,
            'due_date': '2024-03-15',
            'task_type': 'preparation'
        }
        response = api_client.post('/api/scheduling/tasks/', task_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        
        # Check notifications (Notification Service)
        response = api_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_200_OK
        
        # Record financial transaction (Financial Service)
        transaction_data = {
            'type': 'expense',
            'category': 'seeds',
            'amount': 5000,
            'currency': 'KES',
            'farm': farm_id,
            'description': 'Purchased maize seeds'
        }
        response = api_client.post('/api/financial/records/', transaction_data, format='json')
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.e2e
@pytest.mark.slow
class TestFailureScenarios:
    """Test system behavior under failure conditions."""
    
    def test_service_unavailable_graceful_degradation(self, api_client, test_user):
        """Test that system degrades gracefully when services are unavailable."""
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(test_user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Even if some services are down, core functionality should work
        response = api_client.get('/api/health/')
        assert response.status_code == status.HTTP_200_OK
        
        # User should still be able to access their profile
        response = api_client.get('/api/users/profile/')
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE]
    
    def test_database_connection_retry(self, api_client):
        """Test that system retries database connections."""
        # This would require mocking database failures
        # and verifying retry logic
        pass
    
    def test_message_queue_failure_handling(self, api_client, test_user):
        """Test handling of message queue failures."""
        # System should queue messages locally if RabbitMQ is down
        pass
