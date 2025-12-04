"""
Filters for scheduling models
"""
import django_filters
from django.db.models import Q
from django.utils import timezone
from .models import Task, TaskTemplate, CropCalendar


class TaskFilter(django_filters.FilterSet):
    """Filter for Task model"""
    
    # Status and priority filters
    status = django_filters.ChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Task.PRIORITY_CHOICES)
    category = django_filters.ChoiceFilter(choices=Task.CATEGORY_CHOICES)
    
    # Farm and field filters
    farm = django_filters.UUIDFilter(field_name='farm__id')
    field = django_filters.UUIDFilter(field_name='field__id')
    
    # Date filters
    due_date_after = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')
    due_date_before = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Recurrence filters
    is_recurring = django_filters.BooleanFilter()
    recurrence_pattern = django_filters.ChoiceFilter(choices=Task.RECURRENCE_CHOICES)
    
    # Custom filters
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    is_due_soon = django_filters.BooleanFilter(method='filter_due_soon')
    has_reminder = django_filters.BooleanFilter(field_name='reminder_enabled')
    assigned_to_me = django_filters.BooleanFilter(method='filter_assigned_to_me')
    
    class Meta:
        model = Task
        fields = [
            'status', 'priority', 'category', 'farm', 'field',
            'due_date_after', 'due_date_before', 'created_after', 'created_before',
            'is_recurring', 'recurrence_pattern', 'is_overdue', 'is_due_soon',
            'has_reminder', 'assigned_to_me'
        ]
    
    def filter_overdue(self, queryset, name, value):
        """Filter overdue tasks"""
        if value:
            return queryset.filter(
                status__in=['pending', 'in_progress'],
                due_date__lt=timezone.now()
            )
        return queryset
    
    def filter_due_soon(self, queryset, name, value):
        """Filter tasks due within 24 hours"""
        if value:
            now = timezone.now()
            return queryset.filter(
                status__in=['pending', 'in_progress'],
                due_date__gte=now,
                due_date__lte=now + timezone.timedelta(hours=24)
            )
        return queryset
    
    def filter_assigned_to_me(self, queryset, name, value):
        """Filter tasks assigned to current user"""
        if value and hasattr(self.request, 'user'):
            return queryset.filter(assigned_to=self.request.user)
        return queryset


class TaskTemplateFilter(django_filters.FilterSet):
    """Filter for TaskTemplate model"""
    
    category = django_filters.ChoiceFilter(choices=Task.CATEGORY_CHOICES)
    priority = django_filters.ChoiceFilter(choices=Task.PRIORITY_CHOICES)
    is_public = django_filters.BooleanFilter()
    
    # Usage filters
    min_usage = django_filters.NumberFilter(field_name='usage_count', lookup_expr='gte')
    max_usage = django_filters.NumberFilter(field_name='usage_count', lookup_expr='lte')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = TaskTemplate
        fields = [
            'category', 'priority', 'is_public',
            'min_usage', 'max_usage', 'created_after', 'created_before'
        ]


class CropCalendarFilter(django_filters.FilterSet):
    """Filter for CropCalendar model"""
    
    crop_name = django_filters.CharFilter(lookup_expr='icontains')
    variety = django_filters.CharFilter(lookup_expr='icontains')
    
    # Duration filters
    max_days_to_harvest = django_filters.NumberFilter(method='filter_max_days')
    min_days_to_harvest = django_filters.NumberFilter(method='filter_min_days')
    
    # Season filter
    planting_month = django_filters.NumberFilter(method='filter_planting_month')
    
    class Meta:
        model = CropCalendar
        fields = ['crop_name', 'variety', 'is_active']
    
    def filter_max_days(self, queryset, name, value):
        """Filter by maximum days to harvest"""
        # This would require annotation in the view
        return queryset
    
    def filter_min_days(self, queryset, name, value):
        """Filter by minimum days to harvest"""
        # This would require annotation in the view
        return queryset
    
    def filter_planting_month(self, queryset, name, value):
        """Filter by optimal planting month"""
        if value:
            return queryset.filter(optimal_planting_months__contains=[value])
        return queryset
