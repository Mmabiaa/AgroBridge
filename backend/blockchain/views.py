"""Views for blockchain service."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q, Count
import qrcode
import io
import base64
import json

from .models import Certificate, SupplyChainEvent, CertificationBody, CertificateVerification
from .serializers import (
    CertificateSerializer, CertificateCreateSerializer,
    SupplyChainEventSerializer, SupplyChainEventCreateSerializer,
    CertificationBodySerializer, CertificateVerificationSerializer,
    CertificateVerifySerializer, SupplyChainTrackingSerializer
)
from .blockchain_service import BlockchainService
from .permissions import IsCertificateOwner, IsSupplyChainActor


class CertificateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing certificates."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get certificates for current user or all if admin."""
        user = self.request.user
        if user.is_staff:
            return Certificate.objects.all()
        return Certificate.objects.filter(owner=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return CertificateCreateSerializer
        return CertificateSerializer
    
    def perform_create(self, serializer):
        """Create certificate and store on blockchain."""
        certificate = serializer.save()
        
        # Generate QR code
        self._generate_qr_code(certificate)
        
        # Store on blockchain (simulated)
        blockchain_service = BlockchainService()
        tx_hash, block_number = blockchain_service.store_certificate(certificate)
        
        certificate.transaction_hash = tx_hash
        certificate.block_number = block_number
        certificate.status = 'issued'
        certificate.save()
    
    def _generate_qr_code(self, certificate):
        """Generate QR code for certificate."""
        qr_data = {
            'certificate_number': certificate.certificate_number,
            'blockchain_hash': certificate.blockchain_hash,
            'verification_url': f'/api/blockchain/certificates/verify/?hash={certificate.blockchain_hash}'
        }
        
        certificate.qr_code_data = json.dumps(qr_data)
        
        # Generate QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(json.dumps(qr_data))
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        
        # Save as base64 in metadata for now (in production, save to file storage)
        certificate.metadata['qr_code_base64'] = base64.b64encode(buffer.getvalue()).decode()
        certificate.save()
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def verify(self, request):
        """Verify a certificate by number, hash, or QR data."""
        serializer = CertificateVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Find certificate
        certificate = None
        if serializer.validated_data.get('certificate_number'):
            certificate = Certificate.objects.filter(
                certificate_number=serializer.validated_data['certificate_number']
            ).first()
        elif serializer.validated_data.get('blockchain_hash'):
            certificate = Certificate.objects.filter(
                blockchain_hash=serializer.validated_data['blockchain_hash']
            ).first()
        elif serializer.validated_data.get('qr_code_data'):
            try:
                qr_data = json.loads(serializer.validated_data['qr_code_data'])
                certificate = Certificate.objects.filter(
                    blockchain_hash=qr_data.get('blockchain_hash')
                ).first()
            except json.JSONDecodeError:
                pass
        
        if not certificate:
            return Response({
                'is_valid': False,
                'message': 'Certificate not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify on blockchain
        blockchain_service = BlockchainService()
        is_valid_on_chain = blockchain_service.verify_certificate(certificate)
        
        # Check certificate validity
        is_valid = certificate.is_valid() and is_valid_on_chain
        
        if is_valid:
            message = 'Certificate is valid and verified on blockchain'
        elif not certificate.is_valid():
            message = f'Certificate is {certificate.status}'
        else:
            message = 'Certificate blockchain verification failed'
        
        # Record verification attempt
        CertificateVerification.objects.create(
            certificate=certificate,
            verifier_ip=self._get_client_ip(request),
            verifier_user_agent=request.META.get('HTTP_USER_AGENT', ''),
            verifier_user=request.user if request.user.is_authenticated else None,
            is_valid=is_valid,
            verification_message=message
        )
        
        # Update certificate verification stats
        certificate.verification_count += 1
        certificate.last_verified_at = timezone.now()
        certificate.save()
        
        return Response({
            'is_valid': is_valid,
            'message': message,
            'certificate': CertificateSerializer(certificate).data
        })
    
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke a certificate."""
        certificate = self.get_object()
        
        if certificate.owner != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Only certificate owner or admin can revoke'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        certificate.status = 'revoked'
        certificate.save()
        
        # Record on blockchain
        blockchain_service = BlockchainService()
        blockchain_service.revoke_certificate(certificate)
        
        return Response({
            'message': 'Certificate revoked successfully',
            'certificate': CertificateSerializer(certificate).data
        })
    
    @action(detail=False, methods=['get'])
    def my_certificates(self, request):
        """Get all certificates for current user."""
        certificates = Certificate.objects.filter(owner=request.user)
        serializer = CertificateSerializer(certificates, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get certificate statistics."""
        user = request.user
        
        if user.is_staff:
            queryset = Certificate.objects.all()
        else:
            queryset = Certificate.objects.filter(owner=user)
        
        stats = {
            'total': queryset.count(),
            'by_status': dict(queryset.values('status').annotate(count=Count('id')).values_list('status', 'count')),
            'by_type': dict(queryset.values('certificate_type').annotate(count=Count('id')).values_list('certificate_type', 'count')),
            'expiring_soon': queryset.filter(
                expiry_date__lte=timezone.now() + timezone.timedelta(days=30),
                status='issued'
            ).count(),
            'total_verifications': sum(queryset.values_list('verification_count', flat=True))
        }
        
        return Response(stats)
    
    def _get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SupplyChainEventViewSet(viewsets.ModelViewSet):
    """ViewSet for managing supply chain events."""
    
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get supply chain events."""
        user = self.request.user
        if user.is_staff:
            return SupplyChainEvent.objects.all()
        return SupplyChainEvent.objects.filter(actor=user)
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return SupplyChainEventCreateSerializer
        return SupplyChainEventSerializer
    
    def perform_create(self, serializer):
        """Create event and store on blockchain."""
        event = serializer.save()
        
        # Store on blockchain
        blockchain_service = BlockchainService()
        tx_hash, block_number = blockchain_service.store_supply_chain_event(event)
        
        event.transaction_hash = tx_hash
        event.block_number = block_number
        event.save()
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def track(self, request):
        """Track supply chain for a product or batch."""
        serializer = SupplyChainTrackingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Build query
        query = Q()
        if serializer.validated_data.get('product_id'):
            query &= Q(product_id=serializer.validated_data['product_id'])
        if serializer.validated_data.get('batch_number'):
            query &= Q(batch_number=serializer.validated_data['batch_number'])
        
        events = SupplyChainEvent.objects.filter(query).order_by('event_timestamp')
        
        if not events.exists():
            return Response({
                'message': 'No supply chain events found',
                'events': []
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verify blockchain integrity
        blockchain_service = BlockchainService()
        integrity_check = blockchain_service.verify_supply_chain_integrity(events)
        
        return Response({
            'product_id': events.first().product_id,
            'product_name': events.first().product_name,
            'batch_number': events.first().batch_number,
            'event_count': events.count(),
            'integrity_verified': integrity_check['is_valid'],
            'events': SupplyChainEventSerializer(events, many=True).data
        })
    
    @action(detail=True, methods=['post'])
    def verify_event(self, request, pk=None):
        """Verify a supply chain event."""
        event = self.get_object()
        
        if not request.user.is_staff:
            return Response(
                {'error': 'Only staff can verify events'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        event.verified = True
        event.verified_by = request.user
        event.verified_at = timezone.now()
        event.save()
        
        return Response({
            'message': 'Event verified successfully',
            'event': SupplyChainEventSerializer(event).data
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get supply chain statistics."""
        user = request.user
        
        if user.is_staff:
            queryset = SupplyChainEvent.objects.all()
        else:
            queryset = SupplyChainEvent.objects.filter(actor=user)
        
        stats = {
            'total_events': queryset.count(),
            'by_type': dict(queryset.values('event_type').annotate(count=Count('id')).values_list('event_type', 'count')),
            'verified_events': queryset.filter(verified=True).count(),
            'unique_products': queryset.values('product_id').distinct().count(),
            'unique_batches': queryset.values('batch_number').distinct().count()
        }
        
        return Response(stats)


class CertificationBodyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing certification bodies."""
    
    queryset = CertificationBody.objects.all()
    serializer_class = CertificationBodySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Only staff can create/update/delete certification bodies."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), ]
        return [AllowAny()]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active certification bodies."""
        bodies = CertificationBody.objects.filter(is_active=True, is_verified=True)
        serializer = self.get_serializer(bodies, many=True)
        return Response(serializer.data)
