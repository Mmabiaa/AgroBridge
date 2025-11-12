from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid

User = get_user_model()


class Category(models.Model):
    """
    Product categories for marketplace organization
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='subcategories'
    )
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['parent']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} > {self.name}"
        return self.name
    
    @property
    def full_path(self):
        """Get full category path"""
        if self.parent:
            return f"{self.parent.full_path} > {self.name}"
        return self.name


class Product(models.Model):
    """
    Products available in the marketplace
    """
    UNIT_CHOICES = [
        ('kg', 'Kilogram'),
        ('g', 'Gram'),
        ('lb', 'Pound'),
        ('ton', 'Ton'),
        ('piece', 'Piece'),
        ('dozen', 'Dozen'),
        ('bag', 'Bag'),
        ('box', 'Box'),
        ('crate', 'Crate'),
        ('liter', 'Liter'),
        ('gallon', 'Gallon'),
    ]
    
    QUALITY_GRADES = [
        ('premium', 'Premium'),
        ('grade_a', 'Grade A'),
        ('grade_b', 'Grade B'),
        ('standard', 'Standard'),
        ('organic', 'Organic Certified'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('sold_out', 'Sold Out'),
        ('inactive', 'Inactive'),
        ('expired', 'Expired'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    
    # Basic product information
    name = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    
    # Pricing and quantity
    price_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unit_type = models.CharField(max_length=20, choices=UNIT_CHOICES)
    quantity_available = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )
    minimum_order = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        default=Decimal('1'),
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Location and logistics
    location = models.JSONField(default=dict, help_text="Location details including coordinates")
    pickup_available = models.BooleanField(default=True)
    delivery_available = models.BooleanField(default=False)
    delivery_radius_km = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(1000)]
    )
    delivery_cost_per_km = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Quality and certification
    quality_grade = models.CharField(max_length=20, choices=QUALITY_GRADES, default='standard')
    harvest_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    organic_certified = models.BooleanField(default=False)
    certifications = models.JSONField(default=list, help_text="List of certifications")
    
    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(default=False)
    is_negotiable = models.BooleanField(default=False)
    
    # SEO and metadata
    slug = models.SlugField(max_length=250, blank=True)
    tags = models.JSONField(default=list, help_text="Search tags")
    
    # Statistics
    view_count = models.IntegerField(default=0)
    inquiry_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['seller']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['created_at']),
            models.Index(fields=['price_per_unit']),
            models.Index(fields=['location']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.seller.username}"
    
    @property
    def is_available(self):
        """Check if product is available for purchase"""
        return (
            self.status == 'active' and 
            self.quantity_available > 0 and
            (not self.expiry_date or self.expiry_date > timezone.now().date())
        )
    
    @property
    def total_value(self):
        """Calculate total value of available stock"""
        return self.price_per_unit * self.quantity_available
    
    @property
    def days_until_expiry(self):
        """Calculate days until expiry"""
        if not self.expiry_date:
            return None
        return (self.expiry_date - timezone.now().date()).days
    
    def increment_view_count(self):
        """Increment view count"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
    
    def increment_inquiry_count(self):
        """Increment inquiry count"""
        self.inquiry_count += 1
        self.save(update_fields=['inquiry_count'])


class ProductImage(models.Model):
    """
    Images for products
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['is_primary']),
        ]
    
    def __str__(self):
        return f"Image for {self.product.name}"


class Order(models.Model):
    """
    Orders placed by buyers
    """
    # Simplified status choices for MVP
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed'),
    ]
    
    DELIVERY_METHOD_CHOICES = [
        ('pickup', 'Pickup'),
        ('delivery', 'Delivery'),
        ('shipping', 'Shipping'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales')
    
    # Order details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    # Totals
    subtotal = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )
    delivery_cost = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    tax_amount = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Delivery information
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHOD_CHOICES)
    delivery_address = models.JSONField(default=dict)
    delivery_date = models.DateTimeField(null=True, blank=True)
    delivery_notes = models.TextField(blank=True)
    
    # Contact information
    buyer_phone = models.CharField(max_length=20, blank=True)
    buyer_email = models.EmailField(blank=True)
    
    # Notes and communication
    buyer_notes = models.TextField(blank=True)
    seller_notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # New status transition timestamps
    approved_at = models.DateTimeField(null=True, blank=True)
    rejected_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['buyer', 'status']),  # Combined index for my-orders queries
            models.Index(fields=['seller', 'status']),  # Combined index for seller order queries
            models.Index(fields=['status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['order_number']),
        ]
    
    def __str__(self):
        return f"Order {self.order_number} - {self.buyer.username}"
    
    def save(self, *args, **kwargs):
        """Generate order number if not provided"""
        if not self.order_number:
            self.order_number = self.generate_order_number()
        super().save(*args, **kwargs)
    
    def generate_order_number(self):
        """Generate unique order number"""
        import random
        import string
        
        while True:
            number = ''.join(random.choices(string.digits, k=8))
            order_number = f"ORD{number}"
            if not Order.objects.filter(order_number=order_number).exists():
                return order_number
    
    def can_transition_to(self, new_status):
        """
        Validate if status transition is allowed
        
        Valid transitions:
        - pending -> approved, rejected, cancelled
        - approved -> cancelled (if allowed by business rules)
        - rejected -> (no transitions)
        - cancelled -> (no transitions)
        """
        current = self.status
        
        # Define valid transitions
        valid_transitions = {
            'pending': ['approved', 'rejected', 'cancelled'],
            'approved': ['cancelled'],  # Can be cancelled if needed
            'rejected': [],  # Terminal state
            'cancelled': [],  # Terminal state
        }
        
        return new_status in valid_transitions.get(current, [])
    
    def transition_to(self, new_status, user, reason=''):
        """
        Perform status transition with validation and timestamp updates
        
        Args:
            new_status: Target status
            user: User performing the transition
            reason: Optional reason (required for rejection)
        
        Returns:
            bool: True if transition successful, False otherwise
        """
        if not self.can_transition_to(new_status):
            return False
        
        # Update status
        old_status = self.status
        self.status = new_status
        
        # Set appropriate timestamp
        now = timezone.now()
        if new_status == 'approved':
            self.approved_at = now
        elif new_status == 'rejected':
            self.rejected_at = now
            self.rejection_reason = reason
        elif new_status == 'cancelled':
            self.cancelled_at = now
        
        self.save()
        
        # Trigger notification (will be implemented in NotificationService)
        # This will be called from the view layer
        
        return True
    
    @property
    def can_be_cancelled(self):
        """Check if order can be cancelled"""
        return self.status in ['pending', 'approved']
    
    @property
    def is_completed(self):
        """Check if order is completed"""
        return self.status == 'approved'  # In simplified model, approved means completed


class OrderItem(models.Model):
    """
    Individual items in an order
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='order_items')
    
    # Item details (snapshot at time of order)
    product_name = models.CharField(max_length=200)
    unit_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    quantity = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unit_type = models.CharField(max_length=20)
    
    # Calculated fields
    line_total = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Quality and notes
    quality_grade = models.CharField(max_length=20, blank=True)
    special_instructions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['product']),
        ]
    
    def __str__(self):
        return f"{self.quantity} {self.unit_type} of {self.product_name}"
    
    def save(self, *args, **kwargs):
        """Calculate line total"""
        self.line_total = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Review(models.Model):
    """
    Product and seller reviews
    """
    RATING_CHOICES = [
        (1, '1 Star'),
        (2, '2 Stars'),
        (3, '3 Stars'),
        (4, '4 Stars'),
        (5, '5 Stars'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True)
    
    # Review content
    rating = models.IntegerField(choices=RATING_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    
    # Review metadata
    is_verified_purchase = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['reviewer', 'product', 'order']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['seller']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        target = self.product.name if self.product else f"Seller {self.seller.username}"
        return f"{self.rating}-star review for {target}"


class Inquiry(models.Model):
    """
    Product inquiries from potential buyers
    """
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('responded', 'Responded'),
        ('closed', 'Closed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='inquiries')
    inquirer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='inquiries')
    
    # Inquiry details
    subject = models.CharField(max_length=200)
    message = models.TextField()
    quantity_interested = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Contact information
    contact_phone = models.CharField(max_length=20, blank=True)
    contact_email = models.EmailField(blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['inquirer']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Inquiry about {self.product.name} from {self.inquirer.username}"


class Wishlist(models.Model):
    """
    User wishlists for saving favorite products
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlists')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'product']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['product']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class Notification(models.Model):
    """
    User notifications for order events
    """
    NOTIFICATION_TYPES = [
        ('order_created', 'Order Created'),
        ('order_placed', 'Order Placed'),
        ('order_approved', 'Order Approved'),
        ('order_rejected', 'Order Rejected'),
        ('order_cancelled', 'Order Cancelled'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES, default='order_created')
    related_order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='notifications')
    is_read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),  # For unread count queries
            models.Index(fields=['timestamp']),  # For chronological sorting
        ]

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message}"
