"""
Management command for running performance tests

Usage:
    python manage.py performance_test --test all
    python manage.py performance_test --test cache
    python manage.py performance_test --test database
    python manage.py performance_test --test api
"""

import time
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from shared.performance_testing import (
    run_load_test,
    benchmark_function,
    check_sla_compliance,
    PerformanceMetrics
)
from shared.caching import cache_manager, CacheKeyGenerator
from shared.database_optimization import QueryOptimizer

User = get_user_model()


class Command(BaseCommand):
    help = 'Run performance tests on the system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test',
            type=str,
            default='all',
            choices=['all', 'cache', 'database', 'api', 'load'],
            help='Type of test to run'
        )
        parser.add_argument(
            '--requests',
            type=int,
            default=100,
            help='Number of requests for load test'
        )
        parser.add_argument(
            '--concurrent',
            type=int,
            default=10,
            help='Number of concurrent users'
        )
    
    def handle(self, *args, **options):
        test_type = options['test']
        
        self.stdout.write(self.style.SUCCESS(
            f'\n{"="*60}\n'
            f'AgroBridge Performance Testing\n'
            f'{"="*60}\n'
        ))
        
        if test_type in ['all', 'cache']:
            self.test_cache_performance()
        
        if test_type in ['all', 'database']:
            self.test_database_performance()
        
        if test_type in ['all', 'api']:
            self.test_api_performance()
        
        if test_type in ['all', 'load']:
            self.test_load_performance(
                options['requests'],
                options['concurrent']
            )
        
        self.stdout.write(self.style.SUCCESS(
            f'\n{"="*60}\n'
            f'Performance Testing Complete\n'
            f'{"="*60}\n'
        ))
    
    def test_cache_performance(self):
        """Test cache performance"""
        self.stdout.write(self.style.WARNING('\n--- Cache Performance Test ---\n'))
        
        # Test cache set
        def cache_set_test():
            key = CacheKeyGenerator.generate_key('test', time.time())
            cache_manager.set(key, {'data': 'test'}, ttl=60)
        
        set_results = benchmark_function(cache_set_test, iterations=1000)
        self.stdout.write(f"Cache SET: {set_results['avg_time']}")
        
        # Test cache get
        test_key = CacheKeyGenerator.generate_key('test', 'benchmark')
        cache_manager.set(test_key, {'data': 'test'}, ttl=60)
        
        def cache_get_test():
            cache_manager.get(test_key)
        
        get_results = benchmark_function(cache_get_test, iterations=1000)
        self.stdout.write(f"Cache GET: {get_results['avg_time']}")
        
        # Test cache delete
        def cache_delete_test():
            key = CacheKeyGenerator.generate_key('test', time.time())
            cache_manager.set(key, {'data': 'test'}, ttl=60)
            cache_manager.delete(key)
        
        delete_results = benchmark_function(cache_delete_test, iterations=1000)
        self.stdout.write(f"Cache DELETE: {delete_results['avg_time']}")
        
        self.stdout.write(self.style.SUCCESS('✓ Cache performance test completed\n'))
    
    def test_database_performance(self):
        """Test database query performance"""
        self.stdout.write(self.style.WARNING('\n--- Database Performance Test ---\n'))
        
        # Test unoptimized query
        def unoptimized_query():
            users = list(User.objects.all()[:10])
            for user in users:
                _ = user.email
        
        unopt_results = benchmark_function(unoptimized_query, iterations=50)
        self.stdout.write(f"Unoptimized Query: {unopt_results['avg_time']}")
        
        # Test optimized query
        def optimized_query():
            users = list(QueryOptimizer.get_optimized_user_queryset()[:10])
            for user in users:
                _ = user.email
        
        opt_results = benchmark_function(optimized_query, iterations=50)
        self.stdout.write(f"Optimized Query: {opt_results['avg_time']}")
        
        # Calculate improvement
        if unopt_results.get('avg_time') and opt_results.get('avg_time'):
            unopt_time = float(unopt_results['avg_time'].replace('s', ''))
            opt_time = float(opt_results['avg_time'].replace('s', ''))
            improvement = ((unopt_time - opt_time) / unopt_time) * 100
            self.stdout.write(
                self.style.SUCCESS(
                    f"Performance Improvement: {improvement:.2f}%"
                )
            )
        
        self.stdout.write(self.style.SUCCESS('✓ Database performance test completed\n'))
    
    def test_api_performance(self):
        """Test API endpoint performance"""
        self.stdout.write(self.style.WARNING('\n--- API Performance Test ---\n'))
        
        # This would test actual API endpoints
        # For now, we'll simulate with a simple function
        
        def api_endpoint_simulation():
            # Simulate API processing
            time.sleep(0.01)  # 10ms processing time
            return {'status': 'success'}
        
        results = benchmark_function(api_endpoint_simulation, iterations=100)
        self.stdout.write(f"API Response Time: {results['avg_time']}")
        
        self.stdout.write(self.style.SUCCESS('✓ API performance test completed\n'))
    
    def test_load_performance(self, num_requests: int, concurrent_users: int):
        """Test system under load"""
        self.stdout.write(self.style.WARNING('\n--- Load Performance Test ---\n'))
        
        def simulated_request():
            # Simulate a typical request
            time.sleep(0.05)  # 50ms processing
            return {'status': 'success'}
        
        self.stdout.write(
            f"Running load test: {num_requests} requests, "
            f"{concurrent_users} concurrent users\n"
        )
        
        metrics = run_load_test(
            simulated_request,
            num_requests=num_requests,
            concurrent_users=concurrent_users
        )
        
        # Display results
        results = metrics.to_dict()
        self.stdout.write(f"\nResults:")
        self.stdout.write(f"  Total Requests: {results['total_requests']}")
        self.stdout.write(f"  Successful: {results['successful_requests']}")
        self.stdout.write(f"  Failed: {results['failed_requests']}")
        self.stdout.write(f"  Success Rate: {results['success_rate']}")
        self.stdout.write(f"  Duration: {results['duration']}")
        self.stdout.write(f"  Throughput: {results['requests_per_second']}")
        self.stdout.write(f"\nResponse Times:")
        self.stdout.write(f"  Min: {results['response_times']['min']}")
        self.stdout.write(f"  Max: {results['response_times']['max']}")
        self.stdout.write(f"  Avg: {results['response_times']['avg']}")
        self.stdout.write(f"  Median: {results['response_times']['median']}")
        self.stdout.write(f"  P95: {results['response_times']['p95']}")
        self.stdout.write(f"  P99: {results['response_times']['p99']}")
        
        # Check SLA compliance
        sla_results = check_sla_compliance(metrics)
        self.stdout.write(f"\nSLA Compliance:")
        self.stdout.write(
            f"  Overall: {'✓ PASS' if sla_results['overall_compliant'] else '✗ FAIL'}"
        )
        
        self.stdout.write(self.style.SUCCESS('\n✓ Load performance test completed\n'))
