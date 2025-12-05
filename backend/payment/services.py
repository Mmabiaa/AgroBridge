"""
Payment Service Business Logic
"""
from django.db import transaction as db_transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal
import uuid
import logging
import requests

from .models import Transaction, Escrow, PaymentReceipt, Dispute, ExchangeRate
from .paystack_service import PaystackService, MockPaystackService
from django.conf import settings

User = get_user_model()
logger = logging.getLogger(__name__)


class PaymentService:
    """
    Service for handling payment operations
    """
    
    def __init__(self):
        # Use mock service if in test mode or no API key configured
        use_mock = getattr(settings, 'USE_MOCK_PAYMENT', True)
        if use_mock:
            self.gateway = MockPaystackService()
        else:
            self.gateway = PaystackService()
    
    def initialize_payment(self, user, amount, currency='GHS', order_id=None, 
                          description='', callback_url=None, metadata=None):
        """
        Initialize a payment transaction
        """
        with db_transaction.atomic():
            # Generate unique reference
            reference = f"TXN-{uuid.uuid4().hex[:12].upper()}"
            
            # Calculate fee (2.5% + GHS 0.50)
            fee = (amount * Decimal('0.025')) + Decimal('0.50')
            
            # Create transaction record
            transaction = Transaction.objects.create(
                reference=reference,
                user=user,
                transaction_type='payment',
                amount=amount,
                currency=currency,
                fee=fee,
                net_amount=amount - fee,
                status='pending',
                gateway='paystack',
                order_id=order_id or '',
                description=description,
                metadata=metadata or {}
            )
            
            # Initialize with payment gateway
            response = self.gateway.initialize_transaction(
                email=user.email,
                amount=amount,
                reference=reference,
                callback_url=callback_url,
                metadata=metadata
            )
            
            if response.get('status'):
                transaction.gateway_response = response
                transaction.status = 'processing'
                transaction.save()
                
                logger.info(f"Payment initialized: {reference}")
            else:
                transaction.status = 'failed'
                transaction.gateway_response = response
                transaction.save()
                
                logger.error(f"Payment initialization failed: {reference}")
                raise Exception(response.get('message', 'Payment initialization failed'))
            
            return transaction
    
    def verify_transaction(self, transaction):
        """
        Verify a transaction with the payment gateway
        """
        response = self.gateway.verify_transaction(transaction.reference)
        
        with db_transaction.atomic():
            if response.get('status') and response.get('data', {}).get('status') == 'success':
                transaction.status = 'success'
                transaction.completed_at = timezone.now()
                transaction.gateway_response = response
                transaction.save()
                
                # Generate receipt
                self._generate_receipt(transaction)
                
                logger.info(f"Transaction verified successfully: {transaction.reference}")
            else:
                transaction.status = 'failed'
                transaction.gateway_response = response
                transaction.save()
                
                logger.warning(f"Transaction verification failed: {transaction.reference}")
            
            return transaction
    
    def refund_transaction(self, transaction, amount=None, reason=''):
        """
        Refund a transaction
        """
        if transaction.status != 'success':
            raise Exception("Only successful transactions can be refunded")
        
        refund_amount = amount or transaction.amount
        
        if refund_amount > transaction.amount:
            raise Exception("Refund amount cannot exceed transaction amount")
        
        with db_transaction.atomic():
            # Create refund transaction
            refund_reference = f"RFD-{uuid.uuid4().hex[:12].upper()}"
            
            refund_transaction = Transaction.objects.create(
                reference=refund_reference,
                user=transaction.recipient or transaction.user,
                recipient=transaction.user,
                transaction_type='refund',
                amount=refund_amount,
                currency=transaction.currency,
                fee=Decimal('0'),
                net_amount=refund_amount,
                status='processing',
                gateway=transaction.gateway,
                order_id=transaction.order_id,
                description=f"Refund for {transaction.reference}: {reason}",
                metadata={'original_transaction': str(transaction.id)}
            )
            
            # Process refund with gateway
            response = self.gateway.refund_transaction(
                reference=transaction.gateway_reference or transaction.reference,
                amount=refund_amount
            )
            
            if response.get('status'):
                refund_transaction.status = 'success'
                refund_transaction.completed_at = timezone.now()
                refund_transaction.gateway_response = response
                refund_transaction.save()
                
                # Update original transaction
                transaction.status = 'refunded'
                transaction.save()
                
                logger.info(f"Refund processed: {refund_reference}")
            else:
                refund_transaction.status = 'failed'
                refund_transaction.gateway_response = response
                refund_transaction.save()
                
                logger.error(f"Refund failed: {refund_reference}")
                raise Exception(response.get('message', 'Refund failed'))
            
            return refund_transaction
    
    def create_escrow(self, buyer, seller_id, amount, currency='GHS', 
                     order_id='', auto_release_days=7):
        """
        Create an escrow transaction
        """
        seller = User.objects.get(id=seller_id)
        
        with db_transaction.atomic():
            # Generate unique reference
            reference = f"ESC-{uuid.uuid4().hex[:12].upper()}"
            
            # Create escrow record
            escrow = Escrow.objects.create(
                reference=reference,
                buyer=buyer,
                seller=seller,
                amount=amount,
                currency=currency,
                status='pending',
                order_id=order_id,
                auto_release_days=auto_release_days
            )
            
            # Initialize payment to hold funds
            hold_transaction = self.initialize_payment(
                user=buyer,
                amount=amount,
                currency=currency,
                order_id=order_id,
                description=f"Escrow payment for order {order_id}",
                metadata={'escrow_id': str(escrow.id)}
            )
            
            escrow.hold_transaction = hold_transaction
            escrow.escrow_id = str(escrow.id)
            escrow.save()
            
            # Update transaction with escrow ID
            hold_transaction.escrow_id = str(escrow.id)
            hold_transaction.save()
            
            logger.info(f"Escrow created: {reference}")
            
            return escrow
    
    def release_escrow(self, escrow):
        """
        Release escrow funds to seller
        """
        if escrow.status != 'held':
            raise Exception("Escrow must be in 'held' status to release")
        
        with db_transaction.atomic():
            # Create release transaction
            release_reference = f"REL-{uuid.uuid4().hex[:12].upper()}"
            
            release_transaction = Transaction.objects.create(
                reference=release_reference,
                user=escrow.buyer,
                recipient=escrow.seller,
                transaction_type='escrow_release',
                amount=escrow.amount,
                currency=escrow.currency,
                fee=Decimal('0'),
                net_amount=escrow.amount,
                status='success',
                gateway='internal',
                order_id=escrow.order_id,
                escrow_id=str(escrow.id),
                description=f"Escrow release for {escrow.reference}",
                completed_at=timezone.now()
            )
            
            escrow.release_transaction = release_transaction
            escrow.status = 'released'
            escrow.released_at = timezone.now()
            escrow.save()
            
            logger.info(f"Escrow released: {escrow.reference}")
            
            return escrow
    
    def refund_escrow(self, escrow, reason=''):
        """
        Refund escrow to buyer
        """
        if escrow.status not in ['pending', 'held']:
            raise Exception("Escrow cannot be refunded in current status")
        
        with db_transaction.atomic():
            # Refund the hold transaction
            if escrow.hold_transaction and escrow.hold_transaction.status == 'success':
                self.refund_transaction(
                    transaction=escrow.hold_transaction,
                    reason=f"Escrow refund: {reason}"
                )
            
            escrow.status = 'refunded'
            escrow.refunded_at = timezone.now()
            escrow.notes = reason
            escrow.save()
            
            logger.info(f"Escrow refunded: {escrow.reference}")
            
            return escrow
    
    def create_dispute(self, user, transaction_id, reason, description, evidence=None):
        """
        Create a payment dispute
        """
        transaction = Transaction.objects.get(id=transaction_id)
        
        # Determine who the dispute is against
        if transaction.user == user:
            against = transaction.recipient
        elif transaction.recipient == user:
            against = transaction.user
        else:
            raise Exception("User is not part of this transaction")
        
        if not against:
            raise Exception("Cannot create dispute for this transaction")
        
        with db_transaction.atomic():
            reference = f"DSP-{uuid.uuid4().hex[:12].upper()}"
            
            dispute = Dispute.objects.create(
                reference=reference,
                transaction=transaction,
                raised_by=user,
                against=against,
                reason=reason,
                description=description,
                evidence=evidence or [],
                status='open'
            )
            
            logger.info(f"Dispute created: {reference}")
            
            return dispute
    
    def resolve_dispute(self, dispute, resolution, resolution_notes='', refund_amount=None):
        """
        Resolve a dispute
        """
        with db_transaction.atomic():
            dispute.resolution = resolution
            dispute.resolution_notes = resolution_notes
            dispute.status = 'resolved'
            dispute.resolved_at = timezone.now()
            
            # Process refund if applicable
            if resolution in ['buyer_favor', 'partial_refund'] and refund_amount:
                refund_transaction = self.refund_transaction(
                    transaction=dispute.transaction,
                    amount=refund_amount,
                    reason=f"Dispute resolution: {resolution_notes}"
                )
                dispute.refund_amount = refund_amount
                dispute.refund_transaction = refund_transaction
            
            dispute.save()
            
            logger.info(f"Dispute resolved: {dispute.reference}")
            
            return dispute
    
    def convert_currency(self, amount, from_currency, to_currency):
        """
        Convert currency using exchange rates
        """
        if from_currency == to_currency:
            return amount
        
        # Get latest exchange rate
        try:
            rate = ExchangeRate.objects.filter(
                from_currency=from_currency,
                to_currency=to_currency
            ).latest('effective_date')
            
            converted_amount = amount * rate.rate
            return round(converted_amount, 2)
        except ExchangeRate.DoesNotExist:
            # Try to fetch from external API
            return self._fetch_exchange_rate(amount, from_currency, to_currency)
    
    def _fetch_exchange_rate(self, amount, from_currency, to_currency):
        """
        Fetch exchange rate from external API
        """
        # Mock implementation - in production, use a real API like exchangerate-api.com
        mock_rates = {
            ('USD', 'GHS'): Decimal('12.50'),
            ('GHS', 'USD'): Decimal('0.08'),
            ('EUR', 'GHS'): Decimal('13.75'),
            ('GHS', 'EUR'): Decimal('0.073'),
        }
        
        rate = mock_rates.get((from_currency, to_currency))
        if rate:
            # Store the rate
            ExchangeRate.objects.create(
                from_currency=from_currency,
                to_currency=to_currency,
                rate=rate,
                source='mock_api'
            )
            return round(amount * rate, 2)
        
        raise Exception(f"Exchange rate not available for {from_currency} to {to_currency}")
    
    def _generate_receipt(self, transaction):
        """
        Generate a payment receipt
        """
        receipt_number = f"RCP-{uuid.uuid4().hex[:10].upper()}"
        
        # Calculate tax (if applicable)
        tax_rate = Decimal('0')  # No tax for now
        tax_amount = transaction.amount * tax_rate
        
        receipt = PaymentReceipt.objects.create(
            receipt_number=receipt_number,
            transaction=transaction,
            issued_to=transaction.user,
            subtotal=transaction.amount,
            tax_amount=tax_amount,
            total_amount=transaction.amount,
            currency=transaction.currency,
            tax_rate=tax_rate,
            items=[{
                'description': transaction.description or 'Payment',
                'amount': str(transaction.amount),
                'currency': transaction.currency
            }]
        )
        
        logger.info(f"Receipt generated: {receipt_number}")
        
        return receipt
    
    def generate_receipt_pdf(self, receipt):
        """
        Generate PDF receipt (placeholder)
        """
        # In production, use a library like ReportLab or WeasyPrint
        # For now, return a mock URL
        pdf_path = f"/media/receipts/{receipt.receipt_number}.pdf"
        receipt.file_path = pdf_path
        receipt.save()
        
        return pdf_path
    
    def handle_webhook(self, payload):
        """
        Handle payment gateway webhooks
        """
        event = payload.get('event')
        data = payload.get('data', {})
        
        reference = data.get('reference')
        if not reference:
            logger.warning("Webhook received without reference")
            return
        
        try:
            transaction = Transaction.objects.get(reference=reference)
            
            if event == 'charge.success':
                transaction.status = 'success'
                transaction.completed_at = timezone.now()
                transaction.gateway_response = payload
                transaction.save()
                
                self._generate_receipt(transaction)
                
                logger.info(f"Webhook processed: {reference} - success")
            
            elif event == 'charge.failed':
                transaction.status = 'failed'
                transaction.gateway_response = payload
                transaction.save()
                
                logger.info(f"Webhook processed: {reference} - failed")
            
        except Transaction.DoesNotExist:
            logger.warning(f"Webhook received for unknown transaction: {reference}")
