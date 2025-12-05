"""
Event type definitions for the event bus
"""

# User events
EVENT_USER_REGISTERED = 'user.registered'
EVENT_USER_VERIFIED = 'user.verified'
EVENT_USER_UPDATED = 'user.updated'
EVENT_USER_DELETED = 'user.deleted'

# Farm events
EVENT_FARM_CREATED = 'farm.created'
EVENT_FARM_UPDATED = 'farm.updated'
EVENT_CROP_PLANTED = 'crop.planted'
EVENT_CROP_HARVESTED = 'crop.harvested'

# Marketplace events
EVENT_PRODUCT_LISTED = 'product.listed'
EVENT_PRODUCT_UPDATED = 'product.updated'
EVENT_ORDER_PLACED = 'order.placed'
EVENT_ORDER_CONFIRMED = 'order.confirmed'
EVENT_ORDER_COMPLETED = 'order.completed'
EVENT_ORDER_CANCELLED = 'order.cancelled'

# Payment events
EVENT_PAYMENT_INITIATED = 'payment.initiated'
EVENT_PAYMENT_PROCESSED = 'payment.processed'
EVENT_PAYMENT_FAILED = 'payment.failed'
EVENT_PAYMENT_REFUNDED = 'payment.refunded'

# Notification events
EVENT_NOTIFICATION_CREATED = 'notification.created'
EVENT_NOTIFICATION_SENT = 'notification.sent'

# IoT events
EVENT_SENSOR_READING = 'sensor.reading'
EVENT_SENSOR_ALERT = 'sensor.alert'
EVENT_DEVICE_REGISTERED = 'device.registered'
EVENT_DEVICE_OFFLINE = 'device.offline'

# Disease detection events
EVENT_DISEASE_DETECTED = 'disease.detected'
EVENT_DISEASE_ANALYSIS_COMPLETE = 'disease.analysis_complete'

# Emergency events
EVENT_EMERGENCY_ALERT = 'emergency.alert'
EVENT_EMERGENCY_RESOLVED = 'emergency.resolved'
