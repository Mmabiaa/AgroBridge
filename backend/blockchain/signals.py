"""Signal handlers for blockchain service."""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Certificate, SupplyChainEvent


@receiver(pre_save, sender=Certificate)
def check_certificate_expiry(sender, instance, **kwargs):
    """Check and update certificate status if expired."""
    if instance.expiry_date and instance.expiry_date < timezone.now():
        if instance.status not in ['revoked', 'expired']:
            instance.status = 'expired'


@receiver(post_save, sender=Certificate)
def log_certificate_creation(sender, instance, created, **kwargs):
    """Log certificate creation."""
    if created:
        print(f"New certificate created: {instance.certificate_number}")


@receiver(post_save, sender=SupplyChainEvent)
def log_supply_chain_event(sender, instance, created, **kwargs):
    """Log supply chain event creation."""
    if created:
        print(f"New supply chain event: {instance.event_type} for {instance.product_name}")
