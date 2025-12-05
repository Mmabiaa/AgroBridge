"""Management command to populate export documentation data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from export_docs.models import DocumentTemplate, ComplianceRule

User = get_user_model()


class Command(BaseCommand):
    """Populate export documentation data for testing."""
    
    help = 'Populate export documentation data for testing'
    
    def handle(self, *args, **options):
        """Execute the command."""
        self.stdout.write('Populating export documentation data...')
        
        # Create document templates
        self.create_templates()
        
        # Create compliance rules
        self.create_compliance_rules()
        
        self.stdout.write(self.style.SUCCESS('Successfully populated export documentation data'))
    
    def create_templates(self):
        """Create document templates."""
        templates = [
            {
                'name': 'US Commercial Invoice',
                'document_type': 'INVOICE',
                'country_code': 'USA',
                'version': '1.0'
            },
            {
                'name': 'US Certificate of Origin',
                'document_type': 'CERTIFICATE_ORIGIN',
                'country_code': 'USA',
                'version': '1.0'
            },
            {
                'name': 'US Phytosanitary Certificate',
                'document_type': 'PHYTOSANITARY',
                'country_code': 'USA',
                'version': '1.0'
            },
            {
                'name': 'EU Commercial Invoice',
                'document_type': 'INVOICE',
                'country_code': 'EUR',
                'version': '1.0'
            },
            {
                'name': 'UK Certificate of Origin',
                'document_type': 'CERTIFICATE_ORIGIN',
                'country_code': 'GBR',
                'version': '1.0'
            },
            {
                'name': 'Generic Packing List',
                'document_type': 'PACKING_LIST',
                'country_code': 'GENERIC',
                'version': '1.0'
            },
            {
                'name': 'Generic Bill of Lading',
                'document_type': 'BILL_LADING',
                'country_code': 'GENERIC',
                'version': '1.0'
            },
        ]
        
        for template_data in templates:
            template, created = DocumentTemplate.objects.get_or_create(
                document_type=template_data['document_type'],
                country_code=template_data['country_code'],
                version=template_data['version'],
                defaults=template_data
            )
            if created:
                self.stdout.write(f"  Created template: {template.name}")
    
    def create_compliance_rules(self):
        """Create compliance rules."""
        rules = [
            {
                'country_code': 'USA',
                'product_category': '',
                'rule_type': 'REQUIRED_FIELD',
                'rule_name': 'HS Code Required',
                'rule_description': 'All exports to USA must have valid HS code',
                'validation_logic': {'field': 'hs_code'},
                'effective_date': timezone.now().date()
            },
            {
                'country_code': 'USA',
                'product_category': 'Agriculture',
                'rule_type': 'DOCUMENT_REQUIRED',
                'rule_name': 'Phytosanitary Certificate Required',
                'rule_description': 'Agricultural products require phytosanitary certificate',
                'validation_logic': {'document_type': 'PHYTOSANITARY'},
                'effective_date': timezone.now().date()
            },
            {
                'country_code': 'USA',
                'product_category': '',
                'rule_type': 'VALUE_RANGE',
                'rule_name': 'Minimum Value Check',
                'rule_description': 'Export value must be at least $100',
                'validation_logic': {'field': 'value', 'min': 100},
                'effective_date': timezone.now().date()
            },
            {
                'country_code': 'EUR',
                'product_category': '',
                'rule_type': 'REQUIRED_FIELD',
                'rule_name': 'Product Description Required',
                'rule_description': 'Detailed product description required for EU',
                'validation_logic': {'field': 'product_description'},
                'effective_date': timezone.now().date()
            },
            {
                'country_code': 'EUR',
                'product_category': 'Agriculture',
                'rule_type': 'DOCUMENT_REQUIRED',
                'rule_name': 'Certificate of Origin Required',
                'rule_description': 'Agricultural products require certificate of origin',
                'validation_logic': {'document_type': 'CERTIFICATE_ORIGIN'},
                'effective_date': timezone.now().date()
            },
            {
                'country_code': 'GBR',
                'product_category': '',
                'rule_type': 'FORMAT_VALIDATION',
                'rule_name': 'HS Code Format',
                'rule_description': 'HS code must be 10 digits',
                'validation_logic': {'field': 'hs_code', 'pattern': r'^\d{10}$'},
                'effective_date': timezone.now().date()
            },
            {
                'country_code': 'CHN',
                'product_category': '',
                'rule_type': 'VALUE_RANGE',
                'rule_name': 'Maximum Single Shipment Value',
                'rule_description': 'Single shipment cannot exceed $50,000',
                'validation_logic': {'field': 'value', 'max': 50000},
                'effective_date': timezone.now().date()
            },
        ]
        
        for rule_data in rules:
            rule, created = ComplianceRule.objects.get_or_create(
                country_code=rule_data['country_code'],
                rule_name=rule_data['rule_name'],
                defaults=rule_data
            )
            if created:
                self.stdout.write(f"  Created rule: {rule.rule_name}")
