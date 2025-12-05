"""
Django admin configuration for financial management
"""
from django.contrib import admin
from .models import FinancialRecord, Budget, ExchangeRate


@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = [
        'transaction_date', 'user', 'record_type', 'category',
        'amount', 'currency', 'payment_method', 'created_at'
    ]
    list_filter = [
        'record_type', 'category', 'payment_method', 'currency',
        'transaction_date', 'created_at'
    ]
    search_fields = [
        'user__username', 'description', 'reference_number',
        'invoice_number', 'notes'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'transaction_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'record_type', 'category')
        }),
        ('Financial Details', {
            'fields': ('amount', 'currency', 'transaction_date', 'payment_method')
        }),
        ('Transaction Details', {
            'fields': ('description', 'reference_number', 'invoice_number', 'receipt_image')
        }),
        ('Related Entities', {
            'fields': ('farm_id', 'order_id')
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'user', 'category', 'budgeted_amount', 'currency',
        'period', 'start_date', 'end_date', 'status', 'spent_percentage'
    ]
    list_filter = [
        'status', 'period', 'category', 'currency',
        'start_date', 'end_date'
    ]
    search_fields = ['user__username', 'name', 'description']
    readonly_fields = [
        'id', 'spent_amount', 'remaining_amount', 'spent_percentage',
        'is_exceeded', 'days_remaining', 'created_at', 'updated_at'
    ]
    date_hierarchy = 'start_date'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'user', 'name', 'description', 'category')
        }),
        ('Budget Details', {
            'fields': ('budgeted_amount', 'currency', 'period', 'start_date', 'end_date')
        }),
        ('Status & Alerts', {
            'fields': ('status', 'alert_threshold', 'alert_sent')
        }),
        ('Performance Metrics', {
            'fields': ('spent_amount', 'remaining_amount', 'spent_percentage', 'is_exceeded', 'days_remaining'),
            'classes': ('collapse',)
        }),
        ('Related Entities', {
            'fields': ('farm_id',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = [
        'base_currency', 'target_currency', 'rate', 'date', 'updated_at'
    ]
    list_filter = ['base_currency', 'target_currency', 'date']
    search_fields = ['base_currency', 'target_currency']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Exchange Rate Information', {
            'fields': ('id', 'base_currency', 'target_currency', 'rate', 'date')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
