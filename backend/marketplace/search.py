"""
Advanced search and recommendation engine for marketplace
"""
from django.db.models import Q, Count, Avg, F, Case, When, Value, IntegerField
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
import math

from .models import Product, Order, Review, Wishlist, Category


class ProductSearchEngine:
    """
    Advanced product search with ranking and filtering
    """
    
    def __init__(self, user=None):
        self.user = user
    
    def search(self, query, filters=None, sort_by='relevance', limit=50):
        """
        Perform advanced product search
        """
        queryset = Product.objects.filter(status='active')
        
        if query:
            # Text search with ranking
            queryset = self._apply_text_search(queryset, query)
        
        if filters:
            queryset = self._apply_filters(queryset, filters)
        
        # Apply sorting
        queryset = self._apply_sorting(queryset, sort_by, bool(query))
        
        return queryset[:limit]
    
    def _apply_text_search(self, queryset, query):
        """
        Apply text search with PostgreSQL full-text search or fallback to icontains
        """
        try:
            # Try PostgreSQL full-text search first
            search_vector = SearchVector('name', weight='A') + \
                          SearchVector('description', weight='B') + \
                          SearchVector('tags', weight='C')
            
            search_query = SearchQuery(query)
            
            queryset = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(search=search_query)
            
        except Exception:
            # Fallback to basic text search
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(tags__icontains=query) |
                Q(category__name__icontains=query)
            )
            
            # Add manual ranking based on field matches
            queryset = queryset.annotate(
                rank=Case(
                    When(name__icontains=query, then=Value(3)),
                    When(description__icontains=query, then=Value(2)),
                    When(tags__icontains=query, then=Value(1)),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
        
        return queryset
    
    def _apply_filters(self, queryset, filters):
        """
        Apply various filters to the queryset
        """
        # Category filter
        if filters.get('category'):
            category_ids = self._get_category_and_subcategories(filters['category'])
            queryset = queryset.filter(category_id__in=category_ids)
        
        # Price range
        if filters.get('price_min'):
            queryset = queryset.filter(price_per_unit__gte=filters['price_min'])
        if filters.get('price_max'):
            queryset = queryset.filter(price_per_unit__lte=filters['price_max'])
        
        # Location filter
        if filters.get('location'):
            queryset = self._apply_location_filter(queryset, filters['location'])
        
        # Quality grade
        if filters.get('quality_grade'):
            queryset = queryset.filter(quality_grade=filters['quality_grade'])
        
        # Organic certification
        if filters.get('organic_only'):
            queryset = queryset.filter(organic_certified=True)
        
        # Delivery options
        if filters.get('delivery_available'):
            queryset = queryset.filter(delivery_available=True)
        if filters.get('pickup_available'):
            queryset = queryset.filter(pickup_available=True)
        
        # Availability
        if filters.get('available_only', True):
            queryset = queryset.filter(
                quantity_available__gt=0
            ).exclude(
                expiry_date__lte=timezone.now().date()
            )
        
        # Rating filter
        if filters.get('min_rating'):
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).filter(avg_rating__gte=filters['min_rating'])
        
        return queryset
    
    def _get_category_and_subcategories(self, category_id):
        """
        Get category and all its subcategories
        """
        try:
            category = Category.objects.get(id=category_id)
            category_ids = [category.id]
            
            # Get all subcategories recursively
            def get_subcategories(cat):
                subcats = cat.subcategories.all()
                for subcat in subcats:
                    category_ids.append(subcat.id)
                    get_subcategories(subcat)
            
            get_subcategories(category)
            return category_ids
        except Category.DoesNotExist:
            return [category_id]
    
    def _apply_location_filter(self, queryset, location_data):
        """
        Apply location-based filtering
        """
        if isinstance(location_data, dict):
            # Radius-based search
            if 'latitude' in location_data and 'longitude' in location_data:
                # This would require PostGIS for proper implementation
                # For now, use simple text matching
                pass
        
        # Text-based location search
        if isinstance(location_data, str):
            queryset = queryset.filter(
                Q(location__icontains=location_data) |
                Q(seller__profile__city__icontains=location_data) |
                Q(seller__profile__state__icontains=location_data)
            )
        
        return queryset
    
    def _apply_sorting(self, queryset, sort_by, has_text_search=False):
        """
        Apply sorting to the queryset
        """
        if sort_by == 'relevance' and has_text_search:
            return queryset.order_by('-rank', '-created_at')
        elif sort_by == 'price_low':
            return queryset.order_by('price_per_unit')
        elif sort_by == 'price_high':
            return queryset.order_by('-price_per_unit')
        elif sort_by == 'newest':
            return queryset.order_by('-created_at')
        elif sort_by == 'oldest':
            return queryset.order_by('created_at')
        elif sort_by == 'rating':
            return queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).order_by('-avg_rating', '-created_at')
        elif sort_by == 'popular':
            return queryset.order_by('-view_count', '-created_at')
        else:
            return queryset.order_by('-created_at')
    
    def get_search_suggestions(self, query, limit=10):
        """
        Get search suggestions based on partial query
        """
        if len(query) < 2:
            return []
        
        suggestions = []
        
        # Product name suggestions
        products = Product.objects.filter(
            name__icontains=query,
            status='active'
        ).values_list('name', flat=True)[:5]
        suggestions.extend(products)
        
        # Category suggestions
        categories = Category.objects.filter(
            name__icontains=query,
            is_active=True
        ).values_list('name', flat=True)[:3]
        suggestions.extend(categories)
        
        # Tag suggestions (if using tags)
        # This would need more sophisticated implementation
        
        return list(set(suggestions))[:limit]


class RecommendationEngine:
    """
    Product recommendation engine
    """
    
    def __init__(self, user=None):
        self.user = user
    
    def get_recommendations(self, product=None, limit=10):
        """
        Get product recommendations
        """
        if product:
            return self.get_similar_products(product, limit)
        elif self.user:
            return self.get_personalized_recommendations(limit)
        else:
            return self.get_popular_products(limit)
    
    def get_similar_products(self, product, limit=10):
        """
        Get products similar to the given product
        """
        # Start with products in the same category
        similar_products = Product.objects.filter(
            category=product.category,
            status='active'
        ).exclude(id=product.id)
        
        # Add scoring based on various factors
        similar_products = similar_products.annotate(
            similarity_score=Case(
                # Same seller gets lower score (diversity)
                When(seller=product.seller, then=Value(1)),
                # Similar price range gets higher score
                When(
                    price_per_unit__gte=product.price_per_unit * 0.8,
                    price_per_unit__lte=product.price_per_unit * 1.2,
                    then=Value(3)
                ),
                # Same quality grade gets higher score
                When(quality_grade=product.quality_grade, then=Value(2)),
                default=Value(1),
                output_field=IntegerField()
            )
        ).order_by('-similarity_score', '-view_count')
        
        return similar_products[:limit]
    
    def get_personalized_recommendations(self, limit=10):
        """
        Get personalized recommendations for the user
        """
        if not self.user:
            return self.get_popular_products(limit)
        
        recommendations = []
        
        # 1. Based on purchase history
        purchased_categories = self._get_user_purchased_categories()
        if purchased_categories:
            category_products = Product.objects.filter(
                category__in=purchased_categories,
                status='active'
            ).exclude(
                order_items__order__buyer=self.user
            ).annotate(
                avg_rating=Avg('reviews__rating')
            ).order_by('-avg_rating', '-view_count')[:limit//2]
            
            recommendations.extend(category_products)
        
        # 2. Based on wishlist
        wishlisted_categories = self._get_user_wishlisted_categories()
        if wishlisted_categories:
            wishlist_products = Product.objects.filter(
                category__in=wishlisted_categories,
                status='active'
            ).exclude(
                wishlisted_by__user=self.user
            ).exclude(
                order_items__order__buyer=self.user
            ).order_by('-view_count')[:limit//2]
            
            recommendations.extend(wishlist_products)
        
        # 3. Fill remaining with popular products
        if len(recommendations) < limit:
            popular = self.get_popular_products(limit - len(recommendations))
            recommendations.extend(popular)
        
        # Remove duplicates and return
        seen = set()
        unique_recommendations = []
        for product in recommendations:
            if product.id not in seen:
                seen.add(product.id)
                unique_recommendations.append(product)
        
        return unique_recommendations[:limit]
    
    def get_popular_products(self, limit=10):
        """
        Get popular products based on views, orders, and ratings
        """
        # Calculate popularity score
        popular_products = Product.objects.filter(
            status='active'
        ).annotate(
            order_count=Count('order_items'),
            avg_rating=Avg('reviews__rating'),
            popularity_score=(
                F('view_count') * 0.3 +
                F('order_count') * 0.5 +
                Case(
                    When(avg_rating__isnull=True, then=Value(0)),
                    default=F('avg_rating') * 20,
                    output_field=IntegerField()
                ) * 0.2
            )
        ).order_by('-popularity_score')
        
        return popular_products[:limit]
    
    def get_trending_products(self, limit=10, days=7):
        """
        Get trending products (popular in recent days)
        """
        since_date = timezone.now() - timedelta(days=days)
        
        trending = Product.objects.filter(
            status='active',
            created_at__gte=since_date
        ).annotate(
            recent_orders=Count(
                'order_items',
                filter=Q(order_items__created_at__gte=since_date)
            ),
            recent_views=F('view_count')  # This could be more sophisticated
        ).annotate(
            trending_score=F('recent_orders') * 2 + F('recent_views')
        ).order_by('-trending_score')
        
        return trending[:limit]
    
    def get_seasonal_recommendations(self, limit=10):
        """
        Get seasonal product recommendations
        """
        current_month = timezone.now().month
        
        # Define seasonal categories (this could be more sophisticated)
        seasonal_mapping = {
            # Dry season months
            (11, 12, 1, 2, 3): ['vegetables', 'grains'],
            # Wet season months
            (4, 5, 6, 7, 8, 9, 10): ['fruits', 'leafy_greens']
        }
        
        seasonal_categories = []
        for months, categories in seasonal_mapping.items():
            if current_month in months:
                seasonal_categories.extend(categories)
        
        if seasonal_categories:
            seasonal_products = Product.objects.filter(
                status='active',
                category__name__in=seasonal_categories
            ).order_by('-view_count')[:limit]
            
            return seasonal_products
        
        return self.get_popular_products(limit)
    
    def _get_user_purchased_categories(self):
        """
        Get categories of products the user has purchased
        """
        if not self.user:
            return []
        
        return Category.objects.filter(
            products__order_items__order__buyer=self.user,
            products__order_items__order__status__in=['completed', 'delivered']
        ).distinct()
    
    def _get_user_wishlisted_categories(self):
        """
        Get categories of products in user's wishlist
        """
        if not self.user:
            return []
        
        return Category.objects.filter(
            products__wishlisted_by__user=self.user
        ).distinct()


class MarketplaceAnalytics:
    """
    Analytics for marketplace insights
    """
    
    def get_search_analytics(self, days=30):
        """
        Get search analytics (would need search logging)
        """
        # This would require implementing search query logging
        pass
    
    def get_category_performance(self, days=30):
        """
        Get category performance metrics
        """
        since_date = timezone.now() - timedelta(days=days)
        
        category_stats = Category.objects.annotate(
            product_count=Count('products', filter=Q(products__status='active')),
            recent_orders=Count(
                'products__order_items',
                filter=Q(products__order_items__created_at__gte=since_date)
            ),
            total_revenue=Sum(
                'products__order_items__line_total',
                filter=Q(products__order_items__created_at__gte=since_date)
            ),
            avg_rating=Avg('products__reviews__rating')
        ).filter(product_count__gt=0).order_by('-recent_orders')
        
        return category_stats
    
    def get_seller_insights(self, seller, days=30):
        """
        Get insights for a specific seller
        """
        since_date = timezone.now() - timedelta(days=days)
        
        insights = {
            'total_products': seller.products.filter(status='active').count(),
            'total_views': seller.products.aggregate(
                total=Sum('view_count')
            )['total'] or 0,
            'recent_orders': Order.objects.filter(
                seller=seller,
                created_at__gte=since_date
            ).count(),
            'total_revenue': Order.objects.filter(
                seller=seller,
                created_at__gte=since_date,
                status__in=['completed', 'delivered']
            ).aggregate(
                total=Sum('total_amount')
            )['total'] or 0,
            'avg_rating': seller.reviews_received.aggregate(
                avg=Avg('rating')
            )['avg'],
            'top_products': seller.products.filter(
                status='active'
            ).order_by('-view_count')[:5]
        }
        
        return insights