"""
URL configuration for scheduling service
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'templates', views.TaskTemplateViewSet, basename='tasktemplate')
router.register(r'crop-calendars', views.CropCalendarViewSet, basename='cropcalendar')

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional endpoints for convenience (aliases to viewset actions)
    path('statistics/', views.TaskViewSet.as_view({'get': 'statistics'}), name='task-statistics'),
    path('suggestions/', views.TaskViewSet.as_view({'get': 'suggestions'}), name='task-suggestions'),
    path('categories/', views.TaskViewSet.as_view({'get': 'categories'}), name='task-categories'),
]
