"""Serializers for emergency response service."""

from rest_framework import serializers
from .models import (
    EmergencyAlert, IncidentReport, AlertAcknowledgment,
    EmergencyGuideline, IncidentAnalytics
)


class EmergencyAlertSerializer(serializers.ModelSerializer):
    """Serializer for emergency alerts."""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = EmergencyAlert
        fields = [
            'id', 'alert_number', 'alert_type', 'alert_type_display',
            'severity', 'severity_display', 'title', 'description',
            'country', 'regions', 'districts', 'coordinates',
            'response_guidelines', 'emergency_contacts', 'resources',
            'status', 'status_display', 'issued_at', 'expires_at', 'resolved_at',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'broadcast_count', 'view_count', 'acknowledgment_count'
        ]
        read_only_fields = [
            'id', 'alert_number', 'created_by', 'created_at', 'updated_at',
            'broadcast_count', 'view_count', 'acknowledgment_count'
        ]


class EmergencyAlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating emergency alerts."""
    
    class Meta:
        model = EmergencyAlert
        fields = [
            'alert_type', 'severity', 'title', 'description',
            'country', 'regions', 'districts', 'coordinates',
            'response_guidelines', 'emergency_contacts', 'resources',
            'expires_at'
        ]
    
    def validate(self, data):
        """Validate alert data."""
        if not data.get('title'):
            raise serializers.ValidationError("Title is required")
        
        if not data.get('description'):
            raise serializers.ValidationError("Description is required")
        
        if not data.get('response_guidelines'):
            raise serializers.ValidationError("Response guidelines are required")
        
        return data


class IncidentReportSerializer(serializers.ModelSerializer):
    """Serializer for incident reports."""
    
    reporter_name = serializers.CharField(source='reporter.get_full_name', read_only=True)
    incident_type_display = serializers.CharField(source='get_incident_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = IncidentReport
        fields = [
            'id', 'report_number', 'reporter', 'reporter_name', 'reporter_contact',
            'incident_type', 'incident_type_display', 'title', 'description',
            'severity_assessment', 'location_description', 'latitude', 'longitude',
            'region', 'district', 'photos', 'additional_data',
            'status', 'status_display', 'verified_by', 'verified_by_name',
            'verified_at', 'related_alert', 'response_notes', 'resolved_at',
            'reported_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'report_number', 'reporter', 'verified_by', 'verified_at',
            'related_alert', 'response_notes', 'resolved_at', 'reported_at', 'updated_at'
        ]


class IncidentReportCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating incident reports."""
    
    class Meta:
        model = IncidentReport
        fields = [
            'incident_type', 'title', 'description', 'reporter_contact',
            'location_description', 'latitude', 'longitude',
            'region', 'district', 'photos', 'additional_data'
        ]
    
    def validate(self, data):
        """Validate incident report data."""
        if not data.get('title'):
            raise serializers.ValidationError("Title is required")
        
        if not data.get('description'):
            raise serializers.ValidationError("Description is required")
        
        if not data.get('location_description'):
            raise serializers.ValidationError("Location description is required")
        
        return data


class AlertAcknowledgmentSerializer(serializers.ModelSerializer):
    """Serializer for alert acknowledgments."""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    alert_title = serializers.CharField(source='alert.title', read_only=True)
    
    class Meta:
        model = AlertAcknowledgment
        fields = [
            'id', 'alert', 'alert_title', 'user', 'user_name',
            'acknowledged_at', 'location', 'notes'
        ]
        read_only_fields = ['id', 'user', 'acknowledged_at']


class EmergencyGuidelineSerializer(serializers.ModelSerializer):
    """Serializer for emergency guidelines."""
    
    guideline_type_display = serializers.CharField(source='get_guideline_type_display', read_only=True)
    
    class Meta:
        model = EmergencyGuideline
        fields = [
            'id', 'guideline_type', 'guideline_type_display', 'title', 'description',
            'immediate_actions', 'safety_measures', 'resources_needed',
            'emergency_contacts', 'support_services', 'applicable_regions',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class IncidentAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for incident analytics."""
    
    class Meta:
        model = IncidentAnalytics
        fields = [
            'id', 'period_start', 'period_end', 'region',
            'total_incidents', 'incidents_by_type', 'incidents_by_severity',
            'total_alerts', 'alerts_by_type', 'average_response_time',
            'verification_rate', 'resolution_rate', 'acknowledgment_rate',
            'common_patterns', 'recommendations', 'generated_at'
        ]
        read_only_fields = ['id', 'generated_at']


class AlertBroadcastSerializer(serializers.Serializer):
    """Serializer for alert broadcasting request."""
    
    channels = serializers.MultipleChoiceField(
        choices=['websocket', 'push', 'sms', 'email'],
        default=['websocket', 'push']
    )
    target_users = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        help_text="Specific users to target (optional)"
    )
