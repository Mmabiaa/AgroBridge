"""
Elasticsearch configuration for search functionality
"""
import os
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk
import logging

logger = logging.getLogger(__name__)


class ElasticsearchManager:
    """Elasticsearch connection and index manager"""
    
    _instances = {}
    
    def __init__(self, service_name: str = 'default'):
        """
        Initialize Elasticsearch connection
        
        Args:
            service_name: Name of the service using Elasticsearch
        """
        self.service_name = service_name
        self.client = None
        self._connect()
    
    def _connect(self):
        """Establish Elasticsearch connection"""
        try:
            # Elasticsearch hosts
            hosts = os.getenv('ELASTICSEARCH_HOSTS', 'http://localhost:9200').split(',')
            
            # Connection configuration
            self.client = Elasticsearch(
                hosts=hosts,
                basic_auth=(
                    os.getenv('ELASTICSEARCH_USER', 'elastic'),
                    os.getenv('ELASTICSEARCH_PASSWORD', '')
                ) if os.getenv('ELASTICSEARCH_PASSWORD') else None,
                verify_certs=os.getenv('ELASTICSEARCH_VERIFY_CERTS', 'false').lower() == 'true',
                ca_certs=os.getenv('ELASTICSEARCH_CA_CERTS', None),
                timeout=int(os.getenv('ELASTICSEARCH_TIMEOUT', '30')),
                max_retries=int(os.getenv('ELASTICSEARCH_MAX_RETRIES', '3')),
                retry_on_timeout=True,
            )
            
            # Test connection
            if self.client.ping():
                logger.info(f"Elasticsearch connected successfully for service: {self.service_name}")
            else:
                raise ConnectionError("Elasticsearch ping failed")
                
        except Exception as e:
            logger.error(f"Elasticsearch connection failed for service {self.service_name}: {e}")
            raise
    
    @classmethod
    def get_instance(cls, service_name: str = 'default'):
        """
        Get or create Elasticsearch instance (singleton per service)
        
        Args:
            service_name: Name of the service
        
        Returns:
            ElasticsearchManager instance
        """
        if service_name not in cls._instances:
            cls._instances[service_name] = cls(service_name)
        return cls._instances[service_name]
    
    def create_index(self, index_name: str, mappings: dict, settings: dict = None):
        """
        Create an Elasticsearch index
        
        Args:
            index_name: Name of the index
            mappings: Index mappings
            settings: Index settings (optional)
        """
        try:
            if self.client.indices.exists(index=index_name):
                logger.info(f"Index {index_name} already exists")
                return
            
            body = {'mappings': mappings}
            if settings:
                body['settings'] = settings
            
            self.client.indices.create(index=index_name, body=body)
            logger.info(f"Created index: {index_name}")
            
        except Exception as e:
            logger.error(f"Failed to create index {index_name}: {e}")
            raise
    
    def index_document(self, index_name: str, doc_id: str, document: dict):
        """
        Index a single document
        
        Args:
            index_name: Name of the index
            doc_id: Document ID
            document: Document data
        """
        try:
            self.client.index(index=index_name, id=doc_id, document=document)
        except Exception as e:
            logger.error(f"Failed to index document {doc_id} in {index_name}: {e}")
            raise
    
    def bulk_index(self, index_name: str, documents: list):
        """
        Bulk index multiple documents
        
        Args:
            index_name: Name of the index
            documents: List of documents with '_id' field
        """
        try:
            actions = [
                {
                    '_index': index_name,
                    '_id': doc.get('_id'),
                    '_source': {k: v for k, v in doc.items() if k != '_id'}
                }
                for doc in documents
            ]
            
            success, failed = bulk(self.client, actions)
            logger.info(f"Bulk indexed {success} documents in {index_name}, {failed} failed")
            
        except Exception as e:
            logger.error(f"Bulk indexing failed for {index_name}: {e}")
            raise
    
    def search(self, index_name: str, query: dict, size: int = 10, from_: int = 0):
        """
        Search documents
        
        Args:
            index_name: Name of the index
            query: Elasticsearch query DSL
            size: Number of results to return
            from_: Offset for pagination
        
        Returns:
            Search results
        """
        try:
            response = self.client.search(
                index=index_name,
                body={'query': query},
                size=size,
                from_=from_
            )
            return response
        except Exception as e:
            logger.error(f"Search failed for {index_name}: {e}")
            raise
    
    def delete_document(self, index_name: str, doc_id: str):
        """
        Delete a document
        
        Args:
            index_name: Name of the index
            doc_id: Document ID
        """
        try:
            self.client.delete(index=index_name, id=doc_id)
        except Exception as e:
            logger.error(f"Failed to delete document {doc_id} from {index_name}: {e}")
            raise
    
    def close(self):
        """Close Elasticsearch connection"""
        if self.client:
            self.client.close()
            logger.info(f"Elasticsearch connection closed for service: {self.service_name}")


# Index configurations for different services
ELASTICSEARCH_INDEXES = {
    'marketplace': {
        'products': {
            'mappings': {
                'properties': {
                    'name': {'type': 'text', 'analyzer': 'standard'},
                    'description': {'type': 'text', 'analyzer': 'standard'},
                    'category': {'type': 'keyword'},
                    'subcategory': {'type': 'keyword'},
                    'price': {'type': 'float'},
                    'currency': {'type': 'keyword'},
                    'location': {'type': 'geo_point'},
                    'seller_id': {'type': 'keyword'},
                    'is_active': {'type': 'boolean'},
                    'created_at': {'type': 'date'},
                    'rating_average': {'type': 'float'},
                    'tags': {'type': 'keyword'},
                }
            },
            'settings': {
                'number_of_shards': 3,
                'number_of_replicas': 1,
                'analysis': {
                    'analyzer': {
                        'product_analyzer': {
                            'type': 'custom',
                            'tokenizer': 'standard',
                            'filter': ['lowercase', 'asciifolding']
                        }
                    }
                }
            }
        }
    },
    'learning': {
        'courses': {
            'mappings': {
                'properties': {
                    'title': {'type': 'text', 'analyzer': 'standard'},
                    'description': {'type': 'text', 'analyzer': 'standard'},
                    'category': {'type': 'keyword'},
                    'difficulty': {'type': 'keyword'},
                    'language': {'type': 'keyword'},
                    'instructor': {'type': 'text'},
                    'tags': {'type': 'keyword'},
                    'created_at': {'type': 'date'},
                    'rating': {'type': 'float'},
                }
            },
            'settings': {
                'number_of_shards': 2,
                'number_of_replicas': 1,
            }
        }
    },
    'community': {
        'posts': {
            'mappings': {
                'properties': {
                    'content': {'type': 'text', 'analyzer': 'standard'},
                    'author_id': {'type': 'keyword'},
                    'topic': {'type': 'keyword'},
                    'region': {'type': 'keyword'},
                    'location': {'type': 'geo_point'},
                    'created_at': {'type': 'date'},
                    'likes_count': {'type': 'integer'},
                    'comments_count': {'type': 'integer'},
                }
            },
            'settings': {
                'number_of_shards': 2,
                'number_of_replicas': 1,
            }
        }
    },
    'logs': {
        'application_logs': {
            'mappings': {
                'properties': {
                    'timestamp': {'type': 'date'},
                    'level': {'type': 'keyword'},
                    'service': {'type': 'keyword'},
                    'message': {'type': 'text'},
                    'user_id': {'type': 'keyword'},
                    'request_id': {'type': 'keyword'},
                    'trace_id': {'type': 'keyword'},
                }
            },
            'settings': {
                'number_of_shards': 5,
                'number_of_replicas': 1,
                'index.lifecycle.name': 'logs_policy',  # ILM policy
            }
        }
    }
}


def setup_elasticsearch_indexes(service_name: str):
    """
    Set up Elasticsearch indexes for a service
    
    Args:
        service_name: Name of the service
    """
    if service_name not in ELASTICSEARCH_INDEXES:
        logger.warning(f"No Elasticsearch configuration found for service: {service_name}")
        return
    
    try:
        es = ElasticsearchManager.get_instance(service_name)
        indexes = ELASTICSEARCH_INDEXES[service_name]
        
        for index_name, config in indexes.items():
            full_index_name = f"{service_name}_{index_name}"
            es.create_index(
                full_index_name,
                config['mappings'],
                config.get('settings')
            )
        
        logger.info(f"Elasticsearch setup completed for service: {service_name}")
        
    except Exception as e:
        logger.error(f"Failed to setup Elasticsearch for service {service_name}: {e}")
        raise
