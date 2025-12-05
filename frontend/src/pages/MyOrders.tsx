/**
 * My Orders Page
 * Displays customer's order history with filtering and status tracking
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ShoppingBag,
    Package,
    CheckCircle,
    XCircle,
    Ban,
    Clock,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { getMyOrders, cancelOrder, Order } from '@/api/services/orderService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const MyOrders = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

    const pageSize = 20;

    useEffect(() => {
        fetchOrders();
    }, [statusFilter, currentPage]);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await getMyOrders({
                status: statusFilter || undefined,
                page: currentPage,
                page_size: pageSize,
            });

            setOrders(response.results);
            setTotalCount(response.count);
            setHasNext(!!response.next);
            setHasPrevious(!!response.previous);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast({
                title: 'Error',
                description: 'Failed to load orders. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        setCancellingOrderId(orderId);
        try {
            await cancelOrder(orderId);
            
            toast({
                title: 'Order Cancelled',
                description: 'Your order has been cancelled successfully.',
            });

            // Refresh orders
            fetchOrders();
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            
            const errorMessage = error.response?.data?.error || 'Failed to cancel order';
            toast({
                title: 'Cancellation Failed',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setCancellingOrderId(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'approved':
                return <CheckCircle className="h-4 w-4" />;
            case 'rejected':
                return <XCircle className="h-4 w-4" />;
            case 'cancelled':
                return <Ban className="h-4 w-4" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; className: string }> = {
            pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
            approved: { variant: 'default', className: 'bg-green-100 text-green-800' },
            rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
            cancelled: { variant: 'outline', className: 'bg-gray-100 text-gray-800' },
        };

        const config = variants[status] || variants.pending;

        return (
            <Badge variant={config.variant} className={config.className}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </Badge>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
        }).format(parseFloat(price));
    };

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                        <p className="text-muted-foreground">Please login to view your orders</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">My Orders</h1>
                <p className="text-muted-foreground">
                    Track and manage your order history
                </p>
            </div>

            {/* Filters */}
            <div className="mb-6 flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Orders" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Orders</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="text-sm text-muted-foreground">
                    {totalCount} {totalCount === 1 ? 'order' : 'orders'} found
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-20 bg-gray-200 rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && orders.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
                        <p className="text-muted-foreground mb-4">
                            {statusFilter
                                ? `You don't have any ${statusFilter} orders`
                                : "You haven't placed any orders yet"}
                        </p>
                        <Button onClick={() => (window.location.href = '/marketplace')}>
                            Browse Marketplace
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Orders List */}
            {!isLoading && orders.length > 0 && (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">
                                            Order #{order.order_number}
                                        </CardTitle>
                                        <CardDescription>
                                            Placed on {formatDate(order.created_at)}
                                        </CardDescription>
                                    </div>
                                    {getStatusBadge(order.status)}
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-4">
                                    {/* Product Info */}
                                    <div className="flex items-center gap-4">
                                        {order.product.image_url && (
                                            <img
                                                src={order.product.image_url}
                                                alt={order.product.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{order.product.name}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Quantity: {order.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">
                                                {formatPrice(order.total_price)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rejection Reason */}
                                    {order.status === 'rejected' && order.rejection_reason && (
                                        <div className="bg-red-50 border border-red-200 rounded p-3">
                                            <p className="text-sm font-medium text-red-800 mb-1">
                                                Rejection Reason:
                                            </p>
                                            <p className="text-sm text-red-700">
                                                {order.rejection_reason}
                                            </p>
                                        </div>
                                    )}

                                    {/* Status Timestamps */}
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        {order.approved_at && (
                                            <div>
                                                Approved: {formatDate(order.approved_at)}
                                            </div>
                                        )}
                                        {order.rejected_at && (
                                            <div>
                                                Rejected: {formatDate(order.rejected_at)}
                                            </div>
                                        )}
                                        {order.cancelled_at && (
                                            <div>
                                                Cancelled: {formatDate(order.cancelled_at)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {order.status === 'pending' && (
                                        <div className="flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCancelOrder(order.id)}
                                                disabled={cancellingOrderId === order.id}
                                            >
                                                {cancellingOrderId === order.id ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                                        Cancelling...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Ban className="h-4 w-4 mr-2" />
                                                        Cancel Order
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!isLoading && orders.length > 0 && (hasPrevious || hasNext) && (
                <div className="mt-6 flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => p - 1)}
                        disabled={!hasPrevious}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Page {currentPage}
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setCurrentPage((p) => p + 1)}
                        disabled={!hasNext}
                    >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default MyOrders;
