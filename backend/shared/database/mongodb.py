"""
MongoDB configuration for document storage
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import logging

logger = logging.getLogger(__name__)


class MongoDBConnection:
    """MongoDB connection manager with connection pooling"""
    
    _instances = {}
    
    def __init__(self, service_name: str = 'default'):
        """
        Initialize MongoDB connection
        
        Args:
            service_name: Name of the service using MongoDB
        """
        self.service_name = service_name
        self.client = None
        self.db = None
        self._connect()
    
    def _connect(self):
        """Establish MongoDB connection"""
        try:
            # MongoDB connection string
            mongo_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
            
            # Connection options for production
            self.client = MongoClient(
                mongo_uri,
                maxPoolSize=int(os.getenv('MONGODB_MAX_POOL_SIZE', '50')),
                minPoolSize=int(os.getenv('MONGODB_MIN_POOL_SIZE', '10')),
                maxIdleTimeMS=int(os.getenv('MONGODB_MAX_IDLE_TIME_MS', '45000')),
                serverSelectionTimeoutMS=int(os.getenv('MONGODB_SERVER_SELECTION_TIMEOUT_MS', '5000')),
                connectTimeoutMS=int(os.getenv('MONGODB_CONNECT_TIMEOUT_MS', '10000')),
                socketTimeoutMS=int(os.getenv('MONGODB_SOCKET_TIMEOUT_MS', '20000')),
                retryWrites=True,
                retryReads=True,
                w='majority',  # Write concern
                readPreference='primaryPreferred',
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            # Get database for this service
            db_name = os.getenv(
                f'{self.service_name.upper()}_MONGODB_DB',
                f'agrobridge_{self.service_name}'
            )
            self.db = self.client[db_name]
            
            logger.info(f"MongoDB connected successfully for service: {self.service_name}")
            
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection failed for service {self.service_name}: {e}")
            raise
    
    @classmethod
    def get_instance(cls, service_name: str = 'default'):
        """
        Get or create MongoDB connection instance (singleton per service)
        
        Args:
            service_name: Name of the service
        
        Returns:
            MongoDBConnection instance
        """
        if service_name not in cls._instances:
            cls._instances[service_name] = cls(service_name)
        return cls._instances[service_name]
    
    def get_collection(self, collection_name: str):
        """
        Get a MongoDB collection
        
        Args:
            collection_name: Name of the collection
        
        Returns:
            MongoDB collection object
        """
        return self.db[collection_name]
    
    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info(f"MongoDB connection closed for service: {self.service_name}")


# Service-specific MongoDB configurations
MONGODB_SERVICES = {
    'ai_assistant': {
        'collections': ['conversations', 'chat_history', 'voice_commands'],
        'indexes': {
            'conversations': [
                ('user_id', 1),
                ('created_at', -1),
            ],
            'chat_history': [
                ('conversation_id', 1),
                ('timestamp', -1),
            ],
        }
    },
    'crop_detection': {
        'collections': ['detection_results', 'image_metadata', 'disease_history'],
        'indexes': {
            'detection_results': [
                ('user_id', 1),
                ('farm_id', 1),
                ('detected_at', -1),
            ],
            'disease_history': [
                ('disease_type', 1),
                ('detected_at', -1),
            ],
        }
    },
    'analytics': {
        'collections': ['events', 'user_activity', 'system_metrics'],
        'indexes': {
            'events': [
                ('event_type', 1),
                ('timestamp', -1),
            ],
            'user_activity': [
                ('user_id', 1),
                ('timestamp', -1),
            ],
        }
    },
    'logs': {
        'collections': ['application_logs', 'audit_logs', 'error_logs'],
        'indexes': {
            'application_logs': [
                ('level', 1),
                ('timestamp', -1),
            ],
            'audit_logs': [
                ('user_id', 1),
                ('action', 1),
                ('timestamp', -1),
            ],
        }
    },
}


def setup_mongodb_indexes(service_name: str):
    """
    Set up MongoDB indexes for a service
    
    Args:
        service_name: Name of the service
    """
    if service_name not in MONGODB_SERVICES:
        logger.warning(f"No MongoDB configuration found for service: {service_name}")
        return
    
    try:
        mongo = MongoDBConnection.get_instance(service_name)
        config = MONGODB_SERVICES[service_name]
        
        # Create collections if they don't exist
        for collection_name in config['collections']:
            if collection_name not in mongo.db.list_collection_names():
                mongo.db.create_collection(collection_name)
                logger.info(f"Created collection: {collection_name}")
        
        # Create indexes
        if 'indexes' in config:
            for collection_name, indexes in config['indexes'].items():
                collection = mongo.get_collection(collection_name)
                for index_fields in indexes:
                    collection.create_index([index_fields])
                    logger.info(f"Created index on {collection_name}: {index_fields}")
        
        logger.info(f"MongoDB setup completed for service: {service_name}")
        
    except Exception as e:
        logger.error(f"Failed to setup MongoDB for service {service_name}: {e}")
        raise
