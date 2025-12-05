"""
Financial Management Models
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class FinancialRecord(models.Model):
    """
    Financial records for income and expenses
    """
    RECORD_TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]
    
    CATEGORY_CHOICES = [
        # Income categories
        ('crop_sales', 'Crop Sales'),
        ('livestock_sales', 'Livestock Sales'),
        ('product_sales', 'Product Sales'),
        ('service_income', 'Service Income'),
        ('subsidy', 'Government Subsidy'),
        ('loan', 'Loan'),
        ('investment', 'Investment'),
        ('other_income', 'Other Income'),
        
        # Expense categories
        ('seeds', 'Seeds & Planting Materials'),
        ('fertilizer', 'Fertilizers'),
        ('pesticides', 'Pesticides & Herbicides'),
        ('equipment', 'Equipment Purchase'),
        ('equipment_maintenance', 'Equipment Maintenance'),
        ('fuel', 'Fuel & Energy'),
        ('labor', 'Labor Costs'),
        ('irrigation', 'Irrigation'),
        ('feed', 'Animal Feed'),
        ('veterinary', 'Veterinary Services'),
        ('transport', 'Transportation'),
        ('storage', 'Storage'),
        ('insurance', 'Insurance'),
        ('rent', 'Land Rent'),
        ('utilities', 'Utilities'),
        ('marketing', 'Marketing'),
        ('loan_repayment', 'Loan Repayment'),
        ('taxes', 'Taxes'),
        ('other_expense', 'Other Expense'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('check', 'Check'),
        ('credit_card', 'Credit Card'),
        ('other', 'Other'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='financial_records')
    
    # Record details
    record_type = models.CharField(max_length=10, choices=RECORD_TYPE_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='GHS')  # Ghana Cedis
    
    # Transaction details
    description = models.TextField()
    transaction_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    reference_number = models.CharField(max_length=100, blank=True)
    
    # Receipt/invoice
    receipt_image = models.ImageField(upload_to='financial/receipts/', null=True, blank=True)
    invoice_number = models.CharField(max_length=50, blank=True)
    
    # Related entities (optional)
    farm_id = models.UUIDField(null=True, blank=True, help_text="Related farm ID")
    order_id = models.UUIDField(null=True, blank=True, help_text="Related marketplace order ID")
    
    # Additional metadata
    notes = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['user', 'record_type']),
            models.Index(fields=['user', 'transaction_date']),
            models.Index(fields=['category']),
            models.Index(fields=['transaction_date']),
            models.Index(fields=['farm_id']),
            models.Index(fields=['order_id']),
        ]
    
    def __str__(self):
        return f"{self.get_record_type_display()}: {self.amount} {self.currency} - {self.category}"


class Budget(models.Model):
    """
    Budget planning and tracking
    """
    PERIOD_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
        ('custom', 'Custom Period'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('exceeded', 'Exceeded'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    
    # Budget details
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=30, choices=FinancialRecord.CATEGORY_CHOICES)
    
    # Amount and period
    budgeted_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    currency = models.CharField(max_length=3, default='GHS')
    period = models.CharField(max_length=20, choices=PERIOD_CHOICES)
    
    # Date range
    start_date = models.DateField()
    end_date = models.DateField()
    
    # Status and alerts
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    alert_threshold = models.IntegerField(
        default=80,
        validators=[MinValueValidator(1), MinValueValidator(100)],
        help_text="Alert when spending reaches this percentage"
    )
    alert_sent = models.BooleanField(default=False)
    
    # Related entities
    farm_id = models.UUIDField(null=True, blank=True, help_text="Related farm ID")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.budgeted_amount} {self.currency}"
    
    @property
    def spent_amount(self):
        """Calculate total spent against this budget"""
        from django.db.models import Sum
        spent = FinancialRecord.objects.filter(
            user=self.user,
            record_type='expense',
            category=self.category,
            transaction_date__gte=self.start_date,
            transaction_date__lte=self.end_date
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        return spent
    
    @property
    def remaining_amount(self):
        """Calculate remaining budget"""
        return self.budgeted_amount - self.spent_amount
    
    @property
    def spent_percentage(self):
        """Calculate percentage of budget spent"""
        if self.budgeted_amount == 0:
            return 0
        return float((self.spent_amount / self.budgeted_amount) * 100)
    
    @property
    def is_exceeded(self):
        """Check if budget is exceeded"""
        return self.spent_amount > self.budgeted_amount
    
    @property
    def days_remaining(self):
        """Calculate days remaining in budget period"""
        today = timezone.now().date()
        if today > self.end_date:
            return 0
        return (self.end_date - today).days


class ExchangeRate(models.Model):
    """
    Exchange rates for multi-currency support
    """
    base_currency = models.CharField(max_length=3, default='GHS')
    target_currency = models.CharField(max_length=3)
    rate = models.DecimalField(max_digits=12, decimal_places=6)
    date = models.DateField(default=timezone.now)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
        unique_together = ['base_currency', 'target_currency', 'date']
        indexes = [
            models.Index(fields=['base_currency', 'target_currency', 'date']),
        ]
    
    def __str__(self):
        return f"{self.base_currency}/{self.target_currency}: {self.rate} ({self.date})"
