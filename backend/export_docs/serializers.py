"""Serializers for export documentation service."""

from rest_framework import serializers
from .models import (
    DocumentTemplate, ComplianceRule, ExportDocument,
    DocumentVersion, CustomsSubmission
)


class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for document templates."""
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'document_type', 'country_code',
            'template_file', 'version', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ComplianceRuleSerializer(serializers.ModelSerializer):
    """Serializer for compliance rules."""
    
    class Meta:
        model = ComplianceRule
        fields = [
            'id', 'country_code', 'product_category', 'rule_type',
            'rule_name', 'rule_description', 'validation_logic',
            'is_active', 'effective_date', 'expiry_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ExportDocumentSerializer(serializers.ModelSerializer):
    """Serializer for export documents."""
    
    template_name = serializers.CharField(source='template.name', read_only=True)
    document_type = serializers.CharField(source='template.document_type', read_only=True)
    
    class Meta:
        model = ExportDocument
        fields = [
            'id', 'document_number', 'user', 'template', 'template_name',
            'document_type', 'shipment_reference', 'destination_country',
            'origin_country', 'product_description', 'product_category',
            'hs_code', 'quantity', 'unit', 'value', 'currency',
            'document_data', 'generated_file', 'digital_signature',
            'status', 'compliance_checked', 'compliance_issues',
            'submitted_at', 'submission_reference', 'customs_response',
            'version', 'created_at', 'updated_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'document_number', 'generated_file', 'digital_signature',
            'compliance_checked', 'compliance_issues', 'submitted_at',
            'submission_reference', 'customs_response', 'version',
            'created_at', 'updated_at'
        ]


class ExportDocumentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating export documents."""
    
    class Meta:
        model = ExportDocument
        fields = [
            'template', 'shipment_reference', 'destination_country',
            'origin_country', 'product_description', 'product_category',
            'hs_code', 'quantity', 'unit', 'value', 'currency',
            'document_data'
        ]
    
    def validate(self, data):
        """Validate document data."""
        # Ensure required fields are present
        if not data.get('product_description'):
            raise serializers.ValidationError("Product description is required")
        
        if data.get('quantity', 0) <= 0:
            raise serializers.ValidationError("Quantity must be greater than 0")
        
        if data.get('value', 0) <= 0:
            raise serializers.ValidationError("Value must be greater than 0")
        
        return data


class DocumentVersionSerializer(serializers.ModelSerializer):
    """Serializer for document versions."""
    
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    
    class Meta:
        model = DocumentVersion
        fields = [
            'id', 'document', 'version_number', 'document_data',
            'generated_file', 'changed_by', 'changed_by_name',
            'change_reason', 'created_at'
        ]
        read_only_fields = ['id', 'version_number', 'created_at']


class CustomsSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for customs submissions."""
    
    document_number = serializers.CharField(source='document.document_number', read_only=True)
    
    class Meta:
        model = CustomsSubmission
        fields = [
            'id', 'document', 'document_number', 'customs_system',
            'submission_reference', 'submitted_at', 'status',
            'response_received_at', 'response_data', 'error_message',
            'retry_count', 'next_retry_at'
        ]
        read_only_fields = [
            'id', 'submission_reference', 'submitted_at',
            'response_received_at', 'response_data', 'error_message',
            'retry_count', 'next_retry_at'
        ]


class ComplianceCheckSerializer(serializers.Serializer):
    """Serializer for compliance check results."""
    
    is_compliant = serializers.BooleanField()
    issues = serializers.ListField(child=serializers.DictField())
    warnings = serializers.ListField(child=serializers.DictField())
    checked_at = serializers.DateTimeField()


class DocumentGenerationSerializer(serializers.Serializer):
    """Serializer for document generation request."""
    
    format = serializers.ChoiceField(choices=['PDF', 'DOCX', 'HTML'], default='PDF')
    include_signature = serializers.BooleanField(default=True)
