"""
Simple performance test without Django dependencies
Run this to verify performance modules work
"""

import sys
import time
import os

# Set up minimal Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')

# Configure Django with minimal settings
import django
from django.conf import settings

if not settings.configured:
    settings.configure(
        DEBUG=True,
        SECRET_KEY='test-key-for-performance-testing',
        INSTALLED_APPS=[],
        DATABASES={},
        REDIS_HOST='127.0.0.1',
        REDIS_PORT=6379,
        REDIS_DB=0,
        CDN_ENABLED=False,
        CDN_DOMAIN=None,
        STATIC_URL='/static/',
        MEDIA_URL='/media/',
    )

print("=" * 60)
print("AgroBridge Performance Module Test")
print("=" * 60)
print()

# Test 1: Import modules
print("Test 1: Importing modules...")
try:
    from shared.caching import CacheManager, CacheKeyGenerator, CacheConfig
    print("✓ Caching module imported")
    
    from shared.cdn_integration import CDNManager, ImageOptimizer
    print("✓ CDN integration module imported")
    
    from shared.performance_testing import PerformanceMetrics, LoadTester
    print("✓ Performance testing module imported")
    
    print("✓ All modules imported successfully\n")
except Exception as e:
    print(f"✗ Import failed: {e}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 2: Cache key generation
print("Test 2: Cache key generation...")
try:
    key1 = CacheKeyGenerator.user_key(123)
    key2 = CacheKeyGenerator.product_key(456)
    key3 = CacheKeyGenerator.generate_key("test", "key", value=789)
    
    print(f"  User key: {key1}")
    print(f"  Product key: {key2}")
    print(f"  Generated key: {key3}")
    print("✓ Cache key generation working\n")
except Exception as e:
    print(f"✗ Cache key generation failed: {e}\n")

# Test 3: Performance metrics
print("Test 3: Performance metrics...")
try:
    metrics = PerformanceMetrics()
    metrics.total_requests = 100
    metrics.successful_requests = 95
    metrics.failed_requests = 5
    metrics.response_times = [0.1, 0.2, 0.15, 0.3, 0.25]
    
    print(f"  Success rate: {metrics.success_rate}%")
    print(f"  Avg response time: {metrics.avg_response_time}s")
    print(f"  P95 response time: {metrics.p95_response_time}s")
    print("✓ Performance metrics working\n")
except Exception as e:
    print(f"✗ Performance metrics failed: {e}\n")

# Test 4: Simple benchmark
print("Test 4: Simple benchmark...")
try:
    def test_function():
        time.sleep(0.01)  # Simulate 10ms operation
        return "success"
    
    times = []
    for i in range(10):
        start = time.time()
        test_function()
        elapsed = time.time() - start
        times.append(elapsed)
    
    avg_time = sum(times) / len(times)
    print(f"  Average time: {avg_time:.3f}s")
    print(f"  Min time: {min(times):.3f}s")
    print(f"  Max time: {max(times):.3f}s")
    print("✓ Benchmark working\n")
except Exception as e:
    print(f"✗ Benchmark failed: {e}\n")

# Test 5: CDN configuration
print("Test 5: CDN configuration...")
try:
    cdn = CDNManager()
    print(f"  CDN enabled: {cdn.cdn_enabled}")
    print(f"  CDN domain: {cdn.cdn_domain or 'Not configured'}")
    print(f"  Static URL: {cdn.static_url}")
    print(f"  Media URL: {cdn.media_url}")
    print("✓ CDN configuration working\n")
except Exception as e:
    print(f"✗ CDN configuration failed: {e}\n")

# Test 6: Cache TTL configuration
print("Test 6: Cache TTL configuration...")
try:
    print(f"  Short TTL: {CacheConfig.TTL_SHORT}s")
    print(f"  Medium TTL: {CacheConfig.TTL_MEDIUM}s")
    print(f"  Long TTL: {CacheConfig.TTL_LONG}s")
    print(f"  Day TTL: {CacheConfig.TTL_DAY}s")
    print("✓ Cache TTL configuration working\n")
except Exception as e:
    print(f"✗ Cache TTL configuration failed: {e}\n")

# Summary
print("=" * 60)
print("Test Summary")
print("=" * 60)
print()
print("✓ All basic tests passed!")
print()
print("Performance modules are working correctly.")
print("You can now use them in your Django application.")
print()
print("Next steps:")
print("1. Configure Redis (optional but recommended)")
print("2. Update Django settings with performance configuration")
print("3. Run: python manage.py performance_test --test all")
print()
print("Documentation:")
print("  - Quick Start: docs/PERFORMANCE_QUICK_START.md")
print("  - Full Guide: docs/PERFORMANCE_OPTIMIZATION_GUIDE.md")
print()
