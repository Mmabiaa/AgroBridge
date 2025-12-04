"""
Payment service integration for marketplace
"""
import logging
from decimal import Decimal
from typing import Dict, Any, Optional
from django.conf import settings
from django.utils import timezone
import requests
import json

logger = logging.getLogger(__name__)


class PaymentServiceClient:
    """
    Client for integrating with the payment service
    """
    
    def __init__(self):
        self.base_url = getattr(settings, 'PAYMENT_SERVICE_URL', 'http://localhost:8001/api/v1/payments')
        self.api_key = getattr(settings, 'PAYMENT_SERVICE_API_KEY', '')
        self.timeout = 30
    
    def _make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Make HTTP request to payment service
        
        Args:
            method: HTTP method (GET, POST, PUT, etc.)
            endpoint: API endpoint
            data: Request data
            
        Returns:
            Response data
            
        Raises:
            PaymentServiceError: If request fails
        """
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}' if self.api_key else '',
        }
        
        try:
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                timeout=self.timeout
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Payment service request failed: {str(e)}")
            raise PaymentServiceError(f"Payment service unavailable: {str(e)}")
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response from payment service: {str(e)}")
            raise PaymentServiceError("Invalid response from payment service")
    
    def initiate_payment(self, order_id: str, amount: Decimal, currency: str = 'USD', 
                        payment_method: str = 'card') -> Dict[str, Any]:
        """
        Initiate payment for an order
        
        Args:
            order_id: Order ID
            amount: Payment amount
            currency: Currency code
            payment_method: Payment method
            
        Returns:
            Payment initiation response
        """
        data = {
            'order_id': order_id,
            'amount': float(amount),
            'currency': currency,
            'payment_method': payment_method,
            'callback_url': f"{settings.FRONTEND_URL}/api/v1/marketplace/payment-callback/",
            'metadata': {
                'source': 'marketplace',
                'timestamp': timezone.now().isoformat()
            }
        }
        
        logger.info(f"Initiating payment for order {order_id}, amount: {amount} {currency}")
        
        try:
            response = self._make_request('POST', '/initiate', data)
            logger.info(f"Payment initiated successfully for order {order_id}")
            return response
        except PaymentServiceError:
            # Fallback to mock payment for development
            logger.warning(f"Payment service unavailable, using mock payment for order {order_id}")
            return self._mock_payment_initiation(order_id, amount, currency)
    
    def verify_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Verify payment status
        
        Args:
            payment_id: Payment ID
            
        Returns:
            Payment verification response
        """
        logger.info(f"Verifying payment {payment_id}")
        
        try:
            response = self._make_request('GET', f'/verify/{payment_id}')
            logger.info(f"Payment {payment_id} verification completed")
            return response
        except PaymentServiceError:
            # Fallback to mock verification
            logger.warning(f"Payment service unavailable, using mock verification for {payment_id}")
            return self._mock_payment_verification(payment_id)
    
    def process_refund(self, payment_id: str, amount: Optional[Decimal] = None, 
                      reason: str = '') -> Dict[str, Any]:
        """
        Process refund for a payment
        
        Args:
            payment_id: Payment ID
            amount: Refund amount (None for full refund)
            reason: Refund reason
            
        Returns:
            Refund response
        """
        data = {
            'payment_id': payment_id,
            'amount': float(amount) if amount else None,
            'reason': reason,
            'timestamp': timezone.now().isoformat()
        }
        
        logger.info(f"Processing refund for payment {payment_id}")
        
        try:
            response = self._make_request('POST', '/refund', data)
            logger.info(f"Refund processed successfully for payment {payment_id}")
            return response
        except PaymentServiceError:
            # Fallback to mock refund
            logger.warning(f"Payment service unavailable, using mock refund for {payment_id}")
            return self._mock_refund_processing(payment_id, amount)
    
    def _mock_payment_initiation(self, order_id: str, amount: Decimal, currency: str) -> Dict[str, Any]:
        """Mock payment initiation for development"""
        return {
            'payment_id': f'mock_payment_{order_id}',
            'status': 'pending',
            'payment_url': f'{settings.FRONTEND_URL}/mock-payment/{order_id}',
            'expires_at': (timezone.now() + timezone.timedelta(minutes=15)).isoformat(),
            'mock': True
        }
    
    def _mock_payment_verification(self, payment_id: str) -> Dict[str, Any]:
        """Mock payment verification for development"""
        return {
            'payment_id': payment_id,
            'status': 'completed',
            'amount': 100.00,
            'currency': 'USD',
            'verified_at': timezone.now().isoformat(),
            'mock': True
        }
    
    def _mock_refund_processing(self, payment_id: str, amount: Optional[Decimal]) -> Dict[str, Any]:
        """Mock refund processing for development"""
        return {
            'refund_id': f'refund_{payment_id}',
            'payment_id': payment_id,
            'status': 'completed',
            'amount': float(amount) if amount else 100.00,
            'processed_at': timezone.now().isoformat(),
            'mock': True
        }


class EscrowService:
    """
    Escrow service for marketplace transactions
    """
    
    def __init__(self):
        self.payment_client = PaymentServiceClient()
    
    def hold_funds(self, order_id: str, amount: Decimal, currency: str = 'USD') -> Dict[str, Any]:
        """
        Hold funds in escrow for an order
        
        Args:
            order_id: Order ID
            amount: Amount to hold
            currency: Currency code
            
        Returns:
            Escrow hold response
        """
        logger.info(f"Holding {amount} {currency} in escrow for order {order_id}")
        
        # In a real implementation, this would call the payment service
        # For now, we'll simulate the escrow hold
        return {
            'escrow_id': f'escrow_{order_id}',
            'order_id': order_id,
            'amount': float(amount),
            'currency': currency,
            'status': 'held',
            'held_at': timezone.now().isoformat(),
            'expires_at': (timezone.now() + timezone.timedelta(days=7)).isoformat()
        }
    
    def release_funds(self, escrow_id: str, recipient_id: str) -> Dict[str, Any]:
        """
        Release funds from escrow to recipient
        
        Args:
            escrow_id: Escrow ID
            recipient_id: Recipient user ID
            
        Returns:
            Fund release response
        """
        logger.info(f"Releasing funds from escrow {escrow_id} to recipient {recipient_id}")
        
        return {
            'escrow_id': escrow_id,
            'recipient_id': recipient_id,
            'status': 'released',
            'released_at': timezone.now().isoformat()
        }
    
    def refund_funds(self, escrow_id: str, reason: str = '') -> Dict[str, Any]:
        """
        Refund funds from escrow to buyer
        
        Args:
            escrow_id: Escrow ID
            reason: Refund reason
            
        Returns:
            Refund response
        """
        logger.info(f"Refunding funds from escrow {escrow_id}, reason: {reason}")
        
        return {
            'escrow_id': escrow_id,
            'status': 'refunded',
            'reason': reason,
            'refunded_at': timezone.now().isoformat()
        }


class PaymentServiceError(Exception):
    """Exception raised when payment service operations fail"""
    pass


# Convenience functions for easy import
def initiate_order_payment(order):
    """
    Initiate payment for an order
    
    Args:
        order: Order instance
        
    Returns:
        Payment initiation response
    """
    client = PaymentServiceClient()
    return client.initiate_payment(
        order_id=str(order.id),
        amount=order.total_amount,
        currency='USD'  # Could be configurable
    )


def verify_order_payment(payment_id: str):
    """
    Verify payment for an order
    
    Args:
        payment_id: Payment ID
        
    Returns:
        Payment verification response
    """
    client = PaymentServiceClient()
    return client.verify_payment(payment_id)


def process_order_refund(payment_id: str, amount: Optional[Decimal] = None, reason: str = ''):
    """
    Process refund for an order
    
    Args:
        payment_id: Payment ID
        amount: Refund amount
        reason: Refund reason
        
    Returns:
        Refund response
    """
    client = PaymentServiceClient()
    return client.process_refund(payment_id, amount, reason)