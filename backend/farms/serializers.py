"""
Serializers for farm management models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Farm, Field, Crop, Livestock, FarmActivity, Equipment, SatelliteImagery

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


class FieldSerializer(serializers.ModelSerializer):
    """Serializer for Field model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    center_coordinates = serializers.ReadOnlyField()
    perimeter_meters = serializers.ReadOnlyField()
    total_crops = serializers.SerializerMethodField()
    
    class Meta:
        model = Field
        fields = [
            'id', 'name', 'description', 'boundary_geojson', 'area_hectares',
            'soil_type', 'soil_ph', 'elevation_meters', 'slope_percentage',
            'irrigation_type', 'has_drainage', 'has_fencing', 'is_active',
            'last_cultivation_date', 'notes', 'created_at', 'updated_at',
            'farm_name', 'center_coordinates', 'perimeter_meters', 'total_crops'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_crops(self, obj):
        """Get total number of active crops in this field"""
        return obj.crops.filter(status__in=['planted', 'growing', 'flowering', 'fruiting']).count()
    
    def validate_boundary_geojson(self, value):
        """Validate GeoJSON structure"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Boundary must be a valid GeoJSON object")
        
        if value.get('type') != 'Polygon':
            raise serializers.ValidationError("GeoJSON must be a Polygon")
        
        coordinates = value.get('coordinates', [])
        if not coordinates or len(coordinates) < 1:
            raise serializers.ValidationError("Polygon must have coordinates")
        
        # Check if first ring has at least 4 points
        first_ring = coordinates[0]
        if len(first_ring) < 4:
            raise serializers.ValidationError("Polygon must have at least 4 coordinate points")
        
        # Check if polygon is closed
        if first_ring[0] != first_ring[-1]:
            raise serializers.ValidationError("Polygon must be closed")
        
        return value
    
    def validate_area_hectares(self, value):
        """Validate field area"""
        if value <= 0:
            raise serializers.ValidationError("Field area must be greater than 0")
        return value


class SatelliteImagerySerializer(serializers.ModelSerializer):
    """Serializer for SatelliteImagery model"""
    field_name = serializers.CharField(source='field.name', read_only=True)
    ndvi_average = serializers.ReadOnlyField()
    evi_average = serializers.ReadOnlyField()
    
    class Meta:
        model = SatelliteImagery
        fields = [
            'id', 'satellite_name', 'imagery_type', 'acquisition_date',
            'cloud_coverage_percentage', 'resolution_meters', 'image_url',
            'thumbnail_url', 'vegetation_indices', 'crop_health_score',
            'stress_indicators', 'is_processed', 'processing_notes',
            'created_at', 'updated_at', 'field_name', 'ndvi_average', 'evi_average'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_vegetation_indices(self, value):
        """Validate vegetation indices data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Vegetation indices must be a valid JSON object")
        return value
    
    def validate_stress_indicators(self, value):
        """Validate stress indicators data"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Stress indicators must be a list")
        return value


class CropSerializer(serializers.ModelSerializer):
    """Serializer for Crop model"""
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    field_name = serializers.CharField(source='field.name', read_only=True)
    days_to_harvest = serializers.ReadOnlyField()
    growth_stage_percentage = serializers.ReadOnlyField()
    yield_efficiency = serializers.ReadOnlyField()
    
    class Meta:
        model = Crop
        fields = [
            'id', 'field', 'name', 'variety', 'scientific_name', 'planting_date',
            'expected_harvest_date', 'actual_harvest_date', 'area_hectares',
            'plants_per_hectare', 'status', 'season', 'expected_yield_kg',
            'actual_yield_kg', 'notes', 'created_at', 'updated_at',
            'farm_name', 'field_name', 'days_to_harvest', 'growth_stage_percentage', 'yield_efficiency'
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