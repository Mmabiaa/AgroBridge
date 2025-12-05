"""
Analytics Service Admin
"""
from django.contrib import admin
from .models import DashboardMetric, PredictionModel, Prediction, Report, Insight


@admin.register(DashboardMetric)
class DashboardMetricAdmin(admin.ModelAdmin):
    """Admin for dashboard metrics"""
    list_display = ['metric_type', 'user', 'period_start', 'period_end', 'calculated_at', 'is_expired']
    list_filter = ['metric_type', 'is_cached', 'calculated_at']
    search_fields = ['user__username', 'metric_type']
    readonly_fields = ['calculated_at']
    date_hierarchy = 'calculated_at'


@admin.register(PredictionModel)
class PredictionModelAdmin(admin.ModelAdmin):
    """Admin for prediction models"""
    list_display = ['name', 'model_type', 'version', 'status', 'accuracy', 'deployed_at']
    list_filter = ['model_type', 'status', 'deployed_at']
    search_fields = ['name', 'version', 'algorithm']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'model_type', 'version', 'status', 'description', 'algorithm')
        }),
        ('Hyperparameters', {
            'fields': ('hyperparameters',)
        }),
        ('Performance Metrics', {
            'fields': ('accuracy', 'precision', 'recall', 'f1_score', 'mae', 'rmse')
        }),
        ('Training Information', {
            'fields': ('training_data_size', 'training_started_at', 'training_completed_at')
        }),
        ('Deployment', {
            'fields': ('deployed_at', 'deprecated_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Prediction)
class PredictionAdmin(admin.ModelAdmin):
    """Admin for predictions"""
    list_display = ['model', 'user', 'confidence_score', 'is_accurate', 'predicted_at']
    list_filter = ['model', 'is_accurate', 'predicted_at']
    search_fields = ['user__username', 'model__name']
    readonly_fields = ['predicted_at', 'verified_at']
    date_hierarchy = 'predicted_at'


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Admin for reports"""
    list_display = ['title', 'user', 'report_type', 'format', 'status', 'created_at']
    list_filter = ['report_type', 'format', 'status', 'created_at']
    search_fields = ['title', 'user__username']
    readonly_fields = ['created_at', 'generated_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'report_type', 'title', 'description')
        }),
        ('Parameters', {
            'fields': ('parameters', 'period_start', 'period_end')
        }),
        ('Output', {
            'fields': ('format', 'file_path', 'file_size')
        }),
        ('Status', {
            'fields': ('status', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'generated_at', 'expires_at')
        }),
    )


@admin.register(Insight)
class InsightAdmin(admin.ModelAdmin):
    """Admin for insights"""
    list_display = ['title', 'user', 'insight_type', 'priority', 'is_read', 'created_at']
    list_filter = ['insight_type', 'priority', 'is_read', 'is_acted_upon', 'created_at']
    search_fields = ['title', 'description', 'user__username']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'insight_type', 'priority', 'title', 'description')
        }),
        ('Actions', {
            'fields': ('recommended_actions',)
        }),
        ('Context', {
            'fields': ('context_data', 'source_metric')
        }),
        ('Status', {
            'fields': ('is_read', 'is_acted_upon', 'dismissed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at')
        }),
    )
