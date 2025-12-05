"""
Base view classes for all microservices
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from datetime import datetime


class BaseViewSet(viewsets.ModelViewSet):
    """Base viewset with standard response format"""
    
    def create_response(self, data=None, success=True, status_code=status.HTTP_200_OK, 
                       pagination=None, errors=None):
        """Create standardized API response"""
        response_data = {
            'success': success,
            'meta': {
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'version': 'v1'
            }
        }
        
        if data is not None:
            response_data['data'] = data
        
        if pagination:
            response_data['pagination'] = pagination
        
        if errors:
            response_data['errors'] = errors
        
        return Response(response_data, status=status_code)
    
    def create(self, request, *args, **kwargs):
        """Override create to use standard response"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return self.create_response(
            data=serializer.data,
            status_code=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        """Override list to use standard response"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return self.create_response(data=serializer.data)
