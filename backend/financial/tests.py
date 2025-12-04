"""
Tests for Financial Management Service
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import timedelta
import uuid

from .models import FinancialRecord, Budget, ExchangeRate
from .analytics import FinancialAnalytics, BudgetMonitor

User = get_user_model()


class FinancialRecordModelTest(TestCase):
    """Test FinancialRecord model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
    
    def test_create_income_record(self):
        """Test creating an income record"""
        record = FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('1500.00'),
            currency='GHS',
            description='Sold tomatoes',
            transaction_date=timezone.now().date(),
            payment_method='cash'
        )
        
        self.assertEqual(record.user, self.user)
        self.assertEqual(record.record_type, 'income')
        self.assertEqual(record.amount, Decimal('1500.00'))
        self.assertIsNotNone(record.id)
    
    def test_create_expense_record(self):
        """Test creating an expense record"""
        record = FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('500.00'),
            currency='GHS',
            description='Bought NPK fertilizer',
            transaction_date=timezone.now().date(),
            payment_method='mobile_money'
        )
        
        self.assertEqual(record.record_type, 'expense')
        self.assertEqual(record.category, 'fertilizer')
        self.assertEqual(record.amount, Decimal('500.00'))
    
    def test_record_string_representation(self):
        """Test string representation of financial record"""
        record = FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('1000.00'),
            currency='GHS',
            description='Test',
            transaction_date=timezone.now().date(),
            payment_method='cash'
        )
        
        self.assertIn('Income', str(record))
        self.assertIn('1000', str(record))


class BudgetModelTest(TestCase):
    """Test Budget model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.today = timezone.now().date()
    
    def test_create_budget(self):
        """Test creating a budget"""
        budget = Budget.objects.create(
            user=self.user,
            name='Monthly Fertilizer Budget',
            category='fertilizer',
            budgeted_amount=Decimal('2000.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30),
            alert_threshold=80
        )
        
        self.assertEqual(budget.user, self.user)
        self.assertEqual(budget.budgeted_amount, Decimal('2000.00'))
        self.assertEqual(budget.status, 'active')
    
    def test_budget_spent_amount(self):
        """Test budget spent amount calculation"""
        budget = Budget.objects.create(
            user=self.user,
            name='Test Budget',
            category='fertilizer',
            budgeted_amount=Decimal('1000.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30)
        )
        
        # Create expense records
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('300.00'),
            currency='GHS',
            description='Test expense 1',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('200.00'),
            currency='GHS',
            description='Test expense 2',
            transaction_date=self.today + timedelta(days=1),
            payment_method='cash'
        )
        
        self.assertEqual(budget.spent_amount, Decimal('500.00'))
        self.assertEqual(budget.remaining_amount, Decimal('500.00'))
        self.assertEqual(budget.spent_percentage, 50.0)
        self.assertFalse(budget.is_exceeded)
    
    def test_budget_exceeded(self):
        """Test budget exceeded detection"""
        budget = Budget.objects.create(
            user=self.user,
            name='Test Budget',
            category='seeds',
            budgeted_amount=Decimal('500.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30)
        )
        
        # Create expense that exceeds budget
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='seeds',
            amount=Decimal('600.00'),
            currency='GHS',
            description='Exceeded budget',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        self.assertTrue(budget.is_exceeded)
        self.assertEqual(budget.spent_percentage, 120.0)


class FinancialRecordAPITest(APITestCase):
    """Test FinancialRecord API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.today = timezone.now().date()
    
    def test_create_financial_record(self):
        """Test creating a financial record via API"""
        data = {
            'record_type': 'income',
            'category': 'crop_sales',
            'amount': '1500.00',
            'currency': 'GHS',
            'description': 'Sold vegetables',
            'transaction_date': self.today.isoformat(),
            'payment_method': 'cash'
        }
        
        response = self.client.post('/api/v1/financial/records/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['amount'], '1500.00')
        self.assertEqual(response.data['record_type'], 'income')
    
    def test_list_financial_records(self):
        """Test listing financial records"""
        # Create test records
        FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('1000.00'),
            currency='GHS',
            description='Test income',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        response = self.client.get('/api/v1/financial/records/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_filter_by_record_type(self):
        """Test filtering records by type"""
        # Create income and expense
        FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('1000.00'),
            currency='GHS',
            description='Income',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('500.00'),
            currency='GHS',
            description='Expense',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        response = self.client.get('/api/v1/financial/records/?record_type=income')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for record in response.data['results']:
            self.assertEqual(record['record_type'], 'income')
    
    def test_financial_summary(self):
        """Test financial summary endpoint"""
        # Create test data
        FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('2000.00'),
            currency='GHS',
            description='Income',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('800.00'),
            currency='GHS',
            description='Expense',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        response = self.client.get('/api/v1/financial/records/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_income', response.data)
        self.assertIn('total_expenses', response.data)
        self.assertIn('net_profit', response.data)
    
    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access records"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/v1/financial/records/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class BudgetAPITest(APITestCase):
    """Test Budget API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.today = timezone.now().date()
    
    def test_create_budget(self):
        """Test creating a budget via API"""
        data = {
            'name': 'Monthly Seeds Budget',
            'category': 'seeds',
            'budgeted_amount': '1000.00',
            'currency': 'GHS',
            'period': 'monthly',
            'start_date': self.today.isoformat(),
            'end_date': (self.today + timedelta(days=30)).isoformat(),
            'alert_threshold': 80
        }
        
        response = self.client.post('/api/v1/financial/budgets/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Monthly Seeds Budget')
        self.assertEqual(response.data['budgeted_amount'], '1000.00')
    
    def test_list_budgets(self):
        """Test listing budgets"""
        Budget.objects.create(
            user=self.user,
            name='Test Budget',
            category='fertilizer',
            budgeted_amount=Decimal('500.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30)
        )
        
        response = self.client.get('/api/v1/financial/budgets/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_active_budgets(self):
        """Test getting active budgets"""
        Budget.objects.create(
            user=self.user,
            name='Active Budget',
            category='fertilizer',
            budgeted_amount=Decimal('1000.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30),
            status='active'
        )
        
        response = self.client.get('/api/v1/financial/budgets/active/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_budget_performance(self):
        """Test budget performance endpoint"""
        budget = Budget.objects.create(
            user=self.user,
            name='Test Budget',
            category='seeds',
            budgeted_amount=Decimal('1000.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30)
        )
        
        # Add some spending
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='seeds',
            amount=Decimal('400.00'),
            currency='GHS',
            description='Seeds purchase',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        response = self.client.get('/api/v1/financial/budgets/performance/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)


class FinancialAnalyticsTest(TestCase):
    """Test financial analytics"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.today = timezone.now().date()
        self.analytics = FinancialAnalytics(user=self.user)
    
    def test_financial_summary(self):
        """Test financial summary calculation"""
        # Create test data
        FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('3000.00'),
            currency='GHS',
            description='Income',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('1000.00'),
            currency='GHS',
            description='Expense',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        summary = self.analytics.get_financial_summary(
            self.today,
            self.today,
            'GHS'
        )
        
        self.assertEqual(summary['total_income'], Decimal('3000.00'))
        self.assertEqual(summary['total_expenses'], Decimal('1000.00'))
        self.assertEqual(summary['net_profit'], Decimal('2000.00'))
    
    def test_cash_flow_analysis(self):
        """Test cash flow analysis"""
        # Create test data
        FinancialRecord.objects.create(
            user=self.user,
            record_type='income',
            category='crop_sales',
            amount=Decimal('2000.00'),
            currency='GHS',
            description='Income',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        cash_flow = self.analytics.get_cash_flow_analysis(
            self.today,
            self.today,
            'GHS'
        )
        
        self.assertEqual(cash_flow['total_inflow'], Decimal('2000.00'))
        self.assertIn('cash_flow_timeline', cash_flow)


class BudgetMonitorTest(TestCase):
    """Test budget monitoring"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.today = timezone.now().date()
        self.monitor = BudgetMonitor(user=self.user)
    
    def test_budget_alerts(self):
        """Test budget alert generation"""
        # Create budget
        budget = Budget.objects.create(
            user=self.user,
            name='Test Budget',
            category='fertilizer',
            budgeted_amount=Decimal('1000.00'),
            currency='GHS',
            period='monthly',
            start_date=self.today,
            end_date=self.today + timedelta(days=30),
            alert_threshold=80
        )
        
        # Add spending that exceeds threshold
        FinancialRecord.objects.create(
            user=self.user,
            record_type='expense',
            category='fertilizer',
            amount=Decimal('900.00'),
            currency='GHS',
            description='High spending',
            transaction_date=self.today,
            payment_method='cash'
        )
        
        alerts = self.monitor.get_budget_alerts()
        self.assertGreater(len(alerts), 0)
        self.assertEqual(alerts[0]['alert_type'], 'threshold')
