"""
Financial Management API views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from datetime import timedelta, datetime
from decimal import Decimal
import logging

from .models import FinancialRecord, Budget, ExchangeRate
from .serializers import (
    FinancialRecordSerializer, BudgetSerializer, ExchangeRateSerializer,
    FinancialSummarySerializer, CashFlowSerializer, BudgetPerformanceSerializer
)
from .filters import FinancialRecordFilter, BudgetFilter
from .analytics import FinancialAnalytics, BudgetMonitor
from .reports import FinancialReportGenerator

logger = logging.getLogger(__name__)


class FinancialRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing financial records (income and expenses)
    """
    serializer_class = FinancialRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FinancialRecordFilter
    search_fields = ['description', 'reference_number', 'invoice_number', 'notes']
    ordering_fields = ['transaction_date', 'amount', 'created_at']
    ordering = ['-transaction_date', '-created_at']
    
    def get_queryset(self):
        """Filter records for current user"""
        return FinancialRecord.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get financial summary for a date range"""
        # Get date range from query params
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        currency = request.query_params.get('currency', 'GHS')
        
        # Default to current month if not provided
        if not start_date or not end_date:
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = today
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        analytics = FinancialAnalytics(user=request.user)
        summary = analytics.get_financial_summary(start_date, end_date, currency)
        
        serializer = FinancialSummarySerializer(summary)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def cash_flow(self, request):
        """Get cash flow analysis"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        currency = request.query_params.get('currency', 'GHS')
        
        if not start_date or not end_date:
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = today
        else:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        
        analytics = FinancialAnalytics(user=request.user)
        cash_flow = analytics.get_cash_flow_analysis(start_date, end_date, currency)
        
        serializer = CashFlowSerializer(cash_flow)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get financial records grouped by category"""
        record_type = request.query_params.get('type', 'expense')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = self.get_queryset().filter(record_type=record_type)
        
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        
        # Group by category
        category_data = queryset.values('category').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        return Response(category_data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """Export financial records to CSV"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        format_type = request.query_params.get('format', 'csv')  # csv, pdf, excel
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        
        generator = FinancialReportGenerator(user=request.user)
        
        if format_type == 'pdf':
            report = generator.generate_pdf_report(queryset, start_date, end_date)
            return Response({
                'format': 'pdf',
                'url': report['url'],
                'filename': report['filename']
            })
        elif format_type == 'excel':
            report = generator.generate_excel_report(queryset, start_date, end_date)
            return Response({
                'format': 'excel',
                'url': report['url'],
                'filename': report['filename']
            })
        else:  # csv
            report = generator.generate_csv_report(queryset, start_date, end_date)
            return Response({
                'format': 'csv',
                'url': report['url'],
                'filename': report['filename']
            })


class BudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing budgets
    """
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BudgetFilter
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'end_date', 'budgeted_amount', 'created_at']
    ordering = ['-start_date']
    
    def get_queryset(self):
        """Filter budgets for current user"""
        return Budget.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active budgets"""
        today = timezone.now().date()
        active_budgets = self.get_queryset().filter(
            status='active',
            start_date__lte=today,
            end_date__gte=today
        )
        
        serializer = self.get_serializer(active_budgets, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def performance(self, request):
        """Get budget performance analysis"""
        monitor = BudgetMonitor(user=request.user)
        performance = monitor.get_budget_performance()
        
        serializer = BudgetPerformanceSerializer(performance, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """Get budget alerts (exceeded or near threshold)"""
        monitor = BudgetMonitor(user=request.user)
        alerts = monitor.get_budget_alerts()
        
        return Response(alerts)
    
    @action(detail=True, methods=['post'])
    def check_spending(self, request, pk=None):
        """Check current spending against budget"""
        budget = self.get_object()
        
        return Response({
            'budget_id': budget.id,
            'budget_name': budget.name,
            'budgeted_amount': budget.budgeted_amount,
            'spent_amount': budget.spent_amount,
            'remaining_amount': budget.remaining_amount,
            'spent_percentage': budget.spent_percentage,
            'is_exceeded': budget.is_exceeded,
            'days_remaining': budget.days_remaining,
            'status': budget.status
        })


class ExchangeRateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing exchange rates
    """
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['base_currency', 'target_currency', 'date']
    ordering_fields = ['date', 'rate']
    ordering = ['-date']
    
    def get_queryset(self):
        """Get all exchange rates"""
        return ExchangeRate.objects.all()
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest exchange rates"""
        base_currency = request.query_params.get('base', 'GHS')
        target_currency = request.query_params.get('target')
        
        if target_currency:
            # Get specific rate
            rate = ExchangeRate.objects.filter(
                base_currency=base_currency,
                target_currency=target_currency
            ).first()
            
            if rate:
                serializer = self.get_serializer(rate)
                return Response(serializer.data)
            else:
                return Response(
                    {'error': 'Exchange rate not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get all rates for base currency
            rates = ExchangeRate.objects.filter(
                base_currency=base_currency
            ).order_by('target_currency', '-date').distinct('target_currency')
            
            serializer = self.get_serializer(rates, many=True)
            return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def convert(self, request):
        """Convert amount between currencies"""
        amount = Decimal(request.data.get('amount', 0))
        from_currency = request.data.get('from_currency', 'GHS')
        to_currency = request.data.get('to_currency', 'USD')
        
        if from_currency == to_currency:
            return Response({
                'amount': amount,
                'from_currency': from_currency,
                'to_currency': to_currency,
                'converted_amount': amount,
                'rate': 1.0
            })
        
        # Get exchange rate
        rate_obj = ExchangeRate.objects.filter(
            base_currency=from_currency,
            target_currency=to_currency
        ).first()
        
        if not rate_obj:
            return Response(
                {'error': 'Exchange rate not available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        converted_amount = amount * rate_obj.rate
        
        return Response({
            'amount': amount,
            'from_currency': from_currency,
            'to_currency': to_currency,
            'converted_amount': converted_amount,
            'rate': rate_obj.rate,
            'rate_date': rate_obj.date
        })
