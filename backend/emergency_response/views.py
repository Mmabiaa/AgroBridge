"""API views for emergency response service."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from .models import (
    EmergencyAlert, IncidentReport, AlertAcknowledgment,
    EmergencyGuideline, IncidentAnalytics
)
from .serializers import (
    EmergencyAlertSerializer, EmergencyAlertCreateSerializer,
    IncidentReportSerializer, IncidentReportCreateSerializer,
    AlertAcknowledgmentSerializer, EmergencyGuidelineSerializer,
    IncidentAnalyticsSerializer, AlertBroadcastSerializer
)
from .services import AlertService, BroadcastService, IncidentService, AnalyticsService
from .permissions import IsStaffOrReadOnly, IsReporterOrStaff


class EmergencyAlertViewSet(viewsets.ModelViewSet):
    """ViewSet for emergency alerts."""
    
    queryset = EmergencyAlert.objects.all()
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return EmergencyAlertCreateSerializer
        return EmergencyAlertSerializer
    
    def get_queryset(self):
        """Filter alerts based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by alert type
        alert_type = self.request.query_params.get('alert_type')
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        # Filter by severity
        severity = self.request.query_params.get('severity')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        # Filter by region
        region = self.request.query_params.get('region')
        if region:
            queryset = queryset.filter(
                Q(regions__contains=[region]) | Q(regions=[])
            )
        
        # Filter by district
        district = self.request.query_params.get('district')
        if district:
            queryset = queryset.filter(
                Q(districts__contains=[district]) | Q(districts=[])
            )
        
        # Active alerts only
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(
                status='ACTIVE',
                issued_at__lte=timezone.now()
            ).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
            )
        
        return queryset.select_related('created_by')
    
    def perform_create(self, serializer):
        """Create alert and broadcast it."""
        alert = AlertService.create_alert(
            self.request.user,
            serializer.validated_data
        )
        
        # Auto-broadcast on creation
        BroadcastService.broadcast_alert(
            alert,
            channels=['websocket', 'push', 'email']
        )
        
        return alert
    
    @action(detail=True, methods=['post'])
    def broadcast(self, request, pk=None):
        """Broadcast alert through specified channels."""
        alert = self.get_object()
        
        serializer = AlertBroadcastSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        channels = serializer.validated_data.get('channels', ['websocket', 'push'])
        target_users = serializer.validated_data.get('target_users')
        
        # Get user objects if IDs provided
        users = None
        if target_users:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            users = list(User.objects.filter(id__in=target_users))
        
        results = BroadcastService.broadcast_alert(alert, channels, users)
        
        return Response({
            'message': 'Alert broadcasted successfully',
            'results': results
        })
    
    @action(detail=True, methods=['post'])
    def acknowledge(self, request, pk=None):
        """Acknowledge alert."""
        alert = self.get_object()
        
        location = request.data.get('location')
        notes = request.data.get('notes', '')
        
        acknowledgment = AlertService.acknowledge_alert(
            alert,
            request.user,
            location,
            notes
        )
        
        return Response(AlertAcknowledgmentSerializer(acknowledgment).data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark alert as resolved."""
        alert = self.get_object()
        
        if alert.status != 'ACTIVE':
            return Response(
                {'error': 'Only active alerts can be resolved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert = AlertService.resolve_alert(alert)
        
        return Response(EmergencyAlertSerializer(alert).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel alert."""
        alert = self.get_object()
        
        if alert.status not in ['DRAFT', 'ACTIVE']:
            return Response(
                {'error': 'Only draft or active alerts can be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        alert.status = 'CANCELLED'
        alert.save()
        
        return Response(EmergencyAlertSerializer(alert).data)
    
    @action(detail=True, methods=['get'])
    def acknowledgments(self, request, pk=None):
        """Get alert acknowledgments."""
        alert = self.get_object()
        acknowledgments = alert.acknowledgments.all()
        serializer = AlertAcknowledgmentSerializer(acknowledgments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get active alerts for user's location."""
        region = request.query_params.get('region')
        district = request.query_params.get('district')
        
        alerts = AlertService.get_active_alerts(region, district)
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get alert statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {},
            'by_type': {},
            'by_severity': {}
        }
        
        # Count by status
        for status_choice in EmergencyAlert.STATUS_CHOICES:
            status_code = status_choice[0]
            count = queryset.filter(status=status_code).count()
            stats['by_status'][status_code] = count
        
        # Count by type
        for type_choice in EmergencyAlert.ALERT_TYPES:
            type_code = type_choice[0]
            count = queryset.filter(alert_type=type_code).count()
            stats['by_type'][type_code] = count
        
        # Count by severity
        for severity_choice in EmergencyAlert.SEVERITY_LEVELS:
            severity_code = severity_choice[0]
            count = queryset.filter(severity=severity_code).count()
            stats['by_severity'][severity_code] = count
        
        return Response(stats)


class IncidentReportViewSet(viewsets.ModelViewSet):
    """ViewSet for incident reports."""
    
    queryset = IncidentReport.objects.all()
    permission_classes = [IsAuthenticated, IsReporterOrStaff]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return IncidentReportCreateSerializer
        return IncidentReportSerializer
    
    def get_queryset(self):
        """Filter reports based on query parameters and permissions."""
        # Short-circuit for schema generation
        if getattr(self, 'swagger_fake_view', False):
            return IncidentReport.objects.none()
        queryset = super().get_queryset()
        
        # Non-staff users can only see their own reports
        if not self.request.user.is_staff:
            queryset = queryset.filter(reporter=self.request.user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by incident type
        incident_type = self.request.query_params.get('incident_type')
        if incident_type:
            queryset = queryset.filter(incident_type=incident_type)
        
        # Filter by region
        region = self.request.query_params.get('region')
        if region:
            queryset = queryset.filter(region=region)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(reported_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(reported_at__lte=end_date)
        
        return queryset.select_related('reporter', 'verified_by', 'related_alert')
    
    def perform_create(self, serializer):
        """Create incident report."""
        report = IncidentService.create_report(
            self.request.user,
            serializer.validated_data
        )
        return report
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify incident report."""
        report = self.get_object()
        
        if report.status != 'PENDING':
            return Response(
                {'error': 'Only pending reports can be verified'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        severity = request.data.get('severity_assessment')
        
        report = IncidentService.verify_report(report, request.user, severity)
        
        return Response(IncidentReportSerializer(report).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject incident report."""
        report = self.get_object()
        
        if report.status != 'PENDING':
            return Response(
                {'error': 'Only pending reports can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        report.status = 'REJECTED'
        report.response_notes = request.data.get('reason', '')
        report.save()
        
        return Response(IncidentReportSerializer(report).data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark report as resolved."""
        report = self.get_object()
        
        report.status = 'RESOLVED'
        report.resolved_at = timezone.now()
        report.response_notes = request.data.get('notes', '')
        report.save()
        
        return Response(IncidentReportSerializer(report).data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending reports for review."""
        reports = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(reports, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get incident report statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {},
            'by_type': {},
            'by_region': {}
        }
        
        # Count by status
        for status_choice in IncidentReport.STATUS_CHOICES:
            status_code = status_choice[0]
            count = queryset.filter(status=status_code).count()
            stats['by_status'][status_code] = count
        
        # Count by type
        for type_choice in IncidentReport.INCIDENT_TYPES:
            type_code = type_choice[0]
            count = queryset.filter(incident_type=type_code).count()
            stats['by_type'][type_code] = count
        
        # Count by region
        regions = queryset.values_list('region', flat=True).distinct()
        for region in regions:
            if region:
                count = queryset.filter(region=region).count()
                stats['by_region'][region] = count
        
        return Response(stats)


class EmergencyGuidelineViewSet(viewsets.ModelViewSet):
    """ViewSet for emergency guidelines."""
    
    queryset = EmergencyGuideline.objects.all()
    serializer_class = EmergencyGuidelineSerializer
    permission_classes = [IsAuthenticated, IsStaffOrReadOnly]
    
    def get_queryset(self):
        """Filter guidelines based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by guideline type
        guideline_type = self.request.query_params.get('guideline_type')
        if guideline_type:
            queryset = queryset.filter(guideline_type=guideline_type)
        
        # Filter by region
        region = self.request.query_params.get('region')
        if region:
            queryset = queryset.filter(
                Q(applicable_regions__contains=[region]) | Q(applicable_regions=[])
            )
        
        # Active only
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def for_alert_type(self, request):
        """Get guidelines for specific alert type."""
        alert_type = request.query_params.get('alert_type')
        
        if not alert_type:
            return Response(
                {'error': 'alert_type parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        guidelines = self.get_queryset().filter(
            guideline_type=alert_type,
            is_active=True
        )
        
        serializer = self.get_serializer(guidelines, many=True)
        return Response(serializer.data)


class IncidentAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for incident analytics."""
    
    queryset = IncidentAnalytics.objects.all()
    serializer_class = IncidentAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter analytics based on query parameters."""
        queryset = super().get_queryset()
        
        # Filter by region
        region = self.request.query_params.get('region')
        if region:
            queryset = queryset.filter(region=region)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(period_start__gte=start_date)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate analytics for a time period."""
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        region = request.data.get('region')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse dates
        try:
            start_date = datetime.fromisoformat(start_date).date()
            end_date = datetime.fromisoformat(end_date).date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate analytics
        analytics = AnalyticsService.generate_analytics(start_date, end_date, region)
        
        return Response(IncidentAnalyticsSerializer(analytics).data)
