"""
Filters for marketplace models
"""
import django_filters
from django.db.models import Q
from .models import Product, Order, Review, Inquiry


class ProductFilter(django_filters.FilterSet):
    """Filter for Product model"""
    
    category = django_filters.UUIDFilter(field_name='category__id')
    seller = django_filters.UUIDFilter(field_name='seller__id')
    
    # Price filters
    price_min = django_filters.NumberFilter(field_name='price_per_unit', lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name='price_per_unit', lookup_expr='lte')
    
    # Quality and certification
    quality_grade = django_filters.ChoiceFilter(choices=Product.QUALITY_GRADES)
    organic_certified = django_filters.BooleanFilter()
    
    # Availability filters
    status = django_filters.ChoiceFilter(choices=Product.STATUS_CHOICES)
    is_featured = django_filters.BooleanFilter()
    is_negotiable = django_filters.BooleanFilter()
    pickup_available = django_filters.BooleanFilter()
    delivery_available = django_filters.BooleanFilter()
    
    # Date filters
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    harvest_after = django_filters.DateFilter(field_name='harvest_date', lookup_expr='gte')
    harvest_before = django_filters.DateFilter(field_name='harvest_date', lookup_expr='lte')
    
    # Location filters
    location_search = django_filters.CharFilter(method='filter_by_location')
    
    # Custom filters
    available_only = django_filters.BooleanFilter(method='filter_available_only')
    near_expiry = django_filters.BooleanFilter(method='filter_near_expiry')
    
    class Meta:
        model = Product
        fields = [
            'category', 'seller', 'price_min', 'price_max', 'quality_grade',
            'organic_certified', 'status', 'is_featured', 'is_negotiable',
            'pickup_available', 'delivery_available', 'created_after',
            'created_before', 'harvest_after', 'harvest_before',
            'location_search', 'available_only', 'near_expiry'
        ]
    
    def filter_by_location(self, queryset, name, value):
        """Filter products by location (city, region, etc.)"""
        if value:
            return queryset.filter(
                Q(location__icontains=value) |
                Q(seller__profile__city__icontains=value) |
                Q(seller__profile__state__icontains=value)
            )
        return queryset
    
    def filter_available_only(self, queryset, name, value):
        """Filter only available products"""
        if value:
            from django.utils import timezone
            return queryset.filter(
                status='active',
                quantity_available__gt=0
            ).exclude(
                expiry_date__lte=timezone.now().date()
            )
        return queryset
    
    def filter_near_expiry(self, queryset, name, value):
        """Filter products near expiry (within 7 days)"""
        if value:
            from django.utils import timezone
            from datetime import timedelta
            
            target_date = timezone.now().date() + timedelta(days=7)
            return queryset.filter(
                expiry_date__lte=target_date,
                expiry_date__gt=timezone.now().date()
            )
        return queryset


class OrderFilter(django_filters.FilterSet):
    """Filter for Order model"""
    
    status = django_filters.ChoiceFilter(choices=Order.STATUS_CHOICES)
    payment_status = django_filters.ChoiceFilter(choices=Order.PAYMENT_STATUS_CHOICES)
    delivery_method = django_filters.ChoiceFilter(choices=Order.DELIVERY_METHOD_CHOICES)
    
    # Amount filters
    total_min = django_filters.NumberFilter(field_name='total_amount', lookup_expr='gte')
    total_max = django_filters.NumberFilter(field_name='total_amount', lookup_expr='lte')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    delivery_after = django_filters.DateTimeFilter(field_name='delivery_date', lookup_expr='gte')
    delivery_before = django_filters.DateTimeFilter(field_name='delivery_date', lookup_expr='lte')
    
    # Custom filters
    pending_orders = django_filters.BooleanFilter(method='filter_pending_orders')
    completed_orders = django_filters.BooleanFilter(method='filter_completed_orders')
    
    class Meta:
        model = Order
        fields = [
            'status', 'payment_status', 'delivery_method', 'total_min', 'total_max',
            'created_after', 'created_before', 'delivery_after', 'delivery_before',
            'pending_orders', 'completed_orders'
        ]
    
    def filter_pending_orders(self, queryset, name, value):
        """Filter pending orders"""
        if value:
            return queryset.filter(status__in=['pending', 'confirmed', 'preparing'])
        return queryset
    
    def filter_completed_orders(self, queryset, name, value):
        """Filter completed orders"""
        if value:
            return queryset.filter(status__in=['completed', 'delivered'])
        return queryset


class ReviewFilter(django_filters.FilterSet):
    """Filter for Review model"""
    
    product = django_filters.UUIDFilter(field_name='product__id')
    seller = django_filters.UUIDFilter(field_name='seller__id')
    rating = django_filters.NumberFilter()
    rating_min = django_filters.NumberFilter(field_name='rating', lookup_expr='gte')
    rating_max = django_filters.NumberFilter(field_name='rating', lookup_expr='lte')
    
    # Verification filter
    verified_only = django_filters.BooleanFilter(field_name='is_verified_purchase')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Review
        fields = [
            'product', 'seller', 'rating', 'rating_min', 'rating_max',
            'verified_only', 'created_after', 'created_before'
        ]


class InquiryFilter(django_filters.FilterSet):
    """Filter for Inquiry model"""
    
    product = django_filters.UUIDFilter(field_name='product__id')
    status = django_filters.ChoiceFilter(choices=Inquiry.STATUS_CHOICES)
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    class Meta:
        model = Inquiry
        fields = ['product', 'status', 'created_after', 'created_before']