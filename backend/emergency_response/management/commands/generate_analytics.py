"""Management command to generate incident analytics."""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from emergency_response.services import AnalyticsService


class Command(BaseCommand):
    """Generate incident analytics for specified period."""
    
    help = 'Generate incident analytics for specified period'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to analyze (default: 30)'
        )
        parser.add_argument(
            '--region',
            type=str,
            help='Specific region to analyze (optional)'
        )
    
    def handle(self, *args, **options):
        """Execute the command."""
        days = options['days']
        region = options.get('region')
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        self.stdout.write(f'Generating analytics from {start_date} to {end_date}...')
        if region:
            self.stdout.write(f'Region: {region}')
        
        # Generate analytics
        analytics = AnalyticsService.generate_analytics(start_date, end_date, region)
        
        self.stdout.write(self.style.SUCCESS('Analytics generated successfully'))
        self.stdout.write(f'  Total incidents: {analytics.total_incidents}')
        self.stdout.write(f'  Total alerts: {analytics.total_alerts}')
        self.stdout.write(f'  Verification rate: {analytics.verification_rate:.2f}%')
        self.stdout.write(f'  Resolution rate: {analytics.resolution_rate:.2f}%')
        self.stdout.write(f'  Acknowledgment rate: {analytics.acknowledgment_rate:.2f}%')
        
        if analytics.common_patterns:
            self.stdout.write('\nCommon patterns:')
            for pattern in analytics.common_patterns:
                self.stdout.write(f"  - {pattern.get('description', 'N/A')}")
        
        if analytics.recommendations:
            self.stdout.write('\nRecommendations:')
            for rec in analytics.recommendations:
                priority = rec.get('priority', 'MEDIUM')
                recommendation = rec.get('recommendation', 'N/A')
                self.stdout.write(f"  [{priority}] {recommendation}")
