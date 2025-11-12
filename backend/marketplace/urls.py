"""
Marketplace API URLs
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from rest_framework.response import Response
from rest_framework.decorators import action

router = DefaultRouter()

# Register ViewSets with explicit basename where needed
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'orders', views.OrderViewSet, basename='order')
router.register(r'reviews', views.ReviewViewSet, basename='review')
router.register(r'inquiries', views.InquiryViewSet, basename='inquiry')
router.register(r'wishlist', views.WishlistViewSet, basename='wishlist')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

# Ensure the my_orders action is defined in the OrderViewSet
class OrderViewSet(views.OrderViewSet):
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        orders = self.queryset.filter(buyer=request.user)
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

urlpatterns = [
    # Specific paths first to avoid conflicts
    path('products/my-products/', views.ProductViewSet.as_view({'get': 'my_products'}), name='my-products'),
    path('orders/my-purchases/', views.OrderViewSet.as_view({'get': 'my_purchases'}), name='my-purchases'),
    path('orders/my-sales/', views.OrderViewSet.as_view({'get': 'my_sales'}), name='my-sales'),
    # Then include router URLs
    path('', include(router.urls)),
    path('orders/my-orders/', views.OrderViewSet.as_view({'get': 'my_orders'}), name='my-orders'),
    path('api/orders/', views.OrderCreateView.as_view(), name='order-create'),
]