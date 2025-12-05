"""
Performance-Optimized Django Settings

This module provides performance-optimized settings for:
- Redis caching
- Database connection pooling
- CDN configuration
- Response compression
- Query optimization
"""

from datetime import timedelta

# ============================================================================
# CACHING CONFIGURATION
# ============================================================================

# Redis Cache Configuration
CACHES_REDIS = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'KEY_PREFIX': 'agrobridge',
        'TIMEOUT': 300,  # 5 minutes default
    },
    'sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'session',
        'TIMEOUT': 86400,  # 24 hours
    },
    'api': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/3',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'api',
        'TIMEOUT': 60,  # 1 minute
    },
}

# Fallback to local memory cache if Redis is not available
CACHES_FALLBACK = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'default-cache',
        'OPTIONS': {
            'MAX_ENTRIES': 10000,
        },
    },
    'sessions': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'session-cache',
    },
    'api': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'api-cache',
    },
}

# Redis Configuration
REDIS_HOST = '127.0.0.1'
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_PASSWORD = None

# ============================================================================
# DATABASE OPTIMIZATION
# ============================================================================

# Database Connection Pooling
DATABASE_POOL_CONFIG = {
    'CONN_MAX_AGE': 600,  # 10 minutes
    'CONN_HEALTH_CHECKS': True,
    'OPTIONS': {
        'connect_timeout': 10,
        'options': '-c statement_timeout=30000',  # 30 seconds
    },
}

# PostgreSQL Optimized Configuration
DATABASES_POSTGRESQL = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'agrobridge',
        'USER': 'agrobridge_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',
        },
    }
}

# ============================================================================
# CDN CONFIGURATION
# ============================================================================

# CDN Settings
CDN_ENABLED = False  # Set to True in production
CDN_DOMAIN = None  # e.g., 'd1234567890.cloudfront.net'
CDN_PROVIDER = None  # 'cloudfront' or 'cloudflare'
CDN_API_KEY = None

# Static Files CDN
STATIC_URL_CDN = '/static/'
MEDIA_URL_CDN = '/media/'

# Asset Versioning
ASSET_VERSION = 'v1'

# ============================================================================
# COMPRESSION CONFIGURATION
# ============================================================================

# GZip Middleware
MIDDLEWARE_COMPRESSION = [
    'django.middleware.gzip.GZipMiddleware',  # Add at the top
]

# Compression Settings
GZIP_COMPRESSION_LEVEL = 6
GZIP_MIN_LENGTH = 1024  # 1KB

# ============================================================================
# SESSION CONFIGURATION
# ============================================================================

# Use Redis for sessions
SESSION_ENGINE_REDIS = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'

# Session Settings
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = False
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True  # Set to True in production with HTTPS
SESSION_COOKIE_SAMESITE = 'Lax'

# ============================================================================
# REST FRAMEWORK OPTIMIZATION
# ============================================================================

REST_FRAMEWORK_OPTIMIZED = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.CursorPagination',
    'PAGE_SIZE': 20,
    'MAX_PAGE_SIZE': 100,
    
    # Throttling
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'burst': '60/minute',
    },
    
    # Rendering
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    
    # Parsing
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
    ],
    
    # Content Negotiation
    'DEFAULT_CONTENT_NEGOTIATION_CLASS': 'rest_framework.negotiation.DefaultContentNegotiation',
    
    # Metadata
    'DEFAULT_METADATA_CLASS': 'rest_framework.metadata.SimpleMetadata',
}

# ============================================================================
# QUERY OPTIMIZATION
# ============================================================================

# Database Query Logging (disable in production)
LOGGING_QUERIES = False

# Query Timeout
DATABASE_QUERY_TIMEOUT = 30  # seconds

# ============================================================================
# CHANNELS OPTIMIZATION (WebSocket)
# ============================================================================

# Redis Channel Layer
CHANNEL_LAYERS_REDIS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
            'capacity': 1500,
            'expiry': 10,
        },
    },
}

# Fallback In-Memory Channel Layer
CHANNEL_LAYERS_FALLBACK = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# ============================================================================
# FILE UPLOAD OPTIMIZATION
# ============================================================================

# File Upload Settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Temporary File Upload Handler
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

# ============================================================================
# SECURITY HEADERS
# ============================================================================

# Security Headers for Performance
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ============================================================================
# STATIC FILES OPTIMIZATION
# ============================================================================

# Static Files Storage
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# Static Files Finders
STATICFILES_FINDERS = [
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
]

# ============================================================================
# TEMPLATE OPTIMIZATION
# ============================================================================

# Template Caching
TEMPLATES_CACHED = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
            'loaders': [
                ('django.template.loaders.cached.Loader', [
                    'django.template.loaders.filesystem.Loader',
                    'django.template.loaders.app_directories.Loader',
                ]),
            ],
        },
    },
]

# ============================================================================
# CELERY OPTIMIZATION
# ============================================================================

# Celery Configuration
CELERY_BROKER_URL = 'redis://127.0.0.1:6379/4'
CELERY_RESULT_BACKEND = 'redis://127.0.0.1:6379/5'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# ============================================================================
# LOGGING OPTIMIZATION
# ============================================================================

LOGGING_OPTIMIZED = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/agrobridge.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Only log warnings and errors
            'propagate': False,
        },
    },
}

# ============================================================================
# PERFORMANCE MONITORING
# ============================================================================

# Enable performance monitoring
PERFORMANCE_MONITORING_ENABLED = True

# Response time thresholds (in seconds)
RESPONSE_TIME_WARNING = 1.0
RESPONSE_TIME_CRITICAL = 2.0

# Query count thresholds
QUERY_COUNT_WARNING = 10
QUERY_COUNT_CRITICAL = 20
