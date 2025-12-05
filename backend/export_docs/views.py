"""API views for export documentation service."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import (
    DocumentTemplate, ComplianceRule, ExportDocument,
    DocumentVersion, CustomsSubmission
)
from .serializers import (
    DocumentTemplateSerializer, ComplianceRuleSerializer,
    ExportDocumentSerializer, ExportDocumentCreateSerializer,
    DocumentVersionSerializer, CustomsSubmissionSerializer,
    ComplianceCheckSerializer, DocumentGenerationSerializer
)
from .services import (
    DocumentGenerationService, ComplianceService,
    CustomsIntegrationService, TemplateManagementService,
    DocumentVersionService
)
from .permissions import IsDocumentOwnerOrAdmin


class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for document templates."""
    
    queryset = DocumentTemplate.objects.all()
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter templates based on query parameters."""
        queryset = super().get_queryset()
        
        document_type = self.request.query_params.get('document_type')
        country_code = self.request.query_params.get('country_code')
        is_active = self.request.query_params.get('is_active')
        
        if document_type:
            queryset = queryset.filter(document_type=document_type)
        if country_code:
            queryset = queryset.filter(country_code=country_code)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def for_country(self, request):
        """Get template for specific document type and country."""
        document_type = request.query_params.get('document_type')
        country_code = request.query_params.get('country_code')
        
        if not document_type or not country_code:
            return Response(
                {'error': 'document_type and country_code are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        template = TemplateManagementService.get_template_for_country(
            document_type, country_code
        )
        
        if not template:
            return Response(
                {'error': 'No template found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(template)
        return Response(serializer.data)


class ComplianceRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for compliance rules."""
    
    queryset = ComplianceRule.objects.all()
    serializer_class = ComplianceRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter rules based on query parameters."""
        queryset = super().get_queryset()
        
        country_code = self.request.query_params.get('country_code')
        product_category = self.request.query_params.get('product_category')
        is_active = self.request.query_params.get('is_active')
        
        if country_code:
            queryset = queryset.filter(country_code=country_code)
        if product_category:
            queryset = queryset.filter(
                Q(product_category='') | Q(product_category=product_category)
            )
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Only show active rules within effective dates
        queryset = queryset.filter(
            effective_date__lte=timezone.now().date()
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=timezone.now().date())
        )
        
        return queryset


class ExportDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for export documents."""
    
    queryset = ExportDocument.objects.all()
    permission_classes = [IsAuthenticated, IsDocumentOwnerOrAdmin]
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return ExportDocumentCreateSerializer
        return ExportDocumentSerializer
    
    def get_queryset(self):
        """Filter documents for current user."""
        # Short-circuit for schema generation
        if getattr(self, 'swagger_fake_view', False):
            return ExportDocument.objects.none()
        queryset = super().get_queryset()
        
        # Non-admin users can only see their own documents
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by destination country
        country = self.request.query_params.get('destination_country')
        if country:
            queryset = queryset.filter(destination_country=country)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset.select_related('template', 'user')
    
    def perform_create(self, serializer):
        """Create document with generation."""
        document = DocumentGenerationService.create_and_generate(
            user=self.request.user,
            data=serializer.validated_data
        )
        return document
    
    @action(detail=True, methods=['post'])
    def check_compliance(self, request, pk=None):
        """Check document compliance."""
        document = self.get_object()
        
        is_compliant, issues, warnings = ComplianceService.check_compliance(document)
        
        return Response({
            'is_compliant': is_compliant,
            'issues': issues,
            'warnings': warnings,
            'checked_at': timezone.now()
        })
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate document file."""
        document = self.get_object()
        
        # Get format from request
        serializer = DocumentGenerationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        format_type = serializer.validated_data.get('format', 'PDF')
        
        # Generate new file
        content = DocumentGenerationService.generate_document(document, format_type)
        filename = f"{document.document_number}.{format_type.lower()}"
        
        from django.core.files.base import ContentFile
        document.generated_file.save(filename, ContentFile(content))
        
        # Update signature if requested
        if serializer.validated_data.get('include_signature', True):
            document.digital_signature = DocumentGenerationService.sign_document(
                document, content
            )
        
        document.save()
        
        # Create version
        DocumentVersionService.create_version(
            document,
            request.user,
            f"Regenerated in {format_type} format"
        )
        
        return Response(ExportDocumentSerializer(document).data)
    
    @action(detail=True, methods=['post'])
    def submit_to_customs(self, request, pk=None):
        """Submit document to customs system."""
        document = self.get_object()
        
        # Check if document is approved
        if document.status not in ['APPROVED', 'DRAFT']:
            return Response(
                {'error': 'Document must be approved before submission'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check compliance
        if not document.compliance_checked:
            is_compliant, issues, warnings = ComplianceService.check_compliance(document)
            if not is_compliant:
                return Response(
                    {
                        'error': 'Document has compliance issues',
                        'issues': issues
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get customs system from request
        customs_system = request.data.get('customs_system', 'DEFAULT')
        
        # Submit to customs
        submission = CustomsIntegrationService.submit_to_customs(
            document, customs_system
        )
        
        return Response(CustomsSubmissionSerializer(submission).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve document."""
        document = self.get_object()
        
        if document.status != 'PENDING_REVIEW':
            return Response(
                {'error': 'Only documents pending review can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.status = 'APPROVED'
        document.save()
        
        return Response(ExportDocumentSerializer(document).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject document."""
        document = self.get_object()
        
        if document.status != 'PENDING_REVIEW':
            return Response(
                {'error': 'Only documents pending review can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document.status = 'REJECTED'
        document.save()
        
        return Response(ExportDocumentSerializer(document).data)
    
    @action(detail=True, methods=['get'])
    def versions(self, request, pk=None):
        """Get document version history."""
        document = self.get_object()
        versions = document.versions.all()
        serializer = DocumentVersionSerializer(versions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get document statistics."""
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_status': {},
            'by_country': {},
            'by_type': {}
        }
        
        # Count by status
        for status_choice in ExportDocument.STATUS_CHOICES:
            status_code = status_choice[0]
            count = queryset.filter(status=status_code).count()
            stats['by_status'][status_code] = count
        
        # Count by destination country
        countries = queryset.values_list('destination_country', flat=True).distinct()
        for country in countries:
            count = queryset.filter(destination_country=country).count()
            stats['by_country'][country] = count
        
        # Count by document type
        types = queryset.values_list('template__document_type', flat=True).distinct()
        for doc_type in types:
            count = queryset.filter(template__document_type=doc_type).count()
            stats['by_type'][doc_type] = count
        
        return Response(stats)


class CustomsSubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for customs submissions."""
    
    queryset = CustomsSubmission.objects.all()
    serializer_class = CustomsSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter submissions for current user's documents."""
        queryset = super().get_queryset()
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(document__user=self.request.user)
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.select_related('document', 'document__template')
    
    @action(detail=True, methods=['get'])
    def check_status(self, request, pk=None):
        """Check current status of submission."""
        submission = self.get_object()
        status_info = CustomsIntegrationService.check_submission_status(submission)
        return Response(status_info)
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry failed submission."""
        submission = self.get_object()
        
        if submission.status not in ['FAILED', 'RETRY']:
            return Response(
                {'error': 'Only failed submissions can be retried'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Retry submission
        new_submission = CustomsIntegrationService.submit_to_customs(
            submission.document,
            submission.customs_system
        )
        
        return Response(CustomsSubmissionSerializer(new_submission).data)
