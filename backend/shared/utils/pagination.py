"""
Pagination utilities
"""
from rest_framework.pagination import CursorPagination, PageNumberPagination


class StandardCursorPagination(CursorPagination):
    """Standard cursor-based pagination"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    ordering = '-created_at'


class StandardPageNumberPagination(PageNumberPagination):
    """Standard page number pagination"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
