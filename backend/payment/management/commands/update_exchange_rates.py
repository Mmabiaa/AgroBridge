"""
Management command to update exchange rates
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import requests
import logging

from payment.models import ExchangeRate

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Update currency exchange rates from external API'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            type=str,
            default='mock',
            help='Exchange rate source (mock, api, manual)'
        )
    
    def handle(self, *args, **options):
        source = options['source']
        
        self.stdout.write('Updating exchange rates...')
        
        if source == 'mock':
            self._update_mock_rates()
        elif source == 'api':
            self._update_from_api()
        else:
            self.stdout.write(
                self.style.ERROR(f'Unknown source: {source}')
            )
            return
        
        self.stdout.write(
            self.style.SUCCESS('Exchange rates updated successfully')
        )
    
    def _update_mock_rates(self):
        """Update with mock exchange rates"""
        rates = [
            ('USD', 'GHS', Decimal('12.50')),
            ('GHS', 'USD', Decimal('0.08')),
            ('EUR', 'GHS', Decimal('13.75')),
            ('GHS', 'EUR', Decimal('0.073')),
            ('GBP', 'GHS', Decimal('15.80')),
            ('GHS', 'GBP', Decimal('0.063')),
            ('NGN', 'GHS', Decimal('0.015')),
            ('GHS', 'NGN', Decimal('66.67')),
        ]
        
        for from_curr, to_curr, rate in rates:
            ExchangeRate.objects.create(
                from_currency=from_curr,
                to_currency=to_curr,
                rate=rate,
                source='mock',
                effective_date=timezone.now()
            )
            
            self.stdout.write(
                f'Updated: {from_curr}/{to_curr} = {rate}'
            )
    
    def _update_from_api(self):
        """Update from external API"""
        # Example using exchangerate-api.com
        # In production, use a real API key
        
        base_currency = 'GHS'
        api_url = f'https://api.exchangerate-api.com/v4/latest/{base_currency}'
        
        try:
            response = requests.get(api_url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            rates = data.get('rates', {})
            
            for to_currency, rate in rates.items():
                if to_currency != base_currency:
                    ExchangeRate.objects.create(
                        from_currency=base_currency,
                        to_currency=to_currency,
                        rate=Decimal(str(rate)),
                        source='api',
                        effective_date=timezone.now()
                    )
                    
                    self.stdout.write(
                        f'Updated: {base_currency}/{to_currency} = {rate}'
                    )
            
        except Exception as e:
            logger.error(f'Failed to fetch exchange rates: {e}')
            self.stdout.write(
                self.style.ERROR(f'Failed to fetch rates: {e}')
            )
