"""
Filters for farm management models
"""
import django_filters
from django.db.models import Q
from .models import Farm, Field, Crop, Livestock, FarmActivity, Equipment, SatelliteImagery


class FarmFilter(django_filters.FilterSet):
    """Filter for Farm model"""
    
    farm_type = django_filters.ChoiceFilter(choices=Farm.FARM_TYPE_CHOICES)
    certification = django_filters.ChoiceFilter(choices=Farm.CERTIFICATION_CHOICES)
    size_min = django_filters.NumberFilter(field_name='size_hectares', lookup_expr='gte')
    size_max = django_filters.NumberFilter(field_name='size_hectares', lookup_expr='lte')
    established_after = django_filters.DateFilter(field_name='established_date', lookup_expr='gte')
    established_before = django_filters.DateFilter(field_name='established_date', lookup_expr='lte')
    is_active = django_filters.BooleanFilter()
    is_public = django_filters.BooleanFilter()
    
    class Meta:
        model = Farm
        fields = [
            'farm_type', 'certification', 'size_min', 'size_max',
            'established_after', 'established_before', 'is_active', 'is_public'
        ]


class FieldFilter(django_filters.FilterSet):
    """Filter for Field model"""
    
    farm = django_filters.UUIDFilter(field_name='farm__id')
    soil_type = django_filters.ChoiceFilter(choices=Field.SOIL_TYPE_CHOICES)
    irrigation_type = django_filters.ChoiceFilter(choices=Field.IRRIGATION_TYPE_CHOICES)
    area_min = django_filters.NumberFilter(field_name='area_hectares', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area_hectares', lookup_expr='lte')
    ph_min = django_filters.NumberFilter(field_name='soil_ph', lookup_expr='gte')
    ph_max = django_filters.NumberFilter(field_name='soil_ph', lookup_expr='lte')
    elevation_min = django_filters.NumberFilter(field_name='elevation_meters', lookup_expr='gte')
    elevation_max = django_filters.NumberFilter(field_name='elevation_meters', lookup_expr='lte')
    has_drainage = django_filters.BooleanFilter()
    has_fencing = django_filters.BooleanFilter()
    is_active = django_filters.BooleanFilter()
    
    class Meta:
        model = Field
        fields = [
            'farm', 'soil_type', 'irrigation_type', 'area_min', 'area_max',
            'ph_min', 'ph_max', 'elevation_min', 'elevation_max',
            'has_drainage', 'has_fencing', 'is_active'
        ]


class SatelliteImageryFilter(django_filters.FilterSet):
    """Filter for SatelliteImagery model"""
    
    field = django_filters.UUIDFilter(field_name='field__id')
    farm = django_filters.UUIDFilter(field_name='field__farm__id')
    satellite_name = django_filters.ChoiceFilter(choices=SatelliteImagery.SATELLITE_CHOICES)
    imagery_type = django_filters.ChoiceFilter(choices=SatelliteImagery.IMAGERY_TYPE_CHOICES)
    
    # Date filters
    acquired_after = django_filters.DateTimeFilter(field_name='acquisition_date', lookup_expr='gte')
    acquired_before = django_filters.DateTimeFilter(field_name='acquisition_date', lookup_expr='lte')
    
    # Quality filters
    cloud_coverage_max = django_filters.NumberFilter(field_name='cloud_coverage_percentage', lookup_expr='lte')
    resolution_max = django_filters.NumberFilter(field_name='resolution_meters', lookup_expr='lte')
    
    # Health filters
    health_score_min = django_filters.NumberFilter(field_name='crop_health_score', lookup_expr='gte')
    health_score_max = django_filters.NumberFilter(field_name='crop_health_score', lookup_expr='lte')
    
    # Processing status
    is_processed = django_filters.BooleanFilter()
    
    class Meta:
        model = SatelliteImagery
        fields = [
            'field', 'farm', 'satellite_name', 'imagery_type',
            'acquired_after', 'acquired_before', 'cloud_coverage_max',
            'resolution_max', 'health_score_min', 'health_score_max', 'is_processed'
        ]


class CropFilter(django_filters.FilterSet):
    """Filter for Crop model"""
    
    farm = django_filters.UUIDFilter(field_name='farm__id')
    field = django_filters.UUIDFilter(field_name='field__id')
    status = django_filters.ChoiceFilter(choices=Crop.STATUS_CHOICES)
    season = django_filters.ChoiceFilter(choices=Crop.SEASON_CHOICES)
    planted_after = django_filters.DateFilter(field_name='planting_date', lookup_expr='gte')
    planted_before = django_filters.DateFilter(field_name='planting_date', lookup_expr='lte')
    harvest_after = django_filters.DateFilter(field_name='expected_harvest_date', lookup_expr='gte')
    harvest_before = django_filters.DateFilter(field_name='expected_harvest_date', lookup_expr='lte')
    area_min = django_filters.NumberFilter(field_name='area_hectares', lookup_expr='gte')
    area_max = django_filters.NumberFilter(field_name='area_hectares', lookup_expr='lte')
    
    # Custom filters
    ready_for_harvest = django_filters.BooleanFilter(method='filter_ready_for_harvest')
    overdue_harvest = django_filters.BooleanFilter(method='filter_overdue_harvest')
    
    class Meta:
        model = Crop
        fields = [
            'farm', 'field', 'status', 'season', 'planted_after', 'planted_before',
            'harvest_after', 'harvest_before', 'area_min', 'area_max',
            'ready_for_harvest', 'overdue_harvest'
        ]
    
    def filter_ready_for_harvest(self, queryset, name, value):
        """Filter crops ready for harvest (within 7 days)"""
        if value:
            from django.utils import timezone
            from datetime import timedelta
            
            target_date = timezone.now().date() + timedelta(days=7)
            return queryset.filter(
                expected_harvest_date__lte=target_date,
                status__in=['growing', 'flowering', 'fruiting']
            )
        return queryset
    
    def filter_overdue_harvest(self, queryset, name, value):
        """Filter crops with overdue harvest"""
        if value:
            from django.utils import timezone
            
            return queryset.filter(
                expected_harvest_date__lt=timezone.now().date(),
                status__in=['growing', 'flowering', 'fruiting']
            )
        return queryset


class LivestockFilter(django_filters.FilterSet):
    """Filter for Livestock model"""
    
    farm = django_filters.UUIDFilter(field_name='farm__id')
    animal_type = django_filters.ChoiceFilter(choices=Livestock.ANIMAL_TYPE_CHOICES)
    health_status = django_filters.ChoiceFilter(choices=Livestock.HEALTH_STATUS_CHOICES)
    purpose = django_filters.ChoiceFilter(choices=Livestock.PURPOSE_CHOICES)
    count_min = django_filters.NumberFilter(field_name='count', lookup_expr='gte')
    count_max = django_filters.NumberFilter(field_name='count', lookup_expr='lte')
    age_min = django_filters.NumberFilter(field_name='average_age_months', lookup_expr='gte')
    age_max = django_filters.NumberFilter(field_name='average_age_months', lookup_expr='lte')
    weight_min = django_filters.NumberFilter(field_name='average_weight_kg', lookup_expr='gte')
    weight_max = django_filters.NumberFilter(field_name='average_weight_kg', lookup_expr='lte')
    acquired_after = django_filters.DateFilter(field_name='acquisition_date', lookup_expr='gte')
    acquired_before = django_filters.DateFilter(field_name='acquisition_date', lookup_expr='lte')
    
    class Meta:
        model = Livestock
        fields = [
            'farm', 'animal_type', 'health_status', 'purpose',
            'count_min', 'count_max', 'age_min', 'age_max',
            'weight_min', 'weight_max', 'acquired_after', 'acquired_before'
        ]


class FarmActivityFilter(django_filters.FilterSet):
    """Filter for FarmActivity model"""
    
    farm = django_filters.UUIDFilter(field_name='farm__id')
    crop = django_filters.UUIDFilter(field_name='crop__id')
    livestock = django_filters.UUIDFilter(field_name='livestock__id')
    activity_type = django_filters.ChoiceFilter(choices=FarmActivity.ACTIVITY_TYPE_CHOICES)
    status = django_filters.ChoiceFilter(choices=FarmActivity.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=FarmActivity.PRIORITY_CHOICES)
    assigned_to = django_filters.UUIDFilter(field_name='assigned_to__id')
    
    # Date filters
    scheduled_after = django_filters.DateTimeFilter(field_name='scheduled_date', lookup_expr='gte')
    scheduled_before = django_filters.DateTimeFilter(field_name='scheduled_date', lookup_expr='lte')
    completed_after = django_filters.DateTimeFilter(field_name='completed_date', lookup_expr='gte')
    completed_before = django_filters.DateTimeFilter(field_name='completed_date', lookup_expr='lte')
    
    # Custom filters
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    upcoming = django_filters.BooleanFilter(method='filter_upcoming')
    this_week = django_filters.BooleanFilter(method='filter_this_week')
    
    class Meta:
        model = FarmActivity
        fields = [
            'farm', 'crop', 'livestock', 'activity_type', 'status', 'priority',
            'assigned_to', 'scheduled_after', 'scheduled_before',
            'completed_after', 'completed_before', 'overdue', 'upcoming', 'this_week'
        ]
    
    def filter_overdue(self, queryset, name, value):
        """Filter overdue activities"""
        if value:
            from django.utils import timezone
            
            return queryset.filter(
                status__in=['planned', 'in_progress'],
                scheduled_date__lt=timezone.now()
            )
        return queryset
    
    def filter_upcoming(self, queryset, name, value):
        """Filter upcoming activities (next 7 days)"""
        if value:
            from django.utils import timezone
            from datetime import timedelta
            
            end_date = timezone.now() + timedelta(days=7)
            return queryset.filter(
                status__in=['planned', 'in_progress'],
                scheduled_date__gte=timezone.now(),
                scheduled_date__lte=end_date
            )
        return queryset
    
    def filter_this_week(self, queryset, name, value):
        """Filter activities for this week"""
        if value:
            from django.utils import timezone
            from datetime import timedelta
            
            today = timezone.now().date()
            start_week = today - timedelta(days=today.weekday())
            end_week = start_week + timedelta(days=6)
            
            return queryset.filter(
                scheduled_date__date__gte=start_week,
                scheduled_date__date__lte=end_week
            )
        return queryset


class EquipmentFilter(django_filters.FilterSet):
    """Filter for Equipment model"""
    
    farm = django_filters.UUIDFilter(field_name='farm__id')
    equipment_type = django_filters.ChoiceFilter(choices=Equipment.EQUIPMENT_TYPE_CHOICES)
    condition = django_filters.ChoiceFilter(choices=Equipment.CONDITION_CHOICES)
    is_operational = django_filters.BooleanFilter()
    
    # Value filters
    purchase_price_min = django_filters.NumberFilter(field_name='purchase_price', lookup_expr='gte')
    purchase_price_max = django_filters.NumberFilter(field_name='purchase_price', lookup_expr='lte')
    current_value_min = django_filters.NumberFilter(field_name='current_value', lookup_expr='gte')
    current_value_max = django_filters.NumberFilter(field_name='current_value', lookup_expr='lte')
    
    # Date filters
    purchased_after = django_filters.DateFilter(field_name='purchase_date', lookup_expr='gte')
    purchased_before = django_filters.DateFilter(field_name='purchase_date', lookup_expr='lte')
    
    # Custom filters
    needs_maintenance = django_filters.BooleanFilter(method='filter_needs_maintenance')
    
    class Meta:
        model = Equipment
        fields = [
            'farm', 'equipment_type', 'condition', 'is_operational',
            'purchase_price_min', 'purchase_price_max',
            'current_value_min', 'current_value_max',
            'purchased_after', 'purchased_before', 'needs_maintenance'
        ]
    
    def filter_needs_maintenance(self, queryset, name, value):
        """Filter equipment that needs maintenance"""
        if value:
            from django.utils import timezone
            
            return queryset.filter(
                next_maintenance_date__lte=timezone.now().date(),
                is_operational=True
            )
        return queryset