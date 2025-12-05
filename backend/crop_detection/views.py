"""
API views for crop detection functionality
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.core.files.base import ContentFile
import logging
import uuid

from .models import Disease, Treatment, CropScan, ScanHistory, ExpertReview
from .serializers import (
    DiseaseSerializer, TreatmentSerializer, CropScanSerializer,
    CropScanCreateSerializer, CropScanListSerializer, ScanHistorySerializer,
    ExpertReviewSerializer, ScanFeedbackSerializer, DiseaseSearchSerializer,
    TreatmentRecommendationSerializer, ImageAnalysisSerializer
)
from .image_analysis import ImageAnalysisService
from .permissions import IsOwnerOrReadOnly, CanAccessCropDetection

logger = logging.getLogger(__name__)


class DiseaseViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing disease information
    """
    serializer_class = DiseaseSerializer
    permission_classes = [IsAuthenticated, CanAccessCropDetection]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'typical_severity', 'is_active']
    search_fields = ['name', 'scientific_name', 'description', 'symptoms']
    ordering_fields = ['name', 'typical_severity', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter active diseases"""
        return Disease.objects.filter(is_active=True)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced disease search"""
        serializer = DiseaseSearchSerializer(data=request.query_params)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset()
        
        # Apply filters
        query = serializer.validated_data.get('query')
        if query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(scientific_name__icontains=query) |
                Q(description__icontains=query) |
                Q(symptoms__icontains=query)
            )
        
        category = serializer.validated_data.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        crop_type = serializer.validated_data.get('crop_type')
        if crop_type:
            # Use icontains for SQLite compatibility
            queryset = queryset.filter(affected_crops__icontains=crop_type)
        
        severity = serializer.validated_data.get('severity')
        if severity:
            queryset = queryset.filter(typical_severity=severity)
        
        # Limit results
        queryset = queryset[:20]
        
        serializer = DiseaseSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def treatments(self, request, pk=None):
        """Get treatments for a specific disease"""
        disease = self.get_object()
        treatments = Treatment.objects.filter(
            disease=disease,
            is_recommended=True
        ).order_by('-effectiveness_rating')
        
        serializer = TreatmentSerializer(treatments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get disease categories with counts"""
        categories = Disease.objects.filter(is_active=True).values('category').annotate(
            count=Count('id')
        ).order_by('category')
        
        return Response(list(categories))


class TreatmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for browsing treatment information
    """
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated, CanAccessCropDetection]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['treatment_type', 'method', 'is_recommended', 'requires_expert']
    search_fields = ['name', 'description', 'disease__name']
    ordering_fields = ['name', 'effectiveness_rating', 'created_at']
    ordering = ['-effectiveness_rating']
    
    def get_queryset(self):
        """Filter recommended treatments"""
        return Treatment.objects.filter(is_recommended=True).select_related('disease')
    
    @action(detail=False, methods=['post'])
    def recommend(self, request):
        """Get treatment recommendations for specific conditions"""
        serializer = TreatmentRecommendationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        disease_id = serializer.validated_data['disease_id']
        crop_type = serializer.validated_data.get('crop_type')
        organic_only = serializer.validated_data.get('organic_only', False)
        growth_stage = serializer.validated_data.get('growth_stage')
        weather_conditions = serializer.validated_data.get('weather_conditions')
        
        try:
            disease = Disease.objects.get(id=disease_id, is_active=True)
        except Disease.DoesNotExist:
            return Response(
                {'error': 'Disease not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Filter treatments
        treatments = Treatment.objects.filter(
            disease=disease,
            is_recommended=True
        )
        
        if crop_type:
            # Use icontains for SQLite compatibility
            treatments = treatments.filter(suitable_crops__icontains=crop_type)
        
        if organic_only:
            treatments = treatments.filter(method='organic')
        
        if growth_stage:
            treatments = treatments.filter(
                Q(growth_stage__icontains=growth_stage) | Q(growth_stage='')
            )
        
        # Order by effectiveness
        treatments = treatments.order_by('-effectiveness_rating')[:5]
        
        serializer = TreatmentSerializer(treatments, many=True)
        return Response({
            'disease': DiseaseSerializer(disease).data,
            'treatments': serializer.data,
            'filters_applied': {
                'crop_type': crop_type,
                'organic_only': organic_only,
                'growth_stage': growth_stage,
                'weather_conditions': weather_conditions
            }
        })


class CropScanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing crop scans
    """
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'crop_type', 'accuracy_rating']
    ordering_fields = ['created_at', 'health_score', 'accuracy_rating']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter scans for current user"""
        return CropScan.objects.filter(
            user=self.request.user
        ).prefetch_related('recommended_treatments')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return CropScanCreateSerializer
        elif self.action == 'list':
            return CropScanListSerializer
        return CropScanSerializer
    
    def create(self, request, *args, **kwargs):
        """Create and process crop scan"""
        serializer = self.get_serializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Create scan record
        scan = serializer.save()
        
        # Process image asynchronously (in production, use Celery)
        try:
            self._process_scan(scan)
        except Exception as e:
            logger.error(f"Scan processing failed: {str(e)}")
            scan.mark_failed(str(e))
        
        # Return scan with processing status
        response_serializer = CropScanSerializer(scan)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    def _process_scan(self, scan):
        """Process crop scan with image analysis"""
        try:
            # Initialize image analysis service
            analysis_service = ImageAnalysisService()
            
            # Analyze image
            result = analysis_service.analyze_image(
                image_file=scan.image,
                crop_type=scan.crop_type,
                location_data=scan.location_data
            )
            
            if result['success']:
                # Update scan with results
                scan.detected_diseases = result['detected_diseases']
                scan.health_score = result['health_score']
                scan.confidence_scores = result['confidence_scores']
                scan.ai_recommendations = result['recommendations']
                scan.model_version = result['model_version']
                scan.processing_time_ms = result['processing_time_ms']
                
                # Update crop type if detected
                if result['crop_type'] and not scan.crop_type:
                    scan.crop_type = result['crop_type']
                
                # Add recommended treatments
                if result['detected_diseases']:
                    disease_ids = [d['disease_id'] for d in result['detected_diseases']]
                    treatments = Treatment.objects.filter(
                        disease__id__in=disease_ids,
                        is_recommended=True
                    ).order_by('-effectiveness_rating')[:5]
                    
                    scan.recommended_treatments.set(treatments)
                
                scan.mark_completed()
                
                # Update user's scan history
                self._update_scan_history(scan.user)
                
            else:
                scan.mark_failed(result.get('error', 'Analysis failed'))
                
        except Exception as e:
            logger.error(f"Scan processing error: {str(e)}")
            scan.mark_failed(str(e))
    
    def _update_scan_history(self, user):
        """Update user's scan history"""
        try:
            history = ScanHistory.get_or_create_for_user(user)
            history.update_stats()
        except Exception as e:
            logger.error(f"Failed to update scan history: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def feedback(self, request, pk=None):
        """Provide feedback on scan results"""
        scan = self.get_object()
        
        serializer = ScanFeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update scan with feedback
        if 'user_confirmed_disease' in serializer.validated_data:
            disease_id = serializer.validated_data['user_confirmed_disease']
            if disease_id:
                try:
                    disease = Disease.objects.get(id=disease_id)
                    scan.user_confirmed_disease = disease
                except Disease.DoesNotExist:
                    return Response(
                        {'error': 'Invalid disease ID'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
        
        if 'user_feedback' in serializer.validated_data:
            scan.user_feedback = serializer.validated_data['user_feedback']
        
        if 'accuracy_rating' in serializer.validated_data:
            scan.accuracy_rating = serializer.validated_data['accuracy_rating']
        
        if 'treatment_applied' in serializer.validated_data:
            scan.treatment_applied = serializer.validated_data['treatment_applied']
        
        scan.save()
        
        # Update scan history
        self._update_scan_history(scan.user)
        
        return Response({'message': 'Feedback recorded successfully'})
    
    @action(detail=True, methods=['post'])
    def add_follow_up(self, request, pk=None):
        """Add follow-up scan"""
        original_scan = self.get_object()
        
        # Create new scan as follow-up
        serializer = CropScanCreateSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        follow_up_scan = serializer.save()
        
        # Link scans
        original_scan.follow_up_scans.add(follow_up_scan)
        
        # Process follow-up scan
        try:
            self._process_scan(follow_up_scan)
        except Exception as e:
            logger.error(f"Follow-up scan processing failed: {str(e)}")
            follow_up_scan.mark_failed(str(e))
        
        response_serializer = CropScanSerializer(follow_up_scan)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get user's scan statistics"""
        queryset = self.get_queryset()
        
        total_scans = queryset.count()
        successful_scans = queryset.filter(status='completed').count()
        failed_scans = queryset.filter(status='failed').count()
        
        # Health score statistics
        health_scores = queryset.filter(
            health_score__isnull=False
        ).values_list('health_score', flat=True)
        
        avg_health_score = sum(health_scores) / len(health_scores) if health_scores else None
        
        # Accuracy ratings
        ratings = queryset.filter(
            accuracy_rating__isnull=False
        ).values_list('accuracy_rating', flat=True)
        
        avg_rating = sum(ratings) / len(ratings) if ratings else None
        
        # Crop type distribution
        crop_distribution = queryset.values('crop_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_scans': total_scans,
            'successful_scans': successful_scans,
            'failed_scans': failed_scans,
            'success_rate': (successful_scans / total_scans * 100) if total_scans > 0 else 0,
            'average_health_score': round(avg_health_score, 1) if avg_health_score else None,
            'average_rating': round(avg_rating, 1) if avg_rating else None,
            'crop_distribution': list(crop_distribution)
        })


class ImageAnalysisViewSet(viewsets.ViewSet):
    """
    ViewSet for image analysis without saving scan records
    """
    permission_classes = [IsAuthenticated, CanAccessCropDetection]
    
    @action(detail=False, methods=['post'])
    def analyze(self, request):
        """Analyze image without saving scan record"""
        serializer = ImageAnalysisSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        image_file = serializer.validated_data['image']
        crop_type = serializer.validated_data.get('crop_type')
        location = serializer.validated_data.get('location')
        
        try:
            # Initialize analysis service
            analysis_service = ImageAnalysisService()
            
            # Validate image
            is_valid, error_message = analysis_service.validate_image(image_file)
            if not is_valid:
                return Response(
                    {'error': error_message}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Analyze image
            result = analysis_service.analyze_image(
                image_file=image_file,
                crop_type=crop_type,
                location_data=location
            )
            
            if result['success']:
                return Response(result)
            else:
                return Response(
                    {'error': result.get('error', 'Analysis failed')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Image analysis failed: {str(e)}")
            return Response(
                {'error': 'Image analysis failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def supported_crops(self, request):
        """Get list of supported crop types"""
        analysis_service = ImageAnalysisService()
        return Response({
            'supported_crops': analysis_service.get_supported_crops()
        })


class ScanHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing scan history
    """
    serializer_class = ScanHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get current user's scan history"""
        return ScanHistory.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get scan history summary for current user"""
        try:
            history = ScanHistory.get_or_create_for_user(request.user)
            serializer = ScanHistorySerializer(history)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Failed to get scan history: {str(e)}")
            return Response(
                {'error': 'Failed to retrieve scan history'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExpertReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for expert reviews (admin/expert users only)
    """
    serializer_class = ExpertReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'ai_accuracy_assessment']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        
        if user.role in ['admin', 'expert']:
            # Experts can see all reviews
            return ExpertReview.objects.all().select_related(
                'scan', 'scan__user', 'reviewer', 'expert_diagnosis'
            )
        else:
            # Regular users can only see reviews of their own scans
            return ExpertReview.objects.filter(
                scan__user=user
            ).select_related('scan', 'reviewer', 'expert_diagnosis')
    
    def perform_create(self, serializer):
        """Set reviewer to current user"""
        serializer.save(reviewer=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending reviews (experts only)"""
        if request.user.role not in ['admin', 'expert']:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_reviews = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(pending_reviews, many=True)
        return Response(serializer.data)