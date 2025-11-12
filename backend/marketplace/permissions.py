"""
Custom permissions for marketplace
"""
from rest_framework import permissions


class IsSellerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow sellers to edit their own products.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has permission to access the view
        """
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed for authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the specific object
        """
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the seller of the product
        return obj.seller == request.user or request.user.is_staff


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_permission(self, request, view):
        """
        Check if user has permission to access the view
        """
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions are only allowed for authenticated users
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the specific object
        """
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        if hasattr(obj, 'reviewer'):
            # For Review objects
            return obj.reviewer == request.user or request.user.is_staff
        elif hasattr(obj, 'inquirer'):
            # For Inquiry objects
            return obj.inquirer == request.user or request.user.is_staff
        elif hasattr(obj, 'user'):
            # For Wishlist objects
            return obj.user == request.user or request.user.is_staff
        elif hasattr(obj, 'buyer') and hasattr(obj, 'seller'):
            # For Order objects
            return (obj.buyer == request.user or 
                   obj.seller == request.user or 
                   request.user.is_staff)
        else:
            # Default to staff only
            return request.user.is_staff


class IsOrderParticipant(permissions.BasePermission):
    """
    Permission that allows access to order participants (buyer or seller)
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user is buyer or seller of the order
        """
        return (obj.buyer == request.user or 
               obj.seller == request.user or 
               request.user.is_staff)


class CanReviewProduct(permissions.BasePermission):
    """
    Permission that allows users to review products they have purchased
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user can review this product/seller
        """
        from .models import Order
        
        # Check if user has completed orders with this seller
        if hasattr(obj, 'seller'):
            # For product reviews
            has_purchased = Order.objects.filter(
                buyer=request.user,
                seller=obj.seller,
                status__in=['completed', 'delivered']
            ).exists()
            
            if hasattr(obj, 'product') and obj.product:
                # Also check if they bought this specific product
                has_purchased = has_purchased and Order.objects.filter(
                    buyer=request.user,
                    items__product=obj.product,
                    status__in=['completed', 'delivered']
                ).exists()
            
            return has_purchased or request.user.is_staff
        
        return request.user.is_staff


class IsProductSeller(permissions.BasePermission):
    """
    Permission that allows only the product seller to perform certain actions
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user is the seller of the product
        """
        if hasattr(obj, 'product'):
            # For inquiries, etc.
            return obj.product.seller == request.user or request.user.is_staff
        elif hasattr(obj, 'seller'):
            # For products, orders, etc.
            return obj.seller == request.user or request.user.is_staff
        
        return request.user.is_staff


c
lass OrderPermission(permissions.BasePermission):
    """
    Custom permission for order operations in the simplified workflow
    
    Rules:
    - Customers can create orders and view their own orders
    - Customers can cancel their own pending orders
    - Sellers can view orders for their products
    - Sellers can approve/reject orders for their products
    - Admins can do everything
    """
    
    def has_permission(self, request, view):
        """
        Check if user has permission to access the view
        """
        # All authenticated users can list/create orders
        if not request.user or not request.user.is_authenticated:
            return False
        
        # For create action, only customers (non-sellers in this context) can create
        # But we'll allow all authenticated users and validate in the view
        return True
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user has permission to access the specific order
        """
        user = request.user
        
        # Admins can do everything
        if user.is_staff:
            return True
        
        # GET requests - both buyer and seller can view
        if request.method == 'GET':
            return obj.buyer == user or obj.seller == user
        
        # PATCH/PUT requests - status updates
        if request.method in ['PATCH', 'PUT']:
            # Customers can cancel their own pending orders
            if obj.buyer == user:
                # Check if trying to cancel
                new_status = request.data.get('status')
                if new_status == 'cancelled' and obj.status == 'pending':
                    return True
                return False
            
            # Sellers can approve/reject orders for their products
            if obj.seller == user:
                new_status = request.data.get('status')
                if new_status in ['approved', 'rejected'] and obj.status == 'pending':
                    return True
                return False
        
        # DELETE requests - not allowed in this workflow
        if request.method == 'DELETE':
            return False
        
        return False
