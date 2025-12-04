"""
Financial analytics and reporting utilities
"""
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from collections import defaultdict
import calendar

from .models import FinancialRecord, Budget


class FinancialAnalytics:
    """
    Financial analytics and insights
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_financial_summary(self, start_date, end_date, currency='GHS'):
        """
        Get comprehensive financial summary for a date range
        """
        records = FinancialRecord.objects.filter(
            user=self.user,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
            currency=currency
        )
        
        # Calculate totals
        income_records = records.filter(record_type='income')
        expense_records = records.filter(record_type='expense')
        
        total_income = income_records.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        total_expenses = expense_records.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        net_profit = total_income - total_expenses
        
        # Breakdown by category
        income_by_category = {}
        for record in income_records.values('category').annotate(total=Sum('amount')):
            income_by_category[record['category']] = float(record['total'])
        
        expenses_by_category = {}
        for record in expense_records.values('category').annotate(total=Sum('amount')):
            expenses_by_category[record['category']] = float(record['total'])
        
        # Monthly trends
        monthly_data = self._get_monthly_trends(start_date, end_date, currency)
        
        return {
            'total_income': total_income,
            'total_expenses': total_expenses,
            'net_profit': net_profit,
            'currency': currency,
            'period_start': start_date,
            'period_end': end_date,
            'income_by_category': income_by_category,
            'expenses_by_category': expenses_by_category,
            'monthly_income': monthly_data['income'],
            'monthly_expenses': monthly_data['expenses'],
            'monthly_profit': monthly_data['profit']
        }
    
    def _get_monthly_trends(self, start_date, end_date, currency):
        """
        Get monthly income, expenses, and profit trends
        """
        monthly_income = []
        monthly_expenses = []
        monthly_profit = []
        
        current_date = start_date.replace(day=1)
        
        while current_date <= end_date:
            # Get last day of month
            last_day = calendar.monthrange(current_date.year, current_date.month)[1]
            month_end = current_date.replace(day=last_day)
            
            # Calculate for this month
            month_records = FinancialRecord.objects.filter(
                user=self.user,
                transaction_date__gte=current_date,
                transaction_date__lte=month_end,
                currency=currency
            )
            
            income = month_records.filter(record_type='income').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            expenses = month_records.filter(record_type='expense').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            monthly_income.append({
                'month': current_date.strftime('%Y-%m'),
                'amount': float(income)
            })
            monthly_expenses.append({
                'month': current_date.strftime('%Y-%m'),
                'amount': float(expenses)
            })
            monthly_profit.append({
                'month': current_date.strftime('%Y-%m'),
                'amount': float(income - expenses)
            })
            
            # Move to next month
            if current_date.month == 12:
                current_date = current_date.replace(year=current_date.year + 1, month=1)
            else:
                current_date = current_date.replace(month=current_date.month + 1)
        
        return {
            'income': monthly_income,
            'expenses': monthly_expenses,
            'profit': monthly_profit
        }
    
    def get_cash_flow_analysis(self, start_date, end_date, currency='GHS'):
        """
        Get cash flow analysis
        """
        # Calculate opening balance (all records before start_date)
        opening_income = FinancialRecord.objects.filter(
            user=self.user,
            record_type='income',
            transaction_date__lt=start_date,
            currency=currency
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        opening_expenses = FinancialRecord.objects.filter(
            user=self.user,
            record_type='expense',
            transaction_date__lt=start_date,
            currency=currency
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        
        opening_balance = opening_income - opening_expenses
        
        # Calculate period cash flow
        period_records = FinancialRecord.objects.filter(
            user=self.user,
            transaction_date__gte=start_date,
            transaction_date__lte=end_date,
            currency=currency
        )
        
        total_inflow = period_records.filter(record_type='income').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        total_outflow = period_records.filter(record_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0.00')
        
        net_cash_flow = total_inflow - total_outflow
        closing_balance = opening_balance + net_cash_flow
        
        # Daily cash flow timeline
        cash_flow_timeline = self._get_cash_flow_timeline(start_date, end_date, currency)
        
        return {
            'opening_balance': opening_balance,
            'closing_balance': closing_balance,
            'total_inflow': total_inflow,
            'total_outflow': total_outflow,
            'net_cash_flow': net_cash_flow,
            'currency': currency,
            'period_start': start_date,
            'period_end': end_date,
            'cash_flow_timeline': cash_flow_timeline
        }
    
    def _get_cash_flow_timeline(self, start_date, end_date, currency):
        """
        Get daily cash flow data
        """
        timeline = []
        current_date = start_date
        
        while current_date <= end_date:
            day_records = FinancialRecord.objects.filter(
                user=self.user,
                transaction_date=current_date,
                currency=currency
            )
            
            inflow = day_records.filter(record_type='income').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            outflow = day_records.filter(record_type='expense').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
            
            timeline.append({
                'date': current_date.isoformat(),
                'inflow': float(inflow),
                'outflow': float(outflow),
                'net': float(inflow - outflow)
            })
            
            current_date += timedelta(days=1)
        
        return timeline


class BudgetMonitor:
    """
    Budget monitoring and alerts
    """
    
    def __init__(self, user):
        self.user = user
    
    def get_budget_performance(self):
        """
        Get performance data for all active budgets
        """
        today = timezone.now().date()
        budgets = Budget.objects.filter(
            user=self.user,
            status='active',
            start_date__lte=today,
            end_date__gte=today
        )
        
        performance = []
        for budget in budgets:
            performance.append({
                'budget_id': budget.id,
                'budget_name': budget.name,
                'budgeted_amount': budget.budgeted_amount,
                'spent_amount': budget.spent_amount,
                'remaining_amount': budget.remaining_amount,
                'spent_percentage': budget.spent_percentage,
                'status': budget.status,
                'is_exceeded': budget.is_exceeded,
                'days_remaining': budget.days_remaining
            })
        
        return performance
    
    def get_budget_alerts(self):
        """
        Get budget alerts for exceeded or near-threshold budgets
        """
        today = timezone.now().date()
        budgets = Budget.objects.filter(
            user=self.user,
            status='active',
            start_date__lte=today,
            end_date__gte=today
        )
        
        alerts = []
        for budget in budgets:
            if budget.is_exceeded:
                alerts.append({
                    'budget_id': budget.id,
                    'budget_name': budget.name,
                    'alert_type': 'exceeded',
                    'message': f'Budget exceeded by {budget.currency} {abs(budget.remaining_amount)}',
                    'severity': 'high',
                    'spent_percentage': budget.spent_percentage
                })
            elif budget.spent_percentage >= budget.alert_threshold:
                alerts.append({
                    'budget_id': budget.id,
                    'budget_name': budget.name,
                    'alert_type': 'threshold',
                    'message': f'Budget at {budget.spent_percentage:.1f}% of limit',
                    'severity': 'medium',
                    'spent_percentage': budget.spent_percentage
                })
        
        return alerts
    
    def check_and_send_alerts(self):
        """
        Check budgets and send alerts if needed
        """
        alerts = self.get_budget_alerts()
        
        # TODO: Integrate with notification service to send alerts
        # For now, just return the alerts
        return alerts
