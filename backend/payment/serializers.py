"""
Payment Service Serializers
"""
from rest_framework import serializers
from .models import Transaction, Escrow, PaymentReceipt, Dispute, ExchangeRate


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for transactions"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'user', 'recipient', 'transaction_type',
            'transaction_type_display', 'payment_method', 'payment_method_display',
            'amount', 'currency', 'fee', 'net_amount', 'status', 'status_display',
            'gateway', 'gateway_reference', 'gateway_response', 'order_id',
            'escrow_id', 'metadata', 'description', 'created_at', 'updated_at',
            'completed_at'
        ]
        read_only_fields = [
            'id', 'reference', 'gateway_reference', 'gateway_response',
            'created_at', 'updated_at', 'completed_at'
        ]


class TransactionCreateSerializer(serializers.Serializer):
    """Serializer for creating transactions"""
    
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    currency = serializers.CharField(max_length=3, default='GHS')
    order_id = serializers.CharField(max_length=100, required=False)
    description = serializers.CharField(required=False, allow_blank=True)
    callback_url = serializers.URLField(required=False)
    metadata = serializers.JSONField(required=False)


class EscrowSerializer(serializers.ModelSerializer):
    """Serializer for escrow"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    buyer_email = serializers.EmailField(source='buyer.email', read_only=True)
    seller_email = serializers.EmailField(source='seller.email', read_only=True)
    
    class Meta:
        model = Escrow
        fields = [
            'id', 'reference', 'buyer', 'buyer_email', 'seller', 'seller_email',
            'amount', 'currency', 'status', 'status_display', 'hold_transaction',
            'release_transaction', 'order_id', 'auto_release_days', 'release_date',
            'created_at', 'held_at', 'released_at', 'refunded_at', 'notes'
        ]
        read_only_fields = [
            'id', 'reference', 'hold_transaction', 'release_transaction',
            'created_at', 'held_at', 'released_at', 'refunded_at'
        ]


class EscrowCreateSerializer(serializers.Serializer):
    """Serializer for creating escrow"""
    
    seller_id = serializers.UUIDField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    currency = serializers.CharField(max_length=3, default='GHS')
    order_id = serializers.CharField(max_length=100)
    auto_release_days = serializers.IntegerField(default=7, min_value=1, max_value=30)


class PaymentReceiptSerializer(serializers.ModelSerializer):
    """Serializer for payment receipts"""
    
    transaction_reference = serializers.CharField(source='transaction.reference', read_only=True)
    
    class Meta:
        model = PaymentReceipt
        fields = [
            'id', 'receipt_number', 'transaction', 'transaction_reference',
            'issued_to', 'issued_by', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'currency', 'items', 'tax_rate', 'tax_id',
            'file_path', 'issued_at'
        ]
        read_only_fields = ['id', 'receipt_number', 'file_path', 'issued_at']


class DisputeSerializer(serializers.ModelSerializer):
    """Serializer for disputes"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    resolution_display = serializers.CharField(source='get_resolution_display', read_only=True)
    raised_by_email = serializers.EmailField(source='raised_by.email', read_only=True)
    against_email = serializers.EmailField(source='against.email', read_only=True)
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'reference', 'transaction', 'raised_by', 'raised_by_email',
            'against', 'against_email', 'reason', 'description', 'evidence',
            'status', 'status_display', 'resolution', 'resolution_display',
            'resolution_notes', 'refund_amount', 'refund_transaction',
            'created_at', 'resolved_at'
        ]
        read_only_fields = [
            'id', 'reference', 'resolution', 'resolution_notes',
            'refund_transaction', 'created_at', 'resolved_at'
        ]


class DisputeCreateSerializer(serializers.Serializer):
    """Serializer for creating disputes"""
    
    transaction_id = serializers.UUIDField()
    reason = serializers.CharField(max_length=200)
    description = serializers.CharField()
    evidence = serializers.ListField(
        child=serializers.URLField(),
        required=False,
        allow_empty=True
    )


class ExchangeRateSerializer(serializers.ModelSerializer):
    """Serializer for exchange rates"""
    
    class Meta:
        model = ExchangeRate
        fields = [
            'id', 'from_currency', 'to_currency', 'rate', 'source',
            'effective_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CurrencyConversionSerializer(serializers.Serializer):
    """Serializer for currency conversion"""
    
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0.01)
    from_currency = serializers.CharField(max_length=3)
    to_currency = serializers.CharField(max_length=3)
