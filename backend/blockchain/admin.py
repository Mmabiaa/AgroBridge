"""Admin configuration for blockchain service."""

from django.contrib import admin
from .models import Certificate, SupplyChainEvent, CertificationBody, CertificateVerification


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    """Admin interface for Certificate model."""
    
    list_display = [
        'certificate_number', 'certificate_type', 'owner', 'issuer',
        'status', 'issue_date', 'expiry_date', 'verification_count'
    ]
    list_filter = ['certificate_type', 'status', 'issue_date', 'expiry_date']
    search_fields = ['certificate_number', 'title', 'owner__email', 'issuer', 'blockchain_hash']
    readonly_fields = [
        'id', 'certificate_number', 'blockchain_hash', 'transaction_hash',
        'block_number', 'qr_code_data', 'verification_count', 'last_verified_at',
        'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'certificate_number', 'certificate_type', 'owner', 'issuer', 'issuer_id')
        }),
        ('Certificate Details', {
            'fields': ('title', 'description', 'product_name', 'product_category')
        }),
        ('Validity', {
            'fields': ('issue_date', 'expiry_date', 'status')
        }),
        ('Blockchain Data', {
            'fields': ('blockchain_hash', 'transaction_hash', 'block_number', 'blockchain_network')
        }),
        ('QR Code', {
            'fields': ('qr_code', 'qr_code_data'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('metadata', 'verification_count', 'last_verified_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SupplyChainEvent)
class SupplyChainEventAdmin(admin.ModelAdmin):
    """Admin interface for SupplyChainEvent model."""
    
    list_display = [
        'product_name', 'batch_number', 'event_type', 'event_timestamp',
        'actor_name', 'location_name', 'verified'
    ]
    list_filter = ['event_type', 'verified', 'event_timestamp']
    search_fields = ['product_id', 'product_name', 'batch_number', 'actor_name', 'blockchain_hash']
    readonly_fields = [
        'id', 'blockchain_hash', 'transaction_hash', 'block_number',
        'previous_event_hash', 'created_at', 'updated_at'
    ]
    fieldsets = (
        ('Product Information', {
            'fields': ('id', 'product_id', 'product_name', 'batch_number')
        }),
        ('Event Details', {
            'fields': ('event_type', 'event_description', 'event_timestamp')
        }),
        ('Location', {
            'fields': ('location_name', 'latitude', 'longitude')
        }),
        ('Actors', {
            'fields': ('actor', 'actor_name', 'actor_role')
        }),
        ('Blockchain Data', {
            'fields': ('blockchain_hash', 'transaction_hash', 'block_number', 'previous_event_hash')
        }),
        ('Additional Data', {
            'fields': ('metadata', 'attachments'),
            'classes': ('collapse',)
        }),
        ('Verification', {
            'fields': ('verified', 'verified_by', 'verified_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CertificationBody)
class CertificationBodyAdmin(admin.ModelAdmin):
    """Admin interface for CertificationBody model."""
    
    list_display = ['name', 'code', 'country', 'is_active', 'is_verified', 'accreditation_expiry']
    list_filter = ['is_active', 'is_verified', 'country']
    search_fields = ['name', 'code', 'email', 'accreditation_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'code')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'website', 'address', 'country')
        }),
        ('Accreditation', {
            'fields': ('accreditation_number', 'accreditation_body', 'accreditation_expiry')
        }),
        ('API Integration', {
            'fields': ('api_endpoint', 'api_key_encrypted'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'is_verified')
        }),
        ('Metadata', {
            'fields': ('supported_certificate_types', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CertificateVerification)
class CertificateVerificationAdmin(admin.ModelAdmin):
    """Admin interface for CertificateVerification model."""
    
    list_display = ['certificate', 'is_valid', 'verifier_ip', 'verifier_user', 'verified_at']
    list_filter = ['is_valid', 'verified_at']
    search_fields = ['certificate__certificate_number', 'verifier_ip', 'verifier_user__email']
    readonly_fields = ['id', 'verified_at']
    fieldsets = (
        ('Certificate', {
            'fields': ('id', 'certificate')
        }),
        ('Verifier Information', {
            'fields': ('verifier_ip', 'verifier_user_agent', 'verifier_user')
        }),
        ('Verification Result', {
            'fields': ('is_valid', 'verification_message')
        }),
        ('Timestamp', {
            'fields': ('verified_at',)
        }),
    )
