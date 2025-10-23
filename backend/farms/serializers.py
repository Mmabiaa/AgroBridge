"""
Serializers for farm management models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Farm, Crop, Livestock, FarmActivity, Equipment

User = get_user_model()


class FarmSerializer(serializers.ModelSerializer):
    """Serializer for Farm model"""
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    total_crops = serializers.ReadOnlyField()
    total_livestock = serializers.ReadOnlyField()
    farm_age_years = serializers.ReadOnlyField()
    
    class Meta:
        model = Farm
        fields = [
            'id', 'name', 'description', 'location', 'size_hectares',
            'farm_type', 'established_date', 'certification', 'contact_person',
            'phone', 'email', 'is_active', 'is_public', 'created_at', 'updated_at',
            'owner_name', 'total_crops', 'total_livestock', 'farm_age_years'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create farm with current user as owner"""
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_size_hectares(self, value):
        """Validate farm size"""
        if value <= 0:
            raise serializers.ValidationError("Farm size must be greater than 0")
        if value > 10000:  # Reasonable upper limit
            raise serializers.ValidationError("Farm size seems too large. Please verify.")
        return value
    
    def validate_location(self, value):
        """Validate location data structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Location must be a valid JSON object")
        
        # Optional: validate required location fields
        # if 'latitude' not in value or 'longitude' not in value:
        #     raise serializers.ValidationError("Location must include latitude and longitude")
        
        return value


class CropSerializer(serializers.ModelSerializer):
    """Serializer for Crop model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    days_to_harvest = serializers.ReadOnlyField()
    growth_stage_percentage = serializers.ReadOnlyField()
    yield_efficiency = serializers.ReadOnlyField()
    
    class Meta:
        model = Crop
        fields = [
            'id', 'name', 'variety', 'scientific_name', 'planting_date',
            'expected_harvest_date', 'actual_harvest_date', 'area_hectares',
            'plants_per_hectare', 'status', 'season', 'expected_yield_kg',
            'actual_yield_kg', 'notes', 'created_at', 'updated_at',
            'farm_name', 'days_to_harvest', 'growth_stage_percentage', 'yield_efficiency'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Cross-field validation"""
        if data.get('expected_harvest_date') and data.get('planting_date'):
            if data['expected_harvest_date'] <= data['planting_date']:
                raise serializers.ValidationError(
                    "Expected harvest date must be after planting date"
                )
        
        if data.get('actual_harvest_date') and data.get('planting_date'):
            if data['actual_harvest_date'] < data['planting_date']:
                raise serializers.ValidationError(
                    "Actual harvest date cannot be before planting date"
                )
        
        return data
    
    def validate_area_hectares(self, value):
        """Validate crop area"""
        if value <= 0:
            raise serializers.ValidationError("Crop area must be greater than 0")
        return value


class LivestockSerializer(serializers.ModelSerializer):
    """Serializer for Livestock model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    total_value = serializers.ReadOnlyField()
    age_category = serializers.ReadOnlyField()
    
    class Meta:
        model = Livestock
        fields = [
            'id', 'animal_type', 'breed', 'count', 'tag_numbers',
            'average_age_months', 'average_weight_kg', 'purpose', 'health_status',
            'acquisition_date', 'acquisition_cost', 'monthly_production', 'notes',
            'created_at', 'updated_at', 'farm_name', 'total_value', 'age_category'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_count(self, value):
        """Validate livestock count"""
        if value <= 0:
            raise serializers.ValidationError("Livestock count must be greater than 0")
        if value > 10000:  # Reasonable upper limit
            raise serializers.ValidationError("Livestock count seems too large. Please verify.")
        return value
    
    def validate_monthly_production(self, value):
        """Validate monthly production data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Monthly production must be a valid JSON object")
        return value


class FarmActivitySerializer(serializers.ModelSerializer):
    """Serializer for FarmActivity model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    crop_name = serializers.CharField(source='crop.name', read_only=True)
    livestock_info = serializers.CharField(source='livestock.__str__', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    
    class Meta:
        model = FarmActivity
        fields = [
            'id', 'activity_type', 'title', 'description', 'crop', 'livestock',
            'scheduled_date', 'completed_date', 'estimated_duration_hours',
            'actual_duration_hours', 'status', 'priority', 'materials_used',
            'labor_hours', 'cost', 'results', 'notes', 'assigned_to',
            'created_at', 'updated_at', 'farm_name', 'crop_name', 'livestock_info',
            'assigned_to_name', 'is_overdue', 'days_until_due'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Cross-field validation"""
        # Ensure crop or livestock belongs to the same farm
        farm = data.get('farm') or self.instance.farm if self.instance else None
        
        if data.get('crop') and farm:
            if data['crop'].farm != farm:
                raise serializers.ValidationError(
                    "Selected crop does not belong to this farm"
                )
        
        if data.get('livestock') and farm:
            if data['livestock'].farm != farm:
                raise serializers.ValidationError(
                    "Selected livestock does not belong to this farm"
                )
        
        return data
    
    def validate_materials_used(self, value):
        """Validate materials used data"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Materials used must be a list")
        return value


class EquipmentSerializer(serializers.ModelSerializer):
    """Serializer for Equipment model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    needs_maintenance = serializers.ReadOnlyField()
    depreciation_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Equipment
        fields = [
            'id', 'name', 'equipment_type', 'brand', 'model', 'serial_number',
            'purchase_date', 'purchase_price', 'current_value', 'condition',
            'is_operational', 'last_maintenance_date', 'next_maintenance_date',
            'maintenance_interval_days', 'hours_used', 'specifications', 'notes',
            'created_at', 'updated_at', 'farm_name', 'needs_maintenance', 'depreciation_rate'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_specifications(self, value):
        """Validate specifications data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Specifications must be a valid JSON object")
        return value


class FarmSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for farm summaries"""
    owner_name = serializers.CharField(source='owner.username', read_only=True)
    total_crops = serializers.ReadOnlyField()
    total_livestock = serializers.ReadOnlyField()
    
    class Meta:
        model = Farm
        fields = [
            'id', 'name', 'farm_type', 'size_hectares', 'is_active',
            'owner_name', 'total_crops', 'total_livestock'
        ]


class CropSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for crop summaries"""
    days_to_harvest = serializers.ReadOnlyField()
    growth_stage_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Crop
        fields = [
            'id', 'name', 'variety', 'status', 'planting_date',
            'expected_harvest_date', 'area_hectares', 'days_to_harvest',
            'growth_stage_percentage'
        ]


class FarmAnalyticsSerializer(serializers.Serializer):
    """Serializer for farm analytics data"""
    total_farms = serializers.IntegerField()
    total_area = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_crops = serializers.IntegerField()
    total_livestock = serializers.IntegerField()
    active_activities = serializers.IntegerField()
    overdue_activities = serializers.IntegerField()
    
    # Crop status breakdown
    crop_status_breakdown = serializers.DictField()
    
    # Livestock type breakdown
    livestock_type_breakdown = serializers.DictField()
    
    # Monthly activity trends
    monthly_activities = serializers.ListField()
    
    # Yield efficiency
    average_yield_efficiency = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    
    # Equipment status
    equipment_status = serializers.DictField()