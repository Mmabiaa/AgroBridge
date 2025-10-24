"""
Management command for marketplace maintenance tasks
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from marketplace.models import Product, Order
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Perform marketplace maintenance tasks'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--update-expired',
            action='store_true',
            help='Update expired products status'
        )
        
        parser.add_argument(
            '--cleanup-old-orders',
            action='store_true',
            help='Clean up old cancelled orders'
        )
        
        parser.add_argument(
            '--send-expiry-alerts',
            action='store_true',
            help='Send alerts for products nearing expiry'
        )
        
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without actually doing it'
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write("Starting marketplace maintenance...")
        
        if options['update_expired']:
            self.update_expired_products(dry_run)
        
        if options['cleanup_old_orders']:
            self.cleanup_old_orders(dry_run)
        
        if options['send_expiry_alerts']:
            self.send_expiry_alerts(dry_run)
        
        # Run all tasks if no specific task is specified
        if not any([options['update_expired'], options['cleanup_old_orders'], options['send_expiry_alerts']]):
            self.update_expired_products(dry_run)
            self.cleanup_old_orders(dry_run)
            self.send_expiry_alerts(dry_run)
        
        self.stdout.write(
            self.style.SUCCESS("Marketplace maintenance completed")
        )
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING("DRY RUN: No actual changes were made")
            )
    
    def update_expired_products(self, dry_run):
        """Update status of expired products"""
        expired_products = Product.objects.filter(
            expiry_date__lt=timezone.now().date(),
            status='active'
        )
        
        count = expired_products.count()
        
        if count > 0:
            self.stdout.write(f"Found {count} expired products")
            
            if not dry_run:
                expired_products.update(status='expired')
                self.stdout.write(f"Updated {count} products to expired status")
                
                # Log the action
                logger.info(f"Updated {count} expired products to expired status")
        else:
            self.stdout.write("No expired products found")
    
    def cleanup_old_orders(self, dry_run):
        """Clean up old cancelled orders (older than 90 days)"""
        from datetime import timedelta
        
        cutoff_date = timezone.now() - timedelta(days=90)
        
        old_cancelled_orders = Order.objects.filter(
            status='cancelled',
            updated_at__lt=cutoff_date
        )
        
        count = old_cancelled_orders.count()
        
        if count > 0:
            self.stdout.write(f"Found {count} old cancelled orders")
            
            if not dry_run:
                # Instead of deleting, we could archive them
                # For now, just log them
                logger.info(f"Found {count} old cancelled orders for potential cleanup")
                self.stdout.write(f"Logged {count} old cancelled orders for review")
        else:
            self.stdout.write("No old cancelled orders found")
    
    def send_expiry_alerts(self, dry_run):
        """Send alerts for products nearing expiry"""
        from datetime import timedelta
        
        # Products expiring in the next 3 days
        alert_date = timezone.now().date() + timedelta(days=3)
        
        expiring_products = Product.objects.filter(
            expiry_date__lte=alert_date,
            expiry_date__gt=timezone.now().date(),
            status='active'
        ).select_related('seller')
        
        # Group by seller
        sellers_products = {}
        for product in expiring_products:
            if product.seller not in sellers_products:
                sellers_products[product.seller] = []
            sellers_products[product.seller].append(product)
        
        alert_count = 0
        
        for seller, products in sellers_products.items():
            if not dry_run:
                self.send_expiry_alert_email(seller, products)
            alert_count += 1
            
            self.stdout.write(
                f"Alert for {seller.username}: {len(products)} products expiring soon"
            )
        
        if alert_count > 0:
            self.stdout.write(f"Sent {alert_count} expiry alerts")
        else:
            self.stdout.write("No expiry alerts needed")
    
    def send_expiry_alert_email(self, seller, products):
        """Send expiry alert email to seller"""
        try:
            subject = f"AgroBridge Alert: {len(products)} products expiring soon"
            
            message_lines = [
                f"Hello {seller.first_name or seller.username},",
                "",
                f"You have {len(products)} products that will expire soon:",
                ""
            ]
            
            for product in products:
                days_left = (product.expiry_date - timezone.now().date()).days
                message_lines.append(
                    f"• {product.name} - expires in {days_left} day(s) ({product.expiry_date})"
                )
            
            message_lines.extend([
                "",
                "Please consider updating your product listings or offering discounts.",
                "",
                "Best regards,",
                "The AgroBridge Team"
            ])
            
            message = "\n".join(message_lines)
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [seller.email],
                fail_silently=False
            )
            
            logger.info(f"Expiry alert sent to {seller.email}")
            
        except Exception as e:
            logger.error(f"Failed to send expiry alert to {seller.email}: {e}")
            self.stdout.write(
                self.style.ERROR(f"Failed to send alert to {seller.username}: {e}")
            )