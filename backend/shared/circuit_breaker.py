"""
Circuit Breaker Pattern Implementation
Prevents cascading failures in distributed systems
"""

import logging
import time
from typing import Callable, Any, Optional
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
from functools import wraps
import threading

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5  # Number of failures before opening
    success_threshold: int = 2  # Number of successes to close from half-open
    timeout: int = 60  # Seconds to wait before trying again (half-open)
    expected_exception: type = Exception  # Exception type to catch


class CircuitBreakerError(Exception):
    """Raised when circuit breaker is open"""
    pass


class CircuitBreaker:
    """
    Circuit breaker implementation
    """
    
    def __init__(self, config: Optional[CircuitBreakerConfig] = None):
        """
        Initialize circuit breaker
        
        Args:
            config: Circuit breaker configuration
        """
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.lock = threading.Lock()
    
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection
        
        Args:
            func: Function to execute
            *args: Function arguments
            **kwargs: Function keyword arguments
            
        Returns:
            Function result
            
        Raises:
            CircuitBreakerError: If circuit is open
        """
        with self.lock:
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self.state = CircuitState.HALF_OPEN
                    logger.info("Circuit breaker entering HALF_OPEN state")
                else:
                    raise CircuitBreakerError("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
            
        except self.config.expected_exception as e:
            self._on_failure()
            raise
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        
        elapsed = time.time() - self.last_failure_time
        return elapsed >= self.config.timeout
    
    def _on_success(self):
        """Handle successful call"""
        with self.lock:
            self.failure_count = 0
            
            if self.state == CircuitState.HALF_OPEN:
                self.success_count += 1
                
                if self.success_count >= self.config.success_threshold:
                    self.state = CircuitState.CLOSED
                    self.success_count = 0
                    logger.info("Circuit breaker CLOSED")
    
    def _on_failure(self):
        """Handle failed call"""
        with self.lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            
            if self.state == CircuitState.HALF_OPEN:
                self.state = CircuitState.OPEN
                logger.warning("Circuit breaker OPEN (from HALF_OPEN)")
                
            elif self.failure_count >= self.config.failure_threshold:
                self.state = CircuitState.OPEN
                logger.warning(f"Circuit breaker OPEN (failures: {self.failure_count})")
    
    def reset(self):
        """Manually reset circuit breaker"""
        with self.lock:
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.success_count = 0
            self.last_failure_time = None
            logger.info("Circuit breaker manually reset")
    
    def get_state(self) -> CircuitState:
        """Get current circuit state"""
        return self.state
    
    def get_metrics(self) -> dict:
        """Get circuit breaker metrics"""
        return {
            'state': self.state.value,
            'failure_count': self.failure_count,
            'success_count': self.success_count,
            'last_failure_time': self.last_failure_time
        }


class CircuitBreakerRegistry:
    """
    Registry for managing multiple circuit breakers
    """
    
    def __init__(self):
        self.breakers: dict[str, CircuitBreaker] = {}
        self.lock = threading.Lock()
    
    def get_breaker(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None
    ) -> CircuitBreaker:
        """
        Get or create a circuit breaker
        
        Args:
            name: Circuit breaker name
            config: Configuration (used only when creating new breaker)
            
        Returns:
            CircuitBreaker instance
        """
        with self.lock:
            if name not in self.breakers:
                self.breakers[name] = CircuitBreaker(config)
                logger.info(f"Created circuit breaker: {name}")
            
            return self.breakers[name]
    
    def reset_breaker(self, name: str):
        """Reset a specific circuit breaker"""
        with self.lock:
            if name in self.breakers:
                self.breakers[name].reset()
    
    def reset_all(self):
        """Reset all circuit breakers"""
        with self.lock:
            for breaker in self.breakers.values():
                breaker.reset()
            logger.info("Reset all circuit breakers")
    
    def get_all_metrics(self) -> dict:
        """Get metrics for all circuit breakers"""
        with self.lock:
            return {
                name: breaker.get_metrics()
                for name, breaker in self.breakers.items()
            }


# Singleton registry
_registry = None


def get_circuit_breaker_registry() -> CircuitBreakerRegistry:
    """Get singleton circuit breaker registry"""
    global _registry
    if _registry is None:
        _registry = CircuitBreakerRegistry()
    return _registry


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    success_threshold: int = 2,
    timeout: int = 60,
    expected_exception: type = Exception,
    fallback: Optional[Callable] = None
):
    """
    Decorator to add circuit breaker protection to a function
    
    Args:
        name: Circuit breaker name
        failure_threshold: Number of failures before opening
        success_threshold: Number of successes to close from half-open
        timeout: Seconds to wait before trying again
        expected_exception: Exception type to catch
        fallback: Fallback function to call when circuit is open
        
    Usage:
        @circuit_breaker(
            name="payment_service",
            failure_threshold=3,
            timeout=30,
            fallback=lambda *args, **kwargs: {"status": "unavailable"}
        )
        def call_payment_service(amount):
            # Make API call
            return payment_api.charge(amount)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            registry = get_circuit_breaker_registry()
            
            config = CircuitBreakerConfig(
                failure_threshold=failure_threshold,
                success_threshold=success_threshold,
                timeout=timeout,
                expected_exception=expected_exception
            )
            
            breaker = registry.get_breaker(name, config)
            
            try:
                return breaker.call(func, *args, **kwargs)
                
            except CircuitBreakerError:
                logger.warning(f"Circuit breaker {name} is OPEN")
                
                if fallback:
                    logger.info(f"Using fallback for {name}")
                    return fallback(*args, **kwargs)
                else:
                    raise
        
        return wrapper
    return decorator


# Example usage with common services

@circuit_breaker(
    name="payment_gateway",
    failure_threshold=3,
    timeout=30,
    fallback=lambda *args, **kwargs: {"status": "unavailable", "message": "Payment service temporarily unavailable"}
)
def call_payment_gateway(payment_data: dict) -> dict:
    """
    Example: Call payment gateway with circuit breaker protection
    """
    # This would be replaced with actual payment gateway call
    import requests
    response = requests.post(
        "https://payment-gateway.example.com/charge",
        json=payment_data,
        timeout=10
    )
    response.raise_for_status()
    return response.json()


@circuit_breaker(
    name="inventory_service",
    failure_threshold=5,
    timeout=60,
    fallback=lambda *args, **kwargs: {"available": False, "message": "Inventory service temporarily unavailable"}
)
def check_inventory(product_id: str, quantity: int) -> dict:
    """
    Example: Check inventory with circuit breaker protection
    """
    # This would be replaced with actual inventory service call
    import requests
    response = requests.get(
        f"https://inventory-service.example.com/products/{product_id}/availability",
        params={"quantity": quantity},
        timeout=5
    )
    response.raise_for_status()
    return response.json()


@circuit_breaker(
    name="notification_service",
    failure_threshold=10,
    timeout=30,
    fallback=lambda *args, **kwargs: {"sent": False, "message": "Notification queued for later"}
)
def send_notification(user_id: str, message: str) -> dict:
    """
    Example: Send notification with circuit breaker protection
    """
    # This would be replaced with actual notification service call
    import requests
    response = requests.post(
        "https://notification-service.example.com/send",
        json={"user_id": user_id, "message": message},
        timeout=5
    )
    response.raise_for_status()
    return response.json()


@circuit_breaker(
    name="external_api",
    failure_threshold=3,
    timeout=120,
    expected_exception=requests.exceptions.RequestException
)
def call_external_api(endpoint: str, data: dict) -> dict:
    """
    Example: Call external API with circuit breaker protection
    """
    import requests
    response = requests.post(endpoint, json=data, timeout=10)
    response.raise_for_status()
    return response.json()


# Monitoring endpoint for circuit breaker status
def get_circuit_breaker_status() -> dict:
    """
    Get status of all circuit breakers
    
    Returns:
        Dictionary with circuit breaker metrics
    """
    registry = get_circuit_breaker_registry()
    return registry.get_all_metrics()
