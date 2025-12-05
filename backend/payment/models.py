"""
Payment Service Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class Transaction(models.Model):
    """
    Payment transactions
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    TRANSACTION_TYPES = [
        ('payment', 'Payment'),
        ('refund', 'Refund'),
        ('payout', 'Payout'),
        ('escrow_hold', 'Escrow Hold'),
        ('escrow_release', 'Escrow Release'),
    ]
    
    PAYMENT_METHODS = [
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('ussd', 'USSD'),
        ('qr', 'QR Code'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Parties involved
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='received_transactions')
    
    # Transaction details
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='payment')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, null=True, blank=True)
    
    # Amount details
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Gateway details
    gateway = models.CharField(max_length=50, default='paystack')
    gateway_reference = models.CharField(max_length=200, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Related objects
    order_id = models.CharField(max_length=100, blank=True, db_index=True)
    escrow_id = models.CharField(max_length=100, blank=True, db_index=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['reference']),
            models.Index(fields=['gateway_reference']),
            models.Index(fields=['order_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.reference} - {self.amount} {self.currency}"
    
    def save(self, *args, **kwargs):
        """Calculate net amount"""
        if not self.net_amount:
            self.net_amount = self.amount - self.fee
        super().save(*args, **kwargs)


class Escrow(models.Model):
    """
    Escrow management for secure transactions
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('held', 'Held'),
        ('released', 'Released'),
        ('refunded', 'Refunded'),
        ('disputed', 'Disputed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Parties
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='escrow_purchases')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='escrow_sales')
    
    # Amount
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Related transaction
    hold_transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='escrow_holds'
    )
    release_transaction = models.ForeignKey(
        Transaction, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='escrow_releases'
    )
    
    # Related order
    order_id = models.CharField(max_length=100, db_index=True)
    
    # Release conditions
    auto_release_days = models.IntegerField(default=7)
    release_date = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    held_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['order_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Escrow {self.reference} - {self.amount} {self.currency}"


class PaymentReceipt(models.Model):
    """
    Payment receipts and invoices
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    receipt_number = models.CharField(max_length=50, unique=True, db_index=True)
    
    # Related transaction
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='receipt')
    
    # Receipt details
    issued_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receipts')
    issued_by = models.CharField(max_length=200, default='AgroBridge')
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='GHS')
    
    # Line items
    items = models.JSONField(default=list)
    
    # Tax details
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    tax_id = models.CharField(max_length=100, blank=True)
    
    # File
    file_path = models.CharField(max_length=500, blank=True)
    
    # Timestamps
    issued_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['issued_to']),
            models.Index(fields=['receipt_number']),
            models.Index(fields=['issued_at']),
        ]
    
    def __str__(self):
        return f"Receipt {self.receipt_number}"


class Dispute(models.Model):
    """
    Payment disputes
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    RESOLUTION_CHOICES = [
        ('buyer_favor', 'Buyer Favor'),
        ('seller_favor', 'Seller Favor'),
        ('partial_refund', 'Partial Refund'),
        ('no_action', 'No Action'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=100, unique=True, db_index=True)
    
    # Related transaction
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='disputes')
    
    # Parties
    raised_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disputes_raised')
    against = models.ForeignKey(User, on_delete=models.CASCADE, related_name='disputes_against')
    
    # Dispute details
    reason = models.CharField(max_length=200)
    description = models.TextField()
    evidence = models.JSONField(default=list)  # List of file URLs
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    resolution = models.CharField(max_length=20, choices=RESOLUTION_CHOICES, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    # Refund details
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    refund_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dispute_refunds'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['raised_by', 'status']),
            models.Index(fields=['transaction']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Dispute {self.reference} - {self.reason}"


class ExchangeRate(models.Model):
    """
    Currency exchange rates
    """
    from_currency = models.CharField(max_length=3)
    to_currency = models.CharField(max_length=3)
    rate = models.DecimalField(max_digits=12, decimal_places=6)
    
    # Source
    source = models.CharField(max_length=50, default='manual')
    
    # Timestamps
    effective_date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-effective_date']
        unique_together = ['from_currency', 'to_currency', 'effective_date']
        indexes = [
            models.Index(fields=['from_currency', 'to_currency']),
            models.Index(fields=['effective_date']),
        ]
    
    def __str__(self):
        return f"{self.from_currency}/{self.to_currency}: {self.rate}"
