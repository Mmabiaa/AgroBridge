"""Database models for export documentation service."""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator

User = get_user_model()


class DocumentTemplate(models.Model):
    """Template for export documents."""
    
    DOCUMENT_TYPES = [
        ('INVOICE', 'Commercial Invoice'),
        ('CERTIFICATE_ORIGIN', 'Certificate of Origin'),
        ('PHYTOSANITARY', 'Phytosanitary Certificate'),
        ('PACKING_LIST', 'Packing List'),
        ('BILL_LADING', 'Bill of Lading'),
        ('EXPORT_LICENSE', 'Export License'),
        ('CUSTOMS_DECLARATION', 'Customs Declaration'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    country_code = models.CharField(max_length=3, help_text="ISO 3166-1 alpha-3 country code")
    template_file = models.FileField(
        upload_to='export_docs/templates/',
        validators=[FileExtensionValidator(['html', 'pdf', 'docx'])]
    )
    version = models.CharField(max_length=20, default='1.0')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'export_document_templates'
        ordering = ['-created_at']
        unique_together = ['document_type', 'country_code', 'version']
        indexes = [
            models.Index(fields=['document_type', 'country_code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.country_code} v{self.version}"


class ComplianceRule(models.Model):
    """Compliance rules for export documentation."""
    
    RULE_TYPES = [
        ('REQUIRED_FIELD', 'Required Field'),
        ('VALUE_RANGE', 'Value Range'),
        ('FORMAT_VALIDATION', 'Format Validation'),
        ('DOCUMENT_REQUIRED', 'Document Required'),
        ('CERTIFICATION_REQUIRED', 'Certification Required'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    country_code = models.CharField(max_length=3)
    product_category = models.CharField(max_length=100, blank=True)
    rule_type = models.CharField(max_length=50, choices=RULE_TYPES)
    rule_name = models.CharField(max_length=200)
    rule_description = models.TextField()
    validation_logic = models.JSONField(help_text="JSON schema for validation")
    is_active = models.BooleanField(default=True)
    effective_date = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'export_compliance_rules'
        ordering = ['-effective_date']
        indexes = [
            models.Index(fields=['country_code', 'product_category']),
            models.Index(fields=['is_active', 'effective_date']),
        ]
    
    def __str__(self):
        return f"{self.rule_name} - {self.country_code}"


class ExportDocument(models.Model):
    """Generated export documents."""
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING_REVIEW', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('SUBMITTED', 'Submitted to Customs'),
        ('ACCEPTED', 'Accepted by Customs'),
        ('EXPIRED', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_number = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_documents')
    template = models.ForeignKey(DocumentTemplate, on_delete=models.PROTECT)
    
    # Shipment details
    shipment_reference = models.CharField(max_length=100, blank=True)
    destination_country = models.CharField(max_length=3)
    origin_country = models.CharField(max_length=3, default='GHA')
    
    # Product details
    product_description = models.TextField()
    product_category = models.CharField(max_length=100)
    hs_code = models.CharField(max_length=20, help_text="Harmonized System code")
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20)
    value = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Document data
    document_data = models.JSONField(help_text="Complete document data")
    generated_file = models.FileField(upload_to='export_docs/generated/', blank=True)
    digital_signature = models.TextField(blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    compliance_checked = models.BooleanField(default=False)
    compliance_issues = models.JSONField(default=list, blank=True)
    
    # Submission tracking
    submitted_at = models.DateTimeField(null=True, blank=True)
    submission_reference = models.CharField(max_length=100, blank=True)
    customs_response = models.JSONField(default=dict, blank=True)
    
    # Metadata
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'export_documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['destination_country', 'product_category']),
            models.Index(fields=['document_number']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.document_number} - {self.template.document_type}"


class DocumentVersion(models.Model):
    """Version history for export documents."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(ExportDocument, on_delete=models.CASCADE, related_name='versions')
    version_number = models.IntegerField()
    document_data = models.JSONField()
    generated_file = models.FileField(upload_to='export_docs/versions/')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    change_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'export_document_versions'
        ordering = ['-version_number']
        unique_together = ['document', 'version_number']
        indexes = [
            models.Index(fields=['document', 'version_number']),
        ]
    
    def __str__(self):
        return f"{self.document.document_number} v{self.version_number}"


class CustomsSubmission(models.Model):
    """Track submissions to customs systems."""
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('RETRY', 'Retry'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(ExportDocument, on_delete=models.CASCADE, related_name='submissions')
    customs_system = models.CharField(max_length=100)
    submission_reference = models.CharField(max_length=100, unique=True)
    
    # Submission details
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Response tracking
    response_received_at = models.DateTimeField(null=True, blank=True)
    response_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    
    # Retry logic
    retry_count = models.IntegerField(default=0)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'customs_submissions'
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['document', 'status']),
            models.Index(fields=['submission_reference']),
            models.Index(fields=['status', 'next_retry_at']),
        ]
    
    def __str__(self):
        return f"{self.submission_reference} - {self.status}"
