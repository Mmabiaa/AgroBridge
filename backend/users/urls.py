from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='user-service-health'),
    
    # Profile management
    path('profile/', views.user_profile, name='user-profile'),
    path('preferences/', views.user_preferences, name='user-preferences'),
    path('activities/', views.user_activities, name='user-activities'),
    path('upload-avatar/', views.upload_avatar, name='upload-avatar'),
    
    # User discovery
    path('search/', views.search_users, name='search-users'),
    path('public/<int:user_id>/', views.public_profile, name='public-profile'),
    
    # GDPR compliance
    path('export/request/', views.request_data_export, name='request-data-export'),
    path('export/requests/', views.export_requests, name='export-requests'),
    path('deletion/request/', views.request_data_deletion, name='request-data-deletion'),
    path('deletion/requests/', views.deletion_requests, name='deletion-requests'),
]