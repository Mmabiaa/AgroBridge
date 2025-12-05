"""
Analytics Service Serializers
"""
from rest_framework import serializers
from .models import DashboardMetric, PredictionModel, Prediction, Report, Insight


class DashboardMetricSerializer(serializers.ModelSerializer):
    """Serializer for dashboard metrics"""
    
    metric_type_display = serializers.CharField(source='get_metric_type_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = DashboardMetric
        fields = [
            'id', 'metric_type', 'metric_type_display', 'data',
            'period_start', 'period_end', 'calculated_at',
            'is_cached', 'cache_expires_at', 'is_expired'
        ]
        read_only_fields = ['id', 'calculated_at']


class PredictionModelSerializer(serializers.ModelSerializer):
    """Serializer for prediction models"""
    
    model_type_display = serializers.CharField(source='get_model_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PredictionModel
        fields = [
            'id', 'name', 'model_type', 'model_type_display',
            'version', 'status', 'status_display', 'description',
            'algorithm', 'hyperparameters', 'accuracy', 'precision',
            'recall', 'f1_score', 'mae', 'rmse', 'training_data_size',
            'training_started_at', 'training_completed_at',
            'deployed_at', 'deprecated_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PredictionSerializer(serializers.ModelSerializer):
    """Serializer for predictions"""
    
    model_name = serializers.CharField(source='model.name', read_only=True)
    model_version = serializers.CharField(source='model.version', read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'model', 'model_name', 'model_version',
            'input_data', 'prediction_value', 'confidence_score',
            'actual_value', 'is_accurate', 'predicted_at', 'verified_at'
        ]
        read_only_fields = ['id', 'predicted_at']


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for reports"""
    
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    format_display = serializers.CharField(source='get_format_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'report_type_display', 'title',
            'description', 'parameters', 'period_start', 'period_end',
            'format', 'format_display', 'file_path', 'file_size',
            'status', 'status_display', 'error_message',
            'created_at', 'generated_at', 'expires_at'
        ]
        read_only_fields = ['id', 'file_path', 'file_size', 'status', 'created_at', 'generated_at']


class ReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reports"""
    
    class Meta:
        model = Report
        fields = [
            'report_type', 'title', 'description', 'parameters',
            'period_start', 'period_end', 'format'
        ]


class InsightSerializer(serializers.ModelSerializer):
    """Serializer for insights"""
    
    insight_type_display = serializers.CharField(source='get_insight_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    class Meta:
        model = Insight
        fields = [
            'id', 'insight_type', 'insight_type_display', 'priority',
            'priority_display', 'title', 'description', 'recommended_actions',
            'context_data', 'source_metric', 'is_read', 'is_acted_upon',
            'dismissed_at', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at']
