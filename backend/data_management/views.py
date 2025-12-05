"""
Data Management Service Views
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
import logging

from .models import (
    DataRetentionPolicy, DataDeletionLog, GDPRRequest,
    UserConsent, DataExport, DataProcessingRecord
)
from .serializers import (
    DataRetentionPolicySerializer, DataDeletionLogSerializer,
    GDPRRequestSerializer, GDPRRequestCreateSerializer,
    UserConsentSerializer, UserConsentUpdateSerializer,
    DataExportSerializer, DataProcessingRecordSerializer
)
from .services import (
    DataRetentionService, GDPRService, DataExportService
)

logger = logging.getLogger(__name__)


class DataRetentionPolicyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing data retention policies."""
    
    queryset = DataRetentionPolicy.objects.all()
    serializer_class = DataRetentionPolicySerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=False, methods=['post'])
    def apply_policies(self, request):
        """Apply all active retention policies."""
        try:
            service = DataRetentionService()
            results = service.apply_all_policies()
            return Response({
                'message': 'Retention policies applied successfully',
                'results': results
            })
        except Exception as e:
            logger.error(f"Error applying retention policies: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DataDeletionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing data deletion logs."""
    
    queryset = DataDeletionLog.objects.all()
    serializer_class = DataDeletionLogSerializer
    permission_classes = [permissions.IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        data_type = self.request.query_params.get('data_type')
        if data_type:
            queryset = queryset.filter(data_type=data_type)
        return queryset


class GDPRRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for managing GDPR requests."""
    
    queryset = GDPRRequest.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return GDPRRequestCreateSerializer
        return GDPRRequestSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return GDPRRequest.objects.all()
        return GDPRRequest.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def process(self, request, pk=None):
        """Process a GDPR request."""
        gdpr_request = self.get_object()
        
        try:
            service = GDPRService()
            result = service.process_request(gdpr_request)
            
            return Response({
                'message': 'GDPR request processed successfully',
                'result': result
            })
        except Exception as e:
            logger.error(f"Error processing GDPR request: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue GDPR requests."""
        deadline = timezone.now() - timedelta(days=30)
        overdue_requests = GDPRRequest.objects.filter(
            status__in=['pending', 'processing'],
            requested_at__lt=deadline
        )
        serializer = self.get_serializer(overdue_requests, many=True)
        return Response(serializer.data)


class UserConsentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user consents."""
    
    queryset = UserConsent.objects.all()
    serializer_class = UserConsentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff and self.request.query_params.get('all'):
            return UserConsent.objects.all()
        return UserConsent.objects.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def update_consent(self, request):
        """Update user consent."""
        serializer = UserConsentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        user = request.user
        
        consent, created = UserConsent.objects.get_or_create(
            user=user,
            consent_type=data['consent_type'],
            version=data['version'],
            defaults={
                'granted': data['granted'],
                'granted_at': timezone.now() if data['granted'] else None,
                'ip_address': request.META.get('REMOTE_ADDR'),
                'user_agent': request.META.get('HTTP_USER_AGENT', '')
            }
        )
        
        if not created:
            consent.granted = data['granted']
            if data['granted']:
                consent.granted_at = timezone.now()
                consent.withdrawn_at = None
            else:
                consent.withdrawn_at = timezone.now()
            consent.save()
        
        return Response(
            UserConsentSerializer(consent).data,
            status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_consents(self, request):
        """Get current user's consents."""
        consents = UserConsent.objects.filter(user=request.user)
        serializer = self.get_serializer(consents, many=True)
        return Response(serializer.data)


class DataExportViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for managing data exports."""
    
    queryset = DataExport.objects.all()
    serializer_class = DataExportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return DataExport.objects.all()
        return DataExport.objects.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def request_export(self, request):
        """Request a data export."""
        try:
            service = DataExportService()
            export = service.create_export_request(request.user)
            
            return Response(
                DataExportSerializer(export).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error creating data export: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a data export."""
        export = self.get_object()
        
        if export.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if export.is_expired:
            return Response(
                {'error': 'Export has expired'},
                status=status.HTTP_410_GONE
            )
        
        if export.status != 'completed':
            return Response(
                {'error': 'Export is not ready yet'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Increment download count
        export.download_count += 1
        export.save()
        
        # Return file URL or path
        return Response({
            'download_url': export.file_path,
            'expires_at': export.expires_at
        })


class DataProcessingRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for managing data processing records."""
    
    queryset = DataProcessingRecord.objects.all()
    serializer_class = DataProcessingRecordSerializer
    permission_classes = [permissions.IsAdminUser]
    
    @action(detail=False, methods=['get'])
    def by_service(self, request):
        """Get processing records grouped by service."""
        service_name = request.query_params.get('service')
        if service_name:
            records = DataProcessingRecord.objects.filter(service_name=service_name)
        else:
            records = DataProcessingRecord.objects.all()
        
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data)
