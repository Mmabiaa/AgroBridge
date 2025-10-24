export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    unit: string;
    quantity_available: number;
    is_active: boolean;
    status?: string;
    seller?: any;
    category?: any;
    images?: any[];
    created_at?: string;
    updated_at?: string;
}

export interface Order {
    id: string;
    product_name: string;
    quantity: number;
    unit: string;
    total_price: number;
    total_amount?: number;
    status: string;
    seller_name: string;
    created_at: string;
    buyer?: any;
    seller?: any;
    items?: any[];
}

export interface ProductCreateData {
    name: string;
    description: string;
    price: number;
    unit: string;
    quantity_available: number;
    category?: string;
    [key: string]: any;
}

export interface ProductUpdateData {
    name?: string;
    description?: string;
    price?: number;
    quantity_available?: number;
    is_active?: boolean;
    [key: string]: any;
}

export interface OrderCreateData {
    items: Array<{
        product_id: string;
        quantity: number;
        special_instructions?: string;
    }>;
    delivery_method?: string;
    delivery_address?: any;
    [key: string]: any;
}

export interface OrderUpdateData {
    status?: string;
    [key: string]: any;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface ProductListParams {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
    [key: string]: any;
}

export interface OrderListParams {
    status?: string;
    page?: number;
    limit?: number;
    [key: string]: any;
}