"""
Base serializer classes for all microservices
"""
from rest_framework import serializers


class BaseSerializer(serializers.ModelSerializer):
    """Base serializer with common fields"""
    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        abstract = True
