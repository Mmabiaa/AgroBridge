"""
Views for scheduling service
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Task, TaskTemplate, CropCalendar
from .serializers import (
    TaskSerializer, TaskListSerializer, TaskCompleteSerializer,
    TaskTemplateSerializer, TaskFromTemplateSerializer,
    CropCalendarSerializer, GenerateTasksFromCalendarSerializer
)
from .filters import TaskFilter, TaskTemplateFilter, CropCalendarFilter
from .permissions import IsTaskOwnerOrAssigned, IsTemplateOwner

logger = logging.getLogger(__name__)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tasks
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwnerOrAssigned]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['due_date', 'priority', 'created_at', 'status']
    ordering = ['due_date']
    
    def get_queryset(self):
        """Get tasks for current user"""
        user = self.request.user
        
        # Users can see tasks they created or are assigned to
        return Task.objects.filter(
            Q(user=user) | Q(assigned_to=user)
        ).select_related(
            'user', 'farm', 'field', 'completed_by', 'parent_task'
        ).prefetch_related('assigned_to').distinct()
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return TaskListSerializer
        elif self.action == 'complete':
            return TaskCompleteSerializer
        return TaskSerializer
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark task as complete"""
        task = self.get_object()
        
        if task.status == 'completed':
            return Response(
                {'error': 'Task is already completed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(task, data=request.data)
        if serializer.is_valid():
            serializer.save()
            
            # Return full task details
            task.refresh_from_db()
            response_serializer = TaskSerializer(task, context={'request': request})
            
            logger.info(f"Task {task.id} completed by user {request.user.username}")
            
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a completed or cancelled task"""
        task = self.get_object()
        
        if task.status not in ['completed', 'cancelled']:
            return Response(
                {'error': 'Only completed or cancelled tasks can be reopened'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        task.status = 'pending'
        task.completed_at = None
        task.completed_by = None
        task.completion_notes = ''
        task.save()
        
        serializer = TaskSerializer(task, context={'request': request})
        
        logger.info(f"Task {task.id} reopened by user {request.user.username}")
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming tasks (next 7 days)"""
        user = request.user
        days = int(request.query_params.get('days', 7))
        
        end_date = timezone.now() + timedelta(days=days)
        
        tasks = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status__in=['pending', 'in_progress'],
            due_date__lte=end_date,
            due_date__gte=timezone.now()
        ).select_related('farm', 'field').distinct().order_by('due_date')
        
        serializer = TaskListSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks"""
        user = request.user
        
        tasks = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status__in=['pending', 'in_progress'],
            due_date__lt=timezone.now()
        ).select_related('farm', 'field').distinct().order_by('due_date')
        
        serializer = TaskListSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get tasks due today"""
        user = request.user
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        tasks = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status__in=['pending', 'in_progress'],
            due_date__gte=today_start,
            due_date__lt=today_end
        ).select_related('farm', 'field').distinct().order_by('due_date')
        
        serializer = TaskListSerializer(tasks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get task statistics for user"""
        user = request.user
        
        # Get counts by status
        status_counts = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user)
        ).values('status').annotate(count=Count('id'))
        
        status_dict = {item['status']: item['count'] for item in status_counts}
        
        # Get overdue count
        overdue_count = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status__in=['pending', 'in_progress'],
            due_date__lt=timezone.now()
        ).count()
        
        # Get upcoming count (next 7 days)
        upcoming_count = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status__in=['pending', 'in_progress'],
            due_date__gte=timezone.now(),
            due_date__lte=timezone.now() + timedelta(days=7)
        ).count()
        
        # Get completion rate (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        total_tasks = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            created_at__gte=thirty_days_ago
        ).count()
        
        completed_tasks = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status='completed',
            completed_at__gte=thirty_days_ago
        ).count()
        
        completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        return Response({
            'status_counts': status_dict,
            'overdue_count': overdue_count,
            'upcoming_count': upcoming_count,
            'completion_rate': round(completion_rate, 1),
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks
        })
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get tasks grouped by category"""
        user = request.user
        
        category_counts = Task.objects.filter(
            Q(user=user) | Q(assigned_to=user),
            status__in=['pending', 'in_progress']
        ).values('category').annotate(count=Count('id')).order_by('-count')
        
        return Response(category_counts)


class TaskTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing task templates
    """
    queryset = TaskTemplate.objects.all()
    serializer_class = TaskTemplateSerializer
    permission_classes = [IsAuthenticated, IsTemplateOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskTemplateFilter
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['name', 'usage_count', 'created_at']
    ordering = ['-usage_count', 'name']
    
    def get_queryset(self):
        """Get templates for current user and public templates"""
        user = self.request.user
        return TaskTemplate.objects.filter(
            Q(user=user) | Q(is_public=True)
        ).select_related('user')
    
    @action(detail=True, methods=['post'])
    def create_task(self, request, pk=None):
        """Create a task from this template"""
        template = self.get_object()
        
        serializer = TaskFromTemplateSerializer(
            data={**request.data, 'template_id': str(template.id)},
            context={'request': request}
        )
        
        if serializer.is_valid():
            task = serializer.save()
            task_serializer = TaskSerializer(task, context={'request': request})
            
            logger.info(f"Task created from template {template.id} by user {request.user.username}")
            
            return Response(task_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most popular templates"""
        limit = int(request.query_params.get('limit', 10))
        
        templates = self.get_queryset().filter(
            is_public=True
        ).order_by('-usage_count')[:limit]
        
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)


class CropCalendarViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for crop calendars (read-only)
    """
    queryset = CropCalendar.objects.filter(is_active=True)
    serializer_class = CropCalendarSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CropCalendarFilter
    search_fields = ['crop_name', 'variety']
    ordering_fields = ['crop_name', 'total_days_to_harvest']
    ordering = ['crop_name']
    
    @action(detail=True, methods=['post'])
    def generate_tasks(self, request, pk=None):
        """Generate tasks from crop calendar"""
        crop_calendar = self.get_object()
        
        serializer = GenerateTasksFromCalendarSerializer(
            data={**request.data, 'crop_calendar_id': str(crop_calendar.id)},
            context={'request': request}
        )
        
        if serializer.is_valid():
            result = serializer.save()
            
            # Serialize the tasks
            task_serializer = TaskListSerializer(
                result['tasks'],
                many=True,
                context={'request': request}
            )
            
            logger.info(
                f"Generated {result['count']} tasks from crop calendar {crop_calendar.id} "
                f"for user {request.user.username}"
            )
            
            return Response({
                'message': f"Generated {result['count']} tasks for {result['crop']}",
                'count': result['count'],
                'crop': result['crop'],
                'field': result['field'],
                'tasks': task_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_season(self, request):
        """Get crop calendars suitable for current season"""
        current_month = timezone.now().month
        
        calendars = self.get_queryset().filter(
            optimal_planting_months__contains=[current_month]
        )
        
        serializer = self.get_serializer(calendars, many=True)
        return Response(serializer.data)
