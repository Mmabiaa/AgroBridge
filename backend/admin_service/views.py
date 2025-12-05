from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    SystemConfiguration, FeatureFlag, ModerationQueue,
    AuditLog, SecurityIncident, PlatformMetrics, UserActivity
)
from .serializers import (
    UserManagementSerializer, SystemConfigurationSerializer,
    FeatureFlagSerializer, ModerationQueueSerializer,
    ModerationActionSerializer, AuditLogSerializer,
    SecurityIncidentSerializer, PlatformMetricsSerializer,
    UserActivitySerializer, DashboardStatsSerializer,
    UserRoleUpdateSerializer, BulkModerationSerializer
)
from .permissions import IsAdminOrReadOnly, IsSuperAdmin
from .services import (
    UserManagementService, ModerationService,
    SecurityMonitoringService, AnalyticsService
)

User = get_user_model()


class UserManagementViewSet(viewsets.ModelViewSet):
    """ViewSet for user management"""
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'last_login', 'username']
    filterset_fields = ['is_active', 'is_staff']

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account"""
        user = self.get_object()
        result = UserManagementService.activate_user(user, request.user)
        return Response(result)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account"""
        user = self.get_object()
        result = UserManagementService.deactivate_user(user, request.user)
        return Response(result)

    @action(detail=True, methods=['post'])
    def update_role(self, request, pk=None):
        """Update user role"""
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = UserManagementService.update_user_role(
            user, 
            serializer.validated_data['role'],
            request.user
        )
        return Response(result)

    @action(detail=True, methods=['get'])
    def activity_log(self, request, pk=None):
        """Get user activity log"""
        user = self.get_object()
        activities = UserActivity.objects.filter(user=user)[:50]
        serializer = UserActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user statistics"""
        stats = UserManagementService.get_user_statistics()
        return Response(stats)


class SystemConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for system configuration"""
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [IsSuperAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['key', 'description']
    filterset_fields = ['category', 'is_sensitive']

    def perform_create(self, serializer):
        """Set updated_by on create"""
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        """Set updated_by on update"""
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all configuration categories"""
        categories = SystemConfiguration.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))


class FeatureFlagViewSet(viewsets.ModelViewSet):
    """ViewSet for feature flags"""
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['is_enabled']

    def perform_create(self, serializer):
        """Set created_by on create"""
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle feature flag"""
        flag = self.get_object()
        flag.is_enabled = not flag.is_enabled
        flag.save()
        serializer = self.get_serializer(flag)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_users(self, request, pk=None):
        """Add users to feature flag"""
        flag = self.get_object()
        user_ids = request.data.get('user_ids', [])
        users = User.objects.filter(id__in=user_ids)
        flag.target_users.add(*users)
        serializer = self.get_serializer(flag)
        return Response(serializer.data)


class ModerationQueueViewSet(viewsets.ModelViewSet):
    """ViewSet for content moderation"""
    queryset = ModerationQueue.objects.all()
    serializer_class = ModerationQueueSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'moderation_type', 'priority']
    ordering_fields = ['priority', 'created_at']

    @action(detail=True, methods=['post'])
    def moderate(self, request, pk=None):
        """Moderate a content item"""
        item = self.get_object()
        serializer = ModerationActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = ModerationService.moderate_content(
            item,
            serializer.validated_data['action'],
            request.user,
            serializer.validated_data.get('review_notes', '')
        )
        return Response(result)

    @action(detail=False, methods=['post'])
    def bulk_moderate(self, request):
        """Bulk moderation action"""
        serializer = BulkModerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = ModerationService.bulk_moderate(
            serializer.validated_data['item_ids'],
            serializer.validated_data['action'],
            request.user,
            serializer.validated_data.get('review_notes', '')
        )
        return Response(result)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get moderation statistics"""
        stats = ModerationService.get_moderation_statistics()
        return Response(stats)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for audit logs (read-only)"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'user__username']
    filterset_fields = ['action_type', 'user']
    ordering_fields = ['timestamp']

    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export audit logs"""
        # Get filtered queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Limit to date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(timestamp__gte=start_date)
        if end_date:
            queryset = queryset.filter(timestamp__lte=end_date)
        
        # Serialize and return
        serializer = self.get_serializer(queryset[:1000], many=True)
        return Response({
            'count': queryset.count(),
            'logs': serializer.data
        })


class SecurityIncidentViewSet(viewsets.ModelViewSet):
    """ViewSet for security incidents"""
    queryset = SecurityIncident.objects.all()
    serializer_class = SecurityIncidentSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['severity', 'status', 'incident_type']
    ordering_fields = ['severity', 'detected_at']

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign incident to admin"""
        incident = self.get_object()
        admin_id = request.data.get('admin_id')
        
        if admin_id:
            admin = User.objects.get(id=admin_id, is_staff=True)
            incident.assigned_to = admin
        else:
            incident.assigned_to = request.user
        
        incident.status = 'investigating'
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve security incident"""
        incident = self.get_object()
        incident.status = 'resolved'
        incident.resolution = request.data.get('resolution', '')
        incident.resolved_at = timezone.now()
        incident.save()
        
        serializer = self.get_serializer(incident)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get security statistics"""
        stats = SecurityMonitoringService.get_security_statistics()
        return Response(stats)


class PlatformMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for platform metrics"""
    queryset = PlatformMetrics.objects.all()
    serializer_class = PlatformMetricsSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['metric_name', 'category']
    ordering_fields = ['timestamp']

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest metrics by category"""
        category = request.query_params.get('category')
        
        if category:
            metrics = PlatformMetrics.objects.filter(category=category)
        else:
            metrics = PlatformMetrics.objects.all()
        
        # Get latest metric for each metric_name
        latest_metrics = {}
        for metric in metrics.order_by('-timestamp'):
            if metric.metric_name not in latest_metrics:
                latest_metrics[metric.metric_name] = metric
        
        serializer = self.get_serializer(latest_metrics.values(), many=True)
        return Response(serializer.data)


class DashboardViewSet(viewsets.ViewSet):
    """ViewSet for admin dashboard"""
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get dashboard overview"""
        stats = AnalyticsService.get_dashboard_overview()
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def user_growth(self, request):
        """Get user growth metrics"""
        days = int(request.query_params.get('days', 30))
        data = AnalyticsService.get_user_growth(days)
        return Response(data)

    @action(detail=False, methods=['get'])
    def platform_health(self, request):
        """Get platform health metrics"""
        health = AnalyticsService.get_platform_health()
        return Response(health)

    @action(detail=False, methods=['get'])
    def error_rates(self, request):
        """Get error rate metrics"""
        hours = int(request.query_params.get('hours', 24))
        data = AnalyticsService.get_error_rates(hours)
        return Response(data)
