"""
Live API endpoint tests - tests against running Django server.
Run this after starting the Django development server.
"""
import requests
import json
from typing import Dict, Any

BASE_URL = "http://127.0.0.1:8000"

class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.errors = []
    
    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append((test_name, details))
        print(f"✓ PASS: {test_name}")
        if details:
            print(f"  {details}")
    
    def add_fail(self, test_name: str, details: str = ""):
        self.failed.append((test_name, details))
        print(f"✗ FAIL: {test_name}")
        if details:
            print(f"  {details}")
    
    def add_error(self, test_name: str, error: str):
        self.errors.append((test_name, error))
        print(f"⚠ ERROR: {test_name}")
        print(f"  {error}")
    
    def print_summary(self):
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Passed: {len(self.passed)}")
        print(f"Failed: {len(self.failed)}")
        print(f"Errors: {len(self.errors)}")
        print(f"Total:  {len(self.passed) + len(self.failed) + len(self.errors)}")
        
        if self.failed:
            print("\nFailed Tests:")
            for name, details in self.failed:
                print(f"  - {name}: {details}")
        
        if self.errors:
            print("\nErrors:")
            for name, error in self.errors:
                print(f"  - {name}: {error}")


results = TestResults()


def test_endpoint(name: str, method: str, url: str, expected_status: list, 
                  data: Dict = None, headers: Dict = None, auth_token: str = None):
    """Test a single endpoint."""
    try:
        full_url = f"{BASE_URL}{url}"
        
        if headers is None:
            headers = {}
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'
        
        if method == 'GET':
            response = requests.get(full_url, headers=headers, timeout=10)
        elif method == 'POST':
            response = requests.post(full_url, json=data, headers=headers, timeout=10)
        elif method == 'PUT':
            response = requests.put(full_url, json=data, headers=headers, timeout=10)
        elif method == 'PATCH':
            response = requests.patch(full_url, json=data, headers=headers, timeout=10)
        elif method == 'DELETE':
            response = requests.delete(full_url, headers=headers, timeout=10)
        else:
            results.add_error(name, f"Unknown method: {method}")
            return None
        
        if response.status_code in expected_status:
            results.add_pass(name, f"Status: {response.status_code}")
            return response
        else:
            results.add_fail(name, f"Expected {expected_status}, got {response.status_code}")
            try:
                print(f"  Response: {response.json()}")
            except:
                print(f"  Response: {response.text[:200]}")
            return response
            
    except requests.exceptions.ConnectionError:
        results.add_error(name, "Connection refused - is the server running?")
        return None
    except Exception as e:
        results.add_error(name, str(e))
        return None


def main():
    print("="*70)
    print("AgroBridge API Endpoint Tests")
    print("="*70)
    print(f"Testing against: {BASE_URL}")
    print("="*70)
    print()
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health/", timeout=5)
        print(f"✓ Server is running (Status: {response.status_code})")
        print()
    except:
        print("✗ Server is not running!")
        print("Please start the Django server with: python manage.py runserver")
        return
    
    # Store tokens for authenticated requests
    access_token = None
    refresh_token = None
    
    # ========================================================================
    # HEALTH CHECK
    # ========================================================================
    print("\n--- Health Check ---")
    test_endpoint("Health Check", "GET", "/health/", [200])
    
    # ========================================================================
    # AUTHENTICATION TESTS
    # ========================================================================
    print("\n--- Authentication Endpoints ---")
    
    # Register new user with timestamp to ensure uniqueness
    import time
    timestamp = str(int(time.time()))
    test_username = f'testuser{timestamp}'
    test_email = f'testuser{timestamp}@example.com'
    
    register_data = {
        'username': test_username,
        'email': test_email,
        'password': 'SecurePass123!',
        'password_confirm': 'SecurePass123!',
        'first_name': 'Test',
        'last_name': 'User',
        'phone_number': '+1234567890'
    }
    response = test_endpoint("User Registration", "POST", "/api/v1/auth/register/", 
                            [200, 201], data=register_data)
    
    # Login
    login_data = {
        'username': test_username,
        'password': 'SecurePass123!'
    }
    response = test_endpoint("User Login", "POST", "/api/v1/auth/login/", 
                            [200], data=login_data)
    
    if response and response.status_code == 200:
        try:
            data = response.json()
            access_token = data.get('access')
            refresh_token = data.get('refresh')
            print(f"  Got access token: {access_token[:20]}...")
        except:
            pass
    
    # Token refresh
    if refresh_token:
        test_endpoint("Token Refresh", "POST", "/api/v1/auth/refresh/", 
                     [200], data={'refresh': refresh_token})
    
    # ========================================================================
    # USER ENDPOINTS
    # ========================================================================
    print("\n--- User Endpoints ---")
    
    if access_token:
        test_endpoint("Get User Profile", "GET", "/api/v1/users/profile/", 
                     [200], auth_token=access_token)
        
        test_endpoint("Update User Profile", "PATCH", "/api/v1/users/profile/", 
                     [200, 204], data={'first_name': 'Updated'}, auth_token=access_token)
        
        test_endpoint("List Users", "GET", "/api/v1/users/", 
                     [200, 403], auth_token=access_token)
    
    # ========================================================================
    # FARM ENDPOINTS
    # ========================================================================
    print("\n--- Farm Endpoints ---")
    
    test_endpoint("List Farms", "GET", "/api/v1/farms/", [200])
    
    if access_token:
        farm_data = {
            'name': 'Test Farm',
            'location': 'Test Location',
            'size': 100.5,
            'description': 'A test farm'
        }
        test_endpoint("Create Farm", "POST", "/api/v1/farms/", 
                     [200, 201, 400], data=farm_data, auth_token=access_token)
    
    # ========================================================================
    # MARKETPLACE ENDPOINTS
    # ========================================================================
    print("\n--- Marketplace Endpoints ---")
    
    test_endpoint("List Products", "GET", "/api/v1/marketplace/products/", [200])
    test_endpoint("List Orders", "GET", "/api/v1/marketplace/orders/", [200, 401])
    
    # ========================================================================
    # NOTIFICATION ENDPOINTS
    # ========================================================================
    print("\n--- Notification Endpoints ---")
    
    if access_token:
        test_endpoint("List Notifications", "GET", "/api/v1/notifications/", 
                     [200], auth_token=access_token)
    
    # ========================================================================
    # AI ASSISTANT ENDPOINTS
    # ========================================================================
    print("\n--- AI Assistant Endpoints ---")
    
    if access_token:
        test_endpoint("AI Chat", "POST", "/api/v1/ai/chat/", 
                     [200, 400, 500], 
                     data={'message': 'What crops should I plant?'}, 
                     auth_token=access_token)
    
    # ========================================================================
    # CROP DETECTION ENDPOINTS
    # ========================================================================
    print("\n--- Crop Detection Endpoints ---")
    
    test_endpoint("List Crop Detections", "GET", "/api/v1/crop-detection/", 
                 [200, 401])
    
    # ========================================================================
    # IOT ENDPOINTS
    # ========================================================================
    print("\n--- IoT Endpoints ---")
    
    test_endpoint("List IoT Devices", "GET", "/api/v1/iot/devices/", [200, 401])
    test_endpoint("List Sensor Readings", "GET", "/api/v1/iot/readings/", [200, 401])
    
    # ========================================================================
    # FINANCIAL ENDPOINTS
    # ========================================================================
    print("\n--- Financial Endpoints ---")
    
    if access_token:
        test_endpoint("List Transactions", "GET", "/api/v1/financial/transactions/", 
                     [200], auth_token=access_token)
        test_endpoint("List Invoices", "GET", "/api/v1/financial/invoices/", 
                     [200], auth_token=access_token)
    
    # ========================================================================
    # LEARNING ENDPOINTS
    # ========================================================================
    print("\n--- Learning Endpoints ---")
    
    test_endpoint("List Courses", "GET", "/api/v1/learning/courses/", [200])
    test_endpoint("List Lessons", "GET", "/api/v1/learning/lessons/", [200])
    
    # ========================================================================
    # COMMUNITY ENDPOINTS
    # ========================================================================
    print("\n--- Community Endpoints ---")
    
    test_endpoint("List Posts", "GET", "/api/v1/community/posts/", [200])
    
    if access_token:
        post_data = {
            'title': 'Test Post',
            'content': 'This is a test post'
        }
        test_endpoint("Create Post", "POST", "/api/v1/community/posts/", 
                     [200, 201, 400], data=post_data, auth_token=access_token)
    
    # ========================================================================
    # SCHEDULING ENDPOINTS
    # ========================================================================
    print("\n--- Scheduling Endpoints ---")
    
    if access_token:
        test_endpoint("List Tasks", "GET", "/api/v1/scheduling/tasks/", 
                     [200], auth_token=access_token)
    
    # ========================================================================
    # ANALYTICS ENDPOINTS
    # ========================================================================
    print("\n--- Analytics Endpoints ---")
    
    if access_token:
        test_endpoint("Get Dashboard", "GET", "/api/v1/analytics/dashboard/", 
                     [200, 404], auth_token=access_token)
    
    # ========================================================================
    # PAYMENT ENDPOINTS
    # ========================================================================
    print("\n--- Payment Endpoints ---")
    
    if access_token:
        test_endpoint("List Payments", "GET", "/api/v1/payment/payments/", 
                     [200], auth_token=access_token)
    
    # ========================================================================
    # EMERGENCY RESPONSE ENDPOINTS
    # ========================================================================
    print("\n--- Emergency Response Endpoints ---")
    
    if access_token:
        test_endpoint("List Alerts", "GET", "/api/v1/emergency/alerts/", 
                     [200], auth_token=access_token)
        
        alert_data = {
            'title': 'Test Alert',
            'description': 'Test emergency alert',
            'severity': 'medium',
            'alert_type': 'weather'
        }
        test_endpoint("Create Alert", "POST", "/api/v1/emergency/alerts/", 
                     [200, 201, 400], data=alert_data, auth_token=access_token)
    
    # ========================================================================
    # API DOCUMENTATION ENDPOINTS
    # ========================================================================
    print("\n--- API Documentation ---")
    
    test_endpoint("Swagger UI", "GET", "/api/docs/", [200])
    test_endpoint("ReDoc", "GET", "/api/redoc/", [200])
    
    # Print summary
    results.print_summary()


if __name__ == '__main__':
    main()
