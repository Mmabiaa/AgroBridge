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
    
    # ✅ CORRECT - Add all three endpoints with proper mappings
    path('orders/my-orders/', views.OrderViewSet.as_view({'get': 'my_orders'}), name='my-orders'),
    path('orders/my-purchases/', views.OrderViewSet.as_view({'get': 'my_purchases'}), name='my-purchases'),
    path('orders/my-sales/', views.OrderViewSet.as_view({'get': 'my_sales'}), name='my-sales'),
    
    # Make sure these come BEFORE the router URLs to avoid conflicts
] + router.urls

# OR if you want to keep router.urls separate, make sure the specific paths come first:
# urlpatterns = [
#     # Specific paths first
#     path('products/my-products/', views.ProductViewSet.as_view({'get': 'my_products'}), name='my-products'),
#     path('orders/my-orders/', views.OrderViewSet.as_view({'get': 'my_orders'}), name='my-orders'),
#     path('orders/my-purchases/', views.OrderViewSet.as_view({'get': 'my_purchases'}), name='my-purchases'),
#     path('orders/my-sales/', views.OrderViewSet.as_view({'get': 'my_sales'}), name='my-sales'),
#     
#     # Then include router URLs
#     path('', include(router.urls)),
# ]