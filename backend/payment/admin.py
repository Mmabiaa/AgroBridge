"""
Payment Service Admin
"""
from django.contrib import admin
from .models import Transaction, Escrow, PaymentReceipt, Dispute, ExchangeRate


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """Admin for transactions"""
    
    list_display = [
        'reference', 'user', 'transaction_type', 'amount', 'currency',
        'status', 'gateway', 'created_at'
    ]
    list_filter = ['status', 'transaction_type', 'gateway', 'currency', 'created_at']
    search_fields = ['reference', 'user__email', 'order_id', 'gateway_reference']
    readonly_fields = [
        'id', 'reference', 'gateway_reference', 'gateway_response',
        'created_at', 'updated_at', 'completed_at'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'reference', 'transaction_type', 'status')
        }),
        ('Parties', {
            'fields': ('user', 'recipient')
        }),
        ('Amount Details', {
            'fields': ('amount', 'currency', 'fee', 'net_amount')
        }),
        ('Payment Details', {
            'fields': ('payment_method', 'gateway', 'gateway_reference', 'gateway_response')
        }),
        ('Related Objects', {
            'fields': ('order_id', 'escrow_id')
        }),
        ('Additional Info', {
            'fields': ('description', 'metadata')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at')
        }),
    )


@admin.register(Escrow)
class EscrowAdmin(admin.ModelAdmin):
    """Admin for escrow"""
    
    list_display = [
        'reference', 'buyer', 'seller', 'amount', 'currency',
        'status', 'order_id', 'created_at'
    ]
    list_filter = ['status', 'currency', 'created_at']
    search_fields = ['reference', 'buyer__email', 'seller__email', 'order_id']
    readonly_fields = [
        'id', 'reference', 'created_at', 'held_at', 'released_at', 'refunded_at'
    ]
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'reference', 'status')
        }),
        ('Parties', {
            'fields': ('buyer', 'seller')
        }),
        ('Amount', {
            'fields': ('amount', 'currency')
        }),
        ('Transactions', {
            'fields': ('hold_transaction', 'release_transaction')
        }),
        ('Release Settings', {
            'fields': ('auto_release_days', 'release_date')
        }),
        ('Related', {
            'fields': ('order_id', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'held_at', 'released_at', 'refunded_at')
        }),
    )


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    """Admin for payment receipts"""
    
    list_display = [
        'receipt_number', 'issued_to', 'total_amount', 'currency',
        'issued_at'
    ]
    list_filter = ['currency', 'issued_at']
    search_fields = ['receipt_number', 'issued_to__email', 'transaction__reference']
    readonly_fields = ['id', 'receipt_number', 'issued_at']
    date_hierarchy = 'issued_at'


@admin.register(Dispute)
class DisputeAdmin(admin.ModelAdmin):
    """Admin for disputes"""
    
    list_display = [
        'reference', 'raised_by', 'against', 'reason',
        'status', 'resolution', 'created_at'
    ]
    list_filter = ['status', 'resolution', 'created_at']
    search_fields = ['reference', 'raised_by__email', 'against__email', 'reason']
    readonly_fields = ['id', 'reference', 'created_at', 'resolved_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'reference', 'status')
        }),
        ('Parties', {
            'fields': ('raised_by', 'against', 'transaction')
        }),
        ('Dispute Details', {
            'fields': ('reason', 'description', 'evidence')
        }),
        ('Resolution', {
            'fields': ('resolution', 'resolution_notes', 'refund_amount', 'refund_transaction')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'resolved_at')
        }),
    )


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    """Admin for exchange rates"""
    
    list_display = [
        'from_currency', 'to_currency', 'rate', 'source',
        'effective_date'
    ]
    list_filter = ['from_currency', 'to_currency', 'source', 'effective_date']
    search_fields = ['from_currency', 'to_currency']
    date_hierarchy = 'effective_date'
