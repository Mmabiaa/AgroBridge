"""
Consul Service Discovery Client

This module provides utilities for service registration, discovery,
and health checking with HashiCorp Consul.
"""

import os
import socket
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import consul
from consul.base import ConsulException

logger = logging.getLogger(__name__)


@dataclass
class ServiceConfig:
    """Configuration for a microservice"""
    name: str
    service_id: str
    host: str
    port: int
    tags: List[str]
    meta: Dict[str, str]
    health_check_path: str = "/health"
    health_check_interval: str = "10s"
    health_check_timeout: str = "5s"
    health_check_deregister_critical_after: str = "30s"


class ConsulClient:
    """
    Consul client for service registration and discovery
    
    This client handles:
    - Service registration with health checks
    - Service deregistration
    - Service discovery
    - Health check management
    """
    
    def __init__(
        self,
        host: str = None,
        port: int = None,
        token: str = None,
        scheme: str = "http"
    ):
        """
        Initialize Consul client
        
        Args:
            host: Consul server host (default: from env or 'localhost')
            port: Consul server port (default: from env or 8500)
            token: Consul ACL token (optional)
            scheme: Connection scheme ('http' or 'https')
        """
        self.host = host or os.getenv('CONSUL_HOST', 'localhost')
        self.port = port or int(os.getenv('CONSUL_PORT', '8500'))
        self.token = token or os.getenv('CONSUL_TOKEN')
        self.scheme = scheme
        
        try:
            self.client = consul.Consul(
                host=self.host,
                port=self.port,
                token=self.token,
                scheme=self.scheme
            )
            logger.info(f"Consul client initialized: {self.scheme}://{self.host}:{self.port}")
        except Exception as e:
            logger.error(f"Failed to initialize Consul client: {e}")
            raise
    
    def register_service(self, config: ServiceConfig) -> bool:
        """
        Register a service with Consul
        
        Args:
            config: Service configuration
            
        Returns:
            True if registration successful, False otherwise
        """
        try:
            # Prepare health check configuration
            check = consul.Check.http(
                url=f"http://{config.host}:{config.port}{config.health_check_path}",
                interval=config.health_check_interval,
                timeout=config.health_check_timeout,
                deregister=config.health_check_deregister_critical_after
            )
            
            # Register the service
            self.client.agent.service.register(
                name=config.name,
                service_id=config.service_id,
                address=config.host,
                port=config.port,
                tags=config.tags,
                meta=config.meta,
                check=check
            )
            
            logger.info(
                f"Service registered: {config.service_id} "
                f"({config.name}) at {config.host}:{config.port}"
            )
            return True
            
        except ConsulException as e:
            logger.error(f"Failed to register service {config.service_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error registering service {config.service_id}: {e}")
            return False
    
    def deregister_service(self, service_id: str) -> bool:
        """
        Deregister a service from Consul
        
        Args:
            service_id: Unique service identifier
            
        Returns:
            True if deregistration successful, False otherwise
        """
        try:
            self.client.agent.service.deregister(service_id)
            logger.info(f"Service deregistered: {service_id}")
            return True
        except ConsulException as e:
            logger.error(f"Failed to deregister service {service_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deregistering service {service_id}: {e}")
            return False
    
    def discover_service(
        self,
        service_name: str,
        tag: Optional[str] = None,
        passing_only: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Discover service instances by name
        
        Args:
            service_name: Name of the service to discover
            tag: Optional tag to filter services
            passing_only: Only return healthy services
            
        Returns:
            List of service instances with their details
        """
        try:
            index, services = self.client.health.service(
                service_name,
                tag=tag,
                passing=passing_only
            )
            
            instances = []
            for service in services:
                instance = {
                    'service_id': service['Service']['ID'],
                    'service_name': service['Service']['Service'],
                    'address': service['Service']['Address'],
                    'port': service['Service']['Port'],
                    'tags': service['Service']['Tags'],
                    'meta': service['Service'].get('Meta', {}),
                    'node': service['Node']['Node'],
                    'checks': [
                        {
                            'check_id': check['CheckID'],
                            'status': check['Status'],
                            'output': check.get('Output', '')
                        }
                        for check in service['Checks']
                    ]
                }
                instances.append(instance)
            
            logger.info(f"Discovered {len(instances)} instances of service '{service_name}'")
            return instances
            
        except ConsulException as e:
            logger.error(f"Failed to discover service {service_name}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error discovering service {service_name}: {e}")
            return []
    
    def get_service_address(
        self,
        service_name: str,
        tag: Optional[str] = None
    ) -> Optional[str]:
        """
        Get the address of a healthy service instance
        
        Args:
            service_name: Name of the service
            tag: Optional tag to filter services
            
        Returns:
            Service address in format 'host:port' or None if not found
        """
        instances = self.discover_service(service_name, tag=tag, passing_only=True)
        
        if not instances:
            logger.warning(f"No healthy instances found for service '{service_name}'")
            return None
        
        # Return the first healthy instance
        instance = instances[0]
        address = f"{instance['address']}:{instance['port']}"
        logger.debug(f"Resolved service '{service_name}' to {address}")
        return address
    
    def get_all_services(self) -> Dict[str, List[str]]:
        """
        Get all registered services
        
        Returns:
            Dictionary mapping service names to their tags
        """
        try:
            index, services = self.client.catalog.services()
            logger.info(f"Retrieved {len(services)} services from catalog")
            return services
        except ConsulException as e:
            logger.error(f"Failed to get services: {e}")
            return {}
        except Exception as e:
            logger.error(f"Unexpected error getting services: {e}")
            return {}
    
    def health_check(self) -> bool:
        """
        Check if Consul is healthy and reachable
        
        Returns:
            True if Consul is healthy, False otherwise
        """
        try:
            leader = self.client.status.leader()
            if leader:
                logger.debug(f"Consul is healthy, leader: {leader}")
                return True
            else:
                logger.warning("Consul has no leader")
                return False
        except Exception as e:
            logger.error(f"Consul health check failed: {e}")
            return False
    
    def put_key(self, key: str, value: str) -> bool:
        """
        Store a key-value pair in Consul KV store
        
        Args:
            key: Key name
            value: Value to store
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.client.kv.put(key, value)
            if result:
                logger.debug(f"Stored key '{key}' in Consul KV")
            return result
        except Exception as e:
            logger.error(f"Failed to store key '{key}': {e}")
            return False
    
    def get_key(self, key: str) -> Optional[str]:
        """
        Retrieve a value from Consul KV store
        
        Args:
            key: Key name
            
        Returns:
            Value if found, None otherwise
        """
        try:
            index, data = self.client.kv.get(key)
            if data:
                value = data['Value'].decode('utf-8')
                logger.debug(f"Retrieved key '{key}' from Consul KV")
                return value
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve key '{key}': {e}")
            return None
    
    def delete_key(self, key: str) -> bool:
        """
        Delete a key from Consul KV store
        
        Args:
            key: Key name
            
        Returns:
            True if successful, False otherwise
        """
        try:
            result = self.client.kv.delete(key)
            if result:
                logger.debug(f"Deleted key '{key}' from Consul KV")
            return result
        except Exception as e:
            logger.error(f"Failed to delete key '{key}': {e}")
            return False


def get_service_instance_id(service_name: str) -> str:
    """
    Generate a unique service instance ID
    
    Args:
        service_name: Name of the service
        
    Returns:
        Unique service instance ID
    """
    hostname = socket.gethostname()
    pid = os.getpid()
    return f"{service_name}-{hostname}-{pid}"


def get_local_ip() -> str:
    """
    Get the local IP address of the machine
    
    Returns:
        Local IP address
    """
    try:
        # Create a socket to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "127.0.0.1"
