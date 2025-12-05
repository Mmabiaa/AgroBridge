"""
Analytics Service Business Logic
"""
from django.db.models import Count, Sum, Avg, Min, Max, Q, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class DashboardService:
    """Service for calculating dashboard metrics"""
    
    def __init__(self, user=None):
        self.user = user
    
    def get_farm_performance(self, days=30):
        """
        Calculate farm performance metrics
        
        Returns:
            dict: Farm performance data
        """
        from farms.models import Farm, Field, Crop
        
        if not self.user:
            return {}
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get user's farms
        farms = Farm.objects.filter(owner=self.user)
        
        # Calculate metrics
        total_farms = farms.count()
        total_area = farms.aggregate(total=Sum('size_hectares'))['total'] or 0
        
        # Get fields
        fields = Field.objects.filter(farm__owner=self.user)
        total_fields = fields.count()
        
        # Get crops
        crops = Crop.objects.filter(field__farm__owner=self.user)
        active_crops = crops.filter(status='growing').count()
        
        # Recent harvests
        recent_harvests = crops.filter(
            actual_harvest_date__gte=start_date,
            actual_yield_kg__isnull=False
        ).aggregate(
            count=Count('id'),
            total_yield=Sum('actual_yield_kg')
        )
        
        return {
            'total_farms': total_farms,
            'total_area': float(total_area),
            'total_fields': total_fields,
            'active_crops': active_crops,
            'recent_harvests': recent_harvests['count'] or 0,
            'total_yield': float(recent_harvests['total_yield'] or 0),
            'period_days': days
        }
    
    def get_marketplace_stats(self, days=30):
        """
        Calculate marketplace statistics
        
        Returns:
            dict: Marketplace statistics
        """
        from marketplace.models import Product, Order
        
        if not self.user:
            return {}
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Products
        products = Product.objects.filter(seller=self.user)
        active_products = products.filter(status='active').count()
        total_views = products.aggregate(total=Sum('view_count'))['total'] or 0
        
        # Orders as seller
        orders = Order.objects.filter(seller=self.user, created_at__gte=start_date)
        total_orders = orders.count()
        completed_orders = orders.filter(status='approved').count()
        
        # Revenue
        revenue = orders.filter(status='approved').aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')
        
        # Average order value
        avg_order_value = revenue / total_orders if total_orders > 0 else Decimal('0')
        
        return {
            'active_products': active_products,
            'total_views': total_views,
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'revenue': float(revenue),
            'avg_order_value': float(avg_order_value),
            'period_days': days
        }
    
    def get_user_activity(self, days=30):
        """
        Calculate user activity metrics
        
        Returns:
            dict: User activity data
        """
        from community.models import Post, Comment
        
        if not self.user:
            return {}
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Community activity
        posts = Post.objects.filter(author=self.user, created_at__gte=start_date).count()
        comments = Comment.objects.filter(author=self.user, created_at__gte=start_date).count()
        
        # Learning activity
        try:
            from learning.models import Enrollment, LessonProgress
            enrollments = Enrollment.objects.filter(
                user=self.user,
                enrolled_at__gte=start_date
            ).count()
            
            completed_lessons = LessonProgress.objects.filter(
                enrollment__user=self.user,
                is_completed=True,
                completed_at__gte=start_date
            ).count()
        except ImportError:
            enrollments = 0
            completed_lessons = 0
        
        return {
            'posts_created': posts,
            'comments_made': comments,
            'courses_enrolled': enrollments,
            'lessons_completed': completed_lessons,
            'period_days': days
        }
    
    def get_financial_summary(self, days=30):
        """
        Calculate financial summary
        
        Returns:
            dict: Financial summary data
        """
        from financial.models import FinancialRecord
        
        if not self.user:
            return {}
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get financial records
        records = FinancialRecord.objects.filter(
            user=self.user,
            transaction_date__gte=start_date
        )
        
        # Calculate income and expenses
        income = records.filter(record_type='income').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        expenses = records.filter(record_type='expense').aggregate(
            total=Sum('amount')
        )['total'] or Decimal('0')
        
        net_income = income - expenses
        
        # Category breakdown
        expense_by_category = records.filter(record_type='expense').values('category').annotate(
            total=Sum('amount')
        ).order_by('-total')[:5]
        
        return {
            'total_income': float(income),
            'total_expenses': float(expenses),
            'net_income': float(net_income),
            'expense_by_category': list(expense_by_category),
            'period_days': days
        }


class PredictiveAnalyticsService:
    """Service for predictive analytics"""
    
    def predict_yield(self, crop_data):
        """
        Predict crop yield based on historical data and conditions
        
        Args:
            crop_data: dict with crop information
        
        Returns:
            dict: Prediction results
        """
        # Simplified prediction logic (would use ML model in production)
        from farms.models import Crop
        
        crop_type = crop_data.get('crop_type')
        area = crop_data.get('area', 0)
        
        # Get historical average yield for this crop type
        historical_avg = Crop.objects.filter(
            name=crop_type,
            actual_yield_kg__isnull=False
        ).aggregate(avg_yield=Avg('actual_yield_kg'))['avg_yield'] or 0
        
        # Simple prediction: historical average * area
        predicted_yield = float(historical_avg) * float(area)
        confidence = 0.75  # 75% confidence
        
        return {
            'predicted_yield': predicted_yield,
            'confidence_score': confidence,
            'unit': 'kg',
            'factors': {
                'historical_average': float(historical_avg),
                'area': float(area)
            }
        }
    
    def predict_market_price(self, product_data):
        """
        Predict market price for a product
        
        Args:
            product_data: dict with product information
        
        Returns:
            dict: Price prediction
        """
        from marketplace.models import Product
        
        product_name = product_data.get('product_name')
        
        # Get recent prices for similar products
        recent_prices = Product.objects.filter(
            name__icontains=product_name,
            status='active',
            created_at__gte=timezone.now() - timedelta(days=30)
        ).aggregate(
            avg_price=Avg('price_per_unit'),
            min_price=Min('price_per_unit'),
            max_price=Max('price_per_unit')
        )
        
        avg_price = recent_prices['avg_price'] or Decimal('0')
        
        return {
            'predicted_price': float(avg_price),
            'price_range': {
                'min': float(recent_prices['min_price'] or 0),
                'max': float(recent_prices['max_price'] or 0)
            },
            'confidence_score': 0.70,
            'currency': 'GHS'
        }
    
    def forecast_demand(self, product_data, days=30):
        """
        Forecast product demand
        
        Args:
            product_data: dict with product information
            days: forecast period in days
        
        Returns:
            dict: Demand forecast
        """
        from marketplace.models import Order, OrderItem
        
        product_id = product_data.get('product_id')
        
        # Get historical orders
        historical_orders = OrderItem.objects.filter(
            product_id=product_id,
            order__created_at__gte=timezone.now() - timedelta(days=days)
        ).aggregate(
            total_quantity=Sum('quantity'),
            order_count=Count('order')
        )
        
        total_quantity = historical_orders['total_quantity'] or 0
        order_count = historical_orders['order_count'] or 0
        
        # Simple forecast: average daily demand * forecast period
        daily_demand = float(total_quantity) / days if days > 0 else 0
        forecasted_demand = daily_demand * days
        
        return {
            'forecasted_demand': forecasted_demand,
            'daily_average': daily_demand,
            'historical_orders': order_count,
            'forecast_period_days': days,
            'confidence_score': 0.65
        }


class TimeSeriesAnalysisService:
    """Service for time-series analysis"""
    
    def analyze_sensor_trends(self, device_id, metric, days=30):
        """
        Analyze sensor data trends
        
        Args:
            device_id: IoT device ID
            metric: sensor metric to analyze
            days: analysis period
        
        Returns:
            dict: Trend analysis
        """
        from iot_service.models import SensorReading
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get sensor readings
        readings = SensorReading.objects.filter(
            device_id=device_id,
            timestamp__gte=start_date
        ).order_by('timestamp')
        
        # Extract metric values
        values = [r.data.get(metric, 0) for r in readings if metric in r.data]
        
        if not values:
            return {'error': 'No data available'}
        
        # Calculate statistics
        avg_value = sum(values) / len(values)
        min_value = min(values)
        max_value = max(values)
        
        # Simple trend detection
        if len(values) >= 2:
            first_half_avg = sum(values[:len(values)//2]) / (len(values)//2)
            second_half_avg = sum(values[len(values)//2:]) / (len(values) - len(values)//2)
            trend = 'increasing' if second_half_avg > first_half_avg else 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'metric': metric,
            'average': avg_value,
            'min': min_value,
            'max': max_value,
            'trend': trend,
            'data_points': len(values),
            'period_days': days
        }
    
    def analyze_crop_health_trends(self, field_id, days=30):
        """
        Analyze crop health trends over time
        
        Args:
            field_id: Field ID
            days: analysis period
        
        Returns:
            dict: Crop health trend analysis
        """
        from crop_detection.models import DetectionResult
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get detection results
        detections = DetectionResult.objects.filter(
            field_id=field_id,
            created_at__gte=start_date
        ).order_by('created_at')
        
        if not detections.exists():
            return {'error': 'No detection data available'}
        
        # Count disease detections over time
        disease_counts = detections.filter(
            has_disease=True
        ).count()
        
        total_detections = detections.count()
        disease_rate = (disease_counts / total_detections * 100) if total_detections > 0 else 0
        
        return {
            'total_detections': total_detections,
            'disease_detections': disease_counts,
            'disease_rate': disease_rate,
            'health_score': 100 - disease_rate,
            'period_days': days
        }
    
    def analyze_financial_trends(self, user, days=30):
        """
        Analyze financial trends
        
        Args:
            user: User object
            days: analysis period
        
        Returns:
            dict: Financial trend analysis
        """
        from financial.models import FinancialRecord
        
        start_date = timezone.now() - timedelta(days=days)
        
        # Get financial records
        records = FinancialRecord.objects.filter(
            user=user,
            transaction_date__gte=start_date
        ).order_by('transaction_date')
        
        # Group by week
        weekly_data = []
        current_week_start = start_date
        
        while current_week_start < timezone.now():
            week_end = current_week_start + timedelta(days=7)
            
            week_records = records.filter(
                transaction_date__gte=current_week_start,
                transaction_date__lt=week_end
            )
            
            income = week_records.filter(record_type='income').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            expenses = week_records.filter(record_type='expense').aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0')
            
            weekly_data.append({
                'week_start': current_week_start.isoformat(),
                'income': float(income),
                'expenses': float(expenses),
                'net': float(income - expenses)
            })
            
            current_week_start = week_end
        
        return {
            'weekly_data': weekly_data,
            'period_days': days
        }


class InsightGenerationService:
    """Service for generating actionable insights"""
    
    def generate_farming_recommendations(self, user):
        """
        Generate farming recommendations based on user data
        
        Args:
            user: User object
        
        Returns:
            list: List of insights
        """
        from .models import Insight
        from farms.models import Crop
        
        insights = []
        
        # Check for crops nearing harvest
        upcoming_harvests = Crop.objects.filter(
            field__farm__owner=user,
            status='growing',
            expected_harvest_date__lte=timezone.now() + timedelta(days=14),
            expected_harvest_date__gte=timezone.now()
        )
        
        if upcoming_harvests.exists():
            for crop in upcoming_harvests:
                insight = Insight.objects.create(
                    user=user,
                    insight_type='recommendation',
                    priority='high',
                    title=f'Harvest {crop.crop_type} soon',
                    description=f'Your {crop.crop_type} in {crop.field.name} is expected to be ready for harvest on {crop.expected_harvest_date}.',
                    recommended_actions=[
                        'Prepare harvesting equipment',
                        'Arrange for labor',
                        'Plan storage or immediate sale'
                    ],
                    context_data={'crop_id': str(crop.id)},
                    source_metric='crop_lifecycle'
                )
                insights.append(insight)
        
        return insights
    
    def generate_risk_warnings(self, user):
        """
        Generate risk warnings
        
        Args:
            user: User object
        
        Returns:
            list: List of warning insights
        """
        from .models import Insight
        from financial.models import Budget
        
        insights = []
        
        # Check budget overruns
        current_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        budgets = Budget.objects.filter(
            user=user,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
        
        for budget in budgets:
            if budget.spent_amount > budget.amount * Decimal('0.9'):  # 90% threshold
                insight = Insight.objects.create(
                    user=user,
                    insight_type='warning',
                    priority='high',
                    title=f'Budget alert: {budget.category}',
                    description=f'You have spent {float(budget.spent_amount)} out of {float(budget.amount)} budgeted for {budget.category}.',
                    recommended_actions=[
                        'Review spending in this category',
                        'Consider adjusting budget',
                        'Reduce non-essential expenses'
                    ],
                    context_data={'budget_id': str(budget.id)},
                    source_metric='budget_tracking'
                )
                insights.append(insight)
        
        return insights
    
    def generate_optimization_opportunities(self, user):
        """
        Generate optimization opportunities
        
        Args:
            user: User object
        
        Returns:
            list: List of opportunity insights
        """
        from .models import Insight
        from marketplace.models import Product
        
        insights = []
        
        # Check for low-performing products
        products = Product.objects.filter(
            seller=user,
            status='active',
            view_count__lt=10,
            created_at__lte=timezone.now() - timedelta(days=7)
        )
        
        if products.exists():
            insight = Insight.objects.create(
                user=user,
                insight_type='opportunity',
                priority='medium',
                title='Improve product visibility',
                description=f'You have {products.count()} products with low views. Consider improving their listings.',
                recommended_actions=[
                    'Add better product images',
                    'Improve product descriptions',
                    'Adjust pricing',
                    'Use relevant tags'
                ],
                context_data={'product_count': products.count()},
                source_metric='product_performance'
            )
            insights.append(insight)
        
        return insights
