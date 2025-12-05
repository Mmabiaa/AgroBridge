"""
Service registration for Farm Management Service with Consul
"""
import os
import json
import requests
from django.conf import settings

class FarmServiceRegistration:
    def __init__(self):
        self.service_name = "farm-service"
        self.service_id = f"{self.service_name}-{os.getenv('HOSTNAME', 'localhost')}"
        self.consul_url = os.getenv('CONSUL_URL', 'http://localhost:8500')
        self.service_port = int(os.getenv('FARM_SERVICE_PORT', '8002'))
        self.service_host = os.getenv('FARM_SERVICE_HOST', 'localhost')
    
    def register_service(self):
        """Register farm service with Consul"""
        service_definition = {
            "ID": self.service_id,
            "Name": self.service_name,
            "Tags": [
                "farm-management",
                "field-management",
                "crop-tracking",
                "livestock-management",
                "satellite-imagery",
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
                "HTTP": f"http://{self.service_host}:{self.service_port}/api/farms/health/",
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
                print(f"✅ Farm service registered successfully with ID: {self.service_id}")
                return True
            else:
                print(f"❌ Failed to register farm service: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error connecting to Consul: {e}")
            return False
    
    def deregister_service(self):
        """Deregister farm service from Consul"""
        try:
            response = requests.put(
                f"{self.consul_url}/v1/agent/service/deregister/{self.service_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Farm service deregistered successfully: {self.service_id}")
                return True
            else:
                print(f"❌ Failed to deregister farm service: {response.status_code}")
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

def register_farm_service():
    """Helper function to register farm service"""
    registration = FarmServiceRegistration()
    return registration.register_service()

def deregister_farm_service():
    """Helper function to deregister farm service"""
    registration = FarmServiceRegistration()
    return registration.deregister_service()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        action = sys.argv[1]
        registration = FarmServiceRegistration()
        
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