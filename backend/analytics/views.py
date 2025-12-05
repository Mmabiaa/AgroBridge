"""
Analytics Service Views
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
import logging

from .models import DashboardMetric, PredictionModel, Prediction, Report, Insight
from .serializers import (
    DashboardMetricSerializer, PredictionModelSerializer,
    PredictionSerializer, ReportSerializer, ReportCreateSerializer,
    InsightSerializer
)
from .services import (
    DashboardService, PredictiveAnalyticsService,
    TimeSeriesAnalysisService, InsightGenerationService
)

# Import tasks conditionally
try:
    from .tasks import generate_report_task
except ImportError:
    generate_report_task = None

logger = logging.getLogger(__name__)


class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard metrics
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """
        Get dashboard overview with all key metrics
        """
        days = int(request.query_params.get('days', 30))
        
        dashboard_service = DashboardService(user=request.user)
        
        # Get all metrics
        farm_performance = dashboard_service.get_farm_performance(days)
        marketplace_stats = dashboard_service.get_marketplace_stats(days)
        user_activity = dashboard_service.get_user_activity(days)
        financial_summary = dashboard_service.get_financial_summary(days)
        
        return Response({
            'farm_performance': farm_performance,
            'marketplace_stats': marketplace_stats,
            'user_activity': user_activity,
            'financial_summary': financial_summary,
            'period_days': days
        })
    
    @action(detail=False, methods=['get'])
    def farm_performance(self, request):
        """Get farm performance metrics"""
        days = int(request.query_params.get('days', 30))
        
        dashboard_service = DashboardService(user=request.user)
        data = dashboard_service.get_farm_performance(days)
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def marketplace_stats(self, request):
        """Get marketplace statistics"""
        days = int(request.query_params.get('days', 30))
        
        dashboard_service = DashboardService(user=request.user)
        data = dashboard_service.get_marketplace_stats(days)
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        """Get user activity metrics"""
        days = int(request.query_params.get('days', 30))
        
        dashboard_service = DashboardService(user=request.user)
        data = dashboard_service.get_user_activity(days)
        
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def financial_summary(self, request):
        """Get financial summary"""
        days = int(request.query_params.get('days', 30))
        
        dashboard_service = DashboardService(user=request.user)
        data = dashboard_service.get_financial_summary(days)
        
        return Response(data)


class PredictiveAnalyticsViewSet(viewsets.ViewSet):
    """
    ViewSet for predictive analytics
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def predict_yield(self, request):
        """
        Predict crop yield
        
        Request body:
        {
            "crop_type": "tomato",
            "area": 100.0,
            "soil_type": "loamy",
            "irrigation": true
        }
        """
        service = PredictiveAnalyticsService()
        prediction = service.predict_yield(request.data)
        
        return Response(prediction)
    
    @action(detail=False, methods=['post'])
    def predict_price(self, request):
        """
        Predict market price
        
        Request body:
        {
            "product_name": "tomatoes",
            "quality_grade": "premium"
        }
        """
        service = PredictiveAnalyticsService()
        prediction = service.predict_market_price(request.data)
        
        return Response(prediction)
    
    @action(detail=False, methods=['post'])
    def forecast_demand(self, request):
        """
        Forecast product demand
        
        Request body:
        {
            "product_id": "uuid",
            "days": 30
        }
        """
        days = request.data.get('days', 30)
        service = PredictiveAnalyticsService()
        forecast = service.forecast_demand(request.data, days)
        
        return Response(forecast)


class TimeSeriesViewSet(viewsets.ViewSet):
    """
    ViewSet for time-series analysis
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def sensor_trends(self, request):
        """
        Analyze sensor data trends
        
        Query params:
        - device_id: IoT device ID
        - metric: sensor metric (temperature, humidity, etc.)
        - days: analysis period (default: 30)
        """
        device_id = request.query_params.get('device_id')
        metric = request.query_params.get('metric')
        days = int(request.query_params.get('days', 30))
        
        if not device_id or not metric:
            return Response(
                {'error': 'device_id and metric are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = TimeSeriesAnalysisService()
        analysis = service.analyze_sensor_trends(device_id, metric, days)
        
        return Response(analysis)
    
    @action(detail=False, methods=['get'])
    def crop_health_trends(self, request):
        """
        Analyze crop health trends
        
        Query params:
        - field_id: Field ID
        - days: analysis period (default: 30)
        """
        field_id = request.query_params.get('field_id')
        days = int(request.query_params.get('days', 30))
        
        if not field_id:
            return Response(
                {'error': 'field_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        service = TimeSeriesAnalysisService()
        analysis = service.analyze_crop_health_trends(field_id, days)
        
        return Response(analysis)
    
    @action(detail=False, methods=['get'])
    def financial_trends(self, request):
        """
        Analyze financial trends
        
        Query params:
        - days: analysis period (default: 30)
        """
        days = int(request.query_params.get('days', 30))
        
        service = TimeSeriesAnalysisService()
        analysis = service.analyze_financial_trends(request.user, days)
        
        return Response(analysis)


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet for report generation and management
    """
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get reports for current user"""
        return Report.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return ReportCreateSerializer
        return ReportSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Create a new report generation request
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create report record
        report = serializer.save(
            user=request.user,
            status='pending',
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Queue report generation task
        try:
            if generate_report_task and hasattr(generate_report_task, 'delay'):
                generate_report_task.delay(str(report.id))
                logger.info(f"Report generation queued for report {report.id}")
            else:
                logger.warning("Celery not available, report will not be generated automatically")
        except Exception as e:
            logger.error(f"Failed to queue report generation: {e}")
        
        return Response(
            ReportSerializer(report).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Download generated report
        """
        report = self.get_object()
        
        if report.status != 'completed':
            return Response(
                {'error': 'Report is not ready yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not report.file_path:
            return Response(
                {'error': 'Report file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # In production, this would return a file download response
        # For now, return the file path
        return Response({
            'file_path': report.file_path,
            'file_size': report.file_size,
            'format': report.format
        })


class InsightViewSet(viewsets.ModelViewSet):
    """
    ViewSet for actionable insights
    """
    serializer_class = InsightSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get insights for current user"""
        queryset = Insight.objects.filter(user=self.request.user)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read_bool = is_read.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_read=is_read_bool)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by type
        insight_type = self.request.query_params.get('type')
        if insight_type:
            queryset = queryset.filter(insight_type=insight_type)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark insight as read"""
        insight = self.get_object()
        insight.is_read = True
        insight.save()
        
        return Response({'message': 'Insight marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_acted_upon(self, request, pk=None):
        """Mark insight as acted upon"""
        insight = self.get_object()
        insight.is_acted_upon = True
        insight.save()
        
        return Response({'message': 'Insight marked as acted upon'})
    
    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss insight"""
        insight = self.get_object()
        insight.dismissed_at = timezone.now()
        insight.save()
        
        return Response({'message': 'Insight dismissed'})
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate new insights for the user
        """
        service = InsightGenerationService()
        
        # Generate different types of insights
        recommendations = service.generate_farming_recommendations(request.user)
        warnings = service.generate_risk_warnings(request.user)
        opportunities = service.generate_optimization_opportunities(request.user)
        
        all_insights = recommendations + warnings + opportunities
        
        serializer = self.get_serializer(all_insights, many=True)
        
        return Response({
            'message': f'Generated {len(all_insights)} new insights',
            'insights': serializer.data
        })


class PredictionModelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing prediction models (read-only for users)
    """
    queryset = PredictionModel.objects.filter(status='active')
    serializer_class = PredictionModelSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get model performance metrics"""
        model = self.get_object()
        
        return Response({
            'model_name': model.name,
            'version': model.version,
            'accuracy': float(model.accuracy) if model.accuracy else None,
            'precision': float(model.precision) if model.precision else None,
            'recall': float(model.recall) if model.recall else None,
            'f1_score': float(model.f1_score) if model.f1_score else None,
            'mae': float(model.mae) if model.mae else None,
            'rmse': float(model.rmse) if model.rmse else None,
            'training_data_size': model.training_data_size
        })
