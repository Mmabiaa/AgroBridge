"""Serializers for blockchain service."""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Certificate, SupplyChainEvent, CertificationBody, CertificateVerification

User = get_user_model()


class CertificateSerializer(serializers.ModelSerializer):
    """Serializer for Certificate model."""
    
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    is_valid = serializers.SerializerMethodField()
    days_until_expiry = serializers.SerializerMethodField()
    
    class Meta:
        model = Certificate
        fields = [
            'id', 'certificate_number', 'certificate_type', 'owner', 'owner_name',
            'issuer', 'issuer_id', 'title', 'description', 'product_name',
            'product_category', 'issue_date', 'expiry_date', 'status',
            'blockchain_hash', 'transaction_hash', 'block_number',
            'blockchain_network', 'qr_code', 'qr_code_data', 'metadata',
            'verification_count', 'last_verified_at', 'is_valid',
            'days_until_expiry', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'certificate_number', 'blockchain_hash', 'transaction_hash',
            'block_number', 'qr_code', 'qr_code_data', 'verification_count',
            'last_verified_at', 'created_at', 'updated_at'
        ]
    
    def get_is_valid(self, obj):
        """Get certificate validity status."""
        return obj.is_valid()
    
    def get_days_until_expiry(self, obj):
        """Calculate days until certificate expires."""
        if not obj.expiry_date:
            return None
        from django.utils import timezone
        delta = obj.expiry_date - timezone.now()
        return delta.days if delta.days > 0 else 0


class CertificateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating certificates."""
    
    class Meta:
        model = Certificate
        fields = [
            'certificate_type', 'issuer', 'issuer_id', 'title',
            'description', 'product_name', 'product_category',
            'issue_date', 'expiry_date', 'metadata'
        ]
    
    def create(self, validated_data):
        """Create certificate with owner from request."""
        validated_data['owner'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class SupplyChainEventSerializer(serializers.ModelSerializer):
    """Serializer for SupplyChainEvent model."""
    
    actor_name_display = serializers.CharField(source='actor.get_full_name', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = SupplyChainEvent
        fields = [
            'id', 'product_id', 'product_name', 'batch_number', 'event_type',
            'event_description', 'event_timestamp', 'location_name',
            'latitude', 'longitude', 'actor', 'actor_name', 'actor_name_display',
            'actor_role', 'blockchain_hash', 'transaction_hash', 'block_number',
            'previous_event_hash', 'metadata', 'attachments', 'verified',
            'verified_by', 'verified_by_name', 'verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'blockchain_hash', 'transaction_hash', 'block_number',
            'verified', 'verified_by', 'verified_at', 'created_at', 'updated_at'
        ]


class SupplyChainEventCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating supply chain events."""
    
    class Meta:
        model = SupplyChainEvent
        fields = [
            'product_id', 'product_name', 'batch_number', 'event_type',
            'event_description', 'event_timestamp', 'location_name',
            'latitude', 'longitude', 'actor_name', 'actor_role',
            'metadata', 'attachments'
        ]
    
    def create(self, validated_data):
        """Create event with actor from request."""
        validated_data['actor'] = self.context['request'].user
        
        # Get previous event hash for chaining
        previous_event = SupplyChainEvent.objects.filter(
            batch_number=validated_data['batch_number']
        ).order_by('-event_timestamp').first()
        
        if previous_event:
            validated_data['previous_event_hash'] = previous_event.blockchain_hash
        
        return super().create(validated_data)


class CertificationBodySerializer(serializers.ModelSerializer):
    """Serializer for CertificationBody model."""
    
    certificate_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CertificationBody
        fields = [
            'id', 'name', 'code', 'email', 'phone', 'website', 'address',
            'country', 'accreditation_number', 'accreditation_body',
            'accreditation_expiry', 'is_active', 'is_verified',
            'supported_certificate_types', 'metadata', 'certificate_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_certificate_count(self, obj):
        """Get count of certificates issued by this body."""
        return Certificate.objects.filter(issuer=obj.name).count()


class CertificateVerificationSerializer(serializers.ModelSerializer):
    """Serializer for CertificateVerification model."""
    
    certificate_number = serializers.CharField(source='certificate.certificate_number', read_only=True)
    verifier_name = serializers.CharField(source='verifier_user.get_full_name', read_only=True)
    
    class Meta:
        model = CertificateVerification
        fields = [
            'id', 'certificate', 'certificate_number', 'verifier_ip',
            'verifier_user_agent', 'verifier_user', 'verifier_name',
            'is_valid', 'verification_message', 'verified_at'
        ]
        read_only_fields = ['id', 'verified_at']


class CertificateVerifySerializer(serializers.Serializer):
    """Serializer for certificate verification request."""
    
    certificate_number = serializers.CharField(required=False)
    blockchain_hash = serializers.CharField(required=False)
    qr_code_data = serializers.CharField(required=False)
    
    def validate(self, data):
        """Ensure at least one identifier is provided."""
        if not any([data.get('certificate_number'), data.get('blockchain_hash'), data.get('qr_code_data')]):
            raise serializers.ValidationError(
                "At least one of certificate_number, blockchain_hash, or qr_code_data must be provided"
            )
        return data


class SupplyChainTrackingSerializer(serializers.Serializer):
    """Serializer for supply chain tracking query."""
    
    product_id = serializers.CharField(required=False)
    batch_number = serializers.CharField(required=False)
    
    def validate(self, data):
        """Ensure at least one identifier is provided."""
        if not any([data.get('product_id'), data.get('batch_number')]):
            raise serializers.ValidationError(
                "At least one of product_id or batch_number must be provided"
            )
        return data
