# IoT Service

## Overview
The IoT Service provides comprehensive management of Internet of Things (IoT) devices for agricultural monitoring. It enables farmers to register, monitor, and control various sensors and actuators deployed across their farms for real-time data collection and automated farming operations.

## Features

### 🔧 Device Management
- Register and manage IoT devices (sensors, actuators, gateways)
- Device authentication and security
- Device grouping and organization
- Real-time device status monitoring
- Battery level and signal strength tracking

### 📊 Sensor Data Collection
- Real-time sensor data ingestion
- Support for multiple sensor types (temperature, humidity, soil moisture, etc.)
- Batch data upload capabilities
- Data quality validation and filtering
- Historical data storage and retrieval

### 🚨 Alert System
- Threshold-based alerting
- Device offline detection
- Low battery warnings
- Customizable alert severity levels
- Alert acknowledgment and resolution tracking

### 📡 Real-time Monitoring
- Live sensor data streaming
- Device health monitoring
- Network connectivity status
- Performance analytics and reporting

### 🔄 Device Control
- Remote device commands
- Firmware update management (OTA)
- Configuration updates
- Scheduled maintenance

### 📈 Analytics & Insights
- Device uptime tracking
- Data quality metrics
- Performance trends
- Maintenance scheduling

## Supported Device Types

### Sensors
- **AgriSense Pro**: Multi-sensor device (temperature, humidity, soil moisture, light)
- **WeatherStation Elite**: Weather monitoring (temperature, humidity, pressure, wind, rainfall)
- **SoilGuard Monitor**: Soil analysis (moisture, temperature, pH, EC)

### Actuators
- **IrrigationHub Smart**: Irrigation control (flow rate, pressure, valve status)

### Communication Protocols
- WiFi
- LoRa/LoRaWAN
- Cellular (3G/4G/5G)
- Ethernet
- Bluetooth
- ZigBee

## API Endpoints

### Device Management
```
GET /api/v1/iot/devices/                    # List user's devices
POST /api/v1/iot/devices/                   # Register new device
GET /api/v1/iot/devices/{id}/               # Get device details
PUT /api/v1/iot/devices/{id}/               # Update device
DELETE /api/v1/iot/devices/{id}/            # Remove device
POST /api/v1/iot/devices/{id}/activate/     # Activate device
POST /api/v1/iot/devices/{id}/deactivate/   # Deactivate device
POST /api/v1/iot/devices/{id}/update_status/ # Update device status
GET /api/v1/iot/devices/{id}/analytics/     # Get device analytics
GET /api/v1/iot/devices/dashboard/          # Dashboard overview
```

### Sensor Data
```
GET /api/v1/iot/readings/                   # List sensor readings
POST /api/v1/iot/readings/                  # Create sensor reading
POST /api/v1/iot/readings/batch_upload/     # Batch upload readings
GET /api/v1/iot/readings/latest/            # Get latest readings
```

### Device Alerts
```
GET /api/v1/iot/alerts/                     # List alerts
POST /api/v1/iot/alerts/{id}/acknowledge/   # Acknowledge alert
POST /api/v1/iot/alerts/{id}/resolve/       # Resolve alert
GET /api/v1/iot/alerts/active/              # Get active alerts
GET /api/v1/iot/alerts/summary/             # Alert statistics
```

### Device Groups
```
GET /api/v1/iot/groups/                     # List device groups
POST /api/v1/iot/groups/                    # Create device group
POST /api/v1/iot/groups/{id}/add_device/    # Add device to group
POST /api/v1/iot/groups/{id}/remove_device/ # Remove device from group
```

### Device Commands
```
GET /api/v1/iot/commands/                   # List commands
POST /api/v1/iot/commands/                  # Create command
POST /api/v1/iot/commands/{id}/execute/     # Execute command
GET /api/v1/iot/commands/pending/           # Get pending commands
```

### Device Types & Sensors
```
GET /api/v1/iot/device-types/               # List device types
GET /api/v1/iot/sensor-types/               # List sensor types
GET /api/v1/iot/firmware/                   # List firmware versions
GET /api/v1/iot/firmware/latest/            # Get latest firmware
```

## Usage Examples

### 1. Register IoT Device

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "FARM001_SENSOR01",
    "name": "Field A Weather Station",
    "device_type": "device-type-uuid",
    "connectivity_type": "wifi",
    "latitude": 5.6037,
    "longitude": -0.1870,
    "location_description": "Field A - North Corner"
  }' \
  http://localhost:8000/api/v1/iot/devices/
```

### 2. Upload Sensor Data

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device": "device-uuid",
    "sensor_type": "sensor-type-uuid",
    "value": 25.5,
    "timestamp": "2024-12-04T10:30:00Z"
  }' \
  http://localhost:8000/api/v1/iot/readings/
```

### 3. Batch Upload Sensor Data

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "FARM001_SENSOR01",
    "readings": [
      {
        "sensor_type": "temperature",
        "value": 25.5,
        "timestamp": "2024-12-04T10:30:00Z"
      },
      {
        "sensor_type": "humidity",
        "value": 65.2,
        "timestamp": "2024-12-04T10:30:00Z"
      }
    ]
  }' \
  http://localhost:8000/api/v1/iot/readings/batch_upload/
```

### 4. Get Device Dashboard

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/v1/iot/devices/dashboard/
```

### 5. Send Device Command

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device": "device-uuid",
    "command_type": "restart",
    "command_data": {"reason": "maintenance"},
    "expires_at": "2024-12-05T10:30:00Z"
  }' \
  http://localhost:8000/api/v1/iot/commands/
```

## Sensor Types Supported

| Sensor Type | Unit | Range | Description |
|-------------|------|-------|-------------|
| temperature | °C | -40 to 85 | Air temperature |
| humidity | % | 0 to 100 | Relative humidity |
| soil_moisture | % | 0 to 100 | Soil moisture content |
| light | lux | 0 to 100,000 | Light intensity |
| pressure | Pa | 80,000 to 110,000 | Atmospheric pressure |
| wind_speed | m/s | 0 to 50 | Wind speed |
| rainfall | mm | 0 to 500 | Rainfall measurement |
| soil_temperature | °C | -20 to 60 | Soil temperature |
| ph | pH | 0 to 14 | Soil pH level |
| ec | mS/cm | 0 to 10 | Electrical conductivity |

## Alert Types

- **threshold**: Sensor value exceeds configured thresholds
- **device_offline**: Device stops responding
- **low_battery**: Battery level below 20%
- **sensor_failure**: Sensor malfunction detected
- **connectivity**: Network connectivity issues
- **maintenance**: Scheduled maintenance required
- **firmware**: Firmware update available

## Device Status

- **active**: Device is operational and sending data
- **inactive**: Device is registered but not active
- **maintenance**: Device is under maintenance
- **error**: Device is in error state
- **offline**: Device is not responding

## Management Commands

### Populate Sample Data
```bash
python manage.py populate_iot_data
```

This command creates:
- 4 device types with different capabilities
- 10 sensor types covering common agricultural sensors
- Sample devices for existing farmer users
- Historical sensor readings for the last 24 hours

## Testing

Run the complete test suite:
```bash
python manage.py test iot_service
```

Run specific test categories:
```bash
# Model tests
python manage.py test iot_service.tests.IoTServiceModelTests

# API tests
python manage.py test iot_service.tests.IoTDeviceAPITests
python manage.py test iot_service.tests.SensorReadingAPITests
python manage.py test iot_service.tests.DeviceAlertAPITests
```

## Real-time Features

### WebSocket Support
The service is designed to support real-time data streaming through WebSocket connections for:
- Live sensor data updates
- Real-time device status changes
- Instant alert notifications
- Device command responses

### Signal Handlers
Automatic signal processing for:
- Threshold violation detection
- Device status monitoring
- Alert generation
- Data quality validation

## Security Features

- **Device Authentication**: Secure device registration and authentication
- **Data Encryption**: Support for encrypted data transmission
- **Access Control**: Role-based permissions for device management
- **Audit Logging**: Complete audit trail of device operations

## Integration Points

### Farm Management
- Link devices to specific farms and fields
- Integrate with crop management workflows
- Support precision agriculture applications

### Notification Service
- Automatic alert forwarding to notification service
- Multi-channel alert delivery (email, SMS, push)
- Escalation policies for critical alerts

### Analytics Service
- Feed sensor data to analytics engine
- Support predictive analytics and ML models
- Generate insights and recommendations

## Production Considerations

### Scalability
- Designed for thousands of devices per farm
- Efficient data storage with time-series optimization
- Batch processing for high-volume data ingestion

### Reliability
- Automatic device health monitoring
- Data quality validation and filtering
- Graceful handling of intermittent connectivity

### Performance
- Optimized database queries with proper indexing
- Efficient data aggregation and reporting
- Caching strategies for frequently accessed data

## Future Enhancements

1. **Edge Computing**: Support for edge processing and local data aggregation
2. **Machine Learning**: Integrated anomaly detection and predictive maintenance
3. **Advanced Analytics**: Real-time data processing and complex event processing
4. **Mobile SDK**: Native mobile SDKs for device management
5. **Protocol Support**: Additional IoT protocols (MQTT, CoAP, etc.)

## License

This service is part of the AgroBridge platform and follows the project's licensing terms.