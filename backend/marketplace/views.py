"""
Marketplace API views
"""
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from decimal import Decimal
import logging

from .models import (
    Category, Product, ProductImage, Order, OrderItem, 
    Review, Inquiry, Wishlist, Notification
)
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer,
    ProductImageSerializer, OrderSerializer, OrderItemSerializer,
    ReviewSerializer, InquirySerializer, WishlistSerializer,
    OrderCreateSerializer, NotificationSerializer
)
from .filters import ProductFilter, OrderFilter, ReviewFilter, InquiryFilter
from .permissions import IsSellerOrReadOnly, IsOwnerOrReadOnly
from .search import ProductSearchEngine, RecommendationEngine, MarketplaceAnalytics

logger = logging.getLogger(__name__)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'patch', 'head', 'options']  # No create/delete
    
    def get_queryset(self):
        """
        Get current user's notifications
        
        Query parameters:
        - is_read: Filter by read status (true/false)
        """
        queryset = Notification.objects.filter(
            recipient=self.request.user
        ).select_related('related_order').order_by('-timestamp')
        
        # Apply is_read filter if provided
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            is_read_bool = is_read.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_read=is_read_bool)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """
        List notifications with unread count
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Get unread count
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['unread_count'] = unread_count
            return response
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'unread_count': unread_count,
            'results': serializer.data
        })
    
    def partial_update(self, request, *args, **kwargs):
        """
        Mark notification as read
        """
        notification = self.get_object()
        
        is_read = request.data.get('is_read')
        if is_read is None:
            return Response(
                {'error': 'is_read field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        notification.is_read = bool(is_read)
        notification.save()
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        updated_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        
        return Response({
            'message': 'All notifications marked as read',
            'updated_count': updated_count
        })


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for product categories (read-only)
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'sort_order']
    ordering = ['sort_order', 'name']
    
    def list(self, request, *args, **kwargs):
        """Override list to add debugging"""
        print("=== CATEGORIES API ENDPOINT CALLED ===")
        print(f"User: {request.user}")
        print(f"Authenticated: {request.user.is_authenticated}")
        
        # Get the base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        print(f"Total categories in database: {Category.objects.count()}")
        print(f"Active categories: {queryset.count()}")
        
        # Log each category
        for category in queryset:
            print(f" - {category.id}: {category.name}")
        
        # Continue with normal list behavior
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            print(f"Returning {len(serializer.data)} categories in response")
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        print(f"Returning {len(serializer.data)} categories in response")
        return Response(serializer.data)
    
    def get_queryset(self):
        """Filter categories"""
        queryset = super().get_queryset()
        
        # Filter by parent category
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        elif parent_id == '':
            # Root categories only
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset.prefetch_related('subcategories')


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing products
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsSellerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'tags']
    ordering_fields = ['name', 'price_per_unit', 'created_at', 'view_count']
    ordering = ['-created_at']
    
    def get_permissions(self):
        """
        Allow anonymous access for read-only marketplace endpoints while
        requiring authentication for creating/updating/deleting resources
        and for user-specific endpoints.
        """
        public_actions = [
            'list',
            'retrieve',
            'featured',
            'search',
            'search_suggestions',
            'recommendations',
            'similar',
        ]
        if self.action in public_actions:
            return [AllowAny(), IsSellerOrReadOnly()]
        return [IsAuthenticated(), IsSellerOrReadOnly()]
    
    def perform_create(self, serializer):
        """Automatically set the seller to the current user"""
        serializer.save(seller=self.request.user)
    
    def get_queryset(self):
        """Filter products based on user and visibility"""
        user = self.request.user
        
        if self.action == 'list':
            # Public listing - only active products, exclude user's own products
            queryset = Product.objects.filter(status='active')
            
            # If user is authenticated, exclude their own products
            if user.is_authenticated:
                queryset = queryset.exclude(seller=user)
        else:
            # Detail view or user's own products
            if user.is_authenticated:
                queryset = Product.objects.filter(
                    Q(status='active') | Q(seller=user)
                )
            else:
                queryset = Product.objects.filter(status='active')
        
        return queryset.select_related('seller', 'category').prefetch_related('images', 'reviews')
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Increment view count when retrieving product details"""
        instance = self.get_object()
        
        # Increment view count (but not for the seller)
        if request.user != instance.seller:
            instance.increment_view_count()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_to_wishlist(self, request, pk=None):
        """Add product to user's wishlist"""
        product = self.get_object()
        
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )
        
        if created:
            return Response({'message': 'Product added to wishlist'})
        else:
            return Response(
                {'message': 'Product already in wishlist'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['delete'])
    def remove_from_wishlist(self, request, pk=None):
        """Remove product from user's wishlist"""
        product = self.get_object()
        
        try:
            wishlist_item = Wishlist.objects.get(user=request.user, product=product)
            wishlist_item.delete()
            return Response({'message': 'Product removed from wishlist'})
        except Wishlist.DoesNotExist:
            return Response(
                {'message': 'Product not in wishlist'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def create_inquiry(self, request, pk=None):
        """Create an inquiry for this product"""
        product = self.get_object()
        
        # Increment inquiry count
        product.increment_inquiry_count()
        
        serializer = InquirySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(product=product)
            
            logger.info(f"Inquiry created for product {product.name} by {request.user.username}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products"""
        queryset = self.get_queryset().filter(is_featured=True)[:10]
        serializer = ProductListSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_products(self, request):
        """Get current user's products"""
        queryset = Product.objects.filter(seller=request.user)
        
        # Apply filters
        filtered_queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Advanced product search"""
        query = request.query_params.get('q', '')
        
        # Extract filters from query parameters
        filters = {
            'category': request.query_params.get('category'),
            'price_min': request.query_params.get('price_min'),
            'price_max': request.query_params.get('price_max'),
            'location': request.query_params.get('location'),
            'quality_grade': request.query_params.get('quality_grade'),
            'organic_only': request.query_params.get('organic_only') == 'true',
            'delivery_available': request.query_params.get('delivery_available') == 'true',
            'pickup_available': request.query_params.get('pickup_available') == 'true',
            'available_only': request.query_params.get('available_only', 'true') == 'true',
            'min_rating': request.query_params.get('min_rating'),
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}
        
        sort_by = request.query_params.get('sort', 'relevance')
        limit = int(request.query_params.get('limit', 50))
        
        # Perform search
        search_engine = ProductSearchEngine(user=request.user)
        results = search_engine.search(query, filters, sort_by, limit)
        
        # Paginate results
        page = self.paginate_queryset(results)
        if page is not None:
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = ProductListSerializer(results, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_suggestions(self, request):
        """Get search suggestions based on query"""
        query = request.query_params.get('q', '')
        
        search_engine = ProductSearchEngine(user=request.user)
        suggestions = search_engine.get_search_suggestions(query)
        
        return Response(suggestions)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get product recommendations"""
        recommendation_type = request.query_params.get('type', 'personalized')
        limit = int(request.query_params.get('limit', 10))
        
        engine = RecommendationEngine(user=request.user)
        
        if recommendation_type == 'popular':
            products = engine.get_popular_products(limit)
        elif recommendation_type == 'trending':
            days = int(request.query_params.get('days', 7))
            products = engine.get_trending_products(limit, days)
        elif recommendation_type == 'seasonal':
            products = engine.get_seasonal_recommendations(limit)
        else:
            products = engine.get_personalized_recommendations(limit)
        
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def similar(self, request, pk=None):
        """Get products similar to this one"""
        product = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        
        engine = RecommendationEngine(user=request.user)
        similar_products = engine.get_similar_products(product, limit)
        
        serializer = ProductListSerializer(similar_products, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get marketplace analytics (admin only)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        days = int(request.query_params.get('days', 30))
        
        analytics = MarketplaceAnalytics()
        category_performance = analytics.get_category_performance(days)
        
        # Serialize category performance
        category_data = []
        for category in category_performance:
            category_data.append({
                'id': category.id,
                'name': category.name,
                'product_count': category.product_count,
                'recent_orders': category.recent_orders,
                'total_revenue': category.total_revenue or 0,
                'avg_rating': category.avg_rating
            })
        
        return Response({
            'category_performance': category_data,
            'period_days': days
        })
    
    @action(detail=False, methods=['get'])
    def seller_insights(self, request):
        """Get insights for current seller"""
        days = int(request.query_params.get('days', 30))
        
        analytics = MarketplaceAnalytics()
        insights = analytics.get_seller_insights(request.user, days)
        
        # Serialize top products
        top_products_serializer = ProductListSerializer(
            insights['top_products'], 
            many=True, 
            context={'request': request}
        )
        insights['top_products'] = top_products_serializer.data
        
        return Response(insights)

    @action(detail=False, methods=['get'], url_path='my-products')
    def my_products_alt(self, request):
        """Alternative endpoint for my-products"""
        return self.my_products(request)


class OrderCreateView(APIView):
    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)  # Default to 1
        user = request.user

        # Validate user authentication
        if not user.is_authenticated:
            return Response({'error': 'User not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

        # Validate product existence and stock
        try:
            product = Product.objects.get(id=product_id)
            # Check actual field names - might be 'quantity' instead of 'quantity_available'
            if hasattr(product, 'quantity_available') and product.quantity_available < quantity:
                return Response({'error': 'Product out of stock'}, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'error': 'Product does not exist'}, status=status.HTTP_404_NOT_FOUND)

        # Create Order - check actual field names
        order = Order.objects.create(
            buyer=user,
            seller=product.seller,  # Probably 'seller' not 'owner'
            status='PENDING',
            total_price=product.price_per_unit * quantity  # Probably 'price_per_unit' not 'price'
        )

        # Create Notification for the seller
        Notification.objects.create(
            recipient=product.seller,  # Probably 'seller' not 'owner'
            message=f"New order for {product.name} from {user.username}",
            type="ORDER_CREATED"
        )

        # Create a notification for the buyer
        Notification.objects.create(
            recipient=user,
            message=f"Your order for {product.name} has been placed.",
            type="ORDER_PLACED"
        )

        # Use proper serializer instead of .serialize()
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing orders
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = OrderFilter
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter orders based on user role"""
        user = self.request.user
        
        # Users can see orders where they are buyer or seller
        return Order.objects.filter(
            Q(buyer=user) | Q(seller=user)
        ).select_related('buyer', 'seller').prefetch_related('items__product')
    
    def create(self, request, *args, **kwargs):
        """
        Create a new order
        
        Validates:
        - Product exists and is active
        - Quantity is positive and available
        - Customer is not ordering their own product
        """
        from .services import NotificationService
        from django.db import transaction
        
        # Get product_id and quantity from request
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity')
        
        if not product_id or not quantity:
            return Response(
                {'error': 'product_id and quantity are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = Decimal(str(quantity))
            if quantity <= 0:
                return Response(
                    {'error': 'Quantity must be positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get product
        try:
            product = Product.objects.select_related('seller').get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate product is active
        if not product.is_available:
            return Response(
                {'error': 'Product is not available'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate customer is not ordering their own product
        if product.seller == request.user:
            return Response(
                {'error': 'Cannot order your own products'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate quantity available
        if quantity > product.quantity_available:
            return Response(
                {
                    'error': 'Insufficient stock',
                    'available_quantity': float(product.quantity_available),
                    'requested_quantity': float(quantity)
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create order with transaction
        try:
            with transaction.atomic():
                # Calculate totals
                unit_price = product.price_per_unit
                subtotal = unit_price * quantity
                delivery_cost = Decimal('0')  # Simplified for MVP
                tax_amount = Decimal('0')  # Simplified for MVP
                total_amount = subtotal + delivery_cost + tax_amount
                
                # Create order
                order = Order.objects.create(
                    buyer=request.user,
                    seller=product.seller,
                    status='pending',
                    payment_status='pending',
                    subtotal=subtotal,
                    delivery_cost=delivery_cost,
                    tax_amount=tax_amount,
                    total_amount=total_amount,
                    delivery_method='pickup',  # Default for MVP
                    delivery_address={}
                )
                
                # Create order item
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    unit_price=unit_price,
                    quantity=quantity,
                    unit_type=product.unit_type,
                    line_total=subtotal,
                    quality_grade=product.quality_grade
                )
                
                # Create notification for seller
                NotificationService.notify_order_created(order)
                
                logger.info(f"Order {order.order_number} created by {request.user.username}")
        
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return Response(
                {'error': 'Failed to create order. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Return order data with product details
        order_data = {
            'id': str(order.id),
            'order_number': order.order_number,
            'product': {
                'id': str(product.id),
                'name': product.name,
                'image_url': product.images.filter(is_primary=True).first().image.url if product.images.filter(is_primary=True).exists() else None,
                'seller': {
                    'id': product.seller.id,
                    'name': product.seller.username
                }
            },
            'quantity': float(quantity),
            'total_price': str(total_amount),
            'status': order.status,
            'created_at': order.created_at.isoformat()
        }
        
        return Response(order_data, status=status.HTTP_201_CREATED)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Update order status (approve/reject/cancel)
        
        Permissions:
        - Sellers can approve/reject pending orders for their products
        - Customers can cancel their own pending orders
        """
        from .services import NotificationService
        from django.db import transaction
        
        order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status transition
        if not order.can_transition_to(new_status):
            return Response(
                {
                    'error': 'Invalid status transition',
                    'current_status': order.status,
                    'requested_status': new_status,
                    'allowed_transitions': {
                        'pending': ['approved', 'rejected', 'cancelled'],
                        'approved': ['cancelled'],
                        'rejected': [],
                        'cancelled': []
                    }.get(order.status, [])
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Permission checks
        user = request.user
        
        if new_status == 'approved':
            # Only seller can approve
            if user != order.seller and not user.is_staff:
                return Response(
                    {'error': 'Only the seller can approve this order'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Perform transition
            try:
                with transaction.atomic():
                    order.transition_to('approved', user)
                    NotificationService.notify_order_approved(order)
                    logger.info(f"Order {order.order_number} approved by {user.username}")
            except Exception as e:
                logger.error(f"Error approving order: {str(e)}")
                return Response(
                    {'error': 'Failed to approve order'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            message = 'Order approved successfully. Customer has been notified.'
        
        elif new_status == 'rejected':
            # Only seller can reject
            if user != order.seller and not user.is_staff:
                return Response(
                    {'error': 'Only the seller can reject this order'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Rejection reason is required
            rejection_reason = request.data.get('rejection_reason', '')
            if not rejection_reason:
                return Response(
                    {'error': 'rejection_reason is required when rejecting an order'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Perform transition
            try:
                with transaction.atomic():
                    order.transition_to('rejected', user, reason=rejection_reason)
                    NotificationService.notify_order_rejected(order, rejection_reason)
                    logger.info(f"Order {order.order_number} rejected by {user.username}")
            except Exception as e:
                logger.error(f"Error rejecting order: {str(e)}")
                return Response(
                    {'error': 'Failed to reject order'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            message = 'Order rejected successfully. Customer has been notified.'
        
        elif new_status == 'cancelled':
            # Only buyer can cancel
            if user != order.buyer and not user.is_staff:
                return Response(
                    {'error': 'Only the customer can cancel this order'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Perform transition
            try:
                with transaction.atomic():
                    order.transition_to('cancelled', user)
                    NotificationService.notify_order_cancelled(order)
                    logger.info(f"Order {order.order_number} cancelled by {user.username}")
            except Exception as e:
                logger.error(f"Error cancelling order: {str(e)}")
                return Response(
                    {'error': 'Failed to cancel order'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            message = 'Order cancelled successfully. Seller has been notified.'
        
        else:
            return Response(
                {'error': f'Unsupported status: {new_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return updated order
        serializer = self.get_serializer(order)
        response_data = serializer.data
        response_data['message'] = message
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    def _create_order_with_items(self, buyer, validated_data):
        """Create order with items"""
        items_data = validated_data.pop('items')
        
        # Group items by seller
        sellers_items = {}
        for item_data in items_data:
            product = Product.objects.get(id=item_data['product_id'])
            
            # Additional validation - ensure product is available and not user's own
            if product.seller == buyer:
                raise ValueError("Cannot order your own product")
            
            if product.seller not in sellers_items:
                sellers_items[product.seller] = []
            
            sellers_items[product.seller].append({
                'product': product,
                'quantity': Decimal(str(item_data['quantity'])),
                'special_instructions': item_data.get('special_instructions', '')
            })
        
        # Create separate orders for each seller
        orders = []
        for seller, items in sellers_items.items():
            order = self._create_single_order(buyer, seller, items, validated_data)
            orders.append(order)
        
        # Return the first order (or could return all orders)
        return orders[0] if orders else None
    
    def _create_single_order(self, buyer, seller, items, order_data):
        """Create a single order for one seller"""
        # Calculate totals
        subtotal = Decimal('0')
        order_items = []
        
        for item in items:
            product = item['product']
            quantity = item['quantity']
            
            # Validate availability
            if not product.is_available or quantity > product.quantity_available:
                raise ValueError(f"Product {product.name} is not available in requested quantity")
            
            line_total = product.price_per_unit * quantity
            subtotal += line_total
            
            order_items.append({
                'product': product,
                'product_name': product.name,
                'unit_price': product.price_per_unit,
                'quantity': quantity,
                'unit_type': product.unit_type,
                'line_total': line_total,
                'quality_grade': product.quality_grade,
                'special_instructions': item['special_instructions']
            })
        
        # Calculate delivery cost (simplified)
        delivery_cost = Decimal('0')
        if order_data.get('delivery_method') == 'delivery':
            # This could be more sophisticated based on distance
            delivery_cost = Decimal('10.00')
        
        # Calculate tax (simplified)
        tax_amount = subtotal * Decimal('0.05')  # 5% tax
        
        total_amount = subtotal + delivery_cost + tax_amount
        
        # Create order
        order = Order.objects.create(
            buyer=buyer,
            seller=seller,
            subtotal=subtotal,
            delivery_cost=delivery_cost,
            tax_amount=tax_amount,
            total_amount=total_amount,
            delivery_method=order_data.get('delivery_method', 'pickup'),
            delivery_address=order_data.get('delivery_address', {}),
            delivery_notes=order_data.get('delivery_notes', ''),
            buyer_phone=order_data.get('buyer_phone', ''),
            buyer_email=order_data.get('buyer_email', ''),
            buyer_notes=order_data.get('buyer_notes', '')
        )
        
        # Create order items
        for item_data in order_items:
            OrderItem.objects.create(order=order, **item_data)
        
        # Update product quantities
        for item in items:
            product = item['product']
            product.quantity_available -= item['quantity']
            if product.quantity_available <= 0:
                product.status = 'sold_out'
            product.save()
        
        return order
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirm an order (seller action)"""
        order = self.get_object()
        
        # Only seller can confirm
        if request.user != order.seller:
            return Response(
                {'error': 'Only the seller can confirm this order'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if order.status != 'pending':
            return Response(
                {'error': 'Order cannot be confirmed in current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'confirmed'
        order.confirmed_at = timezone.now()
        order.save()
        
        logger.info(f"Order {order.order_number} confirmed by seller {request.user.username}")
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()
        
        # Check if order can be cancelled
        if not order.can_be_cancelled:
            return Response(
                {'error': 'Order cannot be cancelled in current status'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only buyer or seller can cancel
        if request.user not in [order.buyer, order.seller]:
            return Response(
                {'error': 'You do not have permission to cancel this order'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Restore product quantities
        for item in order.items.all():
            product = item.product
            product.quantity_available += item.quantity
            if product.status == 'sold_out':
                product.status = 'active'
            product.save()
        
        order.status = 'cancelled'
        order.save()
        
        logger.info(f"Order {order.order_number} cancelled by {request.user.username}")
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_purchases(self, request):
        """Get current user's purchases"""
        queryset = Order.objects.filter(buyer=request.user)
        
        filtered_queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_sales(self, request):
        """Get current user's sales"""
        queryset = Order.objects.filter(seller=request.user)
        
        filtered_queryset = self.filter_queryset(queryset)
        
        page = self.paginate_queryset(filtered_queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(filtered_queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """
        Get customer's order history
        
        Query parameters:
        - status: Filter by status (pending, approved, rejected, cancelled)
        - page: Page number for pagination
        - page_size: Items per page (default: 20, max: 100)
        """
        # Filter orders where user is the buyer (customer)
        queryset = Order.objects.filter(buyer=request.user).select_related(
            'seller', 'buyer'
        ).prefetch_related('items__product')
        
        # Apply status filter if provided
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Order by created_at descending (most recent first)
        queryset = queryset.order_by('-created_at')
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews
    """
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = ReviewFilter
    ordering_fields = ['rating', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter reviews"""
        return Review.objects.filter(is_public=True).select_related(
            'reviewer', 'product', 'seller', 'order'
        )
    
    def perform_create(self, serializer):
        """Create review with verification check"""
        product = serializer.validated_data.get('product')
        seller = serializer.validated_data.get('seller')
        
        # Check if user has purchased from this seller/product
        has_purchased = Order.objects.filter(
            buyer=self.request.user,
            seller=seller,
            status__in=['completed', 'delivered']
        ).exists()
        
        if product:
            has_purchased = has_purchased and Order.objects.filter(
                buyer=self.request.user,
                items__product=product,
                status__in=['completed', 'delivered']
            ).exists()
        
        serializer.save(
            reviewer=self.request.user,
            is_verified_purchase=has_purchased
        )


class WishlistViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user wishlists
    """
    queryset = Wishlist.objects.all()
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get current user's wishlist"""
        return Wishlist.objects.filter(user=self.request.user).select_related('product')


class InquiryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing product inquiries
    """
    queryset = Inquiry.objects.all()
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = InquiryFilter
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter inquiries based on user role"""
        user = self.request.user
        
        # Users can see inquiries they made or received
        return Inquiry.objects.filter(
            Q(inquirer=user) | Q(product__seller=user)
        ).select_related('inquirer', 'product')
    
    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """Respond to an inquiry (seller action)"""
        inquiry = self.get_object()
        
        # Only product seller can respond
        if request.user != inquiry.product.seller:
            return Response(
                {'error': 'Only the product seller can respond to this inquiry'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        inquiry.status = 'responded'
        inquiry.save()
        
        # Here you could also create a message/response system
        
        serializer = self.get_serializer(inquiry)
        return Response(serializer.data)