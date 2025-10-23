"""
Admin configuration for crop detection models
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Disease, Treatment, CropScan, ScanHistory, ExpertReview


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'typical_severity', 'is_active', 
        'affected_crops_count', 'treatments_count', 'created_at'
    ]
    list_filter = ['category', 'typical_severity', 'is_active', 'created_at']
    search_fields = ['name', 'scientific_name', 'description', 'symptoms']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'scientific_name', 'common_names', 'category', 'description')
        }),
        ('Symptoms and Identification', {
            'fields': ('symptoms', 'visual_indicators', 'affected_crops')
        }),
        ('Severity and Spread', {
            'fields': ('typical_severity', 'spread_rate', 'seasonal_pattern', 'favorable_conditions')
        }),
        ('Treatment Information', {
            'fields': ('prevention_methods', 'organic_treatments', 'chemical_treatments')
        }),
        ('References and Media', {
            'fields': ('reference_images', 'external_links')
        }),
        ('AI Configuration', {
            'fields': ('confidence_threshold',)
        }),
        ('Status and Metadata', {
            'fields': ('is_active', 'created_by', 'created_at', 'updated_at')
        }),
    )
    
    def affected_crops_count(self, obj):
        return len(obj.affected_crops) if obj.affected_crops else 0
    affected_crops_count.short_description = 'Crops Affected'
    
    def treatments_count(self, obj):
        return obj.treatments.count()
    treatments_count.short_description = 'Treatments'


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'disease', 'treatment_type', 'method', 
        'effectiveness_rating', 'is_recommended', 'requires_expert'
    ]
    list_filter = [
        'treatment_type', 'method', 'is_recommended', 
        'requires_expert', 'disease__category'
    ]
    search_fields = ['name', 'description', 'disease__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('disease', 'name', 'treatment_type', 'method', 'description')
        }),
        ('Instructions', {
            'fields': ('detailed_instructions', 'application_method', 'dosage_instructions')
        }),
        ('Timing and Frequency', {
            'fields': ('timing', 'frequency', 'duration')
        }),
        ('Materials and Safety', {
            'fields': ('materials_needed', 'safety_precautions', 'environmental_impact')
        }),
        ('Effectiveness and Cost', {
            'fields': ('effectiveness_rating', 'estimated_cost', 'availability')
        }),
        ('Conditions and Limitations', {
            'fields': ('suitable_crops', 'weather_conditions', 'growth_stage')
        }),
        ('Success Metrics', {
            'fields': ('expected_results', 'success_indicators')
        }),
        ('Status', {
            'fields': ('is_recommended', 'requires_expert')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(CropScan)
class CropScanAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'crop_type', 'status', 'health_score', 
        'diseases_count', 'accuracy_rating', 'created_at'
    ]
    list_filter = [
        'status', 'crop_type', 'created_at', 'accuracy_rating'
    ]
    search_fields = ['user__username', 'user__email', 'crop_type', 'crop_variety']
    readonly_fields = [
        'id', 'processing_time_ms', 'created_at', 'completed_at'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'image', 'crop_type', 'crop_variety', 'growth_stage')
        }),
        ('Location and Context', {
            'fields': ('location_data', 'environmental_conditions', 'image_metadata')
        }),
        ('Analysis Results', {
            'fields': ('status', 'health_score', 'detected_diseases', 'confidence_scores')
        }),
        ('AI Processing', {
            'fields': ('model_version', 'processing_time_ms', 'ai_recommendations')
        }),
        ('Recommendations', {
            'fields': ('recommended_treatments',)
        }),
        ('User Feedback', {
            'fields': ('user_confirmed_disease', 'user_feedback', 'accuracy_rating', 'treatment_applied')
        }),
        ('Follow-up', {
            'fields': ('follow_up_scans',)
        }),
        ('Error Handling', {
            'fields': ('error_message',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'completed_at')
        }),
    )
    
    def diseases_count(self, obj):
        return len(obj.detected_diseases) if obj.detected_diseases else 0
    diseases_count.short_description = 'Diseases Detected'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'user_confirmed_disease')


@admin.register(ScanHistory)
class ScanHistoryAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'total_scans', 'successful_scans', 'failed_scans',
        'average_health_score', 'average_accuracy_rating', 'health_trend'
    ]
    list_filter = ['health_trend', 'first_scan_date', 'last_scan_date']
    search_fields = ['user__username', 'user__email']
    readonly_fields = [
        'total_scans', 'successful_scans', 'failed_scans',
        'first_scan_date', 'last_scan_date', 'updated_at'
    ]
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Scan Statistics', {
            'fields': ('total_scans', 'successful_scans', 'failed_scans')
        }),
        ('Disease and Crop Stats', {
            'fields': ('diseases_detected', 'most_common_disease', 'crops_scanned')
        }),
        ('Quality Metrics', {
            'fields': ('average_accuracy_rating', 'total_feedback_count')
        }),
        ('Health Trends', {
            'fields': ('average_health_score', 'health_trend')
        }),
        ('Timestamps', {
            'fields': ('first_scan_date', 'last_scan_date', 'updated_at')
        }),
    )
    
    actions = ['update_statistics']
    
    def update_statistics(self, request, queryset):
        """Update statistics for selected scan histories"""
        for history in queryset:
            history.update_stats()
        self.message_user(request, f"Updated statistics for {queryset.count()} scan histories.")
    update_statistics.short_description = "Update statistics"


@admin.register(ExpertReview)
class ExpertReviewAdmin(admin.ModelAdmin):
    list_display = [
        'scan', 'reviewer', 'status', 'expert_diagnosis',
        'confidence_in_ai', 'ai_accuracy_assessment', 'created_at'
    ]
    list_filter = [
        'status', 'ai_accuracy_assessment', 'confidence_in_ai', 'created_at'
    ]
    search_fields = [
        'scan__user__username', 'reviewer__username', 
        'expert_diagnosis__name', 'review_comments'
    ]
    readonly_fields = ['id', 'created_at', 'reviewed_at']
    
    fieldsets = (
        ('Review Information', {
            'fields': ('scan', 'reviewer', 'status')
        }),
        ('Expert Analysis', {
            'fields': ('expert_diagnosis', 'confidence_in_ai', 'corrected_health_score')
        }),
        ('Comments and Recommendations', {
            'fields': ('review_comments', 'recommendations')
        }),
        ('AI Assessment', {
            'fields': ('ai_accuracy_assessment',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'reviewed_at')
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'scan', 'scan__user', 'reviewer', 'expert_diagnosis'
        )