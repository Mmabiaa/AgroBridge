from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta
import uuid

from .models import Category, Product, ProductImage, Order, OrderItem, Review, Inquiry, Wishlist
from .search import ProductSearchEngine, RecommendationEngine

User = get_user_model()


class CategoryModelTest(TestCase):
    """Test Category model functionality"""
    
    def setUp(self):
        self.parent_category = Category.objects.create(
            name='Agriculture',
            description='Agricultural products'
        )
        
        self.child_category = Category.objects.create(
            name='Vegetables',
            description='Fresh vegetables',
            parent=self.parent_category
        )
    
    def test_create_category(self):
        """Test category creation"""
        category = Category.objects.create(
            name='Fruits',
            description='Fresh fruits'
        )
        
        self.assertEqual(category.name, 'Fruits')
        self.assertTrue(category.is_active)
        self.assertIsNone(category.parent)
    
    def test_category_hierarchy(self):
        """Test category parent-child relationship"""
        self.assertEqual(self.child_category.parent, self.parent_category)
        self.assertIn(self.child_category, self.parent_category.subcategories.all())
    
    def test_full_path_property(self):
        """Test full path property"""
        self.assertEqual(self.parent_category.full_path, 'Agriculture')
        self.assertEqual(self.child_category.full_path, 'Agriculture > Vegetables')


class ProductModelTest(TestCase):
    """Test Product model functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='seller1',
            email='seller1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.category = Category.objects.create(
            name='Vegetables',
            description='Fresh vegetables'
        )
        
        self.product_data = {
            'name': 'Fresh Tomatoes',
            'description': 'Organic fresh tomatoes',
            'category': self.category,
            'price_per_unit': Decimal('5.00'),
            'unit_type': 'kg',
            'quantity_available': Decimal('100.00'),
            'location': {'city': 'Accra', 'region': 'Greater Accra'},
            'quality_grade': 'premium',
            'harvest_date': date.today() - timedelta(days=1),
            'expiry_date': date.today() + timedelta(days=7),
            'status': 'active'
        }
    
    def test_create_product(self):
        """Test product creation"""
        product = Product.objects.create(seller=self.user, **self.product_data)
        
        self.assertEqual(product.name, 'Fresh Tomatoes')
        self.assertEqual(product.seller, self.user)
        self.assertEqual(product.category, self.category)
        self.assertTrue(product.is_available)
    
    def test_product_availability(self):
        """Test product availability logic"""
        product = Product.objects.create(seller=self.user, **self.product_data)
        
        # Active product with stock should be available
        self.assertTrue(product.is_available)
        
        # Out of stock product should not be available
        product.quantity_available = 0
        self.assertFalse(product.is_available)
        
        # Expired product should not be available
        product.quantity_available = 100
        product.expiry_date = date.today() - timedelta(days=1)
        self.assertFalse(product.is_available)
    
    def test_total_value_calculation(self):
        """Test total value calculation"""
        product = Product.objects.create(seller=self.user, **self.product_data)
        expected_value = product.price_per_unit * product.quantity_available
        self.assertEqual(product.total_value, expected_value)
    
    def test_days_until_expiry(self):
        """Test days until expiry calculation"""
        product = Product.objects.create(seller=self.user, **self.product_data)
        expected_days = (product.expiry_date - timezone.now().date()).days
        self.assertEqual(product.days_until_expiry, expected_days)


class OrderModelTest(TestCase):
    """Test Order model functionality"""
    
    def setUp(self):
        self.buyer = User.objects.create_user(
            username='buyer1',
            email='buyer1@test.com',
            password='testpass123',
            role='buyer'
        )
        
        self.seller = User.objects.create_user(
            username='seller1',
            email='seller1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.order_data = {
            'buyer': self.buyer,
            'seller': self.seller,
            'subtotal': Decimal('50.00'),
            'delivery_cost': Decimal('10.00'),
            'tax_amount': Decimal('3.00'),
            'total_amount': Decimal('63.00'),
            'delivery_method': 'delivery',
            'delivery_address': {'street': '123 Main St', 'city': 'Accra'}
        }
    
    def test_create_order(self):
        """Test order creation"""
        order = Order.objects.create(**self.order_data)
        
        self.assertEqual(order.buyer, self.buyer)
        self.assertEqual(order.seller, self.seller)
        self.assertEqual(order.status, 'pending')
        self.assertTrue(order.can_be_cancelled)
        self.assertIsNotNone(order.order_number)
    
    def test_order_number_generation(self):
        """Test unique order number generation"""
        order1 = Order.objects.create(**self.order_data)
        order2 = Order.objects.create(**self.order_data)
        
        self.assertNotEqual(order1.order_number, order2.order_number)
        self.assertTrue(order1.order_number.startswith('ORD'))
        self.assertTrue(order2.order_number.startswith('ORD'))
    
    def test_order_completion_status(self):
        """Test order completion status"""
        order = Order.objects.create(**self.order_data)
        
        # Pending order should not be completed
        self.assertFalse(order.is_completed)
        
        # Delivered order should be completed
        order.status = 'delivered'
        self.assertTrue(order.is_completed)


class ProductAPITest(APITestCase):
    """Test Product API endpoints"""
    
    def setUp(self):
        self.seller = User.objects.create_user(
            username='seller1',
            email='seller1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.buyer = User.objects.create_user(
            username='buyer1',
            email='buyer1@test.com',
            password='testpass123',
            role='buyer'
        )
        
        self.category = Category.objects.create(
            name='Vegetables',
            description='Fresh vegetables'
        )
        
        self.client = APIClient()
        
        self.product_data = {
            'name': 'Fresh Tomatoes',
            'description': 'Organic fresh tomatoes',
            'category': str(self.category.id),
            'price_per_unit': '5.00',
            'unit_type': 'kg',
            'quantity_available': '100.00',
            'location': {'city': 'Accra', 'region': 'Greater Accra'},
            'quality_grade': 'premium',
            'harvest_date': date.today().isoformat(),
            'expiry_date': (date.today() + timedelta(days=7)).isoformat(),
            'status': 'active'
        }
    
    def test_create_product_as_seller(self):
        """Test product creation by seller"""
        self.client.force_authenticate(user=self.seller)
        
        url = reverse('product-list')
        response = self.client.post(url, self.product_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        
        product = Product.objects.first()
        self.assertEqual(product.seller, self.seller)
        self.assertEqual(product.name, 'Fresh Tomatoes')
    
    def test_list_products(self):
        """Test listing products"""
        # Create a product
        product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name='Test Product',
            description='Test description',
            price_per_unit=Decimal('10.00'),
            unit_type='kg',
            quantity_available=Decimal('50.00'),
            status='active'
        )
        
        url = reverse('product-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Test Product')
    
    def test_product_search(self):
        """Test product search functionality"""
        # Create products
        Product.objects.create(
            seller=self.seller,
            category=self.category,
            name='Red Tomatoes',
            description='Fresh red tomatoes',
            price_per_unit=Decimal('5.00'),
            unit_type='kg',
            quantity_available=Decimal('100.00'),
            status='active'
        )
        
        Product.objects.create(
            seller=self.seller,
            category=self.category,
            name='Green Peppers',
            description='Fresh green peppers',
            price_per_unit=Decimal('8.00'),
            unit_type='kg',
            quantity_available=Decimal('50.00'),
            status='active'
        )
        
        url = reverse('product-search')
        response = self.client.get(url, {'q': 'tomatoes'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('tomatoes', response.data[0]['name'].lower())
    
    def test_add_to_wishlist(self):
        """Test adding product to wishlist"""
        self.client.force_authenticate(user=self.buyer)
        
        product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name='Test Product',
            description='Test description',
            price_per_unit=Decimal('10.00'),
            unit_type='kg',
            quantity_available=Decimal('50.00'),
            status='active'
        )
        
        url = reverse('product-add-to-wishlist', kwargs={'pk': product.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            Wishlist.objects.filter(user=self.buyer, product=product).exists()
        )
    
    def test_product_recommendations(self):
        """Test product recommendations"""
        # Create some products
        for i in range(5):
            Product.objects.create(
                seller=self.seller,
                category=self.category,
                name=f'Product {i}',
                description=f'Description {i}',
                price_per_unit=Decimal('10.00'),
                unit_type='kg',
                quantity_available=Decimal('50.00'),
                status='active'
            )
        
        url = reverse('product-recommendations')
        response = self.client.get(url, {'type': 'popular'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(response.data), 10)  # Default limit


class OrderAPITest(APITestCase):
    """Test Order API endpoints"""
    
    def setUp(self):
        self.buyer = User.objects.create_user(
            username='buyer1',
            email='buyer1@test.com',
            password='testpass123',
            role='buyer'
        )
        
        self.seller = User.objects.create_user(
            username='seller1',
            email='seller1@test.com',
            password='testpass123',
            role='farmer'
        )
        
        self.category = Category.objects.create(
            name='Vegetables',
            description='Fresh vegetables'
        )
        
        self.product = Product.objects.create(
            seller=self.seller,
            category=self.category,
            name='Test Product',
            description='Test description',
            price_per_unit=Decimal('10.00'),
            unit_type='kg',
            quantity_available=Decimal('100.00'),
            status='active'
        )
        
        self.client = APIClient()
    
    def test_create_order(self):
        """Test order creation"""
        self.client.force_authenticate(user=self.buyer)
        
        order_data = {
            'items': [
                {
                    'product_id': str(self.product.id),
                    'quantity': 5.0
                }
            ],
            'delivery_method': 'pickup',
            'buyer_notes': 'Please handle with care'
        }
        
        url = reverse('order-list')
        response = self.client.post(url, order_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Order.objects.count(), 1)
        
        order = Order.objects.first()
        self.assertEqual(order.buyer, self.buyer)
        self.assertEqual(order.seller, self.seller)
        self.assertEqual(order.items.count(), 1)
    
    def test_confirm_order_as_seller(self):
        """Test order confirmation by seller"""
        # Create an order
        order = Order.objects.create(
            buyer=self.buyer,
            seller=self.seller,
            subtotal=Decimal('50.00'),
            total_amount=Decimal('50.00'),
            delivery_method='pickup'
        )
        
        self.client.force_authenticate(user=self.seller)
        
        url = reverse('order-confirm', kwargs={'pk': order.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'confirmed')
        self.assertIsNotNone(order.confirmed_at)
    
    def test_cancel_order(self):
        """Test order cancellation"""
        # Create an order
        order = Order.objects.create(
            buyer=self.buyer,
            seller=self.seller,
            subtotal=Decimal('50.00'),
            total_amount=Decimal('50.00'),
            delivery_method='pickup'
        )
        
        self.client.force_authenticate(user=self.buyer)
        
        url = reverse('order-cancel', kwargs={'pk': order.id})
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        order.refresh_from_db()
        self.assertEqual(order.status, 'cancelled')


class SearchEngineTest(TestCase):
    """Test search engine functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        self.category = Category.objects.create(
            name='Vegetables',
            description='Fresh vegetables'
        )
        
        # Create test products
        self.products = []
        for i in range(5):
            product = Product.objects.create(
                seller=self.user,
                category=self.category,
                name=f'Product {i}',
                description=f'Description for product {i}',
                price_per_unit=Decimal(f'{10 + i}.00'),
                unit_type='kg',
                quantity_available=Decimal('50.00'),
                status='active'
            )
            self.products.append(product)
    
    def test_basic_search(self):
        """Test basic text search"""
        search_engine = ProductSearchEngine()
        results = search_engine.search('Product 1')
        
        self.assertGreater(len(results), 0)
        # Should find the product with "Product 1" in the name
        product_names = [p.name for p in results]
        self.assertIn('Product 1', product_names)
    
    def test_search_with_filters(self):
        """Test search with filters"""
        search_engine = ProductSearchEngine()
        
        filters = {
            'price_min': 12.00,
            'price_max': 15.00
        }
        
        results = search_engine.search('Product', filters=filters)
        
        # Should only return products within price range
        for product in results:
            self.assertGreaterEqual(product.price_per_unit, Decimal('12.00'))
            self.assertLessEqual(product.price_per_unit, Decimal('15.00'))
    
    def test_search_suggestions(self):
        """Test search suggestions"""
        search_engine = ProductSearchEngine()
        suggestions = search_engine.get_search_suggestions('Prod')
        
        self.assertGreater(len(suggestions), 0)
        # Should include product names that start with or contain 'Prod'
        for suggestion in suggestions:
            self.assertIn('prod', suggestion.lower())


class RecommendationEngineTest(TestCase):
    """Test recommendation engine functionality"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        
        self.category = Category.objects.create(
            name='Vegetables',
            description='Fresh vegetables'
        )
        
        # Create test products
        self.products = []
        for i in range(10):
            product = Product.objects.create(
                seller=self.user,
                category=self.category,
                name=f'Product {i}',
                description=f'Description for product {i}',
                price_per_unit=Decimal(f'{10 + i}.00'),
                unit_type='kg',
                quantity_available=Decimal('50.00'),
                status='active',
                view_count=i * 10  # Varying popularity
            )
            self.products.append(product)
    
    def test_popular_products(self):
        """Test popular products recommendation"""
        engine = RecommendationEngine()
        popular = engine.get_popular_products(5)
        
        self.assertEqual(len(popular), 5)
        # Should be ordered by popularity (view_count in this case)
        view_counts = [p.view_count for p in popular]
        self.assertEqual(view_counts, sorted(view_counts, reverse=True))
    
    def test_similar_products(self):
        """Test similar products recommendation"""
        engine = RecommendationEngine()
        base_product = self.products[0]
        
        similar = engine.get_similar_products(base_product, 3)
        
        self.assertLessEqual(len(similar), 3)
        # Should not include the base product itself
        similar_ids = [p.id for p in similar]
        self.assertNotIn(base_product.id, similar_ids)
        
        # Should be from the same category
        for product in similar:
            self.assertEqual(product.category, base_product.category)
    
    def test_personalized_recommendations(self):
        """Test personalized recommendations"""
        engine = RecommendationEngine(user=self.user)
        recommendations = engine.get_personalized_recommendations(5)
        
        self.assertLessEqual(len(recommendations), 5)
        # Should return some products
        self.assertGreater(len(recommendations), 0)
