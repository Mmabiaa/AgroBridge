"""
Service registration for User Service with Consul
"""
import os
import json
import requests
from django.conf import settings

class UserServiceRegistration:
    def __init__(self):
        self.service_name = "user-service"
        self.service_id = f"{self.service_name}-{os.getenv('HOSTNAME', 'localhost')}"
        self.consul_url = os.getenv('CONSUL_URL', 'http://localhost:8500')
        self.service_port = int(os.getenv('USER_SERVICE_PORT', '8001'))
        self.service_host = os.getenv('USER_SERVICE_HOST', 'localhost')
    
    def register_service(self):
        """Register user service with Consul"""
        service_definition = {
            "ID": self.service_id,
            "Name": self.service_name,
            "Tags": [
                "user-management",
                "profile-management", 
                "gdpr-compliance",
                "django",
                "rest-api"
            ],
            "Address": self.service_host,
            "Port": self.service_port,
            "Meta": {
                "version": "1.0.0",
                "environment": os.getenv('ENVIRONMENT', 'development'),
                "framework": "django",
                "api_version": "v1"
            },
            "Check": {
                "HTTP": f"http://{self.service_host}:{self.service_port}/api/users/health/",
                "Method": "GET",
                "Interval": "30s",
                "Timeout": "10s",
                "DeregisterCriticalServiceAfter": "5m"
            },
            "Weights": {
                "Passing": 10,
                "Warning": 1
            }
        }
        
        try:
            response = requests.put(
                f"{self.consul_url}/v1/agent/service/register",
                json=service_definition,
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ User service registered successfully with ID: {self.service_id}")
                return True
            else:
                print(f"❌ Failed to register user service: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error connecting to Consul: {e}")
            return False
    
    def deregister_service(self):
        """Deregister user service from Consul"""
        try:
            response = requests.put(
                f"{self.consul_url}/v1/agent/service/deregister/{self.service_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ User service deregistered successfully: {self.service_id}")
                return True
            else:
                print(f"❌ Failed to deregister user service: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error connecting to Consul: {e}")
            return False
    
    def get_service_health(self):
        """Get service health status from Consul"""
        try:
            response = requests.get(
                f"{self.consul_url}/v1/health/service/{self.service_name}",
                timeout=10
            )
            
            if response.status_code == 200:
                services = response.json()
                for service in services:
                    if service['Service']['ID'] == self.service_id:
                        checks = service.get('Checks', [])
                        if checks:
                            status = checks[0].get('Status', 'unknown')
                            print(f"Service {self.service_id} health status: {status}")
                            return status
                return 'not_found'
            else:
                print(f"❌ Failed to get service health: {response.status_code}")
                return 'error'
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error connecting to Consul: {e}")
            return 'error'

def register_user_service():
    """Helper function to register user service"""
    registration = UserServiceRegistration()
    return registration.register_service()

def deregister_user_service():
    """Helper function to deregister user service"""
    registration = UserServiceRegistration()
    return registration.deregister_service()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        registration = UserServiceRegistration()
        
        if action == "register":
            registration.register_service()
        elif action == "deregister":
            registration.deregister_service()
        elif action == "health":
            registration.get_service_health()
        else:
            print("Usage: python service_registration.py [register|deregister|health]")
    else:
        print("Usage: python service_registration.py [register|deregister|health]")