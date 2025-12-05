"""
Farm management API views
"""
from rest_framework import viewsets, status, filters, serializers
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Farm, Field, Crop, Livestock, FarmActivity, Equipment, SatelliteImagery
from .serializers import (
    FarmSerializer, FieldSerializer, CropSerializer, LivestockSerializer, 
    FarmActivitySerializer, EquipmentSerializer, SatelliteImagerySerializer,
    FarmSummarySerializer, CropSummarySerializer, FarmAnalyticsSerializer
)
from .filters import FarmFilter, FieldFilter, CropFilter, LivestockFilter, FarmActivityFilter, EquipmentFilter, SatelliteImageryFilter
from .permissions import IsFarmOwnerOrReadOnly
from .analytics import FarmAnalytics, FarmPerformanceMonitor

logger = logging.getLogger(__name__)


class FarmViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing farms
    """
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FarmFilter
    search_fields = ['name', 'description', 'farm_type']
    ordering_fields = ['name', 'size_hectares', 'created_at', 'established_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter farms based on user permissions"""
        user = self.request.user
        if user.is_staff:
            return Farm.objects.all()
        return Farm.objects.filter(
            Q(owner=user) | Q(is_public=True)
        ).select_related('owner')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return FarmSummarySerializer
        return FarmSerializer
    
    @action(detail=True, methods=['get'])
    def analytics(self, request, pk=None):
        """Get comprehensive analytics for a specific farm"""
        farm = self.get_object()
        analytics = FarmAnalytics(farm=farm)
        
        # Combine all analytics
        farm_overview = analytics.get_farm_overview()
        crop_analytics = analytics.get_crop_analytics()
        livestock_analytics = analytics.get_livestock_analytics()
        activity_analytics = analytics.get_activity_analytics()
        equipment_analytics = analytics.get_equipment_analytics()
        
        analytics_data = {
            'farm_overview': farm_overview,
            'crop_analytics': crop_analytics,
            'livestock_analytics': livestock_analytics,
            'activity_analytics': activity_analytics,
            'equipment_analytics': equipment_analytics,
            
            # Legacy format for backward compatibility
            'total_farms': 1,
            'total_area': farm.size_hectares,
            'total_crops': crop_analytics['total_crops'],
            'total_livestock': livestock_analytics['total_animals'],
            'active_activities': activity_analytics.get('status_breakdown', {}).get('in_progress', 0),
            'overdue_activities': activity_analytics['overdue_activities'],
            'crop_status_breakdown': crop_analytics['status_breakdown'],
            'livestock_type_breakdown': livestock_analytics['type_breakdown'],
            'monthly_activities': activity_analytics['monthly_trends'],
            'average_yield_efficiency': crop_analytics['yield_efficiency'],
            'equipment_status': {
                'total': equipment_analytics['total_equipment'],
                'operational': equipment_analytics['operational_equipment'],
                'needs_maintenance': equipment_analytics['needs_maintenance']
            }
        }
        
        return Response(analytics_data)
    
    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        """Get performance metrics and alerts for a farm"""
        farm = self.get_object()
        monitor = FarmPerformanceMonitor(farm)
        
        alerts = monitor.get_performance_alerts()
        metrics = monitor.get_productivity_metrics()
        
        return Response({
            'alerts': alerts,
            'metrics': metrics
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard data for all user's farms"""
        analytics = FarmAnalytics(user=request.user)
        
        # Get overview data
        farm_overview = analytics.get_farm_overview()
        crop_analytics = analytics.get_crop_analytics()
        livestock_analytics = analytics.get_livestock_analytics()
        activity_analytics = analytics.get_activity_analytics()
        equipment_analytics = analytics.get_equipment_analytics()
        
        # Get alerts for all farms
        all_alerts = []
        for farm in Farm.objects.filter(owner=request.user):
            monitor = FarmPerformanceMonitor(farm)
            farm_alerts = monitor.get_performance_alerts()
            for alert in farm_alerts:
                alert['farm_name'] = farm.name
                alert['farm_id'] = str(farm.id)
            all_alerts.extend(farm_alerts)
        
        return Response({
            'overview': {
                'farms': farm_overview,
                'crops': crop_analytics,
                'livestock': livestock_analytics,
                'activities': activity_analytics,
                'equipment': equipment_analytics
            },
            'alerts': all_alerts[:10],  # Limit to 10 most recent alerts
            'summary': {
                'total_farms': farm_overview['total_farms'],
                'total_area': farm_overview['total_area'],
                'total_crops': crop_analytics['total_crops'],
                'total_livestock': livestock_analytics['total_animals'],
                'overdue_activities': activity_analytics['overdue_activities'],
                'upcoming_activities': activity_analytics['upcoming_activities']
            }
        })
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get farm summary with related data"""
        farm = self.get_object()
        
        # Get recent crops
        recent_crops = farm.crops.all()[:5]
        crop_serializer = CropSummarySerializer(recent_crops, many=True)
        
        # Get upcoming activities
        upcoming_activities = farm.activities.filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__gte=timezone.now()
        ).order_by('scheduled_date')[:5]
        activity_serializer = FarmActivitySerializer(upcoming_activities, many=True)
        
        # Get overdue activities
        overdue_activities = farm.activities.filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__lt=timezone.now()
        ).order_by('scheduled_date')[:5]
        overdue_serializer = FarmActivitySerializer(overdue_activities, many=True)
        
        return Response({
            'farm': FarmSerializer(farm).data,
            'recent_crops': crop_serializer.data,
            'upcoming_activities': activity_serializer.data,
            'overdue_activities': overdue_serializer.data
        })


class CropViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing crops
    """
    serializer_class = CropSerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CropFilter
    search_fields = ['name', 'variety', 'scientific_name']
    ordering_fields = ['name', 'planting_date', 'expected_harvest_date', 'area_hectares']
    ordering = ['-planting_date']
    
    def get_queryset(self):
        """Filter crops based on user's farms"""
        user = self.request.user
        if user.is_staff:
            return Crop.objects.all()
        return Crop.objects.filter(
            farm__owner=user
        ).select_related('farm')
    
    def perform_create(self, serializer):
        """Ensure crop is created for user's farm"""
        farm_id = self.request.data.get('farm')
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, owner=self.request.user)
                serializer.save(farm=farm)
            except Farm.DoesNotExist:
                raise serializers.ValidationError("Invalid farm selected")
        else:
            raise serializers.ValidationError("Farm is required")
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update crop status"""
        crop = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in dict(Crop.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        crop.status = new_status
        
        # If marking as harvested, set actual harvest date
        if new_status == 'harvested' and not crop.actual_harvest_date:
            crop.actual_harvest_date = timezone.now().date()
        
        crop.save()
        
        logger.info(f"Crop {crop.name} status updated to {new_status}")
        
        return Response(CropSerializer(crop).data)
    
    @action(detail=True, methods=['post'])
    def record_harvest(self, request, pk=None):
        """Record harvest data"""
        crop = self.get_object()
        
        actual_yield = request.data.get('actual_yield_kg')
        harvest_date = request.data.get('harvest_date')
        
        if actual_yield:
            crop.actual_yield_kg = actual_yield
        
        if harvest_date:
            crop.actual_harvest_date = harvest_date
        
        crop.status = 'harvested'
        crop.save()
        
        logger.info(f"Harvest recorded for crop {crop.name}: {actual_yield}kg")
        
        return Response(CropSerializer(crop).data)


class LivestockViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing livestock
    """
    serializer_class = LivestockSerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LivestockFilter
    search_fields = ['animal_type', 'breed']
    ordering_fields = ['animal_type', 'breed', 'count', 'acquisition_date']
    ordering = ['-acquisition_date']
    
    def get_queryset(self):
        """Filter livestock based on user's farms"""
        user = self.request.user
        if user.is_staff:
            return Livestock.objects.all()
        return Livestock.objects.filter(
            farm__owner=user
        ).select_related('farm')
    
    def perform_create(self, serializer):
        """Ensure livestock is created for user's farm"""
        farm_id = self.request.data.get('farm')
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, owner=self.request.user)
                serializer.save(farm=farm)
            except Farm.DoesNotExist:
                raise serializers.ValidationError("Invalid farm selected")
        else:
            raise serializers.ValidationError("Farm is required")
    
    @action(detail=True, methods=['post'])
    def update_health_status(self, request, pk=None):
        """Update livestock health status"""
        livestock = self.get_object()
        new_status = request.data.get('health_status')
        
        if new_status not in dict(Livestock.HEALTH_STATUS_CHOICES):
            return Response(
                {'error': 'Invalid health status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        livestock.health_status = new_status
        livestock.save()
        
        logger.info(f"Livestock {livestock} health status updated to {new_status}")
        
        return Response(LivestockSerializer(livestock).data)
    
    @action(detail=True, methods=['post'])
    def record_production(self, request, pk=None):
        """Record monthly production data"""
        livestock = self.get_object()
        
        month = request.data.get('month')  # Format: YYYY-MM
        production_data = request.data.get('production_data', {})
        
        if not month:
            return Response(
                {'error': 'Month is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update monthly production
        if not livestock.monthly_production:
            livestock.monthly_production = {}
        
        livestock.monthly_production[month] = production_data
        livestock.save()
        
        logger.info(f"Production recorded for {livestock} for {month}")
        
        return Response(LivestockSerializer(livestock).data)


class FarmActivityViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing farm activities
    """
    serializer_class = FarmActivitySerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FarmActivityFilter
    search_fields = ['title', 'description', 'activity_type']
    ordering_fields = ['scheduled_date', 'priority', 'status', 'created_at']
    ordering = ['-scheduled_date']
    
    def get_queryset(self):
        """Filter activities based on user's farms"""
        user = self.request.user
        if user.is_staff:
            return FarmActivity.objects.all()
        return FarmActivity.objects.filter(
            farm__owner=user
        ).select_related('farm', 'crop', 'livestock', 'assigned_to')
    
    def perform_create(self, serializer):
        """Ensure activity is created for user's farm"""
        farm_id = self.request.data.get('farm')
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, owner=self.request.user)
                serializer.save(farm=farm)
            except Farm.DoesNotExist:
                raise serializers.ValidationError("Invalid farm selected")
        else:
            raise serializers.ValidationError("Farm is required")
    
    @action(detail=True, methods=['post'])
    def mark_completed(self, request, pk=None):
        """Mark activity as completed"""
        activity = self.get_object()
        
        results = request.data.get('results', '')
        actual_duration = request.data.get('actual_duration_hours')
        cost = request.data.get('cost')
        
        activity.mark_completed(
            results=results,
            actual_duration=actual_duration,
            cost=cost
        )
        
        logger.info(f"Activity {activity.title} marked as completed")
        
        return Response(FarmActivitySerializer(activity).data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming activities"""
        queryset = self.get_queryset().filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__gte=timezone.now(),
            scheduled_date__lte=timezone.now() + timedelta(days=7)
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue activities"""
        queryset = self.get_queryset().filter(
            status__in=['planned', 'in_progress'],
            scheduled_date__lt=timezone.now()
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EquipmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing farm equipment
    """
    serializer_class = EquipmentSerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = EquipmentFilter
    search_fields = ['name', 'brand', 'model', 'equipment_type']
    ordering_fields = ['name', 'equipment_type', 'condition', 'purchase_date']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter equipment based on user's farms"""
        user = self.request.user
        if user.is_staff:
            return Equipment.objects.all()
        return Equipment.objects.filter(
            farm__owner=user
        ).select_related('farm')
    
    def perform_create(self, serializer):
        """Ensure equipment is created for user's farm"""
        farm_id = self.request.data.get('farm')
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, owner=self.request.user)
                serializer.save(farm=farm)
            except Farm.DoesNotExist:
                raise serializers.ValidationError("Invalid farm selected")
        else:
            raise serializers.ValidationError("Farm is required")
    
    @action(detail=True, methods=['post'])
    def record_maintenance(self, request, pk=None):
        """Record equipment maintenance"""
        equipment = self.get_object()
        
        maintenance_date = request.data.get('maintenance_date', timezone.now().date())
        next_maintenance = request.data.get('next_maintenance_date')
        cost = request.data.get('cost')
        notes = request.data.get('notes', '')
        
        equipment.last_maintenance_date = maintenance_date
        
        if next_maintenance:
            equipment.next_maintenance_date = next_maintenance
        elif equipment.maintenance_interval_days:
            equipment.next_maintenance_date = (
                maintenance_date + timedelta(days=equipment.maintenance_interval_days)
            )
        
        equipment.save()
        
        # Log maintenance activity
        FarmActivity.objects.create(
            farm=equipment.farm,
            activity_type='maintenance',
            title=f"Maintenance: {equipment.name}",
            description=f"Maintenance performed on {equipment.name}. {notes}",
            scheduled_date=timezone.now(),
            completed_date=timezone.now(),
            status='completed',
            cost=cost,
            results=notes
        )
        
        logger.info(f"Maintenance recorded for equipment {equipment.name}")
        
        return Response(EquipmentSerializer(equipment).data)


class FieldViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing farm fields
    """
    serializer_class = FieldSerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FieldFilter
    search_fields = ['name', 'description', 'soil_type']
    ordering_fields = ['name', 'area_hectares', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filter fields based on user's farms"""
        user = self.request.user
        if user.is_staff:
            return Field.objects.all()
        return Field.objects.filter(
            farm__owner=user
        ).select_related('farm')
    
    def perform_create(self, serializer):
        """Ensure field is created for user's farm"""
        farm_id = self.request.data.get('farm')
        if farm_id:
            try:
                farm = Farm.objects.get(id=farm_id, owner=self.request.user)
                serializer.save(farm=farm)
            except Farm.DoesNotExist:
                raise serializers.ValidationError("Invalid farm selected")
        else:
            raise serializers.ValidationError("Farm is required")
    
    @action(detail=True, methods=['get'])
    def crops(self, request, pk=None):
        """Get all crops in this field"""
        field = self.get_object()
        crops = field.crops.all()
        serializer = CropSerializer(crops, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def satellite_images(self, request, pk=None):
        """Get satellite imagery for this field"""
        field = self.get_object()
        images = field.satellite_images.all()
        serializer = SatelliteImagerySerializer(images, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def validate_boundary(self, request, pk=None):
        """Validate field boundary GeoJSON"""
        field = self.get_object()
        is_valid, message = field.validate_geojson()
        
        return Response({
            'is_valid': is_valid,
            'message': message,
            'center_coordinates': field.center_coordinates,
            'perimeter_meters': field.perimeter_meters
        })


class SatelliteImageryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing satellite imagery
    """
    serializer_class = SatelliteImagerySerializer
    permission_classes = [IsAuthenticated, IsFarmOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = SatelliteImageryFilter
    search_fields = ['satellite_name', 'imagery_type']
    ordering_fields = ['acquisition_date', 'cloud_coverage_percentage', 'crop_health_score']
    ordering = ['-acquisition_date']
    
    def get_queryset(self):
        """Filter satellite imagery based on user's fields"""
        user = self.request.user
        if user.is_staff:
            return SatelliteImagery.objects.all()
        return SatelliteImagery.objects.filter(
            field__farm__owner=user
        ).select_related('field', 'field__farm')
    
    def perform_create(self, serializer):
        """Ensure satellite imagery is created for user's field"""
        field_id = self.request.data.get('field')
        if field_id:
            try:
                field = Field.objects.get(id=field_id, farm__owner=self.request.user)
                serializer.save(field=field)
            except Field.DoesNotExist:
                raise serializers.ValidationError("Invalid field selected")
        else:
            raise serializers.ValidationError("Field is required")
    
    @action(detail=True, methods=['post'])
    def process_imagery(self, request, pk=None):
        """Process satellite imagery to calculate vegetation indices"""
        imagery = self.get_object()
        
        # Get band data from request
        red_band = request.data.get('red_band')
        nir_band = request.data.get('nir_band')
        blue_band = request.data.get('blue_band')
        
        if red_band is not None and nir_band is not None:
            indices = imagery.calculate_vegetation_indices(
                red_band=float(red_band),
                nir_band=float(nir_band),
                blue_band=float(blue_band) if blue_band is not None else None
            )
            
            imagery.is_processed = True
            imagery.save()
            
            logger.info(f"Processed satellite imagery {imagery.id}: {indices}")
            
            return Response({
                'message': 'Imagery processed successfully',
                'vegetation_indices': indices
            })
        else:
            return Response(
                {'error': 'Red and NIR band data are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def analyze_crop_health(self, request, pk=None):
        """Analyze crop health from satellite imagery"""
        imagery = self.get_object()
        
        # Simple crop health analysis based on NDVI
        ndvi = imagery.ndvi_average
        if ndvi is not None:
            if ndvi > 0.7:
                health_score = 90 + (ndvi - 0.7) * 33.33  # 90-100%
                stress_level = 'low'
            elif ndvi > 0.5:
                health_score = 70 + (ndvi - 0.5) * 100  # 70-90%
                stress_level = 'moderate'
            elif ndvi > 0.3:
                health_score = 40 + (ndvi - 0.3) * 150  # 40-70%
                stress_level = 'high'
            else:
                health_score = ndvi * 133.33  # 0-40%
                stress_level = 'severe'
            
            imagery.crop_health_score = min(100, max(0, health_score))
            
            # Update stress indicators
            stress_indicators = []
            if stress_level in ['high', 'severe']:
                stress_indicators.append('low_vegetation_vigor')
            if imagery.cloud_coverage_percentage > 30:
                stress_indicators.append('high_cloud_coverage')
            
            imagery.stress_indicators = stress_indicators
            imagery.save()
            
            return Response({
                'crop_health_score': imagery.crop_health_score,
                'stress_level': stress_level,
                'stress_indicators': stress_indicators,
                'ndvi_value': ndvi
            })
        else:
            return Response(
                {'error': 'NDVI data not available. Process imagery first.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def latest_by_field(self, request):
        """Get latest satellite imagery for each field"""
        user_fields = Field.objects.filter(farm__owner=request.user)
        latest_images = []
        
        for field in user_fields:
            latest_image = field.satellite_images.first()  # Already ordered by -acquisition_date
            if latest_image:
                latest_images.append(latest_image)
        
        serializer = self.get_serializer(latest_images, many=True)
        return Response(serializer.data)


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint for farm service monitoring
    """
    from django.db import connection
    from django.core.cache import cache
    
    health_status = {
        'service': 'farm-service',
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0',
        'checks': {}
    }
    
    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['checks']['database'] = 'healthy'
    except Exception as e:
        health_status['checks']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Cache check
    try:
        cache.set('health_check', 'test', 30)
        cache.get('health_check')
        health_status['checks']['cache'] = 'healthy'
    except Exception as e:
        health_status['checks']['cache'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'
    
    # Model checks
    try:
        Farm.objects.count()
        Field.objects.count()
        Crop.objects.count()
        health_status['checks']['models'] = 'healthy'
    except Exception as e:
        health_status['checks']['models'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    status_code = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(health_status, status=status_code)
    
    @action(detail=False, methods=['get'])
    def needs_maintenance(self, request):
        """Get equipment that needs maintenance"""
        queryset = self.get_queryset().filter(
            next_maintenance_date__lte=timezone.now().date(),
            is_operational=True
        )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
