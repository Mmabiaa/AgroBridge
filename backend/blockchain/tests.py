"""Tests for blockchain service."""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Certificate, SupplyChainEvent, CertificationBody, CertificateVerification
from .blockchain_service import BlockchainService

User = get_user_model()


class CertificateModelTest(TestCase):
    """Test Certificate model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Farmer'
        )
    
    def test_certificate_creation(self):
        """Test creating a certificate."""
        certificate = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Certification Body',
            title='Organic Certification',
            description='Certified organic farm',
            issue_date=timezone.now(),
            expiry_date=timezone.now() + timedelta(days=365)
        )
        
        self.assertIsNotNone(certificate.id)
        self.assertIsNotNone(certificate.certificate_number)
        self.assertIsNotNone(certificate.blockchain_hash)
        self.assertTrue(certificate.certificate_number.startswith('ORG-'))
    
    def test_certificate_validity(self):
        """Test certificate validity check."""
        # Valid certificate
        valid_cert = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Valid Cert',
            description='Test',
            status='issued',
            issue_date=timezone.now(),
            expiry_date=timezone.now() + timedelta(days=30)
        )
        self.assertTrue(valid_cert.is_valid())
        
        # Expired certificate
        expired_cert = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Expired Cert',
            description='Test',
            status='issued',
            issue_date=timezone.now() - timedelta(days=400),
            expiry_date=timezone.now() - timedelta(days=30)
        )
        self.assertFalse(expired_cert.is_valid())
        
        # Revoked certificate
        revoked_cert = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Revoked Cert',
            description='Test',
            status='revoked',
            issue_date=timezone.now(),
            expiry_date=timezone.now() + timedelta(days=30)
        )
        self.assertFalse(revoked_cert.is_valid())


class SupplyChainEventModelTest(TestCase):
    """Test SupplyChainEvent model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer@test.com',
            password='testpass123'
        )
    
    def test_event_creation(self):
        """Test creating a supply chain event."""
        event = SupplyChainEvent.objects.create(
            product_id='PROD-001',
            product_name='Organic Tomatoes',
            batch_number='BATCH-001',
            event_type='harvest',
            event_description='Harvested 100kg of tomatoes',
            location_name='Farm A',
            actor=self.user,
            actor_name='Test Farmer',
            actor_role='Farmer'
        )
        
        self.assertIsNotNone(event.id)
        self.assertIsNotNone(event.blockchain_hash)
        self.assertEqual(event.event_type, 'harvest')
    
    def test_event_chaining(self):
        """Test supply chain event chaining."""
        # First event
        event1 = SupplyChainEvent.objects.create(
            product_id='PROD-001',
            product_name='Tomatoes',
            batch_number='BATCH-001',
            event_type='harvest',
            event_description='Harvested',
            location_name='Farm A',
            actor=self.user,
            actor_name='Farmer',
            actor_role='Farmer'
        )
        
        # Second event should reference first
        event2 = SupplyChainEvent.objects.create(
            product_id='PROD-001',
            product_name='Tomatoes',
            batch_number='BATCH-001',
            event_type='processing',
            event_description='Processed',
            location_name='Processing Plant',
            actor=self.user,
            actor_name='Processor',
            actor_role='Processor',
            previous_event_hash=event1.blockchain_hash
        )
        
        self.assertEqual(event2.previous_event_hash, event1.blockchain_hash)


class CertificateAPITest(APITestCase):
    """Test Certificate API endpoints."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer@test.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_certificate(self):
        """Test creating a certificate via API."""
        data = {
            'certificate_type': 'organic',
            'issuer': 'Test Certification Body',
            'title': 'Organic Certification',
            'description': 'Certified organic farm',
            'product_name': 'Tomatoes',
            'product_category': 'Vegetables',
            'issue_date': timezone.now().isoformat(),
            'expiry_date': (timezone.now() + timedelta(days=365)).isoformat()
        }
        
        response = self.client.post('/api/blockchain/certificates/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('certificate_number', response.data)
        self.assertIn('blockchain_hash', response.data)
    
    def test_list_certificates(self):
        """Test listing certificates."""
        Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Test Cert',
            description='Test'
        )
        
        response = self.client.get('/api/blockchain/certificates/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_verify_certificate(self):
        """Test certificate verification."""
        certificate = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Test Cert',
            description='Test',
            status='issued',
            transaction_hash='0x123',
            block_number=12345
        )
        
        data = {'certificate_number': certificate.certificate_number}
        response = self.client.post('/api/blockchain/certificates/verify/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('is_valid', response.data)
        self.assertIn('certificate', response.data)


class BlockchainServiceTest(TestCase):
    """Test BlockchainService."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='farmer1',
            email='farmer@test.com',
            password='testpass123'
        )
        self.service = BlockchainService()
    
    def test_store_certificate(self):
        """Test storing certificate on blockchain."""
        certificate = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Test Cert',
            description='Test'
        )
        
        tx_hash, block_number = self.service.store_certificate(certificate)
        
        self.assertIsNotNone(tx_hash)
        self.assertIsNotNone(block_number)
        self.assertTrue(tx_hash.startswith('0x'))
    
    def test_verify_certificate(self):
        """Test verifying certificate on blockchain."""
        certificate = Certificate.objects.create(
            certificate_type='organic',
            owner=self.user,
            issuer='Test Body',
            title='Test Cert',
            description='Test',
            transaction_hash='0x123',
            block_number=12345
        )
        
        is_valid = self.service.verify_certificate(certificate)
        self.assertTrue(is_valid)
    
    def test_supply_chain_integrity(self):
        """Test supply chain integrity verification."""
        # Create chain of events
        event1 = SupplyChainEvent.objects.create(
            product_id='PROD-001',
            product_name='Tomatoes',
            batch_number='BATCH-001',
            event_type='harvest',
            event_description='Harvested',
            location_name='Farm',
            actor=self.user,
            actor_name='Farmer',
            actor_role='Farmer'
        )
        
        event2 = SupplyChainEvent.objects.create(
            product_id='PROD-001',
            product_name='Tomatoes',
            batch_number='BATCH-001',
            event_type='processing',
            event_description='Processed',
            location_name='Plant',
            actor=self.user,
            actor_name='Processor',
            actor_role='Processor',
            previous_event_hash=event1.blockchain_hash
        )
        
        events = SupplyChainEvent.objects.filter(batch_number='BATCH-001')
        result = self.service.verify_supply_chain_integrity(events)
        
        self.assertTrue(result['is_valid'])
        self.assertEqual(result['event_count'], 2)
        self.assertEqual(len(result['broken_links']), 0)
