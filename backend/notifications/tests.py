"""
Notification Service Tests

This module contains comprehensive tests for the notification service.
"""

import json
from datetime import timedelta
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async

from .models import (
    Notification,
    NotificationDelivery,
    UserNotificationPreferences,
    NotificationTemplate,
    NotificationType,
    NotificationPriority,
    DeliveryChannel,
    DeliveryStatus
)
from .services import NotificationService
from .consumers import NotificationConsumer

User = get_user_model()


class NotificationModelTests(TestCase):
    """Tests for Notification models"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
    
    def test_create_notification(self):
        """Test creating a notification"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test Notification',
            message='This is a test notification',
            notification_type=NotificationType.SYSTEM,
            priority=NotificationPriority.NORMAL,
            channels=['websocket', 'push']
        )
        
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.title, 'Test Notification')
        self.assertFalse(notification.is_read)
        self.assertIsNone(notification.read_at)
    
    def test_mark_as_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=self.user,
            title='Test',
            message='Test message',
        )
        
        self.assertFalse(notification.is_read)
        
        notification.mark_as_read()
        
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)
    
    def test_notification_expiry(self):
        """Test notification expiry"""
        # Create expired notification
        expired_notification = Notification.objects.create(
            user=self.user,
            title='Expired',
            message='This is expired',
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        self.assertTrue(expired_notification.is_expired())
        
        # Create valid notification
        valid_notification = Notification.objects.create(
            user=self.user,
            title='Valid',
            message='This is valid',
            expires_at=timezone.now() + timedelta(hours=1)
        )
        
        self.assertFalse(valid_notification.is_expired())
    
    def test_scheduled_notification(self):
        """Test scheduled notification"""
        # Future scheduled notification
        future_notification = Notification.objects.create(
            user=self.user,
            title='Future',
            message='Scheduled for future',
            scheduled_at=timezone.now() + timedelta(hours=1)
        )
        
        self.assertFalse(future_notification.should_send_now())
        
        # Past scheduled notification
        past_notification = Notification.objects.create(
            user=self.user,
            title='Past',
            message='Scheduled for past',
            scheduled_at=timezone.now() - timedelta(hours=1)
        )
        
        self.assertTrue(past_notification.should_send_now())


class UserNotificationPreferencesTests(TestCase):
    """Tests for user notification preferences"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.preferences = UserNotificationPreferences.objects.create(
            user=self.user,
            enable_websocket=True,
            enable_push=True,
            enable_email=True,
            enable_sms=False,
            dnd_enabled=True,
            dnd_start_time='22:00',
            dnd_end_time='06:00'
        )
    
    def test_should_receive_notification(self):
        """Test notification preference checking"""
        # Should receive via enabled channel
        self.assertTrue(
            self.preferences.should_receive_notification(
                NotificationType.SYSTEM,
                'websocket'
            )
        )
        
        # Should not receive via disabled channel
        self.assertFalse(
            self.preferences.should_receive_notification(
                NotificationType.SYSTEM,
                'sms'
            )
        )
    
    def test_fcm_token_management(self):
        """Test FCM token management"""
        token1 = 'test_token_1'
        token2 = 'test_token_2'
        
        self.preferences.fcm_tokens = [token1]
        self.preferences.save()
        
        self.assertIn(token1, self.preferences.fcm_tokens)
        
        # Add another token
        self.preferences.fcm_tokens.append(token2)
        self.preferences.save()
        
        self.assertEqual(len(self.preferences.fcm_tokens), 2)


class NotificationServiceTests(TestCase):
    """Tests for NotificationService"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.service = NotificationService()
    
    def test_create_notification(self):
        """Test creating notification via service"""
        notification = self.service.create_notification(
            user=self.user,
            title='Test Notification',
            message='Test message',
            notification_type=NotificationType.SYSTEM,
            priority=NotificationPriority.NORMAL,
            send_immediately=False
        )
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.title, 'Test Notification')
    
    def test_create_from_template(self):
        """Test creating notification from template"""
        # Create template
        template = NotificationTemplate.objects.create(
            name='test_template',
            notification_type=NotificationType.SYSTEM,
            title_template='Hello {{ user_name }}',
            message_template='Welcome to {{ site_name }}',
            default_channels=['websocket', 'push'],
            default_priority=NotificationPriority.NORMAL
        )
        
        # Create notification from template
        notification = self.service.create_from_template(
            template_name='test_template',
            user=self.user,
            context={
                'user_name': 'John',
                'site_name': 'AgroBridge'
            }
        )
        
        self.assertIsNotNone(notification)
        self.assertEqual(notification.title, 'Hello John')
        self.assertEqual(notification.message, 'Welcome to AgroBridge')
    
    @patch('notifications.services.NotificationService._send_websocket')
    def test_send_notification(self, mock_websocket):
        """Test sending notification"""
        mock_websocket.return_value = True
        
        notification = self.service.create_notification(
            user=self.user,
            title='Test',
            message='Test message',
            channels=['websocket'],
            send_immediately=False
        )
        
        success = self.service.send_notification(notification)
        
        self.assertTrue(success)
        mock_websocket.assert_called_once()
    
    def test_get_user_preferences(self):
        """Test getting user preferences"""
        preferences = self.service.get_user_preferences(self.user)
        
        self.assertIsNotNone(preferences)
        self.assertEqual(preferences.user, self.user)
    
    def test_mark_as_read(self):
        """Test marking notifications as read"""
        # Create notifications
        n1 = self.service.create_notification(
            user=self.user,
            title='Test 1',
            message='Message 1',
            send_immediately=False
        )
        
        n2 = self.service.create_notification(
            user=self.user,
            title='Test 2',
            message='Message 2',
            send_immediately=False
        )
        
        # Mark as read
        count = self.service.mark_as_read([str(n1.id), str(n2.id)], self.user)
        
        self.assertEqual(count, 2)
        
        # Verify they are read
        n1.refresh_from_db()
        n2.refresh_from_db()
        
        self.assertTrue(n1.is_read)
        self.assertTrue(n2.is_read)
    
    def test_get_user_stats(self):
        """Test getting user statistics"""
        # Create some notifications
        for i in range(5):
            self.service.create_notification(
                user=self.user,
                title=f'Test {i}',
                message=f'Message {i}',
                send_immediately=False
            )
        
        stats = self.service.get_user_stats(self.user)
        
        self.assertEqual(stats['total_notifications'], 5)
        self.assertEqual(stats['unread_notifications'], 5)


class NotificationAPITests(APITestCase):
    """Tests for Notification API endpoints"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        self.service = NotificationService()
    
    def test_list_notifications(self):
        """Test listing notifications"""
        # Create notifications
        for i in range(3):
            self.service.create_notification(
                user=self.user,
                title=f'Test {i}',
                message=f'Message {i}',
                send_immediately=False
            )
        
        response = self.client.get('/api/v1/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_mark_notification_read(self):
        """Test marking notification as read"""
        notification = self.service.create_notification(
            user=self.user,
            title='Test',
            message='Test message',
            send_immediately=False
        )
        
        response = self.client.post(
            f'/api/v1/notifications/{notification.id}/mark_read/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)
    
    def test_bulk_mark_read(self):
        """Test bulk marking notifications as read"""
        # Create notifications
        notifications = []
        for i in range(3):
            n = self.service.create_notification(
                user=self.user,
                title=f'Test {i}',
                message=f'Message {i}',
                send_immediately=False
            )
            notifications.append(n)
        
        notification_ids = [str(n.id) for n in notifications]
        
        response = self.client.post(
            '/api/v1/notifications/bulk_action/',
            {
                'notification_ids': notification_ids,
                'action': 'mark_read'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
    
    def test_get_notification_stats(self):
        """Test getting notification statistics"""
        # Create notifications
        for i in range(5):
            self.service.create_notification(
                user=self.user,
                title=f'Test {i}',
                message=f'Message {i}',
                send_immediately=False
            )
        
        response = self.client.get('/api/v1/notifications/stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_notifications'], 5)
    
    def test_get_unread_count(self):
        """Test getting unread notification count"""
        # Create notifications
        for i in range(3):
            self.service.create_notification(
                user=self.user,
                title=f'Test {i}',
                message=f'Message {i}',
                send_immediately=False
            )
        
        response = self.client.get('/api/v1/notifications/unread_count/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['unread_count'], 3)
    
    def test_update_preferences(self):
        """Test updating notification preferences"""
        response = self.client.put(
            '/api/v1/preferences/me/',
            {
                'enable_push': False,
                'enable_email': True,
                'dnd_enabled': True,
                'dnd_start_time': '22:00:00',
                'dnd_end_time': '06:00:00'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['enable_push'])
        self.assertTrue(response.data['enable_email'])
    
    def test_register_fcm_token(self):
        """Test registering FCM token"""
        response = self.client.post(
            '/api/v1/preferences/register_fcm_token/',
            {
                'token': 'test_fcm_token_123456789',
                'device_type': 'android'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])


class NotificationTemplateTests(TestCase):
    """Tests for notification templates"""
    
    def test_create_template(self):
        """Test creating notification template"""
        template = NotificationTemplate.objects.create(
            name='welcome_template',
            notification_type=NotificationType.SYSTEM,
            title_template='Welcome {{ user_name }}!',
            message_template='Thank you for joining {{ site_name }}.',
            default_channels=['websocket', 'email'],
            default_priority=NotificationPriority.NORMAL
        )
        
        self.assertEqual(template.name, 'welcome_template')
        self.assertTrue(template.is_active)
    
    def test_render_template(self):
        """Test rendering template with context"""
        template = NotificationTemplate.objects.create(
            name='test_template',
            notification_type=NotificationType.SYSTEM,
            title_template='Hello {{ name }}',
            message_template='Your balance is {{ balance }}',
        )
        
        rendered = template.render({
            'name': 'John',
            'balance': '$100'
        })
        
        self.assertEqual(rendered['title'], 'Hello John')
        self.assertEqual(rendered['message'], 'Your balance is $100')


class NotificationDeliveryTests(TestCase):
    """Tests for notification delivery"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.notification = Notification.objects.create(
            user=self.user,
            title='Test',
            message='Test message',
            channels=['websocket', 'push']
        )
    
    def test_create_delivery_record(self):
        """Test creating delivery record"""
        delivery = NotificationDelivery.objects.create(
            notification=self.notification,
            channel=DeliveryChannel.WEBSOCKET,
            status=DeliveryStatus.PENDING
        )
        
        self.assertEqual(delivery.notification, self.notification)
        self.assertEqual(delivery.channel, DeliveryChannel.WEBSOCKET)
        self.assertEqual(delivery.status, DeliveryStatus.PENDING)
    
    def test_update_delivery_status(self):
        """Test updating delivery status"""
        delivery = NotificationDelivery.objects.create(
            notification=self.notification,
            channel=DeliveryChannel.PUSH,
            status=DeliveryStatus.PENDING
        )
        
        delivery.status = DeliveryStatus.SENT
        delivery.sent_at = timezone.now()
        delivery.save()
        
        self.assertEqual(delivery.status, DeliveryStatus.SENT)
        self.assertIsNotNone(delivery.sent_at)


class NotificationIntegrationTests(TransactionTestCase):
    """Integration tests for notification system"""
    
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        
        self.service = NotificationService()
    
    @patch('notifications.websocket.send_websocket_notification')
    def test_end_to_end_notification_flow(self, mock_websocket):
        """Test complete notification flow"""
        mock_websocket.return_value = True
        
        # Create notification
        notification = self.service.create_notification(
            user=self.user,
            title='Test Notification',
            message='This is a test',
            notification_type=NotificationType.SYSTEM,
            priority=NotificationPriority.NORMAL,
            channels=['websocket'],
            send_immediately=True
        )
        
        # Verify notification was created
        self.assertIsNotNone(notification)
        self.assertEqual(notification.user, self.user)
        
        # Verify delivery was attempted
        delivery = NotificationDelivery.objects.filter(
            notification=notification,
            channel=DeliveryChannel.WEBSOCKET
        ).first()
        
        self.assertIsNotNone(delivery)
        self.assertEqual(delivery.status, DeliveryStatus.SENT)
        
        # Mark as read
        notification.mark_as_read()
        
        self.assertTrue(notification.is_read)
        self.assertIsNotNone(notification.read_at)


class NotificationPermissionTests(APITestCase):
    """Tests for notification permissions"""
    
    def setUp(self):
        """Set up test data"""
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        
        self.admin = User.objects.create_user(
            email='admin@example.com',
            password='testpass123',
            is_staff=True
        )
        
        self.service = NotificationService()
        
        # Create notification for user1
        self.notification = self.service.create_notification(
            user=self.user1,
            title='Test',
            message='Test message',
            send_immediately=False
        )
    
    def test_user_can_access_own_notifications(self):
        """Test user can access their own notifications"""
        self.client.force_authenticate(user=self.user1)
        
        response = self.client.get(f'/api/v1/notifications/{self.notification.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_user_cannot_access_others_notifications(self):
        """Test user cannot access other users' notifications"""
        self.client.force_authenticate(user=self.user2)
        
        response = self.client.get(f'/api/v1/notifications/{self.notification.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_admin_can_access_all_notifications(self):
        """Test admin can access all notifications"""
        self.client.force_authenticate(user=self.admin)
        
        response = self.client.get(f'/api/v1/notifications/{self.notification.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_unauthenticated_cannot_access(self):
        """Test unauthenticated users cannot access notifications"""
        response = self.client.get('/api/v1/notifications/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
