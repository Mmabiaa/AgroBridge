/**
 * Order Button Component
 * Handles order creation with loading states and error handling
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder } from '@/api/services/orderService';
import { useToast } from '@/hooks/use-toast';

interface OrderButtonProps {
    productId: string;
    productName: string;
    price: number;
    availableQuantity: number;
    onOrderSuccess?: (order: any) => void;
    onOrderError?: (error: Error) => void;
}

export const OrderButton: React.FC<OrderButtonProps> = ({
    productId,
    productName,
    price,
    availableQuantity,
    onOrderSuccess,
    onOrderError,
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleOrder = async () => {
        if (!user) {
            toast({
                title: 'Login Required',
                description: 'Please login to place an order',
                variant: 'destructive',
            });
            return;
        }

        if (availableQuantity === 0) {
            toast({
                title: 'Out of Stock',
                description: 'This product is currently out of stock',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const order = await createOrder({
                product_id: productId,
                quantity: 1, // Default quantity for MVP
            });

            // Show success state
            setShowSuccess(true);
            
            toast({
                title: 'Order Placed Successfully!',
                description: `Your order for ${productName} has been placed. Order #${order.order_number}`,
            });

            // Call success callback
            if (onOrderSuccess) {
                onOrderSuccess(order);
            }

            // Reset success state after 2 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);

        } catch (error: any) {
            console.error('Error creating order:', error);

            // Extract error message
            let errorMessage = 'Failed to place order. Please try again.';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast({
                title: 'Order Failed',
                description: errorMessage,
                variant: 'destructive',
            });

            // Call error callback
            if (onOrderError) {
                onOrderError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show success state
    if (showSuccess) {
        return (
            <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                <CheckCircle className="h-4 w-4 mr-2" />
                Order Placed!
            </Button>
        );
    }

    // Show loading state
    if (isLoading) {
        return (
            <Button className="w-full" disabled>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Placing Order...
            </Button>
        );
    }

    // Show login prompt if not authenticated
    if (!user) {
        return (
            <Button className="w-full" variant="outline" onClick={handleOrder}>
                <User className="h-4 w-4 mr-2" />
                Login to Order
            </Button>
        );
    }

    // Show disabled state if out of stock
    if (availableQuantity === 0) {
        return (
            <Button className="w-full" disabled>
                Out of Stock
            </Button>
        );
    }

    // Show normal order button
    return (
        <Button className="w-full" onClick={handleOrder}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Order Now
        </Button>
    );
};

export default OrderButton;
