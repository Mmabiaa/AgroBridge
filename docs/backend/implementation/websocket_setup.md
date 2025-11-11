# WebSocket Setup for AgroBridge Backend

## Overview

This document describes the WebSocket implementation for real-time features in the AgroBridge platform.

## Current Status

⚠️ **Note**: WebSocket functionality is currently disabled due to a compatibility issue between Django Channels 3.0.5 and Python 3.13. The `cgi` module was removed in Python 3.13, but Django Channels still depends on it.

## Architecture

The WebSocket implementation includes:

### 1. Base Infrastructure
- **ASGI Application** (`agrobridge_backend/asgi.py`): Handles both HTTP and WebSocket protocols
- **WebSocket Routing** (`agrobridge_backend/routing.py`): URL routing for WebSocket connections
- **Authentication Middleware** (`agrobridge_backend/websocket_auth.py`): JWT-based WebSocket authentication

### 2. Base Consumer Classes
- **BaseAuthenticatedConsumer**: Base class with JWT authentication
- **NotificationMixin**: Mixin for sending notifications
- **BroadcastMixin**: Mixin for group broadcasting
- **TestConsumer**: Test consumer for development

### 3. Planned Consumers
- **NotificationConsumer**: Personal notifications
- **MarketplaceConsumer**: Marketplace updates
- **FarmMonitoringConsumer**: Farm sensor data
- **ChatConsumer**: Real-time chat functionality

## Configuration

### Django Settings

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... other apps
    'channels',
]

# ASGI Application
ASGI_APPLICATION = 'agrobridge_backend.asgi.application'

# Channel Layers (Redis backend)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

### WebSocket URLs

```python
# WebSocket URL patterns
websocket_urlpatterns = [
    path('ws/notifications/', NotificationConsumer.as_asgi()),
    path('ws/marketplace/', MarketplaceConsumer.as_asgi()),
    re_path(r'ws/farms/(?P<farm_id>\w+)/', FarmMonitoringConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_name>\w+)/', ChatConsumer.as_asgi()),
]
```

## Authentication

WebSocket connections use JWT token authentication:

### Query Parameter Method
```
ws://localhost:8000/ws/notifications/?token=<jwt_token>
```

### Header Method
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/notifications/', [], {
    headers: {
        'Authorization': 'Bearer <jwt_token>'
    }
});
```

## Usage Examples

### Frontend WebSocket Client

```javascript
class AgroBridgeWebSocket {
    constructor(endpoint, token) {
        this.endpoint = endpoint;
        this.token = token;
        this.socket = null;
    }
    
    connect() {
        const wsUrl = `ws://localhost:8000/ws/${this.endpoint}/?token=${this.token}`;
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = (event) => {
            console.log('WebSocket connected');
        };
        
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
        };
        
        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected');
        };
    }
    
    sendMessage(type, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: type,
                data: data
            }));
        }
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'notification':
                this.showNotification(message.data);
                break;
            case 'farm_alert':
                this.handleFarmAlert(message.data);
                break;
            case 'marketplace_update':
                this.handleMarketplaceUpdate(message.data);
                break;
        }
    }
}

// Usage
const notificationSocket = new AgroBridgeWebSocket('notifications', userToken);
notificationSocket.connect();
```

### Backend Broadcasting

```python
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# Broadcast to all users in a group
channel_layer = get_channel_layer()
async_to_sync(channel_layer.group_send)(
    'farm_alerts',
    {
        'type': 'farm_alert',
        'data': {
            'farm_id': farm.id,
            'alert_type': 'sensor_offline',
            'message': 'Soil moisture sensor offline'
        }
    }
)
```

## Planned Features

### 1. Personal Notifications
- New messages and alerts
- Farm status updates
- Marketplace activity
- AI assistant responses

### 2. Marketplace Updates
- New product listings
- Price changes
- Order status updates
- Bidding activity

### 3. Farm Monitoring
- Real-time sensor data
- Alert notifications
- Weather updates
- Equipment status

### 4. Chat System
- Direct messaging
- Group conversations
- Expert consultations
- Community discussions

## Testing

Use the management command to test WebSocket functionality:

```bash
# Test basic channel layer
python manage.py test_websocket --test-type=basic

# Test broadcasting
python manage.py test_websocket --test-type=broadcast

# Test group functionality
python manage.py test_websocket --test-type=group
```

## Compatibility Issue Resolution

To resolve the Python 3.13 compatibility issue:

1. **Wait for Django Channels Update**: Monitor for Django Channels 4.x which should support Python 3.13
2. **Use Alternative**: Consider using Django 4.2 with Python 3.11/3.12
3. **Manual Fix**: Patch the channels library to remove `cgi` dependency

### Temporary Workaround

For development, you can:
1. Use Python 3.11 or 3.12 instead of 3.13
2. Or implement WebSocket functionality using alternative libraries like `websockets` or `socket.io`

## Dependencies

```
channels==4.0.0  # When available for Python 3.13
channels-redis==4.0.0
redis==5.0.1
```

## Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT tokens
2. **Authorization**: Users can only access their own data and authorized groups
3. **Rate Limiting**: Implement rate limiting for WebSocket messages
4. **Input Validation**: Validate all incoming WebSocket messages
5. **CORS**: Configure allowed origins for WebSocket connections

## Monitoring and Logging

- Log all WebSocket connections and disconnections
- Monitor message throughput and performance
- Track authentication failures
- Alert on unusual connection patterns

## Production Deployment

1. **Redis Configuration**: Use Redis Cluster for high availability
2. **Load Balancing**: Configure sticky sessions for WebSocket connections
3. **SSL/TLS**: Use secure WebSocket connections (wss://)
4. **Monitoring**: Set up monitoring for WebSocket performance
5. **Scaling**: Consider horizontal scaling with Redis pub/sub