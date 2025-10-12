from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.user_profile, name='user-profile'),
    path('activities/', views.user_activities, name='user-activities'),
    path('public/<int:user_id>/', views.public_profile, name='public-profile'),
]