from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from admin_service.models import PlatformMetrics
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Collect and store platform metrics'

    def handle(self, *args, **options):
        """Collect platform metrics"""
        self.stdout.write('Collecting platform metrics...')
        
        # User metrics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        now = timezone.now()
        new_users_today = User.objects.filter(
            date_joined__date=now.date()
        ).count()
        
        active_last_24h = User.objects.filter(
            last_login__gte=now - timedelta(hours=24)
        ).count()
        
        # Store metrics
        metrics = [
            ('total_users', total_users, 'count', 'users'),
            ('active_users', active_users, 'count', 'users'),
            ('new_users_today', new_users_today, 'count', 'users'),
            ('active_users_24h', active_last_24h, 'count', 'users'),
        ]
        
        # Try to get additional metrics from other services
        try:
            from marketplace.models import Product, Order
            total_products = Product.objects.count()
            active_products = Product.objects.filter(is_active=True).count()
            total_orders = Order.objects.count()
            
            metrics.extend([
                ('total_products', total_products, 'count', 'marketplace'),
                ('active_products', active_products, 'count', 'marketplace'),
                ('total_orders', total_orders, 'count', 'marketplace'),
            ])
        except ImportError:
            pass
        
        try:
            from community.models import Post, Comment
            total_posts = Post.objects.count()
            total_comments = Comment.objects.count()
            
            metrics.extend([
                ('total_posts', total_posts, 'count', 'community'),
                ('total_comments', total_comments, 'count', 'community'),
            ])
        except ImportError:
            pass
        
        try:
            from farms.models import Farm, Field
            total_farms = Farm.objects.count()
            total_fields = Field.objects.count()
            
            metrics.extend([
                ('total_farms', total_farms, 'count', 'farms'),
                ('total_fields', total_fields, 'count', 'farms'),
            ])
        except ImportError:
            pass
        
        # Save all metrics
        for metric_name, value, unit, category in metrics:
            PlatformMetrics.objects.create(
                metric_name=metric_name,
                metric_value=float(value),
                metric_unit=unit,
                category=category
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f'Collected {metric_name}: {value} {unit}'
                )
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully collected {len(metrics)} metrics'
            )
        )
