"""
Performance Testing Utilities for AgroBridge

This module provides:
- Load testing helpers
- Performance benchmarking
- Response time monitoring
- Throughput measurement
- SLA compliance checking
"""

import time
import logging
import statistics
from typing import Callable, List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetrics:
    """Performance metrics for a test"""
    
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    response_times: List[float] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    @property
    def avg_response_time(self) -> float:
        """Calculate average response time"""
        if not self.response_times:
            return 0.0
        return statistics.mean(self.response_times)
    
    @property
    def median_response_time(self) -> float:
        """Calculate median response time"""
        if not self.response_times:
            return 0.0
        return statistics.median(self.response_times)
    
    @property
    def p95_response_time(self) -> float:
        """Calculate 95th percentile response time"""
        if not self.response_times:
            return 0.0
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * 0.95)
        return sorted_times[index] if index < len(sorted_times) else sorted_times[-1]
    
    @property
    def p99_response_time(self) -> float:
        """Calculate 99th percentile response time"""
        if not self.response_times:
            return 0.0
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * 0.99)
        return sorted_times[index] if index < len(sorted_times) else sorted_times[-1]
    
    @property
    def min_response_time(self) -> float:
        """Get minimum response time"""
        return min(self.response_times) if self.response_times else 0.0
    
    @property
    def max_response_time(self) -> float:
        """Get maximum response time"""
        return max(self.response_times) if self.response_times else 0.0
    
    @property
    def duration(self) -> float:
        """Get total test duration in seconds"""
        if not self.start_time or not self.end_time:
            return 0.0
        return (self.end_time - self.start_time).total_seconds()
    
    @property
    def requests_per_second(self) -> float:
        """Calculate requests per second"""
        if self.duration == 0:
            return 0.0
        return self.total_requests / self.duration
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary"""
        return {
            'total_requests': self.total_requests,
            'successful_requests': self.successful_requests,
            'failed_requests': self.failed_requests,
            'success_rate': f"{self.success_rate:.2f}%",
            'duration': f"{self.duration:.2f}s",
            'requests_per_second': f"{self.requests_per_second:.2f}",
            'response_times': {
                'min': f"{self.min_response_time:.3f}s",
                'max': f"{self.max_response_time:.3f}s",
                'avg': f"{self.avg_response_time:.3f}s",
                'median': f"{self.median_response_time:.3f}s",
                'p95': f"{self.p95_response_time:.3f}s",
                'p99': f"{self.p99_response_time:.3f}s",
            },
            'errors': self.errors[:10],  # First 10 errors
        }


class LoadTester:
    """Load testing utility"""
    
    def __init__(self, max_workers: int = 10):
        self.max_workers = max_workers
        self.metrics = PerformanceMetrics()
    
    def run_load_test(
        self,
        func: Callable,
        num_requests: int,
        concurrent_users: int = 1,
        **kwargs
    ) -> PerformanceMetrics:
        """
        Run load test on a function
        
        Args:
            func: Function to test
            num_requests: Total number of requests
            concurrent_users: Number of concurrent users
            **kwargs: Arguments to pass to function
            
        Returns:
            PerformanceMetrics: Test results
        """
        self.metrics = PerformanceMetrics()
        self.metrics.start_time = datetime.now()
        
        logger.info(
            f"Starting load test: {num_requests} requests, "
            f"{concurrent_users} concurrent users"
        )
        
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            
            for i in range(num_requests):
                future = executor.submit(self._execute_request, func, i, **kwargs)
                futures.append(future)
            
            # Wait for all requests to complete
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    logger.error(f"Request failed: {e}")
        
        self.metrics.end_time = datetime.now()
        
        logger.info(f"Load test completed: {self.metrics.to_dict()}")
        
        return self.metrics
    
    def _execute_request(self, func: Callable, request_num: int, **kwargs):
        """Execute a single request"""
        self.metrics.total_requests += 1
        
        start_time = time.time()
        
        try:
            result = func(**kwargs)
            
            response_time = time.time() - start_time
            self.metrics.response_times.append(response_time)
            self.metrics.successful_requests += 1
            
            logger.debug(f"Request {request_num} completed in {response_time:.3f}s")
            
            return result
            
        except Exception as e:
            response_time = time.time() - start_time
            self.metrics.response_times.append(response_time)
            self.metrics.failed_requests += 1
            self.metrics.errors.append(str(e))
            
            logger.error(f"Request {request_num} failed: {e}")
            raise


class PerformanceBenchmark:
    """Benchmark performance of operations"""
    
    @staticmethod
    def benchmark(func: Callable, iterations: int = 100, **kwargs) -> Dict[str, Any]:
        """
        Benchmark a function
        
        Args:
            func: Function to benchmark
            iterations: Number of iterations
            **kwargs: Arguments to pass to function
            
        Returns:
            dict: Benchmark results
        """
        times = []
        errors = 0
        
        logger.info(f"Benchmarking {func.__name__} with {iterations} iterations")
        
        for i in range(iterations):
            start_time = time.time()
            
            try:
                func(**kwargs)
                elapsed = time.time() - start_time
                times.append(elapsed)
            except Exception as e:
                errors += 1
                logger.error(f"Iteration {i} failed: {e}")
        
        if not times:
            return {
                'function': func.__name__,
                'iterations': iterations,
                'errors': errors,
                'success_rate': 0.0,
            }
        
        results = {
            'function': func.__name__,
            'iterations': iterations,
            'successful': len(times),
            'errors': errors,
            'success_rate': f"{(len(times) / iterations) * 100:.2f}%",
            'min_time': f"{min(times):.3f}s",
            'max_time': f"{max(times):.3f}s",
            'avg_time': f"{statistics.mean(times):.3f}s",
            'median_time': f"{statistics.median(times):.3f}s",
        }
        
        logger.info(f"Benchmark results: {results}")
        
        return results


class SLAChecker:
    """Check SLA compliance"""
    
    # SLA thresholds
    SLA_RESPONSE_TIME_P95 = 1.0  # 95% of requests under 1 second
    SLA_RESPONSE_TIME_P99 = 2.0  # 99% of requests under 2 seconds
    SLA_SUCCESS_RATE = 99.9  # 99.9% success rate
    SLA_AVAILABILITY = 99.9  # 99.9% uptime
    
    @staticmethod
    def check_response_time_sla(metrics: PerformanceMetrics) -> Dict[str, Any]:
        """
        Check response time SLA compliance
        
        Args:
            metrics: Performance metrics
            
        Returns:
            dict: SLA compliance results
        """
        p95_compliant = metrics.p95_response_time <= SLAChecker.SLA_RESPONSE_TIME_P95
        p99_compliant = metrics.p99_response_time <= SLAChecker.SLA_RESPONSE_TIME_P99
        
        return {
            'p95_response_time': {
                'value': f"{metrics.p95_response_time:.3f}s",
                'threshold': f"{SLAChecker.SLA_RESPONSE_TIME_P95:.3f}s",
                'compliant': p95_compliant,
            },
            'p99_response_time': {
                'value': f"{metrics.p99_response_time:.3f}s",
                'threshold': f"{SLAChecker.SLA_RESPONSE_TIME_P99:.3f}s",
                'compliant': p99_compliant,
            },
            'overall_compliant': p95_compliant and p99_compliant,
        }
    
    @staticmethod
    def check_success_rate_sla(metrics: PerformanceMetrics) -> Dict[str, Any]:
        """
        Check success rate SLA compliance
        
        Args:
            metrics: Performance metrics
            
        Returns:
            dict: SLA compliance results
        """
        compliant = metrics.success_rate >= SLAChecker.SLA_SUCCESS_RATE
        
        return {
            'success_rate': {
                'value': f"{metrics.success_rate:.2f}%",
                'threshold': f"{SLAChecker.SLA_SUCCESS_RATE:.2f}%",
                'compliant': compliant,
            },
        }
    
    @staticmethod
    def check_all_slas(metrics: PerformanceMetrics) -> Dict[str, Any]:
        """
        Check all SLA compliance
        
        Args:
            metrics: Performance metrics
            
        Returns:
            dict: Complete SLA compliance results
        """
        response_time_sla = SLAChecker.check_response_time_sla(metrics)
        success_rate_sla = SLAChecker.check_success_rate_sla(metrics)
        
        overall_compliant = (
            response_time_sla['overall_compliant'] and
            success_rate_sla['success_rate']['compliant']
        )
        
        return {
            'response_time': response_time_sla,
            'success_rate': success_rate_sla,
            'overall_compliant': overall_compliant,
        }


class ThroughputMonitor:
    """Monitor system throughput"""
    
    def __init__(self):
        self.request_counts = []
        self.start_time = None
    
    def start(self):
        """Start monitoring"""
        self.start_time = time.time()
        self.request_counts = []
    
    def record_request(self):
        """Record a request"""
        if self.start_time:
            elapsed = time.time() - self.start_time
            self.request_counts.append(elapsed)
    
    def get_throughput(self) -> float:
        """
        Get current throughput (requests per second)
        
        Returns:
            float: Requests per second
        """
        if not self.request_counts or not self.start_time:
            return 0.0
        
        elapsed = time.time() - self.start_time
        return len(self.request_counts) / elapsed if elapsed > 0 else 0.0
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get throughput statistics
        
        Returns:
            dict: Throughput statistics
        """
        throughput = self.get_throughput()
        
        return {
            'total_requests': len(self.request_counts),
            'duration': f"{time.time() - self.start_time:.2f}s" if self.start_time else "0s",
            'throughput': f"{throughput:.2f} req/s",
        }


# Convenience functions
def run_load_test(
    func: Callable,
    num_requests: int,
    concurrent_users: int = 1,
    **kwargs
) -> PerformanceMetrics:
    """Run load test"""
    tester = LoadTester(max_workers=concurrent_users)
    return tester.run_load_test(func, num_requests, concurrent_users, **kwargs)


def benchmark_function(func: Callable, iterations: int = 100, **kwargs) -> Dict[str, Any]:
    """Benchmark a function"""
    return PerformanceBenchmark.benchmark(func, iterations, **kwargs)


def check_sla_compliance(metrics: PerformanceMetrics) -> Dict[str, Any]:
    """Check SLA compliance"""
    return SLAChecker.check_all_slas(metrics)
