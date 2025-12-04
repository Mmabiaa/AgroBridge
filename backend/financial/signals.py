"""
Signals for financial management
"""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import FinancialRecord, Budget
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=FinancialRecord)
def check_budget_alerts(sender, instance, created, **kwargs):
    """
    Check if any budgets need alerts after a financial record is created/updated
    """
    if instance.record_type == 'expense':
        # Find active budgets for this category
        today = timezone.now().date()
        budgets = Budget.objects.filter(
            user=instance.user,
            category=instance.category,
            status='active',
            start_date__lte=instance.transaction_date,
            end_date__gte=instance.transaction_date
        )
        
        for budget in budgets:
            # Check if budget threshold is reached
            if budget.spent_percentage >= budget.alert_threshold and not budget.alert_sent:
                # TODO: Send notification via notification service
                logger.info(
                    f"Budget alert: {budget.name} has reached {budget.spent_percentage:.1f}% "
                    f"of budgeted amount for user {instance.user.username}"
                )
                budget.alert_sent = True
                budget.save(update_fields=['alert_sent'])
            
            # Check if budget is exceeded
            if budget.is_exceeded and budget.status != 'exceeded':
                budget.status = 'exceeded'
                budget.save(update_fields=['status'])
                logger.warning(
                    f"Budget exceeded: {budget.name} for user {instance.user.username}"
                )


@receiver(pre_save, sender=Budget)
def update_budget_status(sender, instance, **kwargs):
    """
    Update budget status based on dates and spending
    """
    today = timezone.now().date()
    
    # Check if budget period has ended
    if instance.end_date < today and instance.status == 'active':
        instance.status = 'completed'
    
    # Check if budget is exceeded
    if instance.is_exceeded and instance.status == 'active':
        instance.status = 'exceeded'
