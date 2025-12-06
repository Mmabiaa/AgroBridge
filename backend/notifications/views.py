"""
Notification Service Views

This module defines the API views for the notification service.
"""

import logging
from typing import Dict, Any
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from django.db.models import Q, Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .models import (
    Notification,
    NotificationDelivery,
    UserNotificationPreferences,
    NotificationTemplate,
    NotificationType,
    NotificationPriority,
    DeliveryChannel
)
from .serializers import (
    NotificationSerializer,
    NotificationCreateSerializer,
    NotificationDeliverySerializer,
    UserNotificationPreferencesSerializer,
    NotificationTemplateSerializer,
    NotificationStatsSerializer,
    BulkNotificationSerializer,
    FCMTokenSerializer
)
from .services import NotificationService
from .permissions import IsOwnerOrAdmin, IsAdminUser

User = get_user_model()
logger = logging.getLogger(__name__)


class NotificationPagination(PageNumberPagination):
    """Custom pagination for notifications"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['notification_type', 'priority', 'is_read']
    ordering_fields = ['created_at', 'priority', 'read_at']
    ordering = ['-created_at']
    search_fields = ['title', 'message']
    
    def get_queryset(self):
        """Filter notifications by user"""
        if self.request.user.is_staff:
            # Admin can see all notifications
            return Notification.objects.all()
        else:
            # Regular users see only their notifications
            return Notification.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return NotificationCreateSerializer
        return NotificationSerializer
    
    @swagger_auto_schema(
        operation_description="Create a new notification",
        request_body=NotificationCreateSerializer,
        responses={201: NotificationSerializer}
    )
    def create(self, request, *args, **kwargs):
        """Create notification(s)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create notification(s)
        notifications = serializer.save()
        
        # Handle single vs multiple notifications
        if isinstance(notifications, list):
            response_data = NotificationSerializer(notifications, many=True).data
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            response_data = NotificationSerializer(notifications).data
            return Response(response_data, status=status.HTTP_201_CREATED)
    
    @swagger_auto_schema(
        operation_description="Mark notification as read",
        responses={200: NotificationSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.mark_as_read()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Mark notification as unread",
        responses={200: NotificationSerializer}
    )
    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark notification as unread"""
        notification = self.get_object()
        notification.is_read = False
        notification.read_at = None
        notification.save(update_fields=['is_read', 'read_at'])
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Perform bulk operations on notifications",
        request_body=BulkNotificationSerializer,
        responses={200: openapi.Response('Bulk operation result')}
    )
    @action(detail=False, methods=['post'])
    def bulk_action(self, request):
        """Perform bulk operations on notifications"""
        serializer = BulkNotificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification_ids = serializer.validated_data['notification_ids']
        action_type = serializer.validated_data['action']
        
        # Filter notifications by user (unless admin)
        queryset = self.get_queryset().filter(id__in=notification_ids)
        
        if action_type == 'mark_read':
            count = queryset.filter(is_read=False).update(
                is_read=True,
                read_at=timezone.now()
            )
            message = f"Marked {count} notifications as read"
        elif action_type == 'mark_unread':
            count = queryset.filter(is_read=True).update(
                is_read=False,
                read_at=None
            )
            message = f"Marked {count} notifications as unread"
        elif action_type == 'delete':
            count = queryset.delete()[0]
            message = f"Deleted {count} notifications"
        else:
            return Response(
                {'error': 'Invalid action'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'success': True,
            'message': message,
            'count': count
        })
    
    @swagger_auto_schema(
        operation_description="Get notification statistics",
        responses={200: NotificationStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get notification statistics for current user"""
        service = NotificationService()
        stats = service.get_user_stats(request.user)
        
        # Add recent notifications
        recent_notifications = self.get_queryset()[:5]
        stats['recent_notifications'] = NotificationSerializer(
            recent_notifications, many=True
        ).data
        
        serializer = NotificationStatsSerializer(stats)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Get unread notification count",
        responses={200: openapi.Response('Unread count')}
    )
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get unread notification count"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})


class NotificationDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing notification deliveries
    """
    serializer_class = NotificationDeliverySerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    pagination_class = NotificationPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['channel', 'status']
    ordering_fields = ['created_at', 'sent_at', 'delivered_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter deliveries by user"""
        if self.request.user.is_staff:
            return NotificationDelivery.objects.all()
        else:
            return NotificationDelivery.objects.filter(
                notification__user=self.request.user
            )


class UserNotificationPreferencesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notification preferences
    """
    serializer_class = UserNotificationPreferencesSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return preferences for current user only"""
        return UserNotificationPreferences.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create preferences for current user"""
        service = NotificationService()
        return service.get_user_preferences(self.request.user)
    
    @swagger_auto_schema(
        operation_description="Get user notification preferences",
        responses={200: UserNotificationPreferencesSerializer}
    )
    def retrieve(self, request, *args, **kwargs):
        """Get user preferences"""
        preferences = self.get_object()
        serializer = self.get_serializer(preferences)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Update user notification preferences",
        request_body=UserNotificationPreferencesSerializer,
        responses={200: UserNotificationPreferencesSerializer}
    )
    def update(self, request, *args, **kwargs):
        """Update user preferences"""
        preferences = self.get_object()
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Register FCM token for push notifications",
        request_body=FCMTokenSerializer,
        responses={200: openapi.Response('Token registered')}
    )
    @action(detail=False, methods=['post'])
    def register_fcm_token(self, request):
        """Register FCM token for push notifications"""
        serializer = FCMTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        device_type = serializer.validated_data['device_type']
        device_id = serializer.validated_data.get('device_id')
        
        preferences = self.get_object()
        
        # Add token if not already present
        if token not in preferences.fcm_tokens:
            preferences.fcm_tokens.append(token)
            preferences.save(update_fields=['fcm_tokens'])
            
            logger.info(f"Registered FCM token for user {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'FCM token registered successfully'
        })
    
    @swagger_auto_schema(
        operation_description="Unregister FCM token",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'token': openapi.Schema(type=openapi.TYPE_STRING)
            }
        ),
        responses={200: openapi.Response('Token unregistered')}
    )
    @action(detail=False, methods=['post'])
    def unregister_fcm_token(self, request):
        """Unregister FCM token"""
        token = request.data.get('token')
        if not token:
            return Response(
                {'error': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        preferences = self.get_object()
        
        # Remove token if present
        if token in preferences.fcm_tokens:
            preferences.fcm_tokens.remove(token)
            preferences.save(update_fields=['fcm_tokens'])
            
            logger.info(f"Unregistered FCM token for user {request.user.email}")
        
        return Response({
            'success': True,
            'message': 'FCM token unregistered successfully'
        })


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing notification templates (admin only)
    """
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['notification_type', 'is_active']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    search_fields = ['name', 'title_template', 'message_template']
    
    @swagger_auto_schema(
        operation_description="Test template rendering",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'context': openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    description='Template context variables'
                )
            }
        ),
        responses={200: openapi.Response('Rendered template')}
    )
    @action(detail=True, methods=['post'])
    def test_render(self, request, pk=None):
        """Test template rendering with provided context"""
        template = self.get_object()
        context = request.data.get('context', {})
        
        try:
            rendered = template.render(context)
            return Response({
                'success': True,
                'rendered': rendered
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class NotificationAdminViewSet(viewsets.ViewSet):
    """
    Admin-only viewset for notification management
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get system notification statistics",
        responses={200: openapi.Response('System statistics')}
    )
    @action(detail=False, methods=['get'])
    def system_stats(self, request):
        """Get system-wide notification statistics"""
        stats = {
            'total_notifications': Notification.objects.count(),
            'total_users': User.objects.count(),
            'notifications_by_type': dict(
                Notification.objects.values('notification_type')
                .annotate(count=Count('id'))
                .values_list('notification_type', 'count')
            ),
            'notifications_by_priority': dict(
                Notification.objects.values('priority')
                .annotate(count=Count('id'))
                .values_list('priority', 'count')
            ),
            'delivery_stats': dict(
                NotificationDelivery.objects.values('status')
                .annotate(count=Count('id'))
                .values_list('status', 'count')
            ),
            'channel_stats': dict(
                NotificationDelivery.objects.values('channel')
                .annotate(count=Count('id'))
                .values_list('channel', 'count')
            ),
        }
        
        return Response(stats)
    
    @swagger_auto_schema(
        operation_description="Cleanup expired notifications",
        responses={200: openapi.Response('Cleanup result')}
    )
    @action(detail=False, methods=['post'])
    def cleanup_expired(self, request):
        """Clean up expired notifications"""
        service = NotificationService()
        count = service.cleanup_expired_notifications()
        
        return Response({
            'success': True,
            'message': f'Cleaned up {count} expired notifications',
            'count': count
        })
    
    @swagger_auto_schema(
        operation_description="Retry failed deliveries",
        responses={200: openapi.Response('Retry result')}
    )
    @action(detail=False, methods=['post'])
    def retry_failed(self, request):
        """Retry failed notification deliveries"""
        service = NotificationService()
        count = service.retry_failed_deliveries()
        
        return Response({
            'success': True,
            'message': f'Retried {count} failed deliveries',
            'count': count
        })
    
    @swagger_auto_schema(
        operation_description="Send test notification",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'user_id': openapi.Schema(type=openapi.TYPE_STRING),
                'title': openapi.Schema(type=openapi.TYPE_STRING),
                'message': openapi.Schema(type=openapi.TYPE_STRING),
                'notification_type': openapi.Schema(type=openapi.TYPE_STRING),
                'channels': openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(type=openapi.TYPE_STRING)
                )
            }
        ),
        responses={200: NotificationSerializer}
    )
    @action(detail=False, methods=['post'])
    def send_test(self, request):
        """Send test notification"""
        user_id = request.data.get('user_id')
        title = request.data.get('title', 'Test Notification')
        message = request.data.get('message', 'This is a test notification')
        notification_type = request.data.get('notification_type', NotificationType.SYSTEM)
        channels = request.data.get('channels', ['websocket', 'push'])
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        service = NotificationService()
        notification = service.create_notification(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            channels=channels,
            priority=NotificationPriority.NORMAL
        )
        
        serializer = NotificationSerializer(notification)
        return Response(serializer.data)