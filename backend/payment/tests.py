"""
Payment Service Tests
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from unittest.mock import patch, MagicMock

from .models import Transaction, Escrow, PaymentReceipt, Dispute, ExchangeRate
from .services import PaymentService

User = get_user_model()


class TransactionModelTest(TestCase):
    """Test Transaction model"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='buyer@test.com',
            password='testpass123',
            first_name='Test',
            last_name='Buyer'
        )
    
    def test_create_transaction(self):
        """Test creating a transaction"""
        transaction = Transaction.objects.create(
            reference='TXN-TEST123',
            user=self.user,
            transaction_type='payment',
            amount=Decimal('100.00'),
            currency='GHS',
            fee=Decimal('3.00'),
            net_amount=Decimal('97.00'),
            status='pending'
        )
        
        self.assertEqual(transaction.reference, 'TXN-TEST123')
        self.assertEqual(transaction.amount, Decimal('100.00'))
        self.assertEqual(transaction.status, 'pending')
    
    def test_transaction_net_amount_calculation(self):
        """Test automatic net amount calculation"""
        transaction = Transaction.objects.create(
            reference='TXN-TEST456',
            user=self.user,
            amount=Decimal('100.00'),
            fee=Decimal('5.00')
        )
        
        self.assertEqual(transaction.net_amount, Decimal('95.00'))


class EscrowModelTest(TestCase):
    """Test Escrow model"""
    
    def setUp(self):
        self.buyer = User.objects.create_user(
            email='buyer@test.com',
            password='testpass123'
        )
        self.seller = User.objects.create_user(
            email='seller@test.com',
            password='testpass123'
        )
    
    def test_create_escrow(self):
        """Test creating an escrow"""
        escrow = Escrow.objects.create(
            reference='ESC-TEST123',
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('500.00'),
            currency='GHS',
            order_id='ORD-123',
            auto_release_days=7
        )
        
        self.assertEqual(escrow.reference, 'ESC-TEST123')
        self.assertEqual(escrow.buyer, self.buyer)
        self.assertEqual(escrow.seller, self.seller)
        self.assertEqual(escrow.status, 'pending')


class PaymentServiceTest(TestCase):
    """Test PaymentService"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.service = PaymentService()
    
    def test_initialize_payment(self):
        """Test payment initialization"""
        transaction = self.service.initialize_payment(
            user=self.user,
            amount=Decimal('100.00'),
            currency='GHS',
            description='Test payment'
        )
        
        self.assertIsNotNone(transaction)
        self.assertEqual(transaction.user, self.user)
        self.assertEqual(transaction.amount, Decimal('100.00'))
        self.assertIn(transaction.status, ['processing', 'pending'])
    
    def test_verify_transaction(self):
        """Test transaction verification"""
        transaction = self.service.initialize_payment(
            user=self.user,
            amount=Decimal('100.00')
        )
        
        verified = self.service.verify_transaction(transaction)
        
        self.assertIsNotNone(verified)
        self.assertIn(verified.status, ['success', 'failed'])
    
    def test_currency_conversion(self):
        """Test currency conversion"""
        # Create exchange rate
        ExchangeRate.objects.create(
            from_currency='USD',
            to_currency='GHS',
            rate=Decimal('12.50')
        )
        
        converted = self.service.convert_currency(
            amount=Decimal('10.00'),
            from_currency='USD',
            to_currency='GHS'
        )
        
        self.assertEqual(converted, Decimal('125.00'))
    
    def test_generate_receipt(self):
        """Test receipt generation"""
        transaction = Transaction.objects.create(
            reference='TXN-TEST789',
            user=self.user,
            amount=Decimal('100.00'),
            currency='GHS',
            status='success'
        )
        
        receipt = self.service._generate_receipt(transaction)
        
        self.assertIsNotNone(receipt)
        self.assertEqual(receipt.transaction, transaction)
        self.assertEqual(receipt.issued_to, self.user)


class TransactionAPITest(APITestCase):
    """Test Transaction API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_create_transaction(self):
        """Test creating transaction via API"""
        data = {
            'amount': '100.00',
            'currency': 'GHS',
            'description': 'Test payment'
        }
        
        response = self.client.post('/api/payment/transactions/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('reference', response.data)
    
    def test_list_transactions(self):
        """Test listing transactions"""
        # Create test transaction
        Transaction.objects.create(
            reference='TXN-TEST001',
            user=self.user,
            amount=Decimal('100.00'),
            currency='GHS'
        )
        
        response = self.client.get('/api/payment/transactions/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)
    
    def test_verify_transaction(self):
        """Test transaction verification endpoint"""
        transaction = Transaction.objects.create(
            reference='TXN-TEST002',
            user=self.user,
            amount=Decimal('100.00'),
            currency='GHS',
            status='processing'
        )
        
        response = self.client.post(
            f'/api/payment/transactions/{transaction.id}/verify/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class EscrowAPITest(APITestCase):
    """Test Escrow API endpoints"""
    
    def setUp(self):
        self.buyer = User.objects.create_user(
            email='buyer@test.com',
            password='testpass123'
        )
        self.seller = User.objects.create_user(
            email='seller@test.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.buyer)
    
    def test_create_escrow(self):
        """Test creating escrow via API"""
        data = {
            'seller_id': str(self.seller.id),
            'amount': '500.00',
            'currency': 'GHS',
            'order_id': 'ORD-123',
            'auto_release_days': 7
        }
        
        response = self.client.post('/api/payment/escrow/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('reference', response.data)
    
    def test_release_escrow(self):
        """Test releasing escrow"""
        escrow = Escrow.objects.create(
            reference='ESC-TEST001',
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('500.00'),
            currency='GHS',
            order_id='ORD-123',
            status='held'
        )
        
        response = self.client.post(
            f'/api/payment/escrow/{escrow.id}/release/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        escrow.refresh_from_db()
        self.assertEqual(escrow.status, 'released')
    
    def test_unauthorized_release(self):
        """Test that only buyer can release escrow"""
        # Authenticate as seller
        self.client.force_authenticate(user=self.seller)
        
        escrow = Escrow.objects.create(
            reference='ESC-TEST002',
            buyer=self.buyer,
            seller=self.seller,
            amount=Decimal('500.00'),
            currency='GHS',
            order_id='ORD-124',
            status='held'
        )
        
        response = self.client.post(
            f'/api/payment/escrow/{escrow.id}/release/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DisputeAPITest(APITestCase):
    """Test Dispute API endpoints"""
    
    def setUp(self):
        self.buyer = User.objects.create_user(
            email='buyer@test.com',
            password='testpass123'
        )
        self.seller = User.objects.create_user(
            email='seller@test.com',
            password='testpass123'
        )
        
        self.transaction = Transaction.objects.create(
            reference='TXN-TEST003',
            user=self.buyer,
            recipient=self.seller,
            amount=Decimal('100.00'),
            currency='GHS',
            status='success'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.buyer)
    
    def test_create_dispute(self):
        """Test creating a dispute"""
        data = {
            'transaction_id': str(self.transaction.id),
            'reason': 'Product not received',
            'description': 'I did not receive the product after 2 weeks',
            'evidence': []
        }
        
        response = self.client.post('/api/payment/disputes/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('reference', response.data)
    
    def test_list_disputes(self):
        """Test listing disputes"""
        Dispute.objects.create(
            reference='DSP-TEST001',
            transaction=self.transaction,
            raised_by=self.buyer,
            against=self.seller,
            reason='Test dispute',
            description='Test description'
        )
        
        response = self.client.get('/api/payment/disputes/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)


class ExchangeRateAPITest(APITestCase):
    """Test Exchange Rate API endpoints"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create test exchange rates
        ExchangeRate.objects.create(
            from_currency='USD',
            to_currency='GHS',
            rate=Decimal('12.50')
        )
    
    def test_convert_currency(self):
        """Test currency conversion endpoint"""
        data = {
            'amount': '100.00',
            'from_currency': 'USD',
            'to_currency': 'GHS'
        }
        
        response = self.client.post('/api/payment/exchange-rates/convert/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('converted_amount', response.data)
        self.assertEqual(
            Decimal(response.data['converted_amount']),
            Decimal('1250.00')
        )
    
    def test_get_latest_rates(self):
        """Test getting latest exchange rates"""
        response = self.client.get('/api/payment/exchange-rates/latest/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(response.data), 0)


class PaymentIntegrationTest(TestCase):
    """Integration tests for payment workflows"""
    
    def setUp(self):
        self.buyer = User.objects.create_user(
            email='buyer@test.com',
            password='testpass123'
        )
        self.seller = User.objects.create_user(
            email='seller@test.com',
            password='testpass123'
        )
        self.service = PaymentService()
    
    def test_complete_payment_flow(self):
        """Test complete payment flow"""
        # Initialize payment
        transaction = self.service.initialize_payment(
            user=self.buyer,
            amount=Decimal('100.00'),
            description='Test product'
        )
        
        self.assertIsNotNone(transaction)
        
        # Verify payment
        verified = self.service.verify_transaction(transaction)
        
        # Check receipt was generated
        if verified.status == 'success':
            receipt = PaymentReceipt.objects.filter(transaction=verified).first()
            self.assertIsNotNone(receipt)
    
    def test_complete_escrow_flow(self):
        """Test complete escrow flow"""
        # Create escrow
        escrow = self.service.create_escrow(
            buyer=self.buyer,
            seller_id=self.seller.id,
            amount=Decimal('500.00'),
            order_id='ORD-TEST-001'
        )
        
        self.assertIsNotNone(escrow)
        self.assertEqual(escrow.status, 'pending')
        
        # Simulate payment success
        if escrow.hold_transaction:
            escrow.hold_transaction.status = 'success'
            escrow.hold_transaction.save()
            escrow.status = 'held'
            escrow.save()
        
        # Release escrow
        released = self.service.release_escrow(escrow)
        
        self.assertEqual(released.status, 'released')
        self.assertIsNotNone(released.release_transaction)
    
    def test_dispute_resolution_flow(self):
        """Test dispute resolution flow"""
        # Create transaction
        transaction = Transaction.objects.create(
            reference='TXN-DISPUTE-001',
            user=self.buyer,
            recipient=self.seller,
            amount=Decimal('100.00'),
            currency='GHS',
            status='success'
        )
        
        # Create dispute
        dispute = self.service.create_dispute(
            user=self.buyer,
            transaction_id=transaction.id,
            reason='Product defective',
            description='The product arrived damaged'
        )
        
        self.assertIsNotNone(dispute)
        self.assertEqual(dispute.status, 'open')
        
        # Resolve dispute in buyer's favor
        resolved = self.service.resolve_dispute(
            dispute=dispute,
            resolution='buyer_favor',
            resolution_notes='Product was indeed defective',
            refund_amount=Decimal('100.00')
        )
        
        self.assertEqual(resolved.status, 'resolved')
        self.assertEqual(resolved.resolution, 'buyer_favor')
