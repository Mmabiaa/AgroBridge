"""
Analytics Service Celery Tasks
"""
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

# Try to import Celery, but make it optional
try:
    from celery import shared_task
except ImportError:
    # If Celery is not installed, create a dummy decorator
    def shared_task(func):
        """Dummy decorator when Celery is not available"""
        return func


@shared_task
def generate_report_task(report_id):
    """
    Generate report asynchronously
    
    Args:
        report_id: Report UUID
    """
    from .models import Report
    from .report_generator import ReportGenerator
    
    try:
        report = Report.objects.get(id=report_id)
        report.status = 'generating'
        report.save()
        
        # Generate report
        generator = ReportGenerator(report)
        file_path, file_size = generator.generate()
        
        # Update report
        report.file_path = file_path
        report.file_size = file_size
        report.status = 'completed'
        report.generated_at = timezone.now()
        report.save()
        
        logger.info(f"Report {report_id} generated successfully")
        
    except Report.DoesNotExist:
        logger.error(f"Report {report_id} not found")
    except Exception as e:
        logger.error(f"Failed to generate report {report_id}: {e}")
        try:
            report = Report.objects.get(id=report_id)
            report.status = 'failed'
            report.error_message = str(e)
            report.save()
        except:
            pass


@shared_task
def calculate_dashboard_metrics_task(user_id, days=30):
    """
    Calculate and cache dashboard metrics
    
    Args:
        user_id: User ID
        days: Period in days
    """
    from django.contrib.auth import get_user_model
    from .models import DashboardMetric
    from .services import DashboardService
    from datetime import timedelta
    
    User = get_user_model()
    
    try:
        user = User.objects.get(id=user_id)
        service = DashboardService(user=user)
        
        period_start = timezone.now() - timedelta(days=days)
        period_end = timezone.now()
        cache_expires_at = timezone.now() + timedelta(hours=1)
        
        # Calculate and store metrics
        metric_types = [
            ('farm_performance', service.get_farm_performance),
            ('marketplace_stats', service.get_marketplace_stats),
            ('user_activity', service.get_user_activity),
            ('financial_summary', service.get_financial_summary),
        ]
        
        for metric_type, method in metric_types:
            data = method(days)
            
            DashboardMetric.objects.create(
                metric_type=metric_type,
                user=user,
                data=data,
                period_start=period_start,
                period_end=period_end,
                cache_expires_at=cache_expires_at
            )
        
        logger.info(f"Dashboard metrics calculated for user {user_id}")
        
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
    except Exception as e:
        logger.error(f"Failed to calculate metrics for user {user_id}: {e}")


@shared_task
def generate_daily_insights_task():
    """
    Generate daily insights for all active users
    """
    from django.contrib.auth import get_user_model
    from .services import InsightGenerationService
    
    User = get_user_model()
    service = InsightGenerationService()
    
    # Get active users (users who logged in within last 30 days)
    active_users = User.objects.filter(
        last_login__gte=timezone.now() - timezone.timedelta(days=30)
    )
    
    total_insights = 0
    
    for user in active_users:
        try:
            # Generate insights
            recommendations = service.generate_farming_recommendations(user)
            warnings = service.generate_risk_warnings(user)
            opportunities = service.generate_optimization_opportunities(user)
            
            user_insights = len(recommendations) + len(warnings) + len(opportunities)
            total_insights += user_insights
            
            logger.info(f"Generated {user_insights} insights for user {user.username}")
            
        except Exception as e:
            logger.error(f"Failed to generate insights for user {user.username}: {e}")
    
    logger.info(f"Daily insights generation completed. Total: {total_insights} insights")


@shared_task
def cleanup_expired_reports_task():
    """
    Clean up expired reports
    """
    from .models import Report
    import os
    
    expired_reports = Report.objects.filter(
        expires_at__lt=timezone.now(),
        status='completed'
    )
    
    deleted_count = 0
    
    for report in expired_reports:
        try:
            # Delete file if exists
            if report.file_path and os.path.exists(report.file_path):
                os.remove(report.file_path)
            
            # Delete report record
            report.delete()
            deleted_count += 1
            
        except Exception as e:
            logger.error(f"Failed to delete report {report.id}: {e}")
    
    logger.info(f"Cleaned up {deleted_count} expired reports")


@shared_task
def update_model_performance_task(model_id):
    """
    Update ML model performance metrics
    
    Args:
        model_id: PredictionModel UUID
    """
    from .models import PredictionModel, Prediction
    from django.db.models import Avg, Count
    
    try:
        model = PredictionModel.objects.get(id=model_id)
        
        # Get predictions with actual values
        predictions = Prediction.objects.filter(
            model=model,
            actual_value__isnull=False
        )
        
        if predictions.exists():
            # Calculate accuracy
            accurate_predictions = predictions.filter(is_accurate=True).count()
            total_predictions = predictions.count()
            accuracy = accurate_predictions / total_predictions if total_predictions > 0 else 0
            
            # Update model
            model.accuracy = accuracy
            model.save()
            
            logger.info(f"Updated performance for model {model.name}: accuracy={accuracy}")
        
    except PredictionModel.DoesNotExist:
        logger.error(f"Model {model_id} not found")
    except Exception as e:
        logger.error(f"Failed to update model performance: {e}")
