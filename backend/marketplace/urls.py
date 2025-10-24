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

urlpatterns = [
    path('', include(router.urls)),
    
    # Add explicit routes for the endpoints your frontend expects
    path('products/my-products/', views.ProductViewSet.as_view({'get': 'my_products'}), name='my-products'),
    path('orders/my-orders/', views.OrderViewSet.as_view({'get': 'my_purchases'}), name='my-orders'),
]