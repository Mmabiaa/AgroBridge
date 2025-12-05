"""
Serializers for crop detection models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Disease, Treatment, CropScan, ScanHistory, ExpertReview

User = get_user_model()


class DiseaseSerializer(serializers.ModelSerializer):
    """Serializer for Disease model"""
    treatments_count = serializers.ReadOnlyField(source='treatments.count')
    
    class Meta:
        model = Disease
        fields = [
            'id', 'name', 'scientific_name', 'common_names', 'category',
            'description', 'symptoms', 'visual_indicators', 'affected_crops',
            'typical_severity', 'spread_rate', 'seasonal_pattern',
            'favorable_conditions', 'prevention_methods', 'organic_treatments',
            'chemical_treatments', 'reference_images', 'external_links',
            'confidence_threshold', 'is_active', 'treatments_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'treatments_count']


class TreatmentSerializer(serializers.ModelSerializer):
    """Serializer for Treatment model"""
    disease_name = serializers.ReadOnlyField(source='disease.name')
    
    class Meta:
        model = Treatment
        fields = [
            'id', 'disease', 'disease_name', 'name', 'treatment_type', 'method',
            'description', 'detailed_instructions', 'application_method',
            'timing', 'frequency', 'duration', 'materials_needed',
            'dosage_instructions', 'effectiveness_rating', 'safety_precautions',
            'environmental_impact', 'estimated_cost', 'availability',
            'suitable_crops', 'weather_conditions', 'growth_stage',
            'expected_results', 'success_indicators', 'is_recommended',
            'requires_expert', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CropScanSerializer(serializers.ModelSerializer):
    """Serializer for CropScan model"""
    user_name = serializers.ReadOnlyField(source='user.username')
    primary_disease = serializers.SerializerMethodField()
    recommended_treatments = TreatmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = CropScan
        fields = [
            'id', 'user', 'user_name', 'image', 'image_metadata',
            'crop_type', 'crop_variety', 'growth_stage', 'location_data',
            'environmental_conditions', 'status', 'detected_diseases',
            'health_score', 'model_version', 'processing_time_ms',
            'confidence_scores', 'recommended_treatments', 'ai_recommendations',
            'user_confirmed_disease', 'user_feedback', 'accuracy_rating',
            'treatment_applied', 'error_message', 'created_at', 'completed_at',
            'primary_disease'
        ]
        read_only_fields = [
            'id', 'status', 'detected_diseases', 'health_score',
            'model_version', 'processing_time_ms', 'confidence_scores',
            'ai_recommendations', 'error_message', 'created_at', 'completed_at'
        ]
    
    def get_primary_disease(self, obj):
        """Get the primary detected disease"""
        primary_disease = obj.get_primary_disease()
        if primary_disease:
            return {
                'id': primary_disease.id,
                'name': primary_disease.name,
                'category': primary_disease.category,
                'typical_severity': primary_disease.typical_severity
            }
        return None


class CropScanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating crop scans"""
    
    class Meta:
        model = CropScan
        fields = [
            'image', 'crop_type', 'crop_variety', 'growth_stage',
            'location_data', 'environmental_conditions'
        ]
    
    def validate_image(self, value):
        """Validate uploaded image"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file too large (max 10MB)")
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Unsupported image format. Allowed: {', '.join(allowed_types)}"
            )
        
        return value
    
    def create(self, validated_data):
        """Create crop scan with user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CropScanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing crop scans"""
    user_name = serializers.ReadOnlyField(source='user.username')
    diseases_count = serializers.SerializerMethodField()
    
    class Meta:
        model = CropScan
        fields = [
            'id', 'user_name', 'crop_type', 'status', 'health_score',
            'diseases_count', 'accuracy_rating', 'created_at'
        ]
    
    def get_diseases_count(self, obj):
        """Get count of detected diseases"""
        return len(obj.detected_diseases) if obj.detected_diseases else 0


class ScanHistorySerializer(serializers.ModelSerializer):
    """Serializer for ScanHistory model"""
    user_name = serializers.ReadOnlyField(source='user.username')
    most_common_disease_name = serializers.ReadOnlyField(source='most_common_disease.name')
    
    class Meta:
        model = ScanHistory
        fields = [
            'user', 'user_name', 'total_scans', 'successful_scans', 'failed_scans',
            'diseases_detected', 'most_common_disease', 'most_common_disease_name',
            'crops_scanned', 'average_accuracy_rating', 'total_feedback_count',
            'average_health_score', 'health_trend', 'first_scan_date',
            'last_scan_date', 'updated_at'
        ]
        read_only_fields = [
            'total_scans', 'successful_scans', 'failed_scans', 'diseases_detected',
            'most_common_disease', 'crops_scanned', 'average_accuracy_rating',
            'total_feedback_count', 'average_health_score', 'health_trend',
            'first_scan_date', 'last_scan_date', 'updated_at'
        ]


class ExpertReviewSerializer(serializers.ModelSerializer):
    """Serializer for ExpertReview model"""
    reviewer_name = serializers.ReadOnlyField(source='reviewer.username')
    scan_info = serializers.SerializerMethodField()
    expert_diagnosis_name = serializers.ReadOnlyField(source='expert_diagnosis.name')
    
    class Meta:
        model = ExpertReview
        fields = [
            'id', 'scan', 'scan_info', 'reviewer', 'reviewer_name', 'status',
            'expert_diagnosis', 'expert_diagnosis_name', 'confidence_in_ai',
            'review_comments', 'recommendations', 'corrected_health_score',
            'ai_accuracy_assessment', 'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'created_at', 'reviewed_at']
    
    def get_scan_info(self, obj):
        """Get basic scan information"""
        return {
            'id': obj.scan.id,
            'crop_type': obj.scan.crop_type,
            'user': obj.scan.user.username,
            'created_at': obj.scan.created_at
        }


class ScanFeedbackSerializer(serializers.Serializer):
    """Serializer for scan feedback"""
    user_confirmed_disease = serializers.UUIDField(required=False, allow_null=True)
    user_feedback = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    accuracy_rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    treatment_applied = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )


class DiseaseSearchSerializer(serializers.Serializer):
    """Serializer for disease search parameters"""
    query = serializers.CharField(max_length=200, required=False)
    category = serializers.ChoiceField(
        choices=Disease.CATEGORY_CHOICES,
        required=False
    )
    crop_type = serializers.CharField(max_length=50, required=False)
    severity = serializers.ChoiceField(
        choices=Disease.SEVERITY_CHOICES,
        required=False
    )


class TreatmentRecommendationSerializer(serializers.Serializer):
    """Serializer for treatment recommendation requests"""
    disease_id = serializers.UUIDField()
    crop_type = serializers.CharField(max_length=50, required=False)
    organic_only = serializers.BooleanField(default=False)
    growth_stage = serializers.CharField(max_length=50, required=False)
    weather_conditions = serializers.CharField(max_length=200, required=False)


class ImageAnalysisSerializer(serializers.Serializer):
    """Serializer for image analysis requests"""
    image = serializers.ImageField()
    crop_type = serializers.ChoiceField(
        choices=CropScan.CROP_TYPE_CHOICES,
        required=False
    )
    location = serializers.JSONField(required=False)
    
    def validate_image(self, value):
        """Validate uploaded image"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file too large (max 10MB)")
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError(
                f"Unsupported image format. Allowed: {', '.join(allowed_types)}"
            )
        
        return value