"""
Load testing configuration using Locust.
Simulates realistic user behavior under various load conditions.
"""
import random
import json
from locust import HttpUser, task, between, SequentialTaskSet
from faker import Faker

fake = Faker()


class FarmerBehavior(SequentialTaskSet):
    """Simulate farmer user behavior."""
    
    def on_start(self):
        """Login before starting tasks."""
        self.login()
    
    def login(self):
        """Authenticate user."""
        response = self.client.post('/api/auth/login/', json={
            'username': 'load_test_farmer',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            self.token = response.json()['access']
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
    
    @task
    def view_farms(self):
        """View user's farms."""
        self.client.get('/api/farms/')
    
    @task
    def view_farm_details(self):
        """View specific farm details."""
        # Assume farm_id 1 exists
        self.client.get('/api/farms/1/')
    
    @task
    def check_notifications(self):
        """Check notifications."""
        self.client.get('/api/notifications/')
    
    @task
    def view_marketplace(self):
        """Browse marketplace."""
        self.client.get('/api/marketplace/products/')
    
    @task
    def check_iot_data(self):
        """Check IoT sensor data."""
        self.client.get('/api/iot/devices/')


class BuyerBehavior(SequentialTaskSet):
    """Simulate buyer user behavior."""
    
    def on_start(self):
        """Login before starting tasks."""
        self.login()
    
    def login(self):
        """Authenticate user."""
        response = self.client.post('/api/auth/login/', json={
            'username': 'load_test_buyer',
            'password': 'testpass123'
        })
        if response.status_code == 200:
            self.token = response.json()['access']
            self.client.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
    
    @task(3)
    def browse_products(self):
        """Browse marketplace products."""
        params = {
            'page': random.randint(1, 5),
            'category': random.choice(['grains', 'vegetables', 'fruits'])
        }
        self.client.get('/api/marketplace/products/', params=params)
    
    @task(2)
    def search_products(self):
        """Search for products."""
        self.client.get('/api/marketplace/products/', params={
            'search': random.choice(['maize', 'tomato', 'beans'])
        })
    
    @task(1)
    def view_product_details(self):
        """View product details."""
        product_id = random.randint(1, 100)
        self.client.get(f'/api/marketplace/products/{product_id}/')
    
    @task(1)
    def check_orders(self):
        """Check order history."""
        self.client.get('/api/marketplace/orders/')


class FarmerUser(HttpUser):
    """Farmer user type."""
    tasks = [FarmerBehavior]
    wait_time = between(1, 5)
    weight = 3


class BuyerUser(HttpUser):
    """Buyer user type."""
    tasks = [BuyerBehavior]
    wait_time = between(1, 3)
    weight = 2


class AnonymousUser(HttpUser):
    """Anonymous user browsing."""
    wait_time = between(2, 5)
    weight = 1
    
    @task(5)
    def browse_marketplace(self):
        """Browse marketplace without login."""
        self.client.get('/api/marketplace/products/')
    
    @task(2)
    def view_learning_content(self):
        """View learning content."""
        self.client.get('/api/learning/courses/')
    
    @task(1)
    def view_community_posts(self):
        """View community posts."""
        self.client.get('/api/community/posts/')


# Spike test configuration
class SpikeTestUser(HttpUser):
    """User for spike testing."""
    wait_time = between(0.5, 2)
    
    @task
    def rapid_requests(self):
        """Make rapid requests."""
        endpoints = [
            '/api/marketplace/products/',
            '/api/learning/courses/',
            '/api/community/posts/',
            '/api/health/'
        ]
        endpoint = random.choice(endpoints)
        self.client.get(endpoint)


# Stress test configuration
class StressTestUser(HttpUser):
    """User for stress testing."""
    wait_time = between(0.1, 1)
    
    @task(3)
    def heavy_read_operations(self):
        """Perform heavy read operations."""
        self.client.get('/api/marketplace/products/', params={
            'page_size': 100
        })
    
    @task(1)
    def heavy_write_operations(self):
        """Perform write operations."""
        # This would require authentication
        pass
