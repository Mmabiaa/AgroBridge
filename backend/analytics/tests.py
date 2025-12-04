"""
Analytics Service Tests
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import timedelta
from decimal import Decimal

from .models import DashboardMetric, PredictionModel, Prediction, Report, Insight
from .services import (
    DashboardService, PredictiveAnalyticsService,
    TimeSeriesAnalysisService, InsightGenerationService
)

User = get_user_model()


class DashboardMetricModelTest(TestCase):
    """Test DashboardMetric model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
    
    def test_create_dashboard_metric(self):
        """Test creating a dashboard metric"""
        metric = DashboardMetric.objects.create(
            metric_type='farm_performance',
            user=self.user,
            data={'total_farms': 5, 'total_area': 100.0},
            period_start=timezone.now() - timedelta(days=30),
            period_end=timezone.now(),
            cache_expires_at=timezone.now() + timedelta(hours=1)
        )
        
        self.assertEqual(metric.metric_type, 'farm_performance')
        self.assertEqual(metric.user, self.user)
        self.assertFalse(metric.is_expired)
    
    def test_metric_expiration(self):
        """Test metric expiration check"""
        metric = DashboardMetric.objects.create(
            metric_type='farm_performance',
            user=self.user,
            data={},
            period_start=timezone.now() - timedelta(days=30),
            period_end=timezone.now(),
            cache_expires_at=timezone.now() - timedelta(hours=1)  # Expired
        )
        
        self.assertTrue(metric.is_expired)


class PredictionModelTest(TestCase):
    """Test PredictionModel"""
    
    def test_create_prediction_model(self):
        """Test creating a prediction model"""
        model = PredictionModel.objects.create(
            name='Yield Predictor v1',
            model_type='yield_prediction',
            version='1.0.0',
            status='active',
            algorithm='Random Forest',
            accuracy=Decimal('0.8500')
        )
        
        self.assertEqual(model.name, 'Yield Predictor v1')
        self.assertEqual(model.status, 'active')
        self.assertEqual(model.accuracy, Decimal('0.8500'))


class ReportModelTest(TestCase):
    """Test Report model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
    
    def test_create_report(self):
        """Test creating a report"""
        report = Report.objects.create(
            user=self.user,
            report_type='farm_performance',
            title='Monthly Farm Report',
            period_start=timezone.now() - timedelta(days=30),
            period_end=timezone.now(),
            format='pdf',
            status='pending'
        )
        
        self.assertEqual(report.user, self.user)
        self.assertEqual(report.status, 'pending')
        self.assertEqual(report.format, 'pdf')


class InsightModelTest(TestCase):
    """Test Insight model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
    
    def test_create_insight(self):
        """Test creating an insight"""
        insight = Insight.objects.create(
            user=self.user,
            insight_type='recommendation',
            priority='high',
            title='Harvest tomatoes soon',
            description='Your tomatoes are ready for harvest',
            recommended_actions=['Prepare equipment', 'Arrange labor']
        )
        
        self.assertEqual(insight.user, self.user)
        self.assertEqual(insight.priority, 'high')
        self.assertFalse(insight.is_read)


class DashboardServiceTest(TestCase):
    """Test DashboardService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='farmer'
        )
        self.service = DashboardService(user=self.user)
    
    def test_get_farm_performance(self):
        """Test getting farm performance metrics"""
        metrics = self.service.get_farm_performance(30)
        
        self.assertIn('total_farms', metrics)
        self.assertIn('total_area', metrics)
        self.assertIn('period_days', metrics)
        self.assertEqual(metrics['period_days'], 30)
    
    def test_get_marketplace_stats(self):
        """Test getting marketplace statistics"""
        stats = self.service.get_marketplace_stats(30)
        
        self.assertIn('active_products', stats)
        self.assertIn('total_orders', stats)
        self.assertIn('revenue', stats)
    
    def test_get_user_activity(self):
        """Test getting user activity metrics"""
        activity = self.service.get_user_activity(30)
        
        self.assertIn('posts_created', activity)
        self.assertIn('comments_made', activity)
        self.assertIn('courses_enrolled', activity)
    
    def test_get_financial_summary(self):
        """Test getting financial summary"""
        summary = self.service.get_financial_summary(30)
        
        self.assertIn('total_income', summary)
        self.assertIn('total_expenses', summary)
        self.assertIn('net_income', summary)


class PredictiveAnalyticsServiceTest(TestCase):
    """Test PredictiveAnalyticsService"""
    
    def setUp(self):
        self.service = PredictiveAnalyticsService()
    
    def test_predict_yield(self):
        """Test yield prediction"""
        crop_data = {
            'crop_type': 'tomato',
            'area': 100.0
        }
        
        prediction = self.service.predict_yield(crop_data)
        
        self.assertIn('predicted_yield', prediction)
        self.assertIn('confidence_score', prediction)
        self.assertIn('unit', prediction)
    
    def test_predict_market_price(self):
        """Test market price prediction"""
        product_data = {
            'product_name': 'tomatoes'
        }
        
        prediction = self.service.predict_market_price(product_data)
        
        self.assertIn('predicted_price', prediction)
        self.assertIn('price_range', prediction)
        self.assertIn('confidence_score', prediction)
    
    def test_forecast_demand(self):
        """Test demand forecasting"""
        import uuid
        product_data = {
            'product_id': str(uuid.uuid4())
        }
        
        forecast = self.service.forecast_demand(product_data, 30)
        
        self.assertIn('forecasted_demand', forecast)
        self.assertIn('daily_average', forecast)
        self.assertIn('forecast_period_days', forecast)


class DashboardAPITest(APITestCase):
    """Test Dashboard API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='farmer'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_dashboard_overview(self):
        """Test dashboard overview endpoint"""
        url = '/api/v1/analytics/dashboard/overview/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('farm_performance', response.data)
        self.assertIn('marketplace_stats', response.data)
        self.assertIn('user_activity', response.data)
        self.assertIn('financial_summary', response.data)
    
    def test_farm_performance_endpoint(self):
        """Test farm performance endpoint"""
        url = '/api/v1/analytics/dashboard/farm-performance/'
        response = self.client.get(url, {'days': 30})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_farms', response.data)
        self.assertIn('period_days', response.data)


class PredictiveAnalyticsAPITest(APITestCase):
    """Test Predictive Analytics API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_predict_yield_endpoint(self):
        """Test yield prediction endpoint"""
        url = '/api/v1/analytics/predictions/yield/'
        data = {
            'crop_type': 'tomato',
            'area': 100.0
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('predicted_yield', response.data)
        self.assertIn('confidence_score', response.data)
    
    def test_predict_price_endpoint(self):
        """Test price prediction endpoint"""
        url = '/api/v1/analytics/predictions/price/'
        data = {
            'product_name': 'tomatoes'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('predicted_price', response.data)


class ReportAPITest(APITestCase):
    """Test Report API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_report(self):
        """Test creating a report"""
        url = '/api/v1/analytics/reports/'
        data = {
            'report_type': 'farm_performance',
            'title': 'Monthly Report',
            'description': 'Farm performance for last month',
            'period_start': (timezone.now() - timedelta(days=30)).isoformat(),
            'period_end': timezone.now().isoformat(),
            'format': 'pdf'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        
        report = Report.objects.first()
        self.assertEqual(report.user, self.user)
        self.assertEqual(report.status, 'pending')
    
    def test_list_reports(self):
        """Test listing reports"""
        # Create a report
        Report.objects.create(
            user=self.user,
            report_type='farm_performance',
            title='Test Report',
            period_start=timezone.now() - timedelta(days=30),
            period_end=timezone.now(),
            format='pdf',
            status='completed'
        )
        
        url = '/api/v1/analytics/reports/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class InsightAPITest(APITestCase):
    """Test Insight API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_insights(self):
        """Test listing insights"""
        # Create insights
        Insight.objects.create(
            user=self.user,
            insight_type='recommendation',
            priority='high',
            title='Test Insight',
            description='Test description'
        )
        
        url = '/api/v1/analytics/insights/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_mark_insight_read(self):
        """Test marking insight as read"""
        insight = Insight.objects.create(
            user=self.user,
            insight_type='recommendation',
            priority='high',
            title='Test Insight',
            description='Test description'
        )
        
        url = f'/api/v1/analytics/insights/{insight.id}/mark_read/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        insight.refresh_from_db()
        self.assertTrue(insight.is_read)
    
    def test_generate_insights(self):
        """Test generating insights"""
        url = '/api/v1/analytics/insights/generate/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('insights', response.data)


class InsightGenerationServiceTest(TestCase):
    """Test InsightGenerationService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            role='farmer'
        )
        self.service = InsightGenerationService()
    
    def test_generate_farming_recommendations(self):
        """Test generating farming recommendations"""
        insights = self.service.generate_farming_recommendations(self.user)
        
        self.assertIsInstance(insights, list)
    
    def test_generate_risk_warnings(self):
        """Test generating risk warnings"""
        warnings = self.service.generate_risk_warnings(self.user)
        
        self.assertIsInstance(warnings, list)
    
    def test_generate_optimization_opportunities(self):
        """Test generating optimization opportunities"""
        opportunities = self.service.generate_optimization_opportunities(self.user)
        
        self.assertIsInstance(opportunities, list)
