"""Management command to populate blockchain service with sample data."""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

from blockchain.models import Certificate, SupplyChainEvent, CertificationBody

User = get_user_model()


class Command(BaseCommand):
    """Populate blockchain service with sample data."""
    
    help = 'Populate blockchain service with sample certificates and supply chain events'
    
    def add_arguments(self, parser):
        """Add command arguments."""
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before populating'
        )
    
    def handle(self, *args, **options):
        """Execute command."""
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            Certificate.objects.all().delete()
            SupplyChainEvent.objects.all().delete()
            CertificationBody.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✓ Data cleared'))
        
        self.stdout.write('Creating certification bodies...')
        bodies = self._create_certification_bodies()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(bodies)} certification bodies'))
        
        self.stdout.write('Creating sample certificates...')
        certificates = self._create_certificates()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(certificates)} certificates'))
        
        self.stdout.write('Creating supply chain events...')
        events = self._create_supply_chain_events()
        self.stdout.write(self.style.SUCCESS(f'✓ Created {len(events)} supply chain events'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Blockchain data population completed!'))
    
    def _create_certification_bodies(self):
        """Create sample certification bodies."""
        bodies_data = [
            {
                'name': 'Ghana Organic Agriculture Network',
                'code': 'GOAN',
                'email': 'info@goan.org.gh',
                'phone': '+233-123-456-789',
                'website': 'https://goan.org.gh',
                'address': '123 Organic Street, Accra',
                'country': 'Ghana',
                'accreditation_number': 'ACC-GOAN-2020',
                'accreditation_body': 'International Federation of Organic Agriculture Movements',
                'is_active': True,
                'is_verified': True,
                'supported_certificate_types': ['organic', 'quality', 'fair_trade']
            },
            {
                'name': 'West African Quality Assurance',
                'code': 'WAQA',
                'email': 'contact@waqa.org',
                'phone': '+233-987-654-321',
                'website': 'https://waqa.org',
                'address': '456 Quality Avenue, Kumasi',
                'country': 'Ghana',
                'accreditation_number': 'ACC-WAQA-2019',
                'accreditation_body': 'African Organization for Standardization',
                'is_active': True,
                'is_verified': True,
                'supported_certificate_types': ['quality', 'gmp', 'haccp']
            },
            {
                'name': 'Fair Trade Africa',
                'code': 'FTA',
                'email': 'info@fairtrade-africa.org',
                'phone': '+254-111-222-333',
                'website': 'https://fairtrade-africa.org',
                'address': 'Nairobi, Kenya',
                'country': 'Kenya',
                'accreditation_number': 'ACC-FTA-2018',
                'accreditation_body': 'Fairtrade International',
                'is_active': True,
                'is_verified': True,
                'supported_certificate_types': ['fair_trade', 'organic']
            }
        ]
        
        bodies = []
        for data in bodies_data:
            body, created = CertificationBody.objects.get_or_create(
                code=data['code'],
                defaults=data
            )
            bodies.append(body)
        
        return bodies
    
    def _create_certificates(self):
        """Create sample certificates."""
        # Get or create test users
        users = []
        for i in range(3):
            user, _ = User.objects.get_or_create(
                email=f'farmer{i+1}@agrobridge.com',
                defaults={
                    'first_name': f'Farmer{i+1}',
                    'last_name': 'Test',
                    'role': 'farmer'
                }
            )
            users.append(user)
        
        bodies = list(CertificationBody.objects.all())
        
        certificate_types = ['organic', 'quality', 'fair_trade', 'gmp', 'haccp']
        products = ['Cocoa', 'Coffee', 'Tomatoes', 'Cassava', 'Maize', 'Rice']
        
        certificates = []
        for i in range(15):
            cert_type = random.choice(certificate_types)
            product = random.choice(products)
            issuer = random.choice(bodies)
            
            certificate = Certificate.objects.create(
                certificate_type=cert_type,
                owner=random.choice(users),
                issuer=issuer.name,
                issuer_id=f"{issuer.code}-{i+1:04d}",
                title=f"{cert_type.replace('_', ' ').title()} Certification for {product}",
                description=f"This certifies that the {product.lower()} production meets {cert_type.replace('_', ' ')} standards.",
                product_name=product,
                product_category='Agricultural Product',
                issue_date=timezone.now() - timedelta(days=random.randint(0, 180)),
                expiry_date=timezone.now() + timedelta(days=random.randint(180, 730)),
                status='issued',
                transaction_hash=f"0x{''.join(random.choices('0123456789abcdef', k=64))}",
                block_number=random.randint(1000000, 9999999)
            )
            certificates.append(certificate)
        
        return certificates
    
    def _create_supply_chain_events(self):
        """Create sample supply chain events."""
        users = list(User.objects.filter(email__contains='farmer'))
        if not users:
            return []
        
        products = [
            {'id': 'PROD-001', 'name': 'Organic Cocoa Beans'},
            {'id': 'PROD-002', 'name': 'Fair Trade Coffee'},
            {'id': 'PROD-003', 'name': 'Fresh Tomatoes'}
        ]
        
        event_types = ['harvest', 'processing', 'packaging', 'storage', 'transport', 'inspection', 'delivery']
        locations = ['Farm A - Ashanti Region', 'Processing Plant - Accra', 'Warehouse - Tema', 'Port - Takoradi']
        
        events = []
        for product in products:
            batch_number = f"BATCH-{product['id'][-3:]}-{random.randint(1000, 9999)}"
            previous_hash = ''
            
            for i, event_type in enumerate(event_types[:5]):  # Create 5 events per product
                event = SupplyChainEvent.objects.create(
                    product_id=product['id'],
                    product_name=product['name'],
                    batch_number=batch_number,
                    event_type=event_type,
                    event_description=f"{event_type.title()} completed for {product['name']}",
                    event_timestamp=timezone.now() - timedelta(days=20-i*4),
                    location_name=random.choice(locations),
                    latitude=5.6037 + random.uniform(-0.5, 0.5),
                    longitude=-0.1870 + random.uniform(-0.5, 0.5),
                    actor=random.choice(users),
                    actor_name=f"{event_type.title()} Operator",
                    actor_role=event_type.title(),
                    previous_event_hash=previous_hash,
                    transaction_hash=f"0x{''.join(random.choices('0123456789abcdef', k=64))}",
                    block_number=random.randint(1000000, 9999999),
                    verified=random.choice([True, False])
                )
                previous_hash = event.blockchain_hash
                events.append(event)
        
        return events
