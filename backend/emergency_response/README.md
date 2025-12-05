# Emergency Response Service

The Emergency Response Service manages emergency alerts, incident reporting, and response coordination for agricultural communities.

## Features

### Emergency Alerts
- Create and broadcast emergency alerts
- Multiple alert types (weather, pest, disease, flood, drought, fire, security)
- Severity levels (low, medium, high, critical)
- Geographic targeting (country, regions, districts)
- Multi-channel broadcasting (WebSocket, push, SMS, email)
- Alert acknowledgment tracking
- Alert lifecycle management

### Incident Reporting
- User-submitted incident reports
- Photo and location evidence
- Status tracking (pending, verified, investigating, resolved)
- Automatic alert generation from verified reports
- Geographic clustering of similar incidents

### Emergency Guidelines
- Response guidelines for different emergency types
- Immediate actions and safety measures
- Emergency contact information
- Location-specific advice
- Resource requirements

### Analytics
- Incident pattern analysis
- Response effectiveness metrics
- Geographic hotspot identification
- Automated recommendations
- Trend analysis

## Alert Types

- **WEATHER**: Weather-related emergencies (storms, heavy rain, etc.)
- **PEST**: Pest outbreaks and infestations
- **DISEASE**: Disease outbreaks (crops or livestock)
- **FLOOD**: Flooding warnings
- **DROUGHT**: Drought conditions
- **FIRE**: Fire alerts
- **SECURITY**: Security threats
- **MARKET**: Market disruptions
- **OTHER**: Other emergencies

## API Endpoints

### Emergency Alerts
- `GET /api/emergency/alerts/` - List alerts
- `POST /api/emergency/alerts/` - Create alert (staff only)
- `GET /api/emergency/alerts/{id}/` - Get alert details
- `PUT /api/emergency/alerts/{id}/` - Update alert (staff only)
- `POST /api/emergency/alerts/{id}/broadcast/` - Broadcast alert
- `POST /api/emergency/alerts/{id}/acknowledge/` - Acknowledge alert
- `POST /api/emergency/alerts/{id}/resolve/` - Resolve alert (staff only)
- `POST /api/emergency/alerts/{id}/cancel/` - Cancel alert (staff only)
- `GET /api/emergency/alerts/{id}/acknowledgments/` - Get acknowledgments
- `GET /api/emergency/alerts/active/` - Get active alerts for location
- `GET /api/emergency/alerts/statistics/` - Get alert statistics

### Incident Reports
- `GET /api/emergency/incidents/` - List reports
- `POST /api/emergency/incidents/` - Create report
- `GET /api/emergency/incidents/{id}/` - Get report details
- `PUT /api/emergency/incidents/{id}/` - Update report
- `POST /api/emergency/incidents/{id}/verify/` - Verify report (staff only)
- `POST /api/emergency/incidents/{id}/reject/` - Reject report (staff only)
- `POST /api/emergency/incidents/{id}/resolve/` - Resolve report (staff only)
- `GET /api/emergency/incidents/pending/` - Get pending reports
- `GET /api/emergency/incidents/statistics/` - Get incident statistics

### Emergency Guidelines
- `GET /api/emergency/guidelines/` - List guidelines
- `POST /api/emergency/guidelines/` - Create guideline (staff only)
- `GET /api/emergency/guidelines/{id}/` - Get guideline details
- `PUT /api/emergency/guidelines/{id}/` - Update guideline (staff only)
- `GET /api/emergency/guidelines/for_alert_type/` - Get guidelines for alert type

### Analytics
- `GET /api/emergency/analytics/` - List analytics
- `GET /api/emergency/analytics/{id}/` - Get analytics details
- `POST /api/emergency/analytics/generate/` - Generate analytics

## Models

### EmergencyAlert
Represents an emergency alert with geographic targeting and broadcasting capabilities.

### IncidentReport
User-submitted incident reports with verification workflow.

### AlertAcknowledgment
Tracks user acknowledgments of alerts.

### EmergencyGuideline
Response guidelines for different emergency types.

### IncidentAnalytics
Analytics and patterns for incident response.

## Services

### AlertService
Handles alert creation, broadcasting, and lifecycle management.

### BroadcastService
Manages multi-channel alert broadcasting (WebSocket, push, SMS, email).

### IncidentService
Manages incident reports and verification workflow.

### AnalyticsService
Generates analytics and identifies patterns.

## Management Commands

### populate_emergency_data
Populate sample guidelines:
```bash
python manage.py populate_emergency_data
```

### check_expired_alerts
Check and expire old alerts:
```bash
python manage.py check_expired_alerts
```

### generate_analytics
Generate incident analytics:
```bash
python manage.py generate_analytics --days 30 --region Northern
```

## Usage Examples

### Create Emergency Alert
```python
from emergency_response.services import AlertService, BroadcastService

data = {
    'alert_type': 'WEATHER',
    'severity': 'HIGH',
    'title': 'Severe Storm Warning',
    'description': 'Heavy rainfall and strong winds expected',
    'response_guidelines': 'Stay indoors. Secure loose items. Avoid travel.',
    'emergency_contacts': {
        'meteorological': '0302-123456',
        'emergency': '191'
    },
    'regions': ['Northern', 'Upper East'],
    'expires_at': timezone.now() + timedelta(days=3)
}

alert = AlertService.create_alert(user, data)

# Broadcast alert
BroadcastService.broadcast_alert(
    alert,
    channels=['websocket', 'push', 'sms', 'email']
)
```

### Submit Incident Report
```python
from emergency_response.services import IncidentService

data = {
    'incident_type': 'PEST',
    'title': 'Locust Swarm Sighting',
    'description': 'Large swarm of locusts observed in farmland',
    'location_description': 'Near Tamale, Northern Region',
    'latitude': 9.4034,
    'longitude': -0.8424,
    'region': 'Northern',
    'photos': ['https://example.com/photo1.jpg']
}

report = IncidentService.create_report(user, data)
```

### Verify Incident Report
```python
from emergency_response.services import IncidentService

# Verify report (staff only)
verified_report = IncidentService.verify_report(
    report,
    verifier=staff_user,
    severity='HIGH'
)

# This may automatically create an alert if conditions are met
```

### Generate Analytics
```python
from emergency_response.services import AnalyticsService
from datetime import date, timedelta

end_date = date.today()
start_date = end_date - timedelta(days=30)

analytics = AnalyticsService.generate_analytics(
    start_date,
    end_date,
    region='Northern'
)

print(f"Total incidents: {analytics.total_incidents}")
print(f"Verification rate: {analytics.verification_rate}%")
print(f"Common patterns: {analytics.common_patterns}")
```

## Broadcasting Channels

### WebSocket
Real-time alerts pushed to connected users via WebSocket.

### Push Notifications
Mobile push notifications via FCM.

### SMS
SMS alerts for critical emergencies (severity: CRITICAL).

### Email
Email notifications with detailed information.

## Geographic Targeting

Alerts can be targeted to specific:
- Countries
- Regions
- Districts
- Custom geographic areas (GeoJSON polygons)

Users receive alerts based on their profile location.

## Alert Lifecycle

1. **DRAFT**: Initial creation
2. **ACTIVE**: Issued and broadcasting
3. **RESOLVED**: Emergency resolved
4. **EXPIRED**: Alert expired
5. **CANCELLED**: Alert cancelled

## Incident Report Workflow

1. **PENDING**: Awaiting verification
2. **VERIFIED**: Verified by staff
3. **INVESTIGATING**: Under investigation
4. **RESOLVED**: Incident resolved
5. **REJECTED**: Report rejected
6. **DUPLICATE**: Duplicate report

## Automatic Alert Generation

The system automatically creates alerts when:
- A report is verified with HIGH or CRITICAL severity
- Multiple similar reports (3+) are verified in the same region within 7 days

## Configuration

### Environment Variables
- `EMERGENCY_SERVICE_PORT`: Service port (default: 8018)
- `SMS_CRITICAL_ONLY`: Only send SMS for critical alerts (default: true)

## Testing

Run tests:
```bash
python manage.py test emergency_response
```

## Service Registration

The service automatically registers with Consul on startup:
```python
from emergency_response.service_registration import register_service
register_service()
```

## Integration

The service integrates with:
- **Notification Service**: Multi-channel broadcasting
- **User Service**: User profiles and locations
- **WebSocket**: Real-time updates
- **SMS Service**: Critical alert messaging
- **Email Service**: Detailed notifications

## Security

- Alert creation restricted to staff users
- Users can only view their own incident reports
- Staff can view and manage all reports
- Geographic targeting ensures relevant alerts
- Acknowledgment tracking for accountability

## Performance

- Indexed queries for fast alert retrieval
- Efficient geographic filtering
- Batch broadcasting for multiple users
- Caching for active alerts
- Optimized analytics queries

## Monitoring

- Alert broadcast metrics
- Acknowledgment rates
- Response times
- Incident verification rates
- Geographic distribution

## Best Practices

1. **Alert Creation**
   - Use appropriate severity levels
   - Provide clear, actionable guidelines
   - Include emergency contact information
   - Set realistic expiry times

2. **Incident Reporting**
   - Include photos when possible
   - Provide accurate location information
   - Give detailed descriptions
   - Report promptly

3. **Broadcasting**
   - Use multiple channels for critical alerts
   - Target specific geographic areas
   - Avoid alert fatigue with appropriate severity
   - Follow up on resolved alerts

4. **Analytics**
   - Generate regular reports
   - Act on recommendations
   - Monitor patterns and trends
   - Share insights with stakeholders
