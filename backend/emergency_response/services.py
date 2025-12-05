"""Business logic for emergency response service."""

from datetime import datetime, timedelta
from typing import List, Dict, Tuple
from django.utils import timezone
from django.db import transaction
from django.db.models import Count, Q, Avg
from django.contrib.auth import get_user_model
from .models import (
    EmergencyAlert, IncidentReport, AlertAcknowledgment,
    EmergencyGuideline, IncidentAnalytics
)

User = get_user_model()


class AlertService:
    """Service for managing emergency alerts."""
    
    @staticmethod
    def generate_alert_number(alert_type: str) -> str:
        """Generate unique alert number."""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        prefix = alert_type[:3].upper()
        return f"ALERT-{prefix}-{timestamp}"
    
    @staticmethod
    @transaction.atomic
    def create_alert(user, data: Dict) -> EmergencyAlert:
        """Create and issue emergency alert."""
        # Generate alert number
        alert_number = AlertService.generate_alert_number(data['alert_type'])
        
        # Create alert
        alert = EmergencyAlert.objects.create(
            alert_number=alert_number,
            created_by=user,
            status='ACTIVE',
            issued_at=timezone.now(),
            **data
        )
        
        return alert
    
    @staticmethod
    def get_active_alerts(region: str = None, district: str = None) -> List[EmergencyAlert]:
        """Get active alerts for a location."""
        queryset = EmergencyAlert.objects.filter(
            status='ACTIVE',
            issued_at__lte=timezone.now()
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gte=timezone.now())
        )
        
        if region:
            queryset = queryset.filter(
                Q(regions__contains=[region]) | Q(regions=[])
            )
        
        if district:
            queryset = queryset.filter(
                Q(districts__contains=[district]) | Q(districts=[])
            )
        
        return queryset.order_by('-severity', '-issued_at')
    
    @staticmethod
    def get_targeted_users(alert: EmergencyAlert) -> List[User]:
        """Get users who should receive the alert based on location."""
        from users.models import UserProfile
        
        queryset = User.objects.filter(is_active=True)
        
        # Filter by regions if specified
        if alert.regions:
            queryset = queryset.filter(
                userprofile__region__in=alert.regions
            )
        
        # Filter by districts if specified
        if alert.districts:
            queryset = queryset.filter(
                userprofile__district__in=alert.districts
            )
        
        return list(queryset)
    
    @staticmethod
    @transaction.atomic
    def acknowledge_alert(alert: EmergencyAlert, user: User, location: Dict = None, notes: str = '') -> AlertAcknowledgment:
        """Record user acknowledgment of alert."""
        acknowledgment, created = AlertAcknowledgment.objects.get_or_create(
            alert=alert,
            user=user,
            defaults={
                'location': location,
                'notes': notes
            }
        )
        
        if created:
            # Update acknowledgment count
            alert.acknowledgment_count += 1
            alert.save(update_fields=['acknowledgment_count'])
        
        return acknowledgment
    
    @staticmethod
    @transaction.atomic
    def resolve_alert(alert: EmergencyAlert) -> EmergencyAlert:
        """Mark alert as resolved."""
        alert.status = 'RESOLVED'
        alert.resolved_at = timezone.now()
        alert.save()
        
        return alert


class BroadcastService:
    """Service for broadcasting emergency alerts."""
    
    @staticmethod
    def broadcast_alert(alert: EmergencyAlert, channels: List[str], target_users: List[User] = None):
        """Broadcast alert through multiple channels."""
        if target_users is None:
            target_users = AlertService.get_targeted_users(alert)
        
        results = {
            'websocket': 0,
            'push': 0,
            'sms': 0,
            'email': 0
        }
        
        # WebSocket broadcasting
        if 'websocket' in channels:
            results['websocket'] = BroadcastService._broadcast_websocket(alert, target_users)
        
        # Push notifications
        if 'push' in channels:
            results['push'] = BroadcastService._broadcast_push(alert, target_users)
        
        # SMS for critical alerts
        if 'sms' in channels and alert.severity == 'CRITICAL':
            results['sms'] = BroadcastService._broadcast_sms(alert, target_users)
        
        # Email notifications
        if 'email' in channels:
            results['email'] = BroadcastService._broadcast_email(alert, target_users)
        
        # Update broadcast count
        alert.broadcast_count += sum(results.values())
        alert.save(update_fields=['broadcast_count'])
        
        return results
    
    @staticmethod
    def _broadcast_websocket(alert: EmergencyAlert, users: List[User]) -> int:
        """Broadcast via WebSocket."""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            count = 0
            
            for user in users:
                async_to_sync(channel_layer.group_send)(
                    f"user_{user.id}",
                    {
                        'type': 'emergency_alert',
                        'alert': {
                            'id': str(alert.id),
                            'alert_number': alert.alert_number,
                            'alert_type': alert.alert_type,
                            'severity': alert.severity,
                            'title': alert.title,
                            'description': alert.description,
                            'response_guidelines': alert.response_guidelines,
                            'emergency_contacts': alert.emergency_contacts,
                        }
                    }
                )
                count += 1
            
            return count
        except Exception:
            return 0
    
    @staticmethod
    def _broadcast_push(alert: EmergencyAlert, users: List[User]) -> int:
        """Broadcast via push notifications."""
        try:
            from notifications.services import NotificationService
            
            count = 0
            for user in users:
                NotificationService.create_notification(
                    user=user,
                    notification_type='EMERGENCY_ALERT',
                    title=f"🚨 {alert.get_severity_display()} Alert: {alert.title}",
                    message=alert.description[:200],
                    priority='HIGH' if alert.severity in ['HIGH', 'CRITICAL'] else 'MEDIUM',
                    data={
                        'alert_id': str(alert.id),
                        'alert_number': alert.alert_number,
                        'alert_type': alert.alert_type,
                        'severity': alert.severity
                    }
                )
                count += 1
            
            return count
        except Exception:
            return 0
    
    @staticmethod
    def _broadcast_sms(alert: EmergencyAlert, users: List[User]) -> int:
        """Broadcast via SMS for critical alerts."""
        try:
            from notifications.sms_service import SMSService
            
            sms_service = SMSService()
            count = 0
            
            message = f"CRITICAL ALERT: {alert.title}. {alert.description[:100]}. Check app for details."
            
            for user in users:
                if hasattr(user, 'userprofile') and user.userprofile.phone_number:
                    sms_service.send_sms(
                        user.userprofile.phone_number,
                        message
                    )
                    count += 1
            
            return count
        except Exception:
            return 0
    
    @staticmethod
    def _broadcast_email(alert: EmergencyAlert, users: List[User]) -> int:
        """Broadcast via email."""
        try:
            from notifications.email_service import EmailService
            
            email_service = EmailService()
            count = 0
            
            for user in users:
                email_service.send_email(
                    to_email=user.email,
                    subject=f"Emergency Alert: {alert.title}",
                    template='emergency_alert',
                    context={
                        'alert': alert,
                        'user': user
                    }
                )
                count += 1
            
            return count
        except Exception:
            return 0


class IncidentService:
    """Service for managing incident reports."""
    
    @staticmethod
    def generate_report_number(incident_type: str) -> str:
        """Generate unique report number."""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        prefix = incident_type[:3].upper()
        return f"INC-{prefix}-{timestamp}"
    
    @staticmethod
    @transaction.atomic
    def create_report(user: User, data: Dict) -> IncidentReport:
        """Create incident report."""
        # Generate report number
        report_number = IncidentService.generate_report_number(data['incident_type'])
        
        # Create report
        report = IncidentReport.objects.create(
            report_number=report_number,
            reporter=user,
            **data
        )
        
        return report
    
    @staticmethod
    @transaction.atomic
    def verify_report(report: IncidentReport, verifier: User, severity: str = None) -> IncidentReport:
        """Verify incident report."""
        report.status = 'VERIFIED'
        report.verified_by = verifier
        report.verified_at = timezone.now()
        
        if severity:
            report.severity_assessment = severity
        
        report.save()
        
        # Check if we should create an alert
        if IncidentService._should_create_alert(report):
            IncidentService._create_alert_from_report(report)
        
        return report
    
    @staticmethod
    def _should_create_alert(report: IncidentReport) -> bool:
        """Determine if report warrants an alert."""
        # Check severity
        if report.severity_assessment in ['HIGH', 'CRITICAL']:
            return True
        
        # Check for similar reports in the area
        similar_reports = IncidentReport.objects.filter(
            incident_type=report.incident_type,
            region=report.region,
            status='VERIFIED',
            reported_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        # Create alert if multiple similar reports
        return similar_reports >= 3
    
    @staticmethod
    @transaction.atomic
    def _create_alert_from_report(report: IncidentReport) -> EmergencyAlert:
        """Create alert from verified incident report."""
        alert_data = {
            'alert_type': report.incident_type,
            'severity': report.severity_assessment or 'MEDIUM',
            'title': f"{report.get_incident_type_display()} Alert: {report.region}",
            'description': f"Multiple reports of {report.get_incident_type_display().lower()} in {report.region}. {report.description}",
            'regions': [report.region] if report.region else [],
            'districts': [report.district] if report.district else [],
            'response_guidelines': IncidentService._get_default_guidelines(report.incident_type),
            'emergency_contacts': {},
            'expires_at': timezone.now() + timedelta(days=7)
        }
        
        alert = AlertService.create_alert(report.verified_by, alert_data)
        
        # Link report to alert
        report.related_alert = alert
        report.save(update_fields=['related_alert'])
        
        return alert
    
    @staticmethod
    def _get_default_guidelines(incident_type: str) -> str:
        """Get default response guidelines for incident type."""
        guidelines = {
            'WEATHER': "Monitor weather updates. Secure loose items. Seek shelter if necessary.",
            'PEST': "Inspect crops regularly. Apply appropriate treatments. Report to agricultural extension.",
            'DISEASE': "Isolate affected areas. Contact veterinary/agricultural services. Follow biosecurity protocols.",
            'FLOOD': "Move to higher ground. Avoid flood waters. Secure livestock and equipment.",
            'DROUGHT': "Conserve water. Implement water-saving measures. Monitor crop stress.",
            'FIRE': "Evacuate if necessary. Call emergency services. Create firebreaks.",
            'THEFT': "Report to police. Secure property. Increase surveillance.",
            'ACCIDENT': "Ensure safety. Call emergency services. Provide first aid if trained.",
        }
        return guidelines.get(incident_type, "Follow local emergency procedures.")


class AnalyticsService:
    """Service for incident analytics and reporting."""
    
    @staticmethod
    def generate_analytics(start_date, end_date, region: str = None) -> IncidentAnalytics:
        """Generate analytics for a time period."""
        # Get incidents
        incidents = IncidentReport.objects.filter(
            reported_at__gte=start_date,
            reported_at__lte=end_date
        )
        
        if region:
            incidents = incidents.filter(region=region)
        
        # Get alerts
        alerts = EmergencyAlert.objects.filter(
            issued_at__gte=start_date,
            issued_at__lte=end_date
        )
        
        if region:
            alerts = alerts.filter(regions__contains=[region])
        
        # Calculate statistics
        incidents_by_type = dict(
            incidents.values('incident_type').annotate(count=Count('id')).values_list('incident_type', 'count')
        )
        
        incidents_by_severity = dict(
            incidents.exclude(severity_assessment='').values('severity_assessment').annotate(count=Count('id')).values_list('severity_assessment', 'count')
        )
        
        alerts_by_type = dict(
            alerts.values('alert_type').annotate(count=Count('id')).values_list('alert_type', 'count')
        )
        
        # Calculate rates
        total_incidents = incidents.count()
        verified_incidents = incidents.filter(status='VERIFIED').count()
        resolved_incidents = incidents.filter(status='RESOLVED').count()
        
        verification_rate = (verified_incidents / total_incidents * 100) if total_incidents > 0 else 0
        resolution_rate = (resolved_incidents / total_incidents * 100) if total_incidents > 0 else 0
        
        # Calculate acknowledgment rate
        total_alerts = alerts.count()
        total_acknowledgments = AlertAcknowledgment.objects.filter(
            alert__in=alerts
        ).count()
        acknowledgment_rate = (total_acknowledgments / (total_alerts * 10) * 100) if total_alerts > 0 else 0  # Assuming 10 users per alert
        
        # Create analytics record
        analytics = IncidentAnalytics.objects.create(
            period_start=start_date,
            period_end=end_date,
            region=region or '',
            total_incidents=total_incidents,
            incidents_by_type=incidents_by_type,
            incidents_by_severity=incidents_by_severity,
            total_alerts=total_alerts,
            alerts_by_type=alerts_by_type,
            verification_rate=verification_rate,
            resolution_rate=resolution_rate,
            acknowledgment_rate=acknowledgment_rate,
            common_patterns=AnalyticsService._identify_patterns(incidents),
            recommendations=AnalyticsService._generate_recommendations(incidents, alerts)
        )
        
        return analytics
    
    @staticmethod
    def _identify_patterns(incidents) -> List[Dict]:
        """Identify common patterns in incidents."""
        patterns = []
        
        # Most common incident types
        top_types = incidents.values('incident_type').annotate(
            count=Count('id')
        ).order_by('-count')[:3]
        
        for item in top_types:
            patterns.append({
                'type': 'frequent_incident',
                'incident_type': item['incident_type'],
                'count': item['count'],
                'description': f"{item['incident_type']} incidents are most common"
            })
        
        # Geographic hotspots
        hotspots = incidents.values('region').annotate(
            count=Count('id')
        ).order_by('-count')[:3]
        
        for item in hotspots:
            if item['region']:
                patterns.append({
                    'type': 'geographic_hotspot',
                    'region': item['region'],
                    'count': item['count'],
                    'description': f"{item['region']} has high incident rate"
                })
        
        return patterns
    
    @staticmethod
    def _generate_recommendations(incidents, alerts) -> List[Dict]:
        """Generate recommendations based on data."""
        recommendations = []
        
        # Check verification rate
        total = incidents.count()
        verified = incidents.filter(status='VERIFIED').count()
        
        if total > 0 and (verified / total) < 0.5:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'verification',
                'recommendation': 'Increase verification resources - less than 50% of reports are being verified'
            })
        
        # Check response time
        unresolved = incidents.filter(status__in=['PENDING', 'INVESTIGATING']).count()
        if unresolved > total * 0.3:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'response',
                'recommendation': 'Improve response time - many incidents remain unresolved'
            })
        
        return recommendations
