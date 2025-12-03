"""
Shared constants across all microservices
"""

# User types
USER_TYPE_FARMER = 'farmer'
USER_TYPE_POULTRY_KEEPER = 'poultry_keeper'
USER_TYPE_BUYER = 'buyer'
USER_TYPE_NGO = 'ngo'
USER_TYPE_GOVERNMENT = 'government'

USER_TYPES = [
    (USER_TYPE_FARMER, 'Farmer'),
    (USER_TYPE_POULTRY_KEEPER, 'Poultry Keeper'),
    (USER_TYPE_BUYER, 'Buyer'),
    (USER_TYPE_NGO, 'NGO'),
    (USER_TYPE_GOVERNMENT, 'Government'),
]

# Order statuses
ORDER_STATUS_PENDING = 'pending'
ORDER_STATUS_CONFIRMED = 'confirmed'
ORDER_STATUS_PROCESSING = 'processing'
ORDER_STATUS_SHIPPED = 'shipped'
ORDER_STATUS_DELIVERED = 'delivered'
ORDER_STATUS_CANCELLED = 'cancelled'
ORDER_STATUS_REFUNDED = 'refunded'

ORDER_STATUSES = [
    (ORDER_STATUS_PENDING, 'Pending'),
    (ORDER_STATUS_CONFIRMED, 'Confirmed'),
    (ORDER_STATUS_PROCESSING, 'Processing'),
    (ORDER_STATUS_SHIPPED, 'Shipped'),
    (ORDER_STATUS_DELIVERED, 'Delivered'),
    (ORDER_STATUS_CANCELLED, 'Cancelled'),
    (ORDER_STATUS_REFUNDED, 'Refunded'),
]

# Notification types
NOTIFICATION_TYPE_ORDER = 'order'
NOTIFICATION_TYPE_MESSAGE = 'message'
NOTIFICATION_TYPE_ALERT = 'alert'
NOTIFICATION_TYPE_SYSTEM = 'system'
NOTIFICATION_TYPE_EMERGENCY = 'emergency'

NOTIFICATION_TYPES = [
    (NOTIFICATION_TYPE_ORDER, 'Order'),
    (NOTIFICATION_TYPE_MESSAGE, 'Message'),
    (NOTIFICATION_TYPE_ALERT, 'Alert'),
    (NOTIFICATION_TYPE_SYSTEM, 'System'),
    (NOTIFICATION_TYPE_EMERGENCY, 'Emergency'),
]

# Priority levels
PRIORITY_LOW = 'low'
PRIORITY_MEDIUM = 'medium'
PRIORITY_HIGH = 'high'
PRIORITY_CRITICAL = 'critical'

PRIORITY_LEVELS = [
    (PRIORITY_LOW, 'Low'),
    (PRIORITY_MEDIUM, 'Medium'),
    (PRIORITY_HIGH, 'High'),
    (PRIORITY_CRITICAL, 'Critical'),
]

# Currencies
CURRENCY_USD = 'USD'
CURRENCY_NGN = 'NGN'
CURRENCY_GHS = 'GHS'
CURRENCY_KES = 'KES'
CURRENCY_ZAR = 'ZAR'

CURRENCIES = [
    (CURRENCY_USD, 'US Dollar'),
    (CURRENCY_NGN, 'Nigerian Naira'),
    (CURRENCY_GHS, 'Ghanaian Cedi'),
    (CURRENCY_KES, 'Kenyan Shilling'),
    (CURRENCY_ZAR, 'South African Rand'),
]

# Languages
LANGUAGE_EN = 'en'
LANGUAGE_TWI = 'tw'
LANGUAGE_HAUSA = 'ha'
LANGUAGE_SWAHILI = 'sw'
LANGUAGE_YORUBA = 'yo'

LANGUAGES = [
    (LANGUAGE_EN, 'English'),
    (LANGUAGE_TWI, 'Twi'),
    (LANGUAGE_HAUSA, 'Hausa'),
    (LANGUAGE_SWAHILI, 'Swahili'),
    (LANGUAGE_YORUBA, 'Yoruba'),
]
