"""
Management command to populate sample payment data for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
import random

from payment.models import Transaction, Escrow, ExchangeRate
from payment.services import PaymentService

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate sample payment data for testing'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=20,
            help='Number of transactions to create'
        )
    
    def handle(self, *args, **options):
        count = options['count']
        
        self.stdout.write('Populating payment data...')
        
        # Get or create test users
        buyer, _ = User.objects.get_or_create(
            email='buyer@test.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Buyer',
                'role': 'farmer'
            }
        )
        
        seller, _ = User.objects.get_or_create(
            email='seller@test.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Seller',
                'role': 'supplier'
            }
        )
        
        # Create exchange rates
        self._create_exchange_rates()
        
        # Create transactions
        service = PaymentService()
        
        for i in range(count):
            amount = Decimal(random.uniform(10, 1000)).quantize(Decimal('0.01'))
            
            try:
                transaction = service.initialize_payment(
                    user=buyer,
                    amount=amount,
                    currency='GHS',
                    order_id=f'ORD-TEST-{i+1:03d}',
                    description=f'Test payment {i+1}'
                )
                
                # Randomly mark some as successful
                if random.random() > 0.3:
                    transaction.status = 'success'
                    transaction.save()
                    service._generate_receipt(transaction)
                
                self.stdout.write(f'Created transaction: {transaction.reference}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Failed to create transaction: {e}')
                )
        
        # Create some escrows
        for i in range(5):
            amount = Decimal(random.uniform(100, 2000)).quantize(Decimal('0.01'))
            
            try:
                escrow = service.create_escrow(
                    buyer=buyer,
                    seller_id=seller.id,
                    amount=amount,
                    order_id=f'ORD-ESC-{i+1:03d}',
                    auto_release_days=random.randint(3, 14)
                )
                
                # Randomly mark some as held
                if random.random() > 0.5:
                    escrow.status = 'held'
                    escrow.save()
                
                self.stdout.write(f'Created escrow: {escrow.reference}')
                
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Failed to create escrow: {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated payment data with {count} transactions'
            )
        )
    
    def _create_exchange_rates(self):
        """Create sample exchange rates"""
        rates = [
            ('USD', 'GHS', Decimal('12.50')),
            ('GHS', 'USD', Decimal('0.08')),
            ('EUR', 'GHS', Decimal('13.75')),
            ('GHS', 'EUR', Decimal('0.073')),
        ]
        
        for from_curr, to_curr, rate in rates:
            ExchangeRate.objects.get_or_create(
                from_currency=from_curr,
                to_currency=to_curr,
                defaults={'rate': rate, 'source': 'manual'}
            )
