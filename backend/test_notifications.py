"""
Test script to verify notification creation
Run with: python manage.py shell < test_notifications.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'agrobridge_backend.settings')
django.setup()

from marketplace.models import Order, Notification
from marketplace.services import NotificationService

# Get the most recent order
try:
    latest_order = Order.objects.latest('created_at')
    print(f"\n=== Latest Order ===")
    print(f"Order Number: {latest_order.order_number}")
    print(f"Buyer: {latest_order.buyer.username}")
    print(f"Seller: {latest_order.seller.username}")
    print(f"Status: {latest_order.status}")
    print(f"Created: {latest_order.created_at}")
    
    # Check notifications for this order
    notifications = Notification.objects.filter(related_order=latest_order)
    print(f"\n=== Notifications for this order ===")
    print(f"Total notifications: {notifications.count()}")
    
    for notif in notifications:
        print(f"\n- Type: {notif.type}")
        print(f"  Recipient: {notif.recipient.username}")
        print(f"  Message: {notif.message}")
        print(f"  Read: {notif.is_read}")
        print(f"  Timestamp: {notif.timestamp}")
    
    # Check all notifications for buyer and seller
    print(f"\n=== All Buyer Notifications ===")
    buyer_notifs = Notification.objects.filter(recipient=latest_order.buyer).order_by('-timestamp')[:5]
    for notif in buyer_notifs:
        print(f"- {notif.type}: {notif.message} (Read: {notif.is_read})")
    
    print(f"\n=== All Seller Notifications ===")
    seller_notifs = Notification.objects.filter(recipient=latest_order.seller).order_by('-timestamp')[:5]
    for notif in seller_notifs:
        print(f"- {notif.type}: {notif.message} (Read: {notif.is_read})")
    
    # Test creating a notification manually
    print(f"\n=== Testing Manual Notification Creation ===")
    try:
        test_notif = Notification.objects.create(
            recipient=latest_order.buyer,
            message="Test notification",
            type='order_placed',
            related_order=latest_order,
            is_read=False
        )
        print(f"✓ Test notification created successfully: {test_notif.id}")
        test_notif.delete()  # Clean up
        print(f"✓ Test notification deleted")
    except Exception as e:
        print(f"✗ Error creating test notification: {str(e)}")
    
except Order.DoesNotExist:
    print("No orders found in database")
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
