"""
Serializers for marketplace models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count
from .models import (
    Category, Product, ProductImage, Order, OrderItem, 
    Review, Inquiry, Wishlist, Notification
)

User = get_user_model()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    order_number = serializers.CharField(source='related_order.order_number', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'message', 'type', 'is_read', 'timestamp', 'related_order', 'order_number']
        read_only_fields = ['id', 'timestamp', 'message', 'type', 'related_order']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    subcategories = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    full_path = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'description', 'parent', 'image', 'is_active',
            'sort_order', 'created_at', 'updated_at', 'subcategories',
            'product_count', 'full_path'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subcategories(self, obj):
        """Get subcategories"""
        if hasattr(obj, 'subcategories'):
            return CategorySerializer(obj.subcategories.filter(is_active=True), many=True).data
        return []
    
    def get_product_count(self, obj):
        """Get active product count"""
        return obj.products.filter(status='active').count()


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model"""
    
    class Meta:
        model = ProductImage
        fields = [
            'id', 'image', 'alt_text', 'is_primary', 'sort_order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    seller_rating = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_path = serializers.CharField(source='category.full_path', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_available = serializers.ReadOnlyField()
    total_value = serializers.ReadOnlyField()
    days_until_expiry = serializers.ReadOnlyField()
    is_wishlisted = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'category', 'price_per_unit', 'unit_type',
            'quantity_available', 'minimum_order', 'location', 'pickup_available',
            'delivery_available', 'delivery_radius_km', 'delivery_cost_per_km',
            'quality_grade', 'harvest_date', 'expiry_date', 'organic_certified',
            'certifications', 'status', 'is_featured', 'is_negotiable', 'slug',
            'tags', 'view_count', 'inquiry_count', 'created_at', 'updated_at',
            'published_at', 'seller_name', 'seller_rating', 'category_name',
            'category_path', 'images', 'average_rating', 'review_count',
            'is_available', 'total_value', 'days_until_expiry', 'is_wishlisted'
        ]
        read_only_fields = [
            'id', 'view_count', 'inquiry_count', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        """Create product with current user as seller"""
        validated_data['seller'] = self.context['request'].user
        return super().create(validated_data)
    
    def get_seller_rating(self, obj):
        """Get seller's average rating"""
        avg_rating = obj.seller.reviews_received.aggregate(
            avg_rating=Avg('rating')
        )['avg_rating']
        return round(avg_rating, 1) if avg_rating else None
    
    def get_average_rating(self, obj):
        """Get product's average rating"""
        avg_rating = obj.reviews.aggregate(
            avg_rating=Avg('rating')
        )['avg_rating']
        return round(avg_rating, 1) if avg_rating else None
    
    def get_review_count(self, obj):
        """Get product review count"""
        return obj.reviews.count()
    
    def get_is_wishlisted(self, obj):
        """Check if product is in user's wishlist"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.wishlisted_by.filter(user=request.user).exists()
        return False
    
    def validate_location(self, value):
        """Validate location data"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Location must be a valid JSON object")
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data.get('delivery_available') and not data.get('delivery_radius_km'):
            raise serializers.ValidationError(
                "Delivery radius is required when delivery is available"
            )
        
        if data.get('expiry_date') and data.get('harvest_date'):
            if data['expiry_date'] <= data['harvest_date']:
                raise serializers.ValidationError(
                    "Expiry date must be after harvest date"
                )
        
        return data


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product listings"""
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    primary_image = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    is_available = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price_per_unit', 'unit_type', 'quantity_available',
            'location', 'quality_grade', 'status', 'is_featured', 'created_at',
            'seller_name', 'category_name', 'primary_image', 'average_rating',
            'is_available'
        ]
    
    def get_primary_image(self, obj):
        """Get primary image URL"""
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image:
            return primary_image.image.url if primary_image.image else None
        return None
    
    def get_average_rating(self, obj):
        """Get product's average rating"""
        avg_rating = obj.reviews.aggregate(
            avg_rating=Avg('rating')
        )['avg_rating']
        return round(avg_rating, 1) if avg_rating else None


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for OrderItem model"""
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_name', 'unit_price', 'quantity',
            'unit_type', 'line_total', 'quality_grade', 'special_instructions',
            'created_at'
        ]
        read_only_fields = ['id', 'line_total', 'created_at']
    
    def validate(self, data):
        """Validate order item"""
        product = data.get('product')
        quantity = data.get('quantity')
        
        if product and quantity:
            # Check availability
            if not product.is_available:
                raise serializers.ValidationError("Product is not available")
            
            # Check quantity
            if quantity > product.quantity_available:
                raise serializers.ValidationError(
                    f"Only {product.quantity_available} {product.unit_type} available"
                )
            
            # Check minimum order
            if quantity < product.minimum_order:
                raise serializers.ValidationError(
                    f"Minimum order is {product.minimum_order} {product.unit_type}"
                )
        
        return data


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    can_be_cancelled = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_status', 'subtotal',
            'delivery_cost', 'tax_amount', 'total_amount', 'delivery_method',
            'delivery_address', 'delivery_date', 'delivery_notes', 'buyer_phone',
            'buyer_email', 'buyer_notes', 'seller_notes', 'internal_notes',
            'created_at', 'updated_at', 'confirmed_at', 'completed_at',
            'items', 'buyer_name', 'seller_name', 'can_be_cancelled', 'is_completed'
        ]
        read_only_fields = [
            'id', 'order_number', 'created_at', 'updated_at', 'confirmed_at', 'completed_at'
        ]
    
    def validate_delivery_address(self, value):
        """Validate delivery address"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Delivery address must be a valid JSON object")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model"""
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    seller_name = serializers.CharField(source='seller.username', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id', 'rating', 'title', 'comment', 'is_verified_purchase',
            'is_public', 'created_at', 'updated_at', 'reviewer_name',
            'product_name', 'seller_name'
        ]
        read_only_fields = [
            'id', 'is_verified_purchase', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        """Create review with current user as reviewer"""
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate_rating(self, value):
        """Validate rating value"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5")
        return value


class InquirySerializer(serializers.ModelSerializer):
    """Serializer for Inquiry model"""
    inquirer_name = serializers.CharField(source='inquirer.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Inquiry
        fields = [
            'id', 'subject', 'message', 'quantity_interested', 'contact_phone',
            'contact_email', 'status', 'created_at', 'updated_at',
            'inquirer_name', 'product_name'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Create inquiry with current user as inquirer"""
        validated_data['inquirer'] = self.context['request'].user
        return super().create(validated_data)


class WishlistSerializer(serializers.ModelSerializer):
    """Serializer for Wishlist model"""
    product_details = ProductListSerializer(source='product', read_only=True)
    
    class Meta:
        model = Wishlist
        fields = ['id', 'product', 'created_at', 'product_details']
        read_only_fields = ['id', 'created_at']
    
    def create(self, validated_data):
        """Create wishlist item with current user"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders"""
    items = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    delivery_method = serializers.ChoiceField(choices=Order.DELIVERY_METHOD_CHOICES)
    delivery_address = serializers.JSONField(required=False)
    delivery_notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    buyer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    buyer_email = serializers.EmailField(required=False, allow_blank=True)
    buyer_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    
    def validate_items(self, value):
        """Validate order items"""
        if not value:
            raise serializers.ValidationError("At least one item is required")
        
        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError(
                    "Each item must have product_id and quantity"
                )
        
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        if data['delivery_method'] == 'delivery' and not data.get('delivery_address'):
            raise serializers.ValidationError(
                "Delivery address is required for delivery orders"
            )
        
        return data