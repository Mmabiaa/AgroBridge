"""Database models for blockchain service."""

import uuid
import hashlib
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Certificate(models.Model):
    """Model for blockchain-based certificates."""
    
    CERTIFICATE_TYPES = [
        ('organic', 'Organic Certification'),
        ('quality', 'Quality Certification'),
        ('origin', 'Certificate of Origin'),
        ('phytosanitary', 'Phytosanitary Certificate'),
        ('fair_trade', 'Fair Trade Certification'),
        ('gmp', 'Good Manufacturing Practice'),
        ('haccp', 'HACCP Certification'),
        ('custom', 'Custom Certification'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('issued', 'Issued'),
        ('verified', 'Verified'),
        ('revoked', 'Revoked'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate_number = models.CharField(max_length=100, unique=True, db_index=True)
    certificate_type = models.CharField(max_length=50, choices=CERTIFICATE_TYPES)
    
    # Ownership
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='certificates')
    issuer = models.CharField(max_length=255)  # Certification body name
    issuer_id = models.CharField(max_length=100, blank=True)  # External issuer ID
    
    # Certificate details
    title = models.CharField(max_length=255)
    description = models.TextField()
    product_name = models.CharField(max_length=255, blank=True)
    product_category = models.CharField(max_length=100, blank=True)
    
    # Validity
    issue_date = models.DateTimeField(default=timezone.now)
    expiry_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Blockchain data
    blockchain_hash = models.CharField(max_length=66, unique=True, db_index=True)  # 0x + 64 hex chars
    transaction_hash = models.CharField(max_length=66, blank=True)
    block_number = models.BigIntegerField(null=True, blank=True)
    blockchain_network = models.CharField(max_length=50, default='ethereum')
    
    # QR code
    qr_code = models.ImageField(upload_to='certificates/qr/', blank=True)
    qr_code_data = models.TextField(blank=True)  # JSON data encoded in QR
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    verification_count = models.IntegerField(default=0)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['certificate_type', 'status']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.certificate_number} - {self.title}"
    
    def is_valid(self):
        """Check if certificate is currently valid."""
        if self.status == 'revoked':
            return False
        if self.expiry_date and self.expiry_date < timezone.now():
            return False
        return self.status == 'issued' or self.status == 'verified'
    
    def generate_hash(self):
        """Generate blockchain hash for certificate data."""
        data = f"{self.certificate_number}{self.owner.id}{self.issuer}{self.issue_date.isoformat()}"
        return '0x' + hashlib.sha256(data.encode()).hexdigest()
    
    def save(self, *args, **kwargs):
        """Override save to generate hash if not exists."""
        if not self.blockchain_hash:
            self.blockchain_hash = self.generate_hash()
        if not self.certificate_number:
            self.certificate_number = self._generate_certificate_number()
        super().save(*args, **kwargs)
    
    def _generate_certificate_number(self):
        """Generate unique certificate number."""
        prefix = self.certificate_type[:3].upper()
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        random_suffix = str(uuid.uuid4())[:8].upper()
        return f"{prefix}-{timestamp}-{random_suffix}"


class SupplyChainEvent(models.Model):
    """Model for supply chain tracking events."""
    
    EVENT_TYPES = [
        ('harvest', 'Harvest'),
        ('processing', 'Processing'),
        ('packaging', 'Packaging'),
        ('storage', 'Storage'),
        ('transport', 'Transport'),
        ('inspection', 'Inspection'),
        ('customs', 'Customs Clearance'),
        ('delivery', 'Delivery'),
        ('sale', 'Sale'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Product tracking
    product_id = models.CharField(max_length=100, db_index=True)
    product_name = models.CharField(max_length=255)
    batch_number = models.CharField(max_length=100, db_index=True)
    
    # Event details
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    event_description = models.TextField()
    event_timestamp = models.DateTimeField(default=timezone.now)
    
    # Location
    location_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    
    # Actors
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='supply_chain_events')
    actor_name = models.CharField(max_length=255)
    actor_role = models.CharField(max_length=100)
    
    # Blockchain data
    blockchain_hash = models.CharField(max_length=66, unique=True, db_index=True)
    transaction_hash = models.CharField(max_length=66, blank=True)
    block_number = models.BigIntegerField(null=True, blank=True)
    previous_event_hash = models.CharField(max_length=66, blank=True)  # Chain events together
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    attachments = models.JSONField(default=list, blank=True)  # URLs to images/documents
    
    # Verification
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_events')
    verified_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['event_timestamp']
        indexes = [
            models.Index(fields=['product_id', 'event_timestamp']),
            models.Index(fields=['batch_number', 'event_timestamp']),
            models.Index(fields=['event_type']),
        ]
    
    def __str__(self):
        return f"{self.event_type} - {self.product_name} ({self.batch_number})"
    
    def generate_hash(self):
        """Generate blockchain hash for event data."""
        data = f"{self.product_id}{self.batch_number}{self.event_type}{self.event_timestamp.isoformat()}{self.previous_event_hash}"
        return '0x' + hashlib.sha256(data.encode()).hexdigest()
    
    def save(self, *args, **kwargs):
        """Override save to generate hash if not exists."""
        if not self.blockchain_hash:
            self.blockchain_hash = self.generate_hash()
        super().save(*args, **kwargs)


class CertificationBody(models.Model):
    """Model for external certification bodies."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    code = models.CharField(max_length=50, unique=True)
    
    # Contact information
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # Address
    address = models.TextField()
    country = models.CharField(max_length=100)
    
    # Accreditation
    accreditation_number = models.CharField(max_length=100, blank=True)
    accreditation_body = models.CharField(max_length=255, blank=True)
    accreditation_expiry = models.DateField(null=True, blank=True)
    
    # API integration
    api_endpoint = models.URLField(blank=True)
    api_key_encrypted = models.CharField(max_length=255, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    # Metadata
    supported_certificate_types = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Certification Bodies'
    
    def __str__(self):
        return f"{self.name} ({self.code})"


class CertificateVerification(models.Model):
    """Model for tracking certificate verification attempts."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='verifications')
    
    # Verifier information
    verifier_ip = models.GenericIPAddressField()
    verifier_user_agent = models.TextField(blank=True)
    verifier_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Verification result
    is_valid = models.BooleanField()
    verification_message = models.TextField()
    
    # Timestamp
    verified_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-verified_at']
    
    def __str__(self):
        return f"Verification of {self.certificate.certificate_number} at {self.verified_at}"
