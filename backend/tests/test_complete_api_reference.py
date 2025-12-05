"""
Complete API Reference Test Suite
Tests ALL endpoints from the API documentation including all sub-endpoints.
"""
import requests
import json
import time
from typing import Dict, Any, Optional, List

BASE_URL = "http://127.0.0.1:8000"

class CompleteAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.refresh_token = None
        self.admin_token = None
        self.test_user_id = None
        self.test_resources = {}
        self.results = {
            'total': 0,
            'passed': 0,
            'failed': 0,
            'skipped': 0,
            'by_service': {}
        }
    
    def log(self, message: str, level: str = "INFO"):
        try:
            colors = {
                "INFO": "\033[94m",
                "PASS": "\033[92m",
                "FAIL": "\033[91m",
                "SKIP": "\033[93m",
                "HEADER": "\033[95m",
                "END": "\033[0m"
            }
            print(f"{colors.get(level, '')}{level}: {message}{colors['END']}")
        except UnicodeEncodeError:
            print(f"{level}: {message}")
    
    def test_endpoint(self, service: str, name: str, method: str, endpoint: str,
                     expected_status: List[int], data: Dict = None, 
                     auth: bool = False, admin: bool = False) -> bool:
        """Test a single endpoint and track results."""
        self.results['total'] += 1
        
        if service not in self.results['by_service']:
            self.results['by_service'][service] = {'passed': 0, 'failed': 0, 'skipped': 0}
        
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if admin and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        elif auth and self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                self.log(f"Unknown method: {method}", "SKIP")
                self.results['skipped'] += 1
                self.results['by_service'][service]['skipped'] += 1
                return False
            
            if response.status_code in expected_status:
                self.results['passed'] += 1
                self.results['by_service'][service]['passed'] += 1
                self.log(f"✓ {service} - {name} [{response.status_code}]", "PASS")
                return True
            else:
                self.results['failed'] += 1
                self.results['by_service'][service]['failed'] += 1
                self.log(f"✗ {service} - {name} [Expected {expected_status}, got {response.status_code}]", "FAIL")
                return False
                
        except requests.exceptions.ConnectionError:
            self.results['skipped'] += 1
            self.results['by_service'][service]['skipped'] += 1
            self.log(f"⊘ {service} - {name} [Connection Error]", "SKIP")
            return False
        except Exception as e:
            self.results['failed'] += 1
            self.results['by_service'][service]['failed'] += 1
            self.log(f"✗ {service} - {name} [Error: {str(e)}]", "FAIL")
            return False

    
    def setup_authentication(self):
        """Setup authentication tokens."""
        self.log("\n" + "="*70, "HEADER")
        self.log("AUTHENTICATION SETUP", "HEADER")
        self.log("="*70, "HEADER")
        
        # Create unique user
        timestamp = str(int(time.time()))
        username = f'testuser{timestamp}'
        email = f'testuser{timestamp}@example.com'
        password = 'SecurePass123!'
        
        # Register user
        register_data = {
            'username': username,
            'email': email,
            'password': password,
            'password_confirm': password,
            'first_name': 'Test',
            'last_name': 'User',
            'phone_number': '+1234567890',
            'role': 'farmer'
        }
        
        try:
            response = requests.post(f"{self.base_url}/api/v1/auth/register/", 
                                    json=register_data, timeout=10)
            if response.status_code == 201:
                data = response.json()
                self.access_token = data['tokens']['access']
                self.refresh_token = data['tokens']['refresh']
                self.test_user_id = data['user']['id']
                self.log(f"✓ User registered: {username}", "PASS")
            else:
                self.log("✗ User registration failed", "FAIL")
                return False
        except Exception as e:
            self.log(f"✗ Registration error: {e}", "FAIL")
            return False
        
        # Login as admin
        try:
            login_data = {'username': 'testadmin', 'password': 'AdminPass123!'}
            response = requests.post(f"{self.base_url}/api/v1/auth/login/", 
                                    json=login_data, timeout=10)
            if response.status_code == 200:
                self.admin_token = response.json().get('access')
                self.log("✓ Admin authenticated", "PASS")
            else:
                self.log("⊘ Admin not available", "SKIP")
        except:
            self.log("⊘ Admin authentication skipped", "SKIP")
        
        return True
