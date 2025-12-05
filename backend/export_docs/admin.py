"""Django admin configuration for export documentation service."""

from django.contrib import admin
from .models import (
    DocumentTemplate, ComplianceRule, ExportDocument,
    DocumentVersion, CustomsSubmission
)


@admin.register(DocumentTemplate)
class DocumentTemplateAdmin(admin.ModelAdmin):
    """Admin interface for document templates."""
    
    list_display = [
        'name', 'document_type', 'country_code',
        'version', 'is_active', 'created_at'
    ]
    list_filter = ['document_type', 'country_code', 'is_active', 'created_at']
    search_fields = ['name', 'document_type', 'country_code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'document_type', 'country_code')
        }),
        ('Template', {
            'fields': ('template_file', 'version', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ComplianceRule)
class ComplianceRuleAdmin(admin.ModelAdmin):
    """Admin interface for compliance rules."""
    
    list_display = [
        'rule_name', 'country_code', 'product_category',
        'rule_type', 'is_active', 'effective_date'
    ]
    list_filter = [
        'country_code', 'rule_type', 'is_active',
        'effective_date', 'expiry_date'
    ]
    search_fields = ['rule_name', 'country_code', 'product_category']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'rule_name', 'rule_description')
        }),
        ('Scope', {
            'fields': ('country_code', 'product_category', 'rule_type')
        }),
        ('Validation', {
            'fields': ('validation_logic',)
        }),
        ('Status', {
            'fields': ('is_active', 'effective_date', 'expiry_date')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class DocumentVersionInline(admin.TabularInline):
    """Inline admin for document versions."""
    
    model = DocumentVersion
    extra = 0
    readonly_fields = ['version_number', 'changed_by', 'created_at']
    fields = ['version_number', 'changed_by', 'change_reason', 'created_at']
    can_delete = False


class CustomsSubmissionInline(admin.TabularInline):
    """Inline admin for customs submissions."""
    
    model = CustomsSubmission
    extra = 0
    readonly_fields = ['submission_reference', 'submitted_at', 'status']
    fields = ['submission_reference', 'customs_system', 'status', 'submitted_at']
    can_delete = False


@admin.register(ExportDocument)
class ExportDocumentAdmin(admin.ModelAdmin):
    """Admin interface for export documents."""
    
    list_display = [
        'document_number', 'user', 'template', 'destination_country',
        'status', 'compliance_checked', 'created_at'
    ]
    list_filter = [
        'status', 'destination_country', 'origin_country',
        'compliance_checked', 'created_at', 'template__document_type'
    ]
    search_fields = [
        'document_number', 'user__email', 'shipment_reference',
        'product_description', 'hs_code'
    ]
    readonly_fields = [
        'id', 'document_number', 'generated_file', 'digital_signature',
        'compliance_checked', 'compliance_issues', 'version',
        'created_at', 'updated_at'
    ]
    inlines = [DocumentVersionInline, CustomsSubmissionInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'document_number', 'user', 'template')
        }),
        ('Shipment Details', {
            'fields': (
                'shipment_reference', 'destination_country', 'origin_country'
            )
        }),
        ('Product Details', {
            'fields': (
                'product_description', 'product_category', 'hs_code',
                'quantity', 'unit', 'value', 'currency'
            )
        }),
        ('Document Data', {
            'fields': ('document_data', 'generated_file', 'digital_signature')
        }),
        ('Compliance', {
            'fields': ('compliance_checked', 'compliance_issues')
        }),
        ('Status', {
            'fields': (
                'status', 'submitted_at', 'submission_reference',
                'customs_response', 'expires_at'
            )
        }),
        ('Metadata', {
            'fields': ('version', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['check_compliance', 'approve_documents', 'reject_documents']
    
    def check_compliance(self, request, queryset):
        """Check compliance for selected documents."""
        from .services import ComplianceService
        
        checked = 0
        for document in queryset:
            ComplianceService.check_compliance(document)
            checked += 1
        
        self.message_user(
            request,
            f"Compliance checked for {checked} document(s)."
        )
    check_compliance.short_description = "Check compliance"
    
    def approve_documents(self, request, queryset):
        """Approve selected documents."""
        updated = queryset.filter(status='PENDING_REVIEW').update(status='APPROVED')
        self.message_user(
            request,
            f"{updated} document(s) approved."
        )
    approve_documents.short_description = "Approve selected documents"
    
    def reject_documents(self, request, queryset):
        """Reject selected documents."""
        updated = queryset.filter(status='PENDING_REVIEW').update(status='REJECTED')
        self.message_user(
            request,
            f"{updated} document(s) rejected."
        )
    reject_documents.short_description = "Reject selected documents"


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):
    """Admin interface for document versions."""
    
    list_display = [
        'document', 'version_number', 'changed_by', 'created_at'
    ]
    list_filter = ['created_at']
    search_fields = ['document__document_number', 'change_reason']
    readonly_fields = ['id', 'version_number', 'created_at']
    
    fieldsets = (
        ('Version Information', {
            'fields': ('id', 'document', 'version_number')
        }),
        ('Changes', {
            'fields': ('changed_by', 'change_reason', 'document_data')
        }),
        ('File', {
            'fields': ('generated_file',)
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )


@admin.register(CustomsSubmission)
class CustomsSubmissionAdmin(admin.ModelAdmin):
    """Admin interface for customs submissions."""
    
    list_display = [
        'submission_reference', 'document', 'customs_system',
        'status', 'submitted_at', 'retry_count'
    ]
    list_filter = ['status', 'customs_system', 'submitted_at']
    search_fields = ['submission_reference', 'document__document_number']
    readonly_fields = [
        'id', 'submission_reference', 'submitted_at',
        'response_received_at', 'response_data', 'error_message'
    ]
    
    fieldsets = (
        ('Submission Information', {
            'fields': (
                'id', 'document', 'customs_system', 'submission_reference'
            )
        }),
        ('Status', {
            'fields': ('status', 'submitted_at', 'response_received_at')
        }),
        ('Response', {
            'fields': ('response_data', 'error_message')
        }),
        ('Retry', {
            'fields': ('retry_count', 'next_retry_at')
        }),
    )
    
    actions = ['retry_failed_submissions']
    
    def retry_failed_submissions(self, request, queryset):
        """Retry failed submissions."""
        from .services import CustomsIntegrationService
        
        retried = 0
        for submission in queryset.filter(status__in=['FAILED', 'RETRY']):
            CustomsIntegrationService.submit_to_customs(
                submission.document,
                submission.customs_system
            )
            retried += 1
        
        self.message_user(
            request,
            f"{retried} submission(s) retried."
        )
    retry_failed_submissions.short_description = "Retry failed submissions"
