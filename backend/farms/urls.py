"""
Farm management URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# ViewSets will be registered here as we create them

urlpatterns = [
    path('', include(router.urls)),
    # Additional custom endpoints will be added here
]