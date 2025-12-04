"""
Management command to process data export requests for GDPR compliance
"""
import json
import os
import zipfile
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model
from users.models import DataExportRequest, UserProfile, UserActivity, UserPreferences

User = get_user_model()

class Command(BaseCommand):
    help = 'Process pending data export requests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--request-id',
            type=str,
            help='Process specific export request by ID',
        )

    def handle(self, *args, **options):
        request_id = options.get('request_id')
        
        if request_id:
            try:
                export_request = DataExportRequest.objects.get(id=request_id)
                self.process_export_request(export_request)
            except DataExportRequest.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Export request {request_id} not found')
                )
        else:
            # Process all pending requests
            pending_requests = DataExportRequest.objects.filter(status='pending')
            
            if not pending_requests.exists():
                self.stdout.write(
                    self.style.SUCCESS('No pending export requests to process')
                )
                return
            
            for export_request in pending_requests:
                self.process_export_request(export_request)

    def process_export_request(self, export_request):
        """Process a single export request"""
        self.stdout.write(
            f'Processing export request {export_request.id} for user {export_request.user.username}'
        )
        
        try:
            # Update status to processing
            export_request.status = 'processing'
            export_request.save()
            
            # Create export data
            export_data = self.create_export_data(export_request)
            
            # Create export file
            file_path = self.create_export_file(export_request, export_data)
            
            # Update request with file path and completion
            export_request.file_path = file_path
            export_request.status = 'completed'
            export_request.completed_at = timezone.now()
            export_request.expires_at = timezone.now() + timedelta(days=30)  # 30 days to download
            
            # In a real implementation, you would upload to cloud storage and set download_url
            export_request.download_url = f'/api/users/export/download/{export_request.id}/'
            
            export_request.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'Successfully processed export request {export_request.id}')
            )
            
        except Exception as e:
            export_request.status = 'failed'
            export_request.save()
            
            self.stdout.write(
                self.style.ERROR(f'Failed to process export request {export_request.id}: {str(e)}')
            )

    def create_export_data(self, export_request):
        """Create export data based on request type"""
        user = export_request.user
        export_data = {
            'export_info': {
                'request_id': str(export_request.id),
                'user_id': user.id,
                'username': user.username,
                'export_type': export_request.export_type,
                'requested_at': export_request.requested_at.isoformat(),
                'processed_at': timezone.now().isoformat(),
            }
        }
        
        if export_request.export_type in ['full', 'profile']:
            # Export user data
            export_data['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': getattr(user, 'phone', ''),
                'role': user.role,
                'is_active': user.is_active,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
            }
            
            # Export profile data
            try:
                profile = user.profile
                export_data['profile'] = {
                    'first_name': profile.first_name,
                    'last_name': profile.last_name,
                    'date_of_birth': profile.date_of_birth.isoformat() if profile.date_of_birth else None,
                    'bio': profile.bio,
                    'address': profile.address,
                    'city': profile.city,
                    'state': profile.state,
                    'country': profile.country,
                    'zip_code': profile.zip_code,
                    'latitude': str(profile.latitude) if profile.latitude else None,
                    'longitude': str(profile.longitude) if profile.longitude else None,
                    'farm_experience': profile.farm_experience,
                    'specialization': profile.specialization,
                    'farm_size': str(profile.farm_size) if profile.farm_size else None,
                    'website': profile.website,
                    'social_media_links': profile.social_media_links,
                    'profile_visibility': profile.profile_visibility,
                    'show_location': profile.show_location,
                    'show_contact_info': profile.show_contact_info,
                    'created_at': profile.created_at.isoformat(),
                    'updated_at': profile.updated_at.isoformat(),
                }
            except UserProfile.DoesNotExist:
                export_data['profile'] = None
            
            # Export preferences data
            try:
                preferences = user.preferences
                export_data['preferences'] = {
                    'email_notifications': preferences.email_notifications,
                    'sms_notifications': preferences.sms_notifications,
                    'push_notifications': preferences.push_notifications,
                    'newsletter_subscription': preferences.newsletter_subscription,
                    'marketplace_notifications': preferences.marketplace_notifications,
                    'order_notifications': preferences.order_notifications,
                    'farm_alerts': preferences.farm_alerts,
                    'weather_alerts': preferences.weather_alerts,
                    'price_alerts': preferences.price_alerts,
                    'community_notifications': preferences.community_notifications,
                    'language': preferences.language,
                    'timezone': preferences.timezone,
                    'currency': preferences.currency,
                    'data_sharing_consent': preferences.data_sharing_consent,
                    'marketing_consent': preferences.marketing_consent,
                    'analytics_consent': preferences.analytics_consent,
                    'dnd_enabled': preferences.dnd_enabled,
                    'dnd_start_time': preferences.dnd_start_time.isoformat() if preferences.dnd_start_time else None,
                    'dnd_end_time': preferences.dnd_end_time.isoformat() if preferences.dnd_end_time else None,
                    'created_at': preferences.created_at.isoformat(),
                    'updated_at': preferences.updated_at.isoformat(),
                }
            except UserPreferences.DoesNotExist:
                export_data['preferences'] = None
        
        if export_request.export_type in ['full', 'activity']:
            # Export activity data
            activities = UserActivity.objects.filter(user=user).order_by('-created_at')
            export_data['activities'] = [
                {
                    'activity_type': activity.activity_type,
                    'description': activity.description,
                    'ip_address': activity.ip_address,
                    'user_agent': activity.user_agent,
                    'created_at': activity.created_at.isoformat(),
                }
                for activity in activities
            ]
        
        return export_data

    def create_export_file(self, export_request, export_data):
        """Create export file (JSON + ZIP)"""
        # Create exports directory if it doesn't exist
        exports_dir = os.path.join(settings.MEDIA_ROOT, 'exports')
        os.makedirs(exports_dir, exist_ok=True)
        
        # Create filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'user_export_{export_request.user.id}_{timestamp}'
        
        # Create JSON file
        json_path = os.path.join(exports_dir, f'{filename}.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        
        # Create ZIP file
        zip_path = os.path.join(exports_dir, f'{filename}.zip')
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            zipf.write(json_path, f'{filename}.json')
        
        # Remove JSON file (keep only ZIP)
        os.remove(json_path)
        
        return zip_path