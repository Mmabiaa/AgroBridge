#!/usr/bin/env python
"""
Setup script for creating microservices structure
"""
import os
import sys


SERVICES = [
    # Core Services (Layer 1)
    'authentication',
    'users',
    'api_gateway',
    
    # Business Services (Layer 2)
    'farms',
    'marketplace',
    'ai_assistant',
    'crop_detection',
    'financial',
    'learning',
    'community',
    
    # Advanced Services (Layer 3)
    'iot',
    'notifications',
    'analytics',
    'scheduling',
    'payments',
    'blockchain',
    'export_docs',
    'emergency',
    
    # Infrastructure Services (Layer 4)
    'storage',
    'admin',
]

STANDARD_FILES = [
    '__init__.py',
    'models.py',
    'views.py',
    'serializers.py',
    'urls.py',
    'services.py',
    'tests.py',
    'permissions.py',
]


def create_service_structure(service_name):
    """Create standard directory structure for a service"""
    service_path = os.path.join('services', service_name)
    
    # Create service directory
    os.makedirs(service_path, exist_ok=True)
    
    # Create migrations directory
    migrations_path = os.path.join(service_path, 'migrations')
    os.makedirs(migrations_path, exist_ok=True)
    
    # Create __init__.py in migrations
    with open(os.path.join(migrations_path, '__init__.py'), 'w') as f:
        f.write('')
    
    # Create standard files
    for filename in STANDARD_FILES:
        filepath = os.path.join(service_path, filename)
        if not os.path.exists(filepath):
            with open(filepath, 'w') as f:
                if filename == '__init__.py':
                    f.write(f'"""\n{service_name.title()} Service\n"""\n')
                elif filename == 'models.py':
                    f.write('from django.db import models\n')
                    f.write('from shared.common.base_models import BaseModel\n\n')
                    f.write('# Add your models here\n')
                elif filename == 'views.py':
                    f.write('from rest_framework import viewsets\n')
                    f.write('from shared.common.base_views import BaseViewSet\n\n')
                    f.write('# Add your views here\n')
                elif filename == 'serializers.py':
                    f.write('from rest_framework import serializers\n')
                    f.write('from shared.common.base_serializers import BaseSerializer\n\n')
                    f.write('# Add your serializers here\n')
                elif filename == 'urls.py':
                    f.write('from django.urls import path, include\n')
                    f.write('from rest_framework.routers import DefaultRouter\n\n')
                    f.write('router = DefaultRouter()\n\n')
                    f.write('urlpatterns = [\n')
                    f.write('    path("", include(router.urls)),\n')
                    f.write(']\n')
                elif filename == 'services.py':
                    f.write('"""\nBusiness logic for the service\n"""\n')
                elif filename == 'tests.py':
                    f.write('from django.test import TestCase\n\n')
                    f.write('# Add your tests here\n')
                elif filename == 'permissions.py':
                    f.write('from rest_framework import permissions\n\n')
                    f.write('# Add your custom permissions here\n')
    
    print(f"✓ Created structure for {service_name}")


def main():
    """Main setup function"""
    print("Setting up AgroBridge microservices structure...\n")
    
    # Change to backend directory
    if not os.path.exists('services'):
        os.makedirs('services')
    
    # Create each service
    for service in SERVICES:
        create_service_structure(service)
    
    print(f"\n✓ Successfully created {len(SERVICES)} microservices")
    print("\nNext steps:")
    print("1. Review the generated structure")
    print("2. Implement models for each service")
    print("3. Create API endpoints")
    print("4. Write tests")
    print("5. Configure service discovery")


if __name__ == '__main__':
    main()
