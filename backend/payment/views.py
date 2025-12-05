from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Transaction, Escrow, PaymentReceipt, Dispute, ExchangeRate
from .serializers import TransactionSerializer, EscrowSerializer, PaymentReceiptSerializer, DisputeSerializer, ExchangeRateSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    queryset = Transaction.objects.all()

class EscrowViewSet(viewsets.ModelViewSet):
    serializer_class = EscrowSerializer
    permission_classes = [IsAuthenticated]
    queryset = Escrow.objects.all()

class PaymentReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentReceiptSerializer
    permission_classes = [IsAuthenticated]
    queryset = PaymentReceipt.objects.all()

class DisputeViewSet(viewsets.ModelViewSet):
    serializer_class = DisputeSerializer
    permission_classes = [IsAuthenticated]
    queryset = Dispute.objects.all()

class ExchangeRateViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeRateSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExchangeRate.objects.all()
