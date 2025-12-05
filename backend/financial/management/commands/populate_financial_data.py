"""
Management command to populate sample financial data for testing
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
import random

from financial.models import FinancialRecord, Budget, ExchangeRate

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate sample financial data for testing'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=5,
            help='Number of users to create financial data for'
        )
        parser.add_argument(
            '--records',
            type=int,
            default=50,
            help='Number of financial records per user'
        )
    
    def handle(self, *args, **options):
        num_users = options['users']
        num_records = options['records']
        
        self.stdout.write('Creating sample financial data...')
        
        # Get or create test users
        users = []
        for i in range(num_users):
            user, created = User.objects.get_or_create(
                username=f'farmer{i+1}',
                defaults={
                    'email': f'farmer{i+1}@example.com',
                    'first_name': f'Farmer',
                    'last_name': f'{i+1}'
                }
            )
            if created:
                user.set_password('testpass123')
                user.save()
            users.append(user)
        
        self.stdout.write(f'Using {len(users)} users')
        
        # Create exchange rates
        self._create_exchange_rates()
        
        # Create financial records and budgets for each user
        for user in users:
            self._create_financial_records(user, num_records)
            self._create_budgets(user)
        
        self.stdout.write(self.style.SUCCESS('Successfully populated financial data'))
    
    def _create_exchange_rates(self):
        """Create sample exchange rates"""
        rates = [
            ('GHS', 'USD', Decimal('0.082')),
            ('GHS', 'EUR', Decimal('0.075')),
            ('GHS', 'GBP', Decimal('0.065')),
            ('USD', 'GHS', Decimal('12.20')),
            ('EUR', 'GHS', Decimal('13.33')),
        ]
        
        today = timezone.now().date()
        
        for base, target, rate in rates:
            ExchangeRate.objects.get_or_create(
                base_currency=base,
                target_currency=target,
                date=today,
                defaults={'rate': rate}
            )
        
        self.stdout.write('Created exchange rates')
    
    def _create_financial_records(self, user, count):
        """Create sample financial records for a user"""
        today = timezone.now().date()
        
        income_categories = [
            'crop_sales', 'livestock_sales', 'product_sales',
            'service_income', 'subsidy'
        ]
        
        expense_categories = [
            'seeds', 'fertilizer', 'pesticides', 'equipment',
            'fuel', 'labor', 'irrigation', 'feed', 'veterinary',
            'transport', 'storage', 'utilities'
        ]
        
        payment_methods = ['cash', 'bank_transfer', 'mobile_money', 'check']
        
        for i in range(count):
            # Random date within last 90 days
            days_ago = random.randint(0, 90)
            transaction_date = today - timedelta(days=days_ago)
            
            # 60% expenses, 40% income
            record_type = 'expense' if random.random() < 0.6 else 'income'
            
            if record_type == 'income':
                category = random.choice(income_categories)
                amount = Decimal(random.uniform(500, 5000)).quantize(Decimal('0.01'))
                description = f'Income from {category.replace("_", " ")}'
            else:
                category = random.choice(expense_categories)
                amount = Decimal(random.uniform(100, 2000)).quantize(Decimal('0.01'))
                description = f'Expense for {category.replace("_", " ")}'
            
            FinancialRecord.objects.create(
                user=user,
                record_type=record_type,
                category=category,
                amount=amount,
                currency='GHS',
                description=description,
                transaction_date=transaction_date,
                payment_method=random.choice(payment_methods),
                reference_number=f'REF{random.randint(10000, 99999)}'
            )
        
        self.stdout.write(f'Created {count} financial records for {user.username}')
    
    def _create_budgets(self, user):
        """Create sample budgets for a user"""
        today = timezone.now().date()
        
        budget_configs = [
            {
                'name': 'Monthly Fertilizer Budget',
                'category': 'fertilizer',
                'amount': Decimal('2000.00'),
                'period': 'monthly',
                'days': 30
            },
            {
                'name': 'Quarterly Seeds Budget',
                'category': 'seeds',
                'amount': Decimal('5000.00'),
                'period': 'quarterly',
                'days': 90
            },
            {
                'name': 'Monthly Labor Budget',
                'category': 'labor',
                'amount': Decimal('3000.00'),
                'period': 'monthly',
                'days': 30
            },
            {
                'name': 'Yearly Equipment Budget',
                'category': 'equipment',
                'amount': Decimal('10000.00'),
                'period': 'yearly',
                'days': 365
            }
        ]
        
        for config in budget_configs:
            # Create budget starting from today
            Budget.objects.get_or_create(
                user=user,
                name=config['name'],
                category=config['category'],
                defaults={
                    'budgeted_amount': config['amount'],
                    'currency': 'GHS',
                    'period': config['period'],
                    'start_date': today,
                    'end_date': today + timedelta(days=config['days']),
                    'alert_threshold': 80,
                    'status': 'active'
                }
            )
        
        self.stdout.write(f'Created budgets for {user.username}')
