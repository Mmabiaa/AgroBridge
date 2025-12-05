"""
Filters for financial management models
"""
import django_filters
from .models import FinancialRecord, Budget


class FinancialRecordFilter(django_filters.FilterSet):
    """Filter for FinancialRecord model"""
    record_type = django_filters.ChoiceFilter(choices=FinancialRecord.RECORD_TYPE_CHOICES)
    category = django_filters.ChoiceFilter(choices=FinancialRecord.CATEGORY_CHOICES)
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    start_date = django_filters.DateFilter(field_name='transaction_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='transaction_date', lookup_expr='lte')
    payment_method = django_filters.ChoiceFilter(choices=FinancialRecord.PAYMENT_METHOD_CHOICES)
    currency = django_filters.CharFilter(field_name='currency')
    farm_id = django_filters.UUIDFilter(field_name='farm_id')
    order_id = django_filters.UUIDFilter(field_name='order_id')
    
    class Meta:
        model = FinancialRecord
        fields = [
            'record_type', 'category', 'min_amount', 'max_amount',
            'start_date', 'end_date', 'payment_method', 'currency',
            'farm_id', 'order_id'
        ]


class BudgetFilter(django_filters.FilterSet):
    """Filter for Budget model"""
    category = django_filters.ChoiceFilter(choices=FinancialRecord.CATEGORY_CHOICES)
    period = django_filters.ChoiceFilter(choices=Budget.PERIOD_CHOICES)
    status = django_filters.ChoiceFilter(choices=Budget.STATUS_CHOICES)
    start_date = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    currency = django_filters.CharFilter(field_name='currency')
    farm_id = django_filters.UUIDFilter(field_name='farm_id')
    is_exceeded = django_filters.BooleanFilter(method='filter_exceeded')
    
    class Meta:
        model = Budget
        fields = [
            'category', 'period', 'status', 'start_date', 'end_date',
            'currency', 'farm_id', 'is_exceeded'
        ]
    
    def filter_exceeded(self, queryset, name, value):
        """Filter budgets that are exceeded"""
        if value:
            # This requires a custom query since is_exceeded is a property
            exceeded_ids = [budget.id for budget in queryset if budget.is_exceeded]
            return queryset.filter(id__in=exceeded_ids)
        else:
            exceeded_ids = [budget.id for budget in queryset if budget.is_exceeded]
            return queryset.exclude(id__in=exceeded_ids)
