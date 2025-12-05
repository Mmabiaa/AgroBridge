"""Payment Service Views"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
import logging

from .models import Transaction, Escrow, PaymentReceipt, Dispute, ExchangeRate
from .serializers import (
    TransactionSerializer, TransactionCreateSerializer,
    EscrowSerializer, EscrowCreateSerializer,
    PaymentReceiptSerializer, DisputeSerializer, DisputeCreateSerializer,
    ExchangeRateSerializer, CurrencyConversionSerializer
)
from .services import PaymentService

logger = logging.getLogger(__name__)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Short-circuit for schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Transaction.objects.none()
        user = self.request.user
        return Transaction.objects.filter(
            models.Q(user=user) | models.Q(recipient=user)
        ).select_related('user', 'recipient')
    
    def create(self, request):
        serializer = TransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            payment_service = PaymentService()
            transaction = payment_service.initialize_payment(
                user=request.user,
                amount=serializer.validated_data['amount'],
                currency=serializer.validated_data.get('currency', 'GHS'),
                order_id=serializer.validated_data.get('order_id'),
                description=serializer.validated_data.get('description', ''),
                callback_url=serializer.validated_data.get('callback_url'),
                metadata=serializer.validated_data.get('metadata', {})
            )
            
            return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Payment initialization error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        transaction = self.get_object()
        
        try:
            payment_service = PaymentService()
            updated_transaction = payment_service.verify_transaction(transaction)
            
            return Response(TransactionSerializer(updated_transaction).data)
        except Exception as e:
            logger.error(f"Transaction verification error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        transaction = self.get_object()
        
        if transaction.status != 'success':
            return Response({'error': 'Only successful transactions can be refunded'}, status=status.HTTP_400_BAD_REQUEST)
        
        amount = request.data.get('amount')
        reason = request.data.get('reason', '')
        
        try:
            payment_service = PaymentService()
            refund_transaction = payment_service.refund_transaction(transaction=transaction, amount=amount, reason=reason)
            
            return Response(TransactionSerializer(refund_transaction).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Refund error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def webhook(self, request):
        try:
            payment_service = PaymentService()
            result = payment_service.handle_webhook(request.data)
            
            return Response({'status': 'success'})
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class EscrowViewSet(viewsets.ModelViewSet):
    serializer_class = EscrowSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Short-circuit for schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Escrow.objects.none()
        user = self.request.user
        return Escrow.objects.filter(
            models.Q(buyer=user) | models.Q(seller=user)
        ).select_related('buyer', 'seller', 'hold_transaction', 'release_transaction')
    
    def create(self, request):
        serializer = EscrowCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            payment_service = PaymentService()
            escrow = payment_service.create_escrow(
                buyer=request.user,
                seller_id=serializer.validated_data['seller_id'],
                amount=serializer.validated_data['amount'],
                currency=serializer.validated_data.get('currency', 'GHS'),
                order_id=serializer.validated_data['order_id'],
                auto_release_days=serializer.validated_data.get('auto_release_days', 7)
            )
            
            return Response(EscrowSerializer(escrow).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Escrow creation error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        escrow = self.get_object()
        
        if escrow.buyer != request.user:
            return Response({'error': 'Only the buyer can release escrow funds'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            payment_service = PaymentService()
            updated_escrow = payment_service.release_escrow(escrow)
            
            return Response(EscrowSerializer(updated_escrow).data)
        except Exception as e:
            logger.error(f"Escrow release error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        escrow = self.get_object()
        
        if escrow.seller != request.user and not request.user.is_staff:
            return Response({'error': 'Only the seller or admin can refund escrow'}, status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', '')
        
        try:
            payment_service = PaymentService()
            updated_escrow = payment_service.refund_escrow(escrow, reason)
            
            return Response(EscrowSerializer(updated_escrow).data)
        except Exception as e:
            logger.error(f"Escrow refund error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class PaymentReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PaymentReceipt.objects.filter(issued_to=self.request.user).select_related('transaction', 'issued_to')
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        receipt = self.get_object()
        
        try:
            payment_service = PaymentService()
            pdf_path = payment_service.generate_receipt_pdf(receipt)
            
            return Response({'download_url': pdf_path})
        except Exception as e:
            logger.error(f"Receipt download error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Short-circuit for schema generation
        if getattr(self, 'swagger_fake_view', False):
            return Dispute.objects.none()
        user = self.request.user
        return Dispute.objects.filter(
            models.Q(raised_by=user) | models.Q(against=user)
        ).select_related('transaction', 'raised_by', 'against', 'refund_transaction')
    
    def create(self, request):
        serializer = DisputeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            payment_service = PaymentService()
            dispute = payment_service.create_dispute(
                user=request.user,
                transaction_id=serializer.validated_data['transaction_id'],
                reason=serializer.validated_data['reason'],
                description=serializer.validated_data['description'],
                evidence=serializer.validated_data.get('evidence', [])
            )
            
            return Response(DisputeSerializer(dispute).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Dispute creation error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def resolve(self, request, pk=None):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can resolve disputes'}, status=status.HTTP_403_FORBIDDEN)
        
        dispute = self.get_object()
        resolution = request.data.get('resolution')
        resolution_notes = request.data.get('resolution_notes', '')
        refund_amount = request.data.get('refund_amount')
        
        try:
            payment_service = PaymentService()
            updated_dispute = payment_service.resolve_dispute(
                dispute=dispute,
                resolution=resolution,
                resolution_notes=resolution_notes,
                refund_amount=refund_amount
            )
            
            return Response(DisputeSerializer(updated_dispute).data)
        except Exception as e:
            logger.error(f"Dispute resolution error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ExchangeRateViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExchangeRate.objects.all()
    
    @action(detail=False, methods=['post'])
    def convert(self, request):
        serializer = CurrencyConversionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            payment_service = PaymentService()
            converted_amount = payment_service.convert_currency(
                amount=serializer.validated_data['amount'],
                from_currency=serializer.validated_data['from_currency'],
                to_currency=serializer.validated_data['to_currency']
            )
            
            return Response({
                'original_amount': serializer.validated_data['amount'],
                'from_currency': serializer.validated_data['from_currency'],
                'to_currency': serializer.validated_data['to_currency'],
                'converted_amount': converted_amount
            })
        except Exception as e:
            logger.error(f"Currency conversion error: {e}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        from_currency = request.query_params.get('from_currency')
        to_currency = request.query_params.get('to_currency')
        
        queryset = self.get_queryset()
        
        if from_currency:
            queryset = queryset.filter(from_currency=from_currency)
        if to_currency:
            queryset = queryset.filter(to_currency=to_currency)
        
        rates = queryset.order_by('from_currency', 'to_currency', '-effective_date').distinct('from_currency', 'to_currency')
        
        serializer = self.get_serializer(rates, many=True)
        return Response(serializer.data)
