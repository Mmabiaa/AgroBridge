from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('refresh/', views.refresh_token, name='refresh-token'),
    
    # User profile endpoints
    path('me/', views.get_current_user, name='current-user'),
    path('me/update/', views.update_user_profile, name='update-profile'),
    path('me/change-password/', views.change_password, name='change-password'),
    
    # Email verification and password reset
    path('verify-email/', views.verify_email, name='verify-email'),
    path('request-password-reset/', views.request_password_reset, name='request-password-reset'),
    path('reset-password/', views.reset_password, name='reset-password'),
]