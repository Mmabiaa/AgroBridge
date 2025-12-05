"""
Data Management Service Serializers
"""
from rest_framework import serializers
from .models import (
    DataRetentionPolicy, DataDeletionLog, GDPRRequest,
    UserConsent, DataExport, DataProcessingRecord
)


class DataRetentionPolicySerializer(serializers.ModelSerializer):
    """Serializer for data retention policies."""
    
    class Meta:
        model = DataRetentionPolicy
        fields = [
            'id', 'data_type', 'retention_days', 'description',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DataDeletionLogSerializer(serializers.ModelSerializer):
    """Serializer for data deletion logs."""
    
    policy_name = serializers.CharField(source='policy.data_type', read_only=True)
    
    class Meta:
        model = DataDeletionLog
        fields = [
            'id', 'data_type', 'records_deleted', 'deletion_date',
            'policy', 'policy_name', 'details'
        ]
        read_only_fields = ['id', 'deletion_date']


class GDPRRequestSerializer(serializers.ModelSerializer):
    """Serializer for GDPR requests."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = GDPRRequest
        fields = [
            'id', 'user', 'user_email', 'request_type', 'status',
            'reason', 'requested_at', 'processed_at', 'completed_at',
            'result_data', 'notes', 'is_overdue'
        ]
        read_only_fields = [
            'id', 'user', 'requested_at', 'processed_at',
            'completed_at', 'is_overdue'
        ]


class GDPRRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating GDPR requests."""
    
    class Meta:
        model = GDPRRequest
        fields = ['request_type', 'reason']


class UserConsentSerializer(serializers.ModelSerializer):
    """Serializer for user consents."""
    
    class Meta:
        model = UserConsent
        fields = [
            'id', 'user', 'consent_type', 'granted', 'granted_at',
            'withdrawn_at', 'version', 'ip_address', 'user_agent'
        ]
        read_only_fields = ['id', 'user', 'granted_at', 'withdrawn_at']


class UserConsentUpdateSerializer(serializers.Serializer):
    """Serializer for updating user consent."""
    
    consent_type = serializers.ChoiceField(choices=UserConsent.CONSENT_TYPES)
    granted = serializers.BooleanField()
    version = serializers.CharField(max_length=20)


class DataExportSerializer(serializers.ModelSerializer):
    """Serializer for data exports."""
    
    user_email = serializers.EmailField(source='user.email', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    file_size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = DataExport
        fields = [
            'id', 'user', 'user_email', 'gdpr_request', 'status',
            'file_path', 'file_size', 'file_size_mb', 'format',
            'requested_at', 'completed_at', 'expires_at',
            'download_count', 'is_expired'
        ]
        read_only_fields = [
            'id', 'user', 'status', 'file_path', 'file_size',
            'requested_at', 'completed_at', 'download_count'
        ]
    
    def get_file_size_mb(self, obj):
        """Convert file size to MB."""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0


class DataProcessingRecordSerializer(serializers.ModelSerializer):
    """Serializer for data processing records."""
    
    class Meta:
        model = DataProcessingRecord
        fields = [
            'id', 'service_name', 'data_category', 'processing_purpose',
            'legal_basis', 'data_subjects', 'retention_period',
            'recipients', 'transfers', 'security_measures',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
