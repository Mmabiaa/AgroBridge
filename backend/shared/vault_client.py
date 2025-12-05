"""
HashiCorp Vault Client for AgroBridge Microservices

This module provides utilities for secrets management using HashiCorp Vault,
including secret storage, retrieval, rotation, and audit logging.
"""

import os
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import hvac
from hvac.exceptions import VaultError, InvalidPath

logger = logging.getLogger(__name__)


@dataclass
class SecretMetadata:
    """Metadata for a secret"""
    path: str
    version: int
    created_time: str
    deletion_time: Optional[str]
    destroyed: bool
    custom_metadata: Dict[str, str]


class VaultClient:
    """
    HashiCorp Vault client for secrets management
    
    This client handles:
    - Secret storage and retrieval
    - Secret versioning
    - Secret rotation
    - Database credential management
    - PKI certificate management
    - Audit logging
    """
    
    def __init__(
        self,
        url: str = None,
        token: str = None,
        namespace: str = None,
        mount_point: str = "secret"
    ):
        """
        Initialize Vault client
        
        Args:
            url: Vault server URL (default: from env or 'http://localhost:8200')
            token: Vault authentication token (default: from env)
            namespace: Vault namespace (optional, for Vault Enterprise)
            mount_point: KV secrets engine mount point (default: 'secret')
        """
        self.url = url or os.getenv('VAULT_ADDR', 'http://localhost:8200')
        self.token = token or os.getenv('VAULT_TOKEN')
        self.namespace = namespace or os.getenv('VAULT_NAMESPACE')
        self.mount_point = mount_point
        
        if not self.token:
            logger.warning("No Vault token provided, client may not be authenticated")
        
        try:
            self.client = hvac.Client(
                url=self.url,
                token=self.token,
                namespace=self.namespace
            )
            
            if self.token and self.client.is_authenticated():
                logger.info(f"Vault client initialized and authenticated: {self.url}")
            else:
                logger.warning(f"Vault client initialized but not authenticated: {self.url}")
                
        except Exception as e:
            logger.error(f"Failed to initialize Vault client: {e}")
            raise
    
    def is_authenticated(self) -> bool:
        """
        Check if client is authenticated with Vault
        
        Returns:
            True if authenticated, False otherwise
        """
        try:
            return self.client.is_authenticated()
        except Exception as e:
            logger.error(f"Error checking authentication: {e}")
            return False
    
    def is_sealed(self) -> bool:
        """
        Check if Vault is sealed
        
        Returns:
            True if sealed, False if unsealed
        """
        try:
            return self.client.sys.is_sealed()
        except Exception as e:
            logger.error(f"Error checking seal status: {e}")
            return True
    
    def get_secret(
        self,
        path: str,
        version: Optional[int] = None,
        mount_point: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve a secret from Vault
        
        Args:
            path: Secret path (e.g., 'database/postgres')
            version: Specific version to retrieve (optional)
            mount_point: KV mount point (default: self.mount_point)
            
        Returns:
            Secret data dictionary or None if not found
        """
        mount = mount_point or self.mount_point
        
        try:
            if version:
                response = self.client.secrets.kv.v2.read_secret_version(
                    path=path,
                    version=version,
                    mount_point=mount
                )
            else:
                response = self.client.secrets.kv.v2.read_secret_version(
                    path=path,
                    mount_point=mount
                )
            
            if response and 'data' in response and 'data' in response['data']:
                logger.debug(f"Retrieved secret from path: {path}")
                return response['data']['data']
            else:
                logger.warning(f"Secret not found at path: {path}")
                return None
                
        except InvalidPath:
            logger.warning(f"Secret path does not exist: {path}")
            return None
        except VaultError as e:
            logger.error(f"Vault error retrieving secret at {path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error retrieving secret at {path}: {e}")
            return None
    
    def set_secret(
        self,
        path: str,
        secret_data: Dict[str, Any],
        mount_point: Optional[str] = None,
        cas: Optional[int] = None
    ) -> bool:
        """
        Store a secret in Vault
        
        Args:
            path: Secret path (e.g., 'database/postgres')
            secret_data: Dictionary of secret key-value pairs
            mount_point: KV mount point (default: self.mount_point)
            cas: Check-and-Set version for optimistic locking (optional)
            
        Returns:
            True if successful, False otherwise
        """
        mount = mount_point or self.mount_point
        
        try:
            self.client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=secret_data,
                mount_point=mount,
                cas=cas
            )
            
            logger.info(f"Secret stored at path: {path}")
            return True
            
        except VaultError as e:
            logger.error(f"Vault error storing secret at {path}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error storing secret at {path}: {e}")
            return False
    
    def delete_secret(
        self,
        path: str,
        versions: Optional[List[int]] = None,
        mount_point: Optional[str] = None
    ) -> bool:
        """
        Delete a secret or specific versions
        
        Args:
            path: Secret path
            versions: List of versions to delete (optional, deletes latest if None)
            mount_point: KV mount point (default: self.mount_point)
            
        Returns:
            True if successful, False otherwise
        """
        mount = mount_point or self.mount_point
        
        try:
            if versions:
                self.client.secrets.kv.v2.delete_secret_versions(
                    path=path,
                    versions=versions,
                    mount_point=mount
                )
            else:
                self.client.secrets.kv.v2.delete_latest_version_of_secret(
                    path=path,
                    mount_point=mount
                )
            
            logger.info(f"Secret deleted at path: {path}")
            return True
            
        except VaultError as e:
            logger.error(f"Vault error deleting secret at {path}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting secret at {path}: {e}")
            return False
    
    def get_secret_metadata(
        self,
        path: str,
        mount_point: Optional[str] = None
    ) -> Optional[SecretMetadata]:
        """
        Get metadata for a secret
        
        Args:
            path: Secret path
            mount_point: KV mount point (default: self.mount_point)
            
        Returns:
            SecretMetadata object or None if not found
        """
        mount = mount_point or self.mount_point
        
        try:
            response = self.client.secrets.kv.v2.read_secret_metadata(
                path=path,
                mount_point=mount
            )
            
            if response and 'data' in response:
                data = response['data']
                current_version = data.get('current_version', 1)
                versions = data.get('versions', {})
                
                if str(current_version) in versions:
                    version_data = versions[str(current_version)]
                    
                    return SecretMetadata(
                        path=path,
                        version=current_version,
                        created_time=version_data.get('created_time', ''),
                        deletion_time=version_data.get('deletion_time'),
                        destroyed=version_data.get('destroyed', False),
                        custom_metadata=data.get('custom_metadata', {})
                    )
            
            return None
            
        except VaultError as e:
            logger.error(f"Vault error getting metadata for {path}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting metadata for {path}: {e}")
            return None
    
    def list_secrets(
        self,
        path: str = "",
        mount_point: Optional[str] = None
    ) -> List[str]:
        """
        List secrets at a path
        
        Args:
            path: Path to list (empty for root)
            mount_point: KV mount point (default: self.mount_point)
            
        Returns:
            List of secret names
        """
        mount = mount_point or self.mount_point
        
        try:
            response = self.client.secrets.kv.v2.list_secrets(
                path=path,
                mount_point=mount
            )
            
            if response and 'data' in response and 'keys' in response['data']:
                return response['data']['keys']
            else:
                return []
                
        except InvalidPath:
            logger.debug(f"No secrets found at path: {path}")
            return []
        except VaultError as e:
            logger.error(f"Vault error listing secrets at {path}: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error listing secrets at {path}: {e}")
            return []
    
    def generate_database_credentials(
        self,
        role_name: str,
        mount_point: str = "database"
    ) -> Optional[Dict[str, str]]:
        """
        Generate dynamic database credentials
        
        Args:
            role_name: Database role name
            mount_point: Database secrets engine mount point
            
        Returns:
            Dictionary with 'username' and 'password' or None
        """
        try:
            response = self.client.secrets.database.generate_credentials(
                name=role_name,
                mount_point=mount_point
            )
            
            if response and 'data' in response:
                credentials = {
                    'username': response['data'].get('username'),
                    'password': response['data'].get('password'),
                    'lease_id': response.get('lease_id'),
                    'lease_duration': response.get('lease_duration')
                }
                logger.info(f"Generated database credentials for role: {role_name}")
                return credentials
            
            return None
            
        except VaultError as e:
            logger.error(f"Vault error generating credentials for {role_name}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error generating credentials for {role_name}: {e}")
            return None
    
    def renew_lease(self, lease_id: str, increment: Optional[int] = None) -> bool:
        """
        Renew a lease
        
        Args:
            lease_id: Lease ID to renew
            increment: Requested lease increment in seconds (optional)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.sys.renew_lease(
                lease_id=lease_id,
                increment=increment
            )
            logger.info(f"Renewed lease: {lease_id}")
            return True
            
        except VaultError as e:
            logger.error(f"Vault error renewing lease {lease_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error renewing lease {lease_id}: {e}")
            return False
    
    def revoke_lease(self, lease_id: str) -> bool:
        """
        Revoke a lease
        
        Args:
            lease_id: Lease ID to revoke
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.sys.revoke_lease(lease_id=lease_id)
            logger.info(f"Revoked lease: {lease_id}")
            return True
            
        except VaultError as e:
            logger.error(f"Vault error revoking lease {lease_id}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error revoking lease {lease_id}: {e}")
            return False
    
    def health_check(self) -> bool:
        """
        Check if Vault is healthy and accessible
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            health = self.client.sys.read_health_status(method='GET')
            
            # Vault is healthy if initialized and not sealed
            is_healthy = health.get('initialized', False) and not health.get('sealed', True)
            
            if is_healthy:
                logger.debug("Vault is healthy")
            else:
                logger.warning(f"Vault is not healthy: {health}")
            
            return is_healthy
            
        except Exception as e:
            logger.error(f"Vault health check failed: {e}")
            return False


# Convenience functions for common operations

def get_database_config(service_name: str) -> Optional[Dict[str, str]]:
    """
    Get database configuration for a service
    
    Args:
        service_name: Name of the service
        
    Returns:
        Database configuration dictionary or None
    """
    try:
        client = VaultClient()
        return client.get_secret(f"database/{service_name}")
    except Exception as e:
        logger.error(f"Error getting database config for {service_name}: {e}")
        return None


def get_api_key(service_name: str, key_name: str) -> Optional[str]:
    """
    Get API key for a service
    
    Args:
        service_name: Name of the service
        key_name: Name of the API key
        
    Returns:
        API key string or None
    """
    try:
        client = VaultClient()
        secret = client.get_secret(f"api-keys/{service_name}")
        return secret.get(key_name) if secret else None
    except Exception as e:
        logger.error(f"Error getting API key {key_name} for {service_name}: {e}")
        return None


def store_secret(path: str, **kwargs) -> bool:
    """
    Store a secret in Vault
    
    Args:
        path: Secret path
        **kwargs: Key-value pairs to store
        
    Returns:
        True if successful, False otherwise
    """
    try:
        client = VaultClient()
        return client.set_secret(path, kwargs)
    except Exception as e:
        logger.error(f"Error storing secret at {path}: {e}")
        return False
