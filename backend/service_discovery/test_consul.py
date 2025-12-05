#!/usr/bin/env python3
"""
Test script for Consul service discovery

This script tests the Consul setup and service registration/discovery functionality.
"""

import sys
import os
import time

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared.consul_client import ConsulClient, ServiceConfig
from service_discovery.service_registration_template import (
    register_with_consul,
    discover_service,
    ServiceNames
)


def test_consul_connection():
    """Test Consul server connectivity"""
    print("=" * 60)
    print("Test 1: Consul Connection")
    print("=" * 60)
    
    try:
        client = ConsulClient()
        if client.health_check():
            print("✅ Consul is healthy and reachable")
            return True
        else:
            print("❌ Consul is not healthy")
            return False
    except Exception as e:
        print(f"❌ Failed to connect to Consul: {e}")
        return False


def test_service_registration():
    """Test service registration"""
    print("\n" + "=" * 60)
    print("Test 2: Service Registration")
    print("=" * 60)
    
    try:
        success = register_with_consul(
            service_name='test-service',
            port=9999,
            tags=['test', 'v1'],
            meta={'test': 'true'}
        )
        
        if success:
            print("✅ Service registered successfully")
            return True
        else:
            print("❌ Service registration failed")
            return False
    except Exception as e:
        print(f"❌ Error during registration: {e}")
        return False


def test_service_discovery():
    """Test service discovery"""
    print("\n" + "=" * 60)
    print("Test 3: Service Discovery")
    print("=" * 60)
    
    try:
        # Wait a moment for registration to propagate
        time.sleep(2)
        
        # Try to discover the test service
        address = discover_service('test-service')
        
        if address:
            print(f"✅ Service discovered at: {address}")
            return True
        else:
            print("❌ Service not found")
            return False
    except Exception as e:
        print(f"❌ Error during discovery: {e}")
        return False


def test_service_list():
    """Test listing all services"""
    print("\n" + "=" * 60)
    print("Test 4: List All Services")
    print("=" * 60)
    
    try:
        client = ConsulClient()
        services = client.get_all_services()
        
        print(f"✅ Found {len(services)} services:")
        for service_name, tags in services.items():
            print(f"  - {service_name}: {tags}")
        
        return True
    except Exception as e:
        print(f"❌ Error listing services: {e}")
        return False


def test_kv_store():
    """Test key-value store"""
    print("\n" + "=" * 60)
    print("Test 5: Key-Value Store")
    print("=" * 60)
    
    try:
        client = ConsulClient()
        
        # Test write
        key = "test/config"
        value = "test_value"
        
        if client.put_key(key, value):
            print(f"✅ Stored key '{key}'")
        else:
            print(f"❌ Failed to store key '{key}'")
            return False
        
        # Test read
        retrieved = client.get_key(key)
        if retrieved == value:
            print(f"✅ Retrieved key '{key}': {retrieved}")
        else:
            print(f"❌ Value mismatch: expected '{value}', got '{retrieved}'")
            return False
        
        # Test delete
        if client.delete_key(key):
            print(f"✅ Deleted key '{key}'")
        else:
            print(f"❌ Failed to delete key '{key}'")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Error with KV store: {e}")
        return False


def cleanup():
    """Cleanup test service"""
    print("\n" + "=" * 60)
    print("Cleanup")
    print("=" * 60)
    
    try:
        from shared.consul_client import get_service_instance_id
        
        client = ConsulClient()
        service_id = get_service_instance_id('test-service')
        
        if client.deregister_service(service_id):
            print("✅ Test service deregistered")
        else:
            print("⚠️  Failed to deregister test service")
    except Exception as e:
        print(f"⚠️  Error during cleanup: {e}")


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("Consul Service Discovery Test Suite")
    print("=" * 60)
    print()
    
    results = []
    
    # Run tests
    results.append(("Consul Connection", test_consul_connection()))
    results.append(("Service Registration", test_service_registration()))
    results.append(("Service Discovery", test_service_discovery()))
    results.append(("List Services", test_service_list()))
    results.append(("Key-Value Store", test_kv_store()))
    
    # Cleanup
    cleanup()
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print()
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
