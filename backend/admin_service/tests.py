from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    SystemConfiguration, FeatureFlag, ModerationQueue,
    AuditLog, SecurityIncident, PlatformMetrics
)
from .services import (
    UserManagementService, ModerationService,
    SecurityMonitoringService, AnalyticsService
)

User = get_user_model()


class AdminServiceTestCase(TestCase):
    """Test cases for Admin Service"""

    def setUp(self):
        """Set up test data"""
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass123',
            is_staff=True,
            is_superuser=True
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@test.com',
            password='testpass123'
        )

    def test_user_management_list(self):
        """Test listing users"""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get('/api/admin/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 2)

    def test_user_activation(self):
        """Test user activation"""
        self.regular_user.is_active = False
        self.regular_user.save()
        
        result = UserManagementService.activate_user(
            self.regular_user,
            self.admin_user
        )
        
        self.assertTrue(result['success'])
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.is_active)

    def test_user_deactivation(self):
        """Test user deactivation"""
        result = UserManagementService.deactivate_user(
            self.regular_user,
            self.admin_user
        )
        
        self.assertTrue(result['success'])
        self.regular_user.refresh_from_db()
        self.assertFalse(self.regular_user.is_active)

    def test_system_configuration(self):
        """Test system configuration"""
        config = SystemConfiguration.objects.create(
            key='test_key',
            value='test_value',
            category='test',
            updated_by=self.admin_user
        )
        
        self.assertEqual(config.key, 'test_key')
        self.assertEqual(config.value, 'test_value')

    def test_feature_flag(self):
        """Test feature flag"""
        flag = FeatureFlag.objects.create(
            name='test_feature',
            description='Test feature',
            is_enabled=True,
            rollout_percentage=50,
            created_by=self.admin_user
        )
        
        # Test for user with ID that should be included
        self.assertTrue(flag.is_enabled_for_user(self.regular_user))

    def test_moderation_queue(self):
        """Test moderation queue"""
        from django.contrib.contenttypes.models import ContentType
        
        content_type = ContentType.objects.get_for_model(User)
        
        item = ModerationQueue.objects.create(
            content_type=content_type,
            object_id=self.regular_user.id,
            moderation_type='post',
            status='pending',
            reported_by=self.admin_user,
            report_reason='Test report'
        )
        
        result = ModerationService.moderate_content(
            item,
            'approve',
            self.admin_user,
            'Looks good'
        )
        
        self.assertTrue(result['success'])
        item.refresh_from_db()
        self.assertEqual(item.status, 'approved')

    def test_audit_log_creation(self):
        """Test audit log creation"""
        log = AuditLog.objects.create(
            user=self.admin_user,
            action_type='create',
            description='Test action'
        )
        
        self.assertEqual(log.user, self.admin_user)
        self.assertEqual(log.action_type, 'create')

    def test_security_incident(self):
        """Test security incident"""
        incident = SecurityIncident.objects.create(
            incident_type='test_incident',
            severity='medium',
            description='Test incident',
            detection_method='manual'
        )
        
        self.assertEqual(incident.status, 'open')
        self.assertEqual(incident.severity, 'medium')

    def test_user_statistics(self):
        """Test user statistics"""
        stats = UserManagementService.get_user_statistics()
        
        self.assertIn('total_users', stats)
        self.assertIn('active_users', stats)
        self.assertGreaterEqual(stats['total_users'], 2)

    def test_moderation_statistics(self):
        """Test moderation statistics"""
        stats = ModerationService.get_moderation_statistics()
        
        self.assertIn('total', stats)
        self.assertIn('pending', stats)

    def test_security_statistics(self):
        """Test security statistics"""
        stats = SecurityMonitoringService.get_security_statistics()
        
        self.assertIn('total_incidents', stats)
        self.assertIn('open_incidents', stats)

    def test_dashboard_overview(self):
        """Test dashboard overview"""
        overview = AnalyticsService.get_dashboard_overview()
        
        self.assertIn('total_users', overview)
        self.assertIn('system_health', overview)

    def test_platform_metrics(self):
        """Test platform metrics"""
        metric = PlatformMetrics.objects.create(
            metric_name='test_metric',
            metric_value=100.0,
            metric_unit='count',
            category='test'
        )
        
        self.assertEqual(metric.metric_value, 100.0)

    def test_bulk_moderation(self):
        """Test bulk moderation"""
        from django.contrib.contenttypes.models import ContentType
        
        content_type = ContentType.objects.get_for_model(User)
        
        items = []
        for i in range(3):
            item = ModerationQueue.objects.create(
                content_type=content_type,
                object_id=self.regular_user.id,
                moderation_type='post',
                status='pending',
                reported_by=self.admin_user,
                report_reason=f'Test report {i}'
            )
            items.append(item.id)
        
        result = ModerationService.bulk_moderate(
            items,
            'approve',
            self.admin_user,
            'Bulk approval'
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['count'], 3)

    def test_failed_login_tracking(self):
        """Test failed login tracking"""
        SecurityMonitoringService.track_failed_login(
            self.regular_user,
            '127.0.0.1',
            'Test User Agent'
        )
        
        # Check that activity was logged
        activity_count = self.regular_user.activities.filter(
            activity_type='failed_login'
        ).count()
        
        self.assertEqual(activity_count, 1)

    def test_user_growth_analytics(self):
        """Test user growth analytics"""
        growth = AnalyticsService.get_user_growth(days=7)
        
        self.assertIn('period', growth)
        self.assertIn('data', growth)
        self.assertEqual(len(growth['data']), 8)  # 7 days + today

    def test_feature_flag_rollout(self):
        """Test feature flag rollout percentage"""
        flag = FeatureFlag.objects.create(
            name='partial_rollout',
            description='Partial rollout test',
            is_enabled=True,
            rollout_percentage=0,
            created_by=self.admin_user
        )
        
        # With 0% rollout, should be disabled
        self.assertFalse(flag.is_enabled_for_user(self.regular_user))
        
        # With 100% rollout, should be enabled
        flag.rollout_percentage = 100
        flag.save()
        self.assertTrue(flag.is_enabled_for_user(self.regular_user))

    def test_sensitive_config_hiding(self):
        """Test that sensitive config values are hidden"""
        from .serializers import SystemConfigurationSerializer
        
        config = SystemConfiguration.objects.create(
            key='api_key',
            value='secret123',
            category='security',
            is_sensitive=True,
            updated_by=self.admin_user
        )
        
        serializer = SystemConfigurationSerializer(config)
        self.assertEqual(serializer.data['value'], '***HIDDEN***')
