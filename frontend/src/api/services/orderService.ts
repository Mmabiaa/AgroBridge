/**
 * Order Service
 * Handles all order-related API calls
 */
import apiClient from '../axiosClient';

export interface CreateOrderRequest {
    product_id: string;
    quantity: number;
}

export interface CreateOrderResponse {
    id: string;
    order_number: string;
    product: {
        id: string;
        name: string;
        image_url: string | null;
        seller: {
            id: number;
            name: string;
        };
    };
    quantity: number;
    total_price: string;
    status: string;
    created_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    product: {
        id: string;
        name: string;
        image_url: string | null;
    };
    quantity: number;
    total_price: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    created_at: string;
    approved_at?: string;
    rejected_at?: string;
    cancelled_at?: string;
    rejection_reason?: string;
}

export interface MyOrdersResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Order[];
}

export interface UpdateOrderStatusRequest {
    status: 'approved' | 'rejected' | 'cancelled';
    rejection_reason?: string;
}

/**
 * Create a new order
 */
export const createOrder = async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post('/api/v1/marketplace/orders/', data);
    return response.data;
};

/**
 * Get customer's order history
 */
export const getMyOrders = async (params?: {
    status?: string;
    page?: number;
    page_size?: number;
}): Promise<MyOrdersResponse> => {
    const response = await apiClient.get('/api/v1/marketplace/orders/my-orders/', { params });
    return response.data;
};

/**
 * Update order status (approve/reject/cancel)
 */
export const updateOrderStatus = async (
    orderId: string,
    data: UpdateOrderStatusRequest
): Promise<Order> => {
    const response = await apiClient.patch(`/api/v1/marketplace/orders/${orderId}/`, data);
    return response.data;
};

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<Order> => {
    return updateOrderStatus(orderId, { status: 'cancelled' });
};

/**
 * Approve an order (seller action)
 */
export const approveOrder = async (orderId: string): Promise<Order> => {
    return updateOrderStatus(orderId, { status: 'approved' });
};

/**
 * Reject an order (seller action)
 */
export const rejectOrder = async (orderId: string, reason: string): Promise<Order> => {
    return updateOrderStatus(orderId, { status: 'rejected', rejection_reason: reason });
};
