# Design Supplements - Additional Implementation Details

This document provides additional implementation details to complement the main design document.

## API Specifications (OpenAPI)

### Sample OpenAPI Specification for Marketplace Service

```yaml
openapi: 3.0.3
info:
  title: AgroBridge Marketplace API
  version: 1.0.0
  description: Marketplace service for agricultural products
  contact:
    name: API Support
    email: api@agrobridge.africa

servers:
  - url: https://api.agrobridge.africa/v1
    description: Production server
  - url: https://staging-api.agrobridge.africa/v1
    description: Staging server

security:
  - BearerAuth: []

paths:
  /marketplace/products:
    get:
      summary: List products
      tags: [Products]
      parameters:
        - name: category
          in: query
          schema:
            type: string
          description: Filter by category
        - name: min_price
          in: query
          schema:
            type: number
          description: Minimum price filter
        - name: max_price
          in: query
          schema:
            type: number
          description: Maximum price filter
        - name: cursor
          in: query
          schema:
            type: string
          description: Pagination cursor
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductListResponse'
        '401':
          $ref: '#/components/responses/Unauthorized'
    
    post:
      summary: Create product listing
      tags: [Products]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductCreate'
      responses:
        '201':
          description: Product created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/Unauthorized'

  /marketplace/products/{id}:
    get:
      summary: Get product details
      tags: [Products]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductResponse'
        '404':
          $ref: '#/components/responses/NotFound'
    
    put:
      summary: Update product
      tags: [Products]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProductUpdate'
      responses:
        '200':
          description: Product updated
        '403':
          $ref: '#/components/responses/Forbidden'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    ProductListResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: array
          items:
            $ref: '#/components/schemas/Product'
        pagination:
          $ref: '#/components/schemas/Pagination'
        meta:
          $ref: '#/components/schemas/Meta'
    
    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        price:
          type: number
          format: decimal
        currency:
          type: string
        quantity_available:
          type: number
        unit:
          type: string
        seller_id:
          type: string
          format: uuid
        images:
          type: array
          items:
            type: string
            format: uri
        created_at:
          type: string
          format: date-time
    
    ProductCreate:
      type: object
      required:
        - name
        - price
        - quantity_available
        - unit
      properties:
        name:
          type: string
          minLength: 3
          maxLength: 200
        description:
          type: string
        price:
          type: number
          minimum: 0
        quantity_available:
          type: number
          minimum: 0
        unit:
          type: string
        category:
          type: string
    
    Pagination:
      type: object
      properties:
        next:
          type: string
          nullable: true
        previous:
          type: string
          nullable: true
        total:
          type: integer
    
    Meta:
      type: object
      properties:
        timestamp:
          type: string
          format: date-time
        request_id:
          type: string
          format: uuid
  
  responses:
    Unauthorized:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    Forbidden:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    NotFound:
      description: Not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ValidationErrorResponse'
```

## Database Migration Strategy

### Alembic Migration Configuration

```python
# alembic/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os

# Import all models for autogenerate
from authentication.models import User, RefreshToken
from marketplace.models import Product, Order, Review
from farms.models import Farm, Field, Crop

config = context.config

# Set database URL from environment
config.set_main_option(
    'sqlalchemy.url',
    os.getenv('DATABASE_URL', 'postgresql://localhost/agrobridge')
)

fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_online():
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()
```

### Sample Migration with Partitioning

```python
# migrations/versions/001_create_sensor_readings_table.py
"""Create sensor readings table with partitioning

Revision ID: 001
Create Date: 2025-12-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None

def upgrade():
    # Create main table
    op.execute("""
        CREATE TABLE sensor_readings (
            id BIGSERIAL,
            device_id UUID NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            sensor_type VARCHAR(50) NOT NULL,
            value DECIMAL(10, 4) NOT NULL,
            unit VARCHAR(20) NOT NULL,
            quality VARCHAR(20) DEFAULT 'good',
            PRIMARY KEY (id, timestamp)
        ) PARTITION BY RANGE (timestamp);
    """)
    
    # Create indexes
    op.create_index(
        'ix_sensor_readings_device_timestamp',
        'sensor_readings',
        ['device_id', 'timestamp']
    )
    
    # Create partitions for current and next 12 months
    import datetime
    current_date = datetime.date.today()
    
    for i in range(12):
        month_start = current_date.replace(day=1) + datetime.timedelta(days=32*i)
        month_start = month_start.replace(day=1)
        month_end = (month_start + datetime.timedelta(days=32)).replace(day=1)
        
        partition_name = f"sensor_readings_y{month_start.year}m{month_start.month:02d}"
        
        op.execute(f"""
            CREATE TABLE {partition_name} PARTITION OF sensor_readings
            FOR VALUES FROM ('{month_start}') TO ('{month_end}');
        """)
        
        # Create indexes on partition
        op.create_index(
            f'ix_{partition_name}_device_id',
            partition_name,
            ['device_id']
        )

def downgrade():
    op.execute("DROP TABLE sensor_readings CASCADE;")
```


## Distributed Transaction Patterns

### Saga Pattern Implementation

```python
# sagas/order_saga.py
from enum import Enum
from dataclasses import dataclass
from typing import Callable, List
import logging

logger = logging.getLogger(__name__)

class SagaStepStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATED = "compensated"

@dataclass
class SagaStep:
    """Represents a single step in a saga"""
    name: str
    action: Callable
    compensation: Callable
    status: SagaStepStatus = SagaStepStatus.PENDING

class OrderCreationSaga:
    """Saga for creating an order across multiple services"""
    
    def __init__(self, order_data):
        self.order_data = order_data
        self.steps: List[SagaStep] = []
        self.context = {}
        
        # Define saga steps
        self.steps = [
            SagaStep(
                name="validate_product",
                action=self.validate_product,
                compensation=self.noop
            ),
            SagaStep(
                name="reserve_inventory",
                action=self.reserve_inventory,
                compensation=self.release_inventory
            ),
            SagaStep(
                name="process_payment",
                action=self.process_payment,
                compensation=self.refund_payment
            ),
            SagaStep(
                name="create_order",
                action=self.create_order,
                compensation=self.cancel_order
            ),
            SagaStep(
                name="send_notifications",
                action=self.send_notifications,
                compensation=self.noop
            ),
        ]
    
    def execute(self):
        """Execute the saga"""
        try:
            for step in self.steps:
                logger.info(f"Executing saga step: {step.name}")
                result = step.action()
                
                if not result:
                    raise Exception(f"Step {step.name} failed")
                
                step.status = SagaStepStatus.COMPLETED
                logger.info(f"Completed saga step: {step.name}")
            
            return True
            
        except Exception as e:
            logger.error(f"Saga failed: {str(e)}")
            self.compensate()
            raise
    
    def compensate(self):
        """Compensate for failed steps"""
        logger.info("Starting saga compensation")
        
        # Compensate in reverse order
        for step in reversed(self.steps):
            if step.status == SagaStepStatus.COMPLETED:
                try:
                    logger.info(f"Compensating step: {step.name}")
                    step.compensation()
                    step.status = SagaStepStatus.COMPENSATED
                except Exception as e:
                    logger.error(f"Compensation failed for {step.name}: {str(e)}")
    
    # Step implementations
    def validate_product(self):
        """Validate product exists and is available"""
        product = Product.objects.get(id=self.order_data['product_id'])
        if not product.is_active:
            return False
        self.context['product'] = product
        return True
    
    def reserve_inventory(self):
        """Reserve inventory for the order"""
        product = self.context['product']
        quantity = self.order_data['quantity']
        
        if product.quantity_available < quantity:
            return False
        
        # Reserve inventory
        product.quantity_available -= quantity
        product.save()
        
        self.context['inventory_reserved'] = quantity
        return True
    
    def release_inventory(self):
        """Release reserved inventory"""
        if 'inventory_reserved' in self.context:
            product = self.context['product']
            product.quantity_available += self.context['inventory_reserved']
            product.save()
    
    def process_payment(self):
        """Process payment"""
        # Call payment service
        payment_result = PaymentService.process_payment({
            'amount': self.order_data['total_amount'],
            'buyer_id': self.order_data['buyer_id'],
        })
        
        if not payment_result['success']:
            return False
        
        self.context['payment_id'] = payment_result['payment_id']
        return True
    
    def refund_payment(self):
        """Refund payment"""
        if 'payment_id' in self.context:
            PaymentService.refund_payment(self.context['payment_id'])
    
    def create_order(self):
        """Create order record"""
        order = Order.objects.create(**self.order_data)
        self.context['order'] = order
        return True
    
    def cancel_order(self):
        """Cancel order"""
        if 'order' in self.context:
            order = self.context['order']
            order.status = 'cancelled'
            order.save()
    
    def send_notifications(self):
        """Send notifications"""
        NotificationService.send_order_notification(
            self.context['order'].id
        )
        return True
    
    def noop(self):
        """No-op compensation"""
        pass
```

### Outbox Pattern for Reliable Messaging

```python
# outbox/pattern.py
from django.db import models, transaction
import uuid
import json

class OutboxMessage(models.Model):
    """Outbox pattern for reliable message delivery"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    aggregate_type = models.CharField(max_length=100)
    aggregate_id = models.UUIDField()
    event_type = models.CharField(max_length=100)
    payload = models.JSONField()
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    retry_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'outbox_messages'
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]

class OutboxPublisher:
    """Publish outbox messages to message queue"""
    
    @staticmethod
    @transaction.atomic
    def publish_event(aggregate_type, aggregate_id, event_type, payload):
        """Create outbox message within transaction"""
        OutboxMessage.objects.create(
            aggregate_type=aggregate_type,
            aggregate_id=aggregate_id,
            event_type=event_type,
            payload=payload
        )
    
    @staticmethod
    def process_outbox():
        """Process pending outbox messages"""
        pending_messages = OutboxMessage.objects.filter(
            status='pending'
        ).order_by('created_at')[:100]
        
        for message in pending_messages:
            try:
                # Publish to message queue
                publish_to_queue(
                    event_type=message.event_type,
                    payload=message.payload
                )
                
                # Mark as sent
                message.status = 'sent'
                message.sent_at = timezone.now()
                message.save()
                
            except Exception as e:
                logger.error(f"Failed to publish message {message.id}: {str(e)}")
                message.retry_count += 1
                
                if message.retry_count >= 3:
                    message.status = 'failed'
                
                message.save()

# Usage in service
class OrderService:
    @transaction.atomic
    def create_order(self, order_data):
        # Create order
        order = Order.objects.create(**order_data)
        
        # Publish event via outbox
        OutboxPublisher.publish_event(
            aggregate_type='Order',
            aggregate_id=order.id,
            event_type='order.created',
            payload={
                'order_id': str(order.id),
                'buyer_id': str(order.buyer_id),
                'seller_id': str(order.seller_id),
                'total_amount': float(order.total_amount),
            }
        )
        
        return order
```

## Data Privacy & GDPR Compliance

```python
# privacy/gdpr.py
from django.db import transaction
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class GDPRComplianceManager:
    """Manage GDPR compliance operations"""
    
    def __init__(self):
        self.data_retention_policies = {
            'user_profiles': timedelta(days=730),  # 2 years
            'transactions': timedelta(days=2555),  # 7 years (legal requirement)
            'sensor_data': timedelta(days=365),    # 1 year
            'chat_logs': timedelta(days=90),       # 3 months
            'audit_logs': timedelta(days=2555),    # 7 years
        }
    
    @transaction.atomic
    def process_erasure_request(self, user_id):
        """
        Process right to erasure (GDPR Article 17)
        Returns: dict with status and actions taken
        """
        actions_taken = []
        
        try:
            # 1. Anonymize user profile
            user = User.objects.get(id=user_id)
            user.email = f"deleted_{user_id}@anonymized.local"
            user.phone_number = None
            user.is_active = False
            user.save()
            actions_taken.append("User profile anonymized")
            
            # 2. Anonymize user profile data
            profile = UserProfile.objects.get(user_id=user_id)
            profile.first_name = "Deleted"
            profile.last_name = "User"
            profile.bio = None
            profile.avatar_url = None
            profile.save()
            actions_taken.append("Profile data anonymized")
            
            # 3. Delete non-essential data
            # Delete chat messages
            ChatMessage.objects.filter(user_id=user_id).delete()
            actions_taken.append("Chat messages deleted")
            
            # Delete notifications
            Notification.objects.filter(user_id=user_id).delete()
            actions_taken.append("Notifications deleted")
            
            # 4. Retain legally required data
            # Keep transaction records but anonymize personal details
            orders = Order.objects.filter(buyer_id=user_id)
            for order in orders:
                order.delivery_address = "REDACTED"
                order.delivery_notes = "REDACTED"
                order.save()
            actions_taken.append("Transaction records anonymized")
            
            # 5. Create audit log
            AuditLog.objects.create(
                event_type='gdpr_erasure',
                user_id=user_id,
                details={
                    'actions': actions_taken,
                    'timestamp': datetime.utcnow().isoformat(),
                }
            )
            
            # 6. Notify data processors
            self.notify_data_processors(user_id, 'erasure')
            actions_taken.append("Data processors notified")
            
            return {
                'success': True,
                'actions_taken': actions_taken,
                'timestamp': datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Erasure request failed for user {user_id}: {str(e)}")
            return {
                'success': False,
                'error': str(e),
            }
    
    def process_access_request(self, user_id):
        """
        Process right to access (GDPR Article 15)
        Returns: Complete user data package
        """
        data_package = {
            'request_date': datetime.utcnow().isoformat(),
            'user_id': str(user_id),
            'personal_data': {},
            'activity_data': {},
            'transaction_data': {},
        }
        
        try:
            # Collect personal data
            user = User.objects.get(id=user_id)
            profile = UserProfile.objects.get(user_id=user_id)
            
            data_package['personal_data'] = {
                'email': user.email,
                'phone': user.phone_number,
                'name': f"{profile.first_name} {profile.last_name}",
                'location': {
                    'country': profile.country,
                    'region': profile.region,
                    'city': profile.city,
                },
                'preferences': self.get_user_preferences(user_id),
            }
            
            # Collect activity data
            data_package['activity_data'] = {
                'farms': self.get_user_farms(user_id),
                'products': self.get_user_products(user_id),
                'posts': self.get_user_posts(user_id),
            }
            
            # Collect transaction data
            data_package['transaction_data'] = {
                'orders': self.get_user_orders(user_id),
                'financial_records': self.get_financial_records(user_id),
            }
            
            return data_package
            
        except Exception as e:
            logger.error(f"Access request failed for user {user_id}: {str(e)}")
            raise
    
    def apply_data_retention_policies(self):
        """Apply data retention policies"""
        for data_type, retention_period in self.data_retention_policies.items():
            cutoff_date = datetime.utcnow() - retention_period
            
            if data_type == 'sensor_data':
                # Delete old sensor readings
                deleted_count = SensorReading.objects.filter(
                    timestamp__lt=cutoff_date
                ).delete()[0]
                logger.info(f"Deleted {deleted_count} old sensor readings")
            
            elif data_type == 'chat_logs':
                # Delete old chat messages
                deleted_count = ChatMessage.objects.filter(
                    created_at__lt=cutoff_date
                ).delete()[0]
                logger.info(f"Deleted {deleted_count} old chat messages")
    
    def mask_sensitive_data(self, data, fields_to_mask):
        """Mask sensitive fields in data"""
        masked_data = data.copy()
        
        for field in fields_to_mask:
            if field in masked_data:
                if field == 'email':
                    masked_data[field] = self.mask_email(masked_data[field])
                elif field == 'phone':
                    masked_data[field] = self.mask_phone(masked_data[field])
                elif field == 'location':
                    masked_data[field] = self.generalize_location(masked_data[field])
        
        return masked_data
    
    @staticmethod
    def mask_email(email):
        """Mask email address"""
        if not email:
            return None
        parts = email.split('@')
        if len(parts) != 2:
            return '***@***.***'
        username = parts[0]
        domain = parts[1]
        masked_username = username[0] + '*' * (len(username) - 1)
        return f"{masked_username}@{domain}"
    
    @staticmethod
    def mask_phone(phone):
        """Mask phone number"""
        if not phone:
            return None
        return phone[:3] + '*' * (len(phone) - 6) + phone[-3:]
    
    @staticmethod
    def generalize_location(location):
        """Generalize location to region level"""
        return {
            'country': location.get('country'),
            'region': location.get('region'),
            # Remove city and precise coordinates
        }
```

