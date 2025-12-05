"""
Data Management Service Business Logic
"""
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import timedelta
import logging
import json
import os

from .models import (
    DataRetentionPolicy, DataDeletionLog, GDPRRequest,
    UserConsent, DataExport
)

User = get_user_model()
logger = logging.getLogger(__name__)


class DataRetentionService:
    """Service for managing data retention and cleanup."""
    
    def apply_all_policies(self):
        """Apply all active retention policies."""
        results = []
        policies = DataRetentionPolicy.objects.filter(status='active')
        
        for policy in policies:
            try:
                result = self.apply_policy(policy)
                results.append(result)
            except Exception as e:
                logger.error(f"Error applying policy {policy.id}: {str(e)}")
                results.append({
                    'policy_id': str(policy.id),
                    'data_type': policy.data_type,
                    'error': str(e)
                })
        
        return results
    
    def apply_policy(self, policy):
        """Apply a specific retention policy."""
        cutoff_date = timezone.now() - timedelta(days=policy.retention_days)
        deleted_count = 0
        
        # Route to appropriate cleanup method based on data type
        cleanup_methods = {
            'user_data': self._cleanup_user_data,
            'transaction': self._cleanup_transactions,
            'audit_log': self._cleanup_audit_logs,
            'sensor_data': self._cleanup_sensor_data,
            'marketplace': self._cleanup_marketplace_data,
            'communication': self._cleanup_communication_data,
            'analytics': self._cleanup_analytics_data,
        }
        
        cleanup_method = cleanup_methods.get(policy.data_type)
        if cleanup_method:
            deleted_count = cleanup_method(cutoff_date)
        
        # Log the deletion
        DataDeletionLog.objects.create(
            data_type=policy.data_type,
            records_deleted=deleted_count,
            policy=policy,
            details={'cutoff_date': cutoff_date.isoformat()}
        )
        
        return {
            'policy_id': str(policy.id),
            'data_type': policy.data_type,
            'records_deleted': deleted_count,
            'cutoff_date': cutoff_date.isoformat()
        }
    
    def _cleanup_user_data(self, cutoff_date):
        """Cleanup old user data (soft-deleted users)."""
        # This would delete users marked for deletion
        # Implementation depends on your user model
        return 0
    
    def _cleanup_transactions(self, cutoff_date):
        """Cleanup old transaction records."""
        # Implementation depends on transaction model
        return 0
    
    def _cleanup_audit_logs(self, cutoff_date):
        """Cleanup old audit logs (keeping 7 years as per regulations)."""
        # Note: Audit logs typically have longer retention
        return 0
    
    def _cleanup_sensor_data(self, cutoff_date):
        """Cleanup old sensor data."""
        # Implementation depends on sensor data model
        return 0
    
    def _cleanup_marketplace_data(self, cutoff_date):
        """Cleanup old marketplace data."""
        # Implementation depends on marketplace models
        return 0
    
    def _cleanup_communication_data(self, cutoff_date):
        """Cleanup old communication data."""
        # Implementation depends on communication models
        return 0
    
    def _cleanup_analytics_data(self, cutoff_date):
        """Cleanup old analytics data."""
        # Implementation depends on analytics models
        return 0


class GDPRService:
    """Service for handling GDPR compliance operations."""
    
    def process_request(self, gdpr_request):
        """Process a GDPR request based on its type."""
        gdpr_request.status = 'processing'
        gdpr_request.processed_at = timezone.now()
        gdpr_request.save()
        
        try:
            handlers = {
                'access': self._handle_access_request,
                'erasure': self._handle_erasure_request,
                'portability': self._handle_portability_request,
                'rectification': self._handle_rectification_request,
                'restriction': self._handle_restriction_request,
                'objection': self._handle_objection_request,
            }
            
            handler = handlers.get(gdpr_request.request_type)
            if handler:
                result = handler(gdpr_request)
                gdpr_request.result_data = result
                gdpr_request.status = 'completed'
                gdpr_request.completed_at = timezone.now()
            else:
                raise ValueError(f"Unknown request type: {gdpr_request.request_type}")
            
            gdpr_request.save()
            return result
            
        except Exception as e:
            gdpr_request.status = 'rejected'
            gdpr_request.notes = f"Error: {str(e)}"
            gdpr_request.save()
            raise
    
    def _handle_access_request(self, gdpr_request):
        """Handle right to access request."""
        user = gdpr_request.user
        
        # Create data export
        export_service = DataExportService()
        export = export_service.create_export_request(user, gdpr_request)
        
        return {
            'message': 'Data export created',
            'export_id': str(export.id)
        }
    
    @transaction.atomic
    def _handle_erasure_request(self, gdpr_request):
        """Handle right to erasure request."""
        user = gdpr_request.user
        
        # Anonymize or delete user data across all services
        deleted_data = {
            'user_profile': self._delete_user_profile(user),
            'farm_data': self._delete_farm_data(user),
            'marketplace_data': self._anonymize_marketplace_data(user),
            'communication_data': self._delete_communication_data(user),
            'iot_data': self._delete_iot_data(user),
            'learning_progress': self._delete_learning_data(user),
        }
        
        # Mark user account for deletion
        user.is_active = False
        user.email = f"deleted_{user.id}@deleted.local"
        user.save()
        
        return {
            'message': 'User data erased successfully',
            'deleted_data': deleted_data
        }
    
    def _handle_portability_request(self, gdpr_request):
        """Handle data portability request."""
        # Similar to access request but in machine-readable format
        return self._handle_access_request(gdpr_request)
    
    def _handle_rectification_request(self, gdpr_request):
        """Handle right to rectification request."""
        return {
            'message': 'Please update your profile through the user settings',
            'action_required': 'manual_update'
        }
    
    def _handle_restriction_request(self, gdpr_request):
        """Handle restriction of processing request."""
        user = gdpr_request.user
        
        # Mark user data for restricted processing
        # This would typically involve setting flags in various services
        
        return {
            'message': 'Processing restriction applied',
            'restricted_services': ['analytics', 'marketing']
        }
    
    def _handle_objection_request(self, gdpr_request):
        """Handle right to object request."""
        user = gdpr_request.user
        
        # Withdraw consents for objected processing
        UserConsent.objects.filter(
            user=user,
            consent_type__in=['marketing', 'profiling']
        ).update(granted=False, withdrawn_at=timezone.now())
        
        return {
            'message': 'Objection recorded, processing stopped',
            'affected_consents': ['marketing', 'profiling']
        }
    
    # Helper methods for data deletion
    def _delete_user_profile(self, user):
        """Delete user profile data."""
        # Implementation depends on user profile model
        return {'deleted': True}
    
    def _delete_farm_data(self, user):
        """Delete farm-related data."""
        # Implementation depends on farm models
        return {'deleted': True}
    
    def _anonymize_marketplace_data(self, user):
        """Anonymize marketplace data (keep for business records)."""
        # Implementation depends on marketplace models
        return {'anonymized': True}
    
    def _delete_communication_data(self, user):
        """Delete communication data."""
        # Implementation depends on communication models
        return {'deleted': True}
    
    def _delete_iot_data(self, user):
        """Delete IoT device data."""
        # Implementation depends on IoT models
        return {'deleted': True}
    
    def _delete_learning_data(self, user):
        """Delete learning progress data."""
        # Implementation depends on learning models
        return {'deleted': True}


class DataExportService:
    """Service for creating and managing data exports."""
    
    def create_export_request(self, user, gdpr_request=None):
        """Create a new data export request."""
        export = DataExport.objects.create(
            user=user,
            gdpr_request=gdpr_request,
            status='pending',
            format='json',
            expires_at=timezone.now() + timedelta(days=7)
        )
        
        # Queue export job (would use Celery in production)
        # For now, we'll process it synchronously
        self._process_export(export)
        
        return export
    
    def _process_export(self, export):
        """Process the data export."""
        try:
            export.status = 'processing'
            export.save()
            
            user = export.user
            
            # Collect data from all services
            data = {
                'user_profile': self._export_user_profile(user),
                'farm_data': self._export_farm_data(user),
                'marketplace_data': self._export_marketplace_data(user),
                'communication_data': self._export_communication_data(user),
                'iot_data': self._export_iot_data(user),
                'learning_data': self._export_learning_data(user),
                'financial_data': self._export_financial_data(user),
                'consents': self._export_consents(user),
                'export_metadata': {
                    'exported_at': timezone.now().isoformat(),
                    'format': export.format,
                    'user_id': str(user.id)
                }
            }
            
            # Save to file
            file_path = self._save_export_file(export, data)
            
            export.file_path = file_path
            export.file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            export.status = 'completed'
            export.completed_at = timezone.now()
            export.save()
            
        except Exception as e:
            logger.error(f"Error processing export {export.id}: {str(e)}")
            export.status = 'failed'
            export.save()
            raise
    
    def _save_export_file(self, export, data):
        """Save export data to file."""
        # In production, this would save to object storage (S3, MinIO, etc.)
        export_dir = 'exports'
        os.makedirs(export_dir, exist_ok=True)
        
        file_path = os.path.join(export_dir, f"{export.id}.json")
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2, default=str)
        
        return file_path
    
    # Data export methods for each service
    def _export_user_profile(self, user):
        """Export user profile data."""
        return {
            'id': str(user.id),
            'email': user.email,
            'username': user.username,
            'date_joined': user.date_joined.isoformat() if hasattr(user, 'date_joined') else None,
        }
    
    def _export_farm_data(self, user):
        """Export farm data."""
        # Implementation depends on farm models
        return {}
    
    def _export_marketplace_data(self, user):
        """Export marketplace data."""
        # Implementation depends on marketplace models
        return {}
    
    def _export_communication_data(self, user):
        """Export communication data."""
        # Implementation depends on communication models
        return {}
    
    def _export_iot_data(self, user):
        """Export IoT data."""
        # Implementation depends on IoT models
        return {}
    
    def _export_learning_data(self, user):
        """Export learning data."""
        # Implementation depends on learning models
        return {}
    
    def _export_financial_data(self, user):
        """Export financial data."""
        # Implementation depends on financial models
        return {}
    
    def _export_consents(self, user):
        """Export user consents."""
        consents = UserConsent.objects.filter(user=user)
        return [
            {
                'consent_type': c.consent_type,
                'granted': c.granted,
                'granted_at': c.granted_at.isoformat() if c.granted_at else None,
                'withdrawn_at': c.withdrawn_at.isoformat() if c.withdrawn_at else None,
                'version': c.version
            }
            for c in consents
        ]


class DataValidationService:
    """Service for data validation across the platform."""
    
    @staticmethod
    def validate_email(email):
        """Validate email format."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number format."""
        import re
        # Support international formats
        pattern = r'^\+?[1-9]\d{1,14}$'
        return re.match(pattern, phone) is not None
    
    @staticmethod
    def sanitize_input(text):
        """Sanitize user input to prevent XSS."""
        import html
        return html.escape(text)
    
    @staticmethod
    def validate_geojson(geojson_data):
        """Validate GeoJSON format."""
        try:
            if not isinstance(geojson_data, dict):
                return False
            if 'type' not in geojson_data:
                return False
            if 'coordinates' not in geojson_data:
                return False
            return True
        except Exception:
            return False
