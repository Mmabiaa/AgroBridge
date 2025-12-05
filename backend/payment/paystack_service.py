"""
Paystack Payment Gateway Integration
"""
import requests
import logging
from decimal import Decimal
from django.conf import settings

logger = logging.getLogger(__name__)


class PaystackService:
    """
    Service for integrating with Paystack payment gateway
    """
    
    def __init__(self):
        self.secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
        self.public_key = getattr(settings, 'PAYSTACK_PUBLIC_KEY', '')
        self.base_url = 'https://api.paystack.co'
        self.headers = {
            'Authorization': f'Bearer {self.secret_key}',
            'Content-Type': 'application/json'
        }
    
    def initialize_transaction(self, email, amount, reference, callback_url=None, metadata=None):
        """
        Initialize a payment transaction
        
        Args:
            email: Customer email
            amount: Amount in kobo (smallest currency unit)
            reference: Unique transaction reference
            callback_url: URL to redirect after payment
            metadata: Additional metadata
        
        Returns:
            dict: Response from Paystack
        """
        url = f'{self.base_url}/transaction/initialize'
        
        # Convert amount to kobo (Paystack uses smallest currency unit)
        amount_kobo = int(Decimal(str(amount)) * 100)
        
        payload = {
            'email': email,
            'amount': amount_kobo,
            'reference': reference,
            'currency': 'GHS',  # Ghana Cedis
        }
        
        if callback_url:
            payload['callback_url'] = callback_url
        
        if metadata:
            payload['metadata'] = metadata
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Paystack transaction initialized: {reference}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack initialization error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True  # Indicate this is a mock response
            }
    
    def verify_transaction(self, reference):
        """
        Verify a transaction
        
        Args:
            reference: Transaction reference
        
        Returns:
            dict: Verification response
        """
        url = f'{self.base_url}/transaction/verify/{reference}'
        
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Paystack transaction verified: {reference}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack verification error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }
    
    def charge_authorization(self, authorization_code, email, amount, reference):
        """
        Charge a saved authorization
        
        Args:
            authorization_code: Saved authorization code
            email: Customer email
            amount: Amount to charge
            reference: Transaction reference
        
        Returns:
            dict: Charge response
        """
        url = f'{self.base_url}/transaction/charge_authorization'
        
        amount_kobo = int(Decimal(str(amount)) * 100)
        
        payload = {
            'authorization_code': authorization_code,
            'email': email,
            'amount': amount_kobo,
            'reference': reference,
            'currency': 'GHS'
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Paystack authorization charged: {reference}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack charge error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }
    
    def create_transfer_recipient(self, account_number, bank_code, name):
        """
        Create a transfer recipient
        
        Args:
            account_number: Bank account number
            bank_code: Bank code
            name: Recipient name
        
        Returns:
            dict: Recipient details
        """
        url = f'{self.base_url}/transferrecipient'
        
        payload = {
            'type': 'nuban',
            'name': name,
            'account_number': account_number,
            'bank_code': bank_code,
            'currency': 'GHS'
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Transfer recipient created: {name}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack recipient creation error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }
    
    def initiate_transfer(self, recipient_code, amount, reference, reason=None):
        """
        Initiate a transfer
        
        Args:
            recipient_code: Recipient code
            amount: Amount to transfer
            reference: Transfer reference
            reason: Transfer reason
        
        Returns:
            dict: Transfer response
        """
        url = f'{self.base_url}/transfer'
        
        amount_kobo = int(Decimal(str(amount)) * 100)
        
        payload = {
            'source': 'balance',
            'amount': amount_kobo,
            'recipient': recipient_code,
            'reference': reference,
            'currency': 'GHS'
        }
        
        if reason:
            payload['reason'] = reason
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Transfer initiated: {reference}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack transfer error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }
    
    def refund_transaction(self, reference, amount=None):
        """
        Refund a transaction
        
        Args:
            reference: Transaction reference
            amount: Amount to refund (optional, full refund if not specified)
        
        Returns:
            dict: Refund response
        """
        url = f'{self.base_url}/refund'
        
        payload = {
            'transaction': reference
        }
        
        if amount:
            payload['amount'] = int(Decimal(str(amount)) * 100)
        
        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Refund processed: {reference}")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack refund error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }
    
    def list_banks(self, country='ghana'):
        """
        List available banks
        
        Args:
            country: Country code
        
        Returns:
            dict: List of banks
        """
        url = f'{self.base_url}/bank'
        params = {'country': country}
        
        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack banks list error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }
    
    def verify_account(self, account_number, bank_code):
        """
        Verify bank account
        
        Args:
            account_number: Account number
            bank_code: Bank code
        
        Returns:
            dict: Account details
        """
        url = f'{self.base_url}/bank/resolve'
        params = {
            'account_number': account_number,
            'bank_code': bank_code
        }
        
        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Paystack account verification error: {e}")
            return {
                'status': False,
                'message': str(e),
                'mock': True
            }


class MockPaystackService(PaystackService):
    """
    Mock Paystack service for testing
    """
    
    def initialize_transaction(self, email, amount, reference, callback_url=None, metadata=None):
        """Mock transaction initialization"""
        return {
            'status': True,
            'message': 'Authorization URL created',
            'data': {
                'authorization_url': f'https://checkout.paystack.com/mock/{reference}',
                'access_code': f'mock_access_{reference}',
                'reference': reference
            },
            'mock': True
        }
    
    def verify_transaction(self, reference):
        """Mock transaction verification"""
        return {
            'status': True,
            'message': 'Verification successful',
            'data': {
                'reference': reference,
                'amount': 10000,  # 100.00 GHS in kobo
                'status': 'success',
                'paid_at': '2025-12-04T12:00:00.000Z',
                'channel': 'card',
                'currency': 'GHS',
                'authorization': {
                    'authorization_code': f'AUTH_mock_{reference}',
                    'card_type': 'visa',
                    'last4': '4081',
                    'bank': 'Test Bank'
                }
            },
            'mock': True
        }
    
    def refund_transaction(self, reference, amount=None):
        """Mock refund"""
        return {
            'status': True,
            'message': 'Refund processed successfully',
            'data': {
                'reference': reference,
                'amount': amount or 10000,
                'status': 'success'
            },
            'mock': True
        }
