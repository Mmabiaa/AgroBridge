"""
Marketplace API URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Register ViewSets with explicit basename where needed
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'inquiries', views.InquiryViewSet, basename='inquiry')
router.register(r'wishlist', views.WishlistViewSet, basename='wishlist')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    # Include router URLs (provides all CRUD operations)
    path('', include(router.urls)),
    
    # Payment callback endpoint
    path('payment-callback/', views.PaymentCallbackView.as_view(), name='payment-callback'),
]