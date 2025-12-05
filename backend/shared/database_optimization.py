"""
Database Optimization Utilities for AgroBridge

This module provides:
- Query optimization helpers
- Index management
- Connection pooling
- Query profiling
- N+1 query prevention
"""

import logging
import time
from functools import wraps
from typing import Any, Callable, List, Optional
from contextlib import contextmanager

try:
    from django.db import connection, reset_queries
    from django.db.models import Prefetch, QuerySet
    from django.conf import settings
except ImportError:
    connection = None
    reset_queries = None
    Prefetch = None
    QuerySet = None
    settings = None

logger = logging.getLogger(__name__)


class QueryOptimizer:
    """Optimize Django ORM queries"""
    
    @staticmethod
    def optimize_queryset(
        queryset: QuerySet,
        select_related: Optional[List[str]] = None,
        prefetch_related: Optional[List[str]] = None
    ) -> QuerySet:
        """
        Optimize queryset with select_related and prefetch_related
        
        Args:
            queryset: Django QuerySet
            select_related: List of fields for select_related
            prefetch_related: List of fields for prefetch_related
            
        Returns:
            Optimized QuerySet
        """
        if select_related:
            queryset = queryset.select_related(*select_related)
        
        if prefetch_related:
            queryset = queryset.prefetch_related(*prefetch_related)
        
        return queryset
    
    @staticmethod
    def get_optimized_user_queryset():
        """Get optimized user queryset"""
        from authentication.models import User
        
        return User.objects.select_related(
            'profile'
        ).prefetch_related(
            'farms',
            'orders'
        )
    
    @staticmethod
    def get_optimized_farm_queryset():
        """Get optimized farm queryset"""
        from farms.models import Farm
        
        return Farm.objects.select_related(
            'owner'
        ).prefetch_related(
            'fields',
            'fields__crops'
        )
    
    @staticmethod
    def get_optimized_product_queryset():
        """Get optimized product queryset"""
        from marketplace.models import Product
        
        return Product.objects.select_related(
            'seller',
            'category'
        ).prefetch_related(
            'images',
            'reviews'
        )
    
    @staticmethod
    def get_optimized_order_queryset():
        """Get optimized order queryset"""
        from marketplace.models import Order
        
        return Order.objects.select_related(
            'buyer',
            'seller',
            'product'
        ).prefetch_related(
            'items',
            'items__product'
        )
    
    @staticmethod
    def get_optimized_course_queryset():
        """Get optimized course queryset"""
        from learning.models import Course
        
        return Course.objects.select_related(
            'instructor'
        ).prefetch_related(
            'lessons',
            'enrollments'
        )
    
    @staticmethod
    def get_optimized_post_queryset():
        """Get optimized post queryset"""
        from community.models import Post
        
        return Post.objects.select_related(
            'author'
        ).prefetch_related(
            'comments',
            'comments__author',
            'likes'
        )


class QueryProfiler:
    """Profile database queries"""
    
    @staticmethod
    @contextmanager
    def profile_queries(description: str = "Query"):
        """
        Context manager to profile queries
        
        Args:
            description: Description of the operation
            
        Example:
            with QueryProfiler.profile_queries("Get users"):
                users = User.objects.all()
        """
        if not settings or not settings.DEBUG:
            yield
            return
        
        reset_queries()
        start_time = time.time()
        start_queries = len(connection.queries)
        
        yield
        
        end_time = time.time()
        end_queries = len(connection.queries)
        
        num_queries = end_queries - start_queries
        duration = end_time - start_time
        
        logger.info(
            f"{description}: {num_queries} queries in {duration:.3f}s"
        )
        
        if num_queries > 10:
            logger.warning(
                f"High query count detected: {num_queries} queries"
            )
    
    @staticmethod
    def log_queries():
        """Log all executed queries"""
        if not settings or not settings.DEBUG:
            return
        
        for query in connection.queries:
            logger.debug(f"Query: {query['sql']}")
            logger.debug(f"Time: {query['time']}s")


def profile_queries(description: str = ""):
    """
    Decorator to profile queries in a function
    
    Args:
        description: Description of the operation
        
    Example:
        @profile_queries("Get all users")
        def get_users():
            return User.objects.all()
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            desc = description or func.__name__
            
            with QueryProfiler.profile_queries(desc):
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


class IndexManager:
    """Manage database indexes"""
    
    # Recommended indexes for common queries
    RECOMMENDED_INDEXES = {
        'authentication_user': [
            ('email',),
            ('username',),
            ('is_active', 'created_at'),
        ],
        'farms_farm': [
            ('owner_id',),
            ('created_at',),
            ('is_active',),
        ],
        'marketplace_product': [
            ('seller_id',),
            ('category_id',),
            ('is_active', 'created_at'),
            ('price',),
        ],
        'marketplace_order': [
            ('buyer_id',),
            ('seller_id',),
            ('status', 'created_at'),
            ('order_number',),
        ],
        'learning_course': [
            ('instructor_id',),
            ('is_published', 'created_at'),
            ('category',),
        ],
        'community_post': [
            ('author_id',),
            ('created_at',),
            ('is_published',),
        ],
        'notifications_notification': [
            ('user_id', 'is_read'),
            ('created_at',),
            ('notification_type',),
        ],
    }
    
    @staticmethod
    def get_missing_indexes() -> dict:
        """
        Check for missing recommended indexes
        
        Returns:
            dict: Dictionary of tables and missing indexes
        """
        missing = {}
        
        # This is a simplified check
        # In production, you'd query the database for actual indexes
        for table, indexes in IndexManager.RECOMMENDED_INDEXES.items():
            missing[table] = indexes
        
        return missing
    
    @staticmethod
    def generate_index_sql(table: str, columns: tuple) -> str:
        """
        Generate SQL for creating an index
        
        Args:
            table: Table name
            columns: Column names
            
        Returns:
            str: SQL statement
        """
        index_name = f"idx_{table}_{'_'.join(columns)}"
        column_list = ', '.join(columns)
        
        return f"CREATE INDEX {index_name} ON {table} ({column_list});"


class ConnectionPoolManager:
    """Manage database connection pooling"""
    
    @staticmethod
    def get_pool_config() -> dict:
        """
        Get recommended connection pool configuration
        
        Returns:
            dict: Pool configuration
        """
        return {
            'CONN_MAX_AGE': 600,  # 10 minutes
            'OPTIONS': {
                'connect_timeout': 10,
                'options': '-c statement_timeout=30000',  # 30 seconds
            },
        }
    
    @staticmethod
    def get_pool_stats() -> dict:
        """
        Get connection pool statistics
        
        Returns:
            dict: Pool statistics
        """
        if not connection:
            return {}
        
        return {
            'queries_executed': len(connection.queries) if settings.DEBUG else 'N/A',
            'connection_created': hasattr(connection, 'connection') and connection.connection is not None,
        }


class BulkOperationHelper:
    """Helper for bulk database operations"""
    
    @staticmethod
    def bulk_create_with_batch(
        model_class,
        objects: List[Any],
        batch_size: int = 1000
    ) -> int:
        """
        Bulk create objects in batches
        
        Args:
            model_class: Django model class
            objects: List of model instances
            batch_size: Batch size
            
        Returns:
            int: Number of objects created
        """
        total = 0
        
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            model_class.objects.bulk_create(batch, ignore_conflicts=True)
            total += len(batch)
            logger.info(f"Created batch {i // batch_size + 1}: {len(batch)} objects")
        
        return total
    
    @staticmethod
    def bulk_update_with_batch(
        objects: List[Any],
        fields: List[str],
        batch_size: int = 1000
    ) -> int:
        """
        Bulk update objects in batches
        
        Args:
            objects: List of model instances
            fields: Fields to update
            batch_size: Batch size
            
        Returns:
            int: Number of objects updated
        """
        if not objects:
            return 0
        
        model_class = objects[0].__class__
        total = 0
        
        for i in range(0, len(objects), batch_size):
            batch = objects[i:i + batch_size]
            model_class.objects.bulk_update(batch, fields)
            total += len(batch)
            logger.info(f"Updated batch {i // batch_size + 1}: {len(batch)} objects")
        
        return total


class QuerySetPaginator:
    """Efficient pagination for large querysets"""
    
    @staticmethod
    def cursor_paginate(
        queryset: QuerySet,
        cursor: Optional[Any] = None,
        page_size: int = 20,
        order_by: str = '-created_at'
    ) -> tuple:
        """
        Cursor-based pagination for efficient large dataset pagination
        
        Args:
            queryset: Django QuerySet
            cursor: Current cursor position
            page_size: Number of items per page
            order_by: Order by field
            
        Returns:
            tuple: (results, next_cursor, has_more)
        """
        # Apply ordering
        queryset = queryset.order_by(order_by)
        
        # Apply cursor filter
        if cursor:
            if order_by.startswith('-'):
                field = order_by[1:]
                queryset = queryset.filter(**{f"{field}__lt": cursor})
            else:
                queryset = queryset.filter(**{f"{order_by}__gt": cursor})
        
        # Fetch one extra to check if there are more
        results = list(queryset[:page_size + 1])
        
        has_more = len(results) > page_size
        if has_more:
            results = results[:page_size]
        
        # Get next cursor
        next_cursor = None
        if results and has_more:
            field = order_by[1:] if order_by.startswith('-') else order_by
            next_cursor = getattr(results[-1], field)
        
        return results, next_cursor, has_more


# Convenience functions
def optimize_user_query():
    """Get optimized user queryset"""
    return QueryOptimizer.get_optimized_user_queryset()


def optimize_farm_query():
    """Get optimized farm queryset"""
    return QueryOptimizer.get_optimized_farm_queryset()


def optimize_product_query():
    """Get optimized product queryset"""
    return QueryOptimizer.get_optimized_product_queryset()


def optimize_order_query():
    """Get optimized order queryset"""
    return QueryOptimizer.get_optimized_order_queryset()


def optimize_course_query():
    """Get optimized course queryset"""
    return QueryOptimizer.get_optimized_course_queryset()


def optimize_post_query():
    """Get optimized post queryset"""
    return QueryOptimizer.get_optimized_post_queryset()
