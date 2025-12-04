"""
Serializers for financial management models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import FinancialRecord, Budget, ExchangeRate

User = get_user_model()


class FinancialRecordSerializer(serializers.ModelSerializer):
    """Serializer for FinancialRecord model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    record_type_display = serializers.CharField(source='get_record_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    
    class Meta:
        model = FinancialRecord
        fields = [
            'id', 'record_type', 'record_type_display', 'category', 'category_display',
            'amount', 'currency', 'description', 'transaction_date', 'payment_method',
            'payment_method_display', 'reference_number', 'receipt_image', 'invoice_number',
            'farm_id', 'order_id', 'notes', 'tags', 'created_at', 'updated_at', 'user_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create financial record with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Validate income categories are only used with income type
        income_categories = [
            'crop_sales', 'livestock_sales', 'product_sales', 'service_income',
            'subsidy', 'loan', 'investment', 'other_income'
        ]
        expense_categories = [
            'seeds', 'fertilizer', 'pesticides', 'equipment', 'equipment_maintenance',
            'fuel', 'labor', 'irrigation', 'feed', 'veterinary', 'transport',
            'storage', 'insurance', 'rent', 'utilities', 'marketing',
            'loan_repayment', 'taxes', 'other_expense'
        ]
        
        record_type = data.get('record_type')
        category = data.get('category')
        
        if record_type == 'income' and category in expense_categories:
            raise serializers.ValidationError({
                'category': 'This category is for expenses only'
            })
        
        if record_type == 'expense' and category in income_categories:
            raise serializers.ValidationError({
                'category': 'This category is for income only'
            })
        
        return data


class BudgetSerializer(serializers.ModelSerializer):
    """Serializer for Budget model"""
    user_name = serializers.CharField(source='user.username', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    period_display = serializers.CharField(source='get_period_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    # Computed fields
    spent_amount = serializers.ReadOnlyField()
    remaining_amount = serializers.ReadOnlyField()
    spent_percentage = serializers.ReadOnlyField()
    is_exceeded = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    
    class Meta:
        model = Budget
        fields = [
            'id', 'name', 'description', 'category', 'category_display',
            'budgeted_amount', 'currency', 'period', 'period_display',
            'start_date', 'end_date', 'status', 'status_display',
            'alert_threshold', 'alert_sent', 'farm_id',
            'spent_amount', 'remaining_amount', 'spent_percentage',
            'is_exceeded', 'days_remaining',
            'created_at', 'updated_at', 'user_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'alert_sent']
    
    def create(self, validated_data):
        """Create budget with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_budgeted_amount(self, value):
        """Validate budgeted amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Budgeted amount must be greater than 0")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date'
            })
        
        return data


class ExchangeRateSerializer(serializers.ModelSerializer):
    """Serializer for ExchangeRate model"""
    
    class Meta:
        model = ExchangeRate
        fields = [
            'id', 'base_currency', 'target_currency', 'rate', 'date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_rate(self, value):
        """Validate exchange rate is positive"""
        if value <= 0:
            raise serializers.ValidationError("Exchange rate must be greater than 0")
        return value


class FinancialSummarySerializer(serializers.Serializer):
    """Serializer for financial summary data"""
    total_income = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_profit = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    
    # Breakdown by category
    income_by_category = serializers.DictField()
    expenses_by_category = serializers.DictField()
    
    # Monthly trends
    monthly_income = serializers.ListField()
    monthly_expenses = serializers.ListField()
    monthly_profit = serializers.ListField()


class CashFlowSerializer(serializers.Serializer):
    """Serializer for cash flow analysis"""
    opening_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    closing_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_inflow = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_outflow = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_cash_flow = serializers.DecimalField(max_digits=12, decimal_places=2)
    currency = serializers.CharField(max_length=3)
    period_start = serializers.DateField()
    period_end = serializers.DateField()
    
    # Daily/weekly/monthly cash flow
    cash_flow_timeline = serializers.ListField()


class BudgetPerformanceSerializer(serializers.Serializer):
    """Serializer for budget performance analysis"""
    budget_id = serializers.UUIDField()
    budget_name = serializers.CharField()
    budgeted_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    spent_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    spent_percentage = serializers.FloatField()
    status = serializers.CharField()
    is_exceeded = serializers.BooleanField()
    days_remaining = serializers.IntegerField()
