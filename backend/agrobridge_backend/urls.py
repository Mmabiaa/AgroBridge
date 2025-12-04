from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
    openapi.Info(
        title="AgroBridge API",
        default_version='v1',
        description="""
        Backend API for AgroBridge Agricultural Platform
        
        ## Authentication
        This API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:
        `Authorization: Bearer <your_token>`
        
        ## Rate Limiting
        - Anonymous users: 100 requests/hour
        - Authenticated users: 1000 requests/hour
        - Authentication endpoints: 5 requests/minute
        
        ## Error Handling
        All errors follow a consistent format with error codes, messages, and details.
        """,
        terms_of_service="https://agrobridge.com/terms/",
        contact=openapi.Contact(email="support@agrobridge.com"),
        license=openapi.License(name="Proprietary License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    patterns=[
        path('api/v1/', include([
            path('auth/', include('authentication.urls')),
            path('users/', include('users.urls')),
            path('farms/', include('farms.urls')),
            path('marketplace/', include('marketplace.urls')),
            path('ai/', include('ai_assistant.urls')),
            path('crop-detection/', include('crop_detection.urls')),
            path('iot/', include('iot_service.urls')),
            path('notifications/', include('notifications.urls')),
            path('financial/', include('financial.urls')),
            path('learning/', include('learning.urls')),
            path('community/', include('community.urls')),
            path('scheduling/', include('scheduling.urls')),
        ])),
    ],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 endpoints
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/users/', include('users.urls')),
    path('api/v1/farms/', include('farms.urls')),
    path('api/v1/marketplace/', include('marketplace.urls')),
    path('api/v1/ai/', include('ai_assistant.urls')),
    path('api/v1/crop-detection/', include('crop_detection.urls')),
    path('api/v1/iot/', include('iot_service.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/financial/', include('financial.urls')),
    path('api/v1/learning/', include('learning.urls')),
    path('api/v1/community/', include('community.urls')),
    path('api/v1/scheduling/', include('scheduling.urls')),
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Health check endpoint
    path('health/', include('agrobridge_backend.health_urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)