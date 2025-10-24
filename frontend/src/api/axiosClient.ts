
import axios, {
    AxiosInstance,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosError,
    InternalAxiosRequestConfig
} from 'axios';
import { defaultErrorHandler, defaultRetryInterceptor, ApiError as ErrorHandlerApiError } from './errorHandler';
import { notificationService } from './notificationService';

// Types for API responses
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    status: number;
}

export interface ClientApiError {
    message: string;
    status: number;
    code?: string;
    details?: any;
    timestamp: string;
}

// Extended request config with metadata
export interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
    metadata?: {
        startTime?: number;
        retryCount?: number;
        [key: string]: any;
    };
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Token management
class TokenManager {
    private static readonly ACCESS_TOKEN_KEY = 'access_token';
    private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

    static getAccessToken(): string | null {
        return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    }

    static getRefreshToken(): string | null {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    static setTokens(accessToken: string, refreshToken: string): void {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    static clearTokens(): void {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }

    static isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch {
            return true;
        }
    }
}

// Request/Response logging
class ApiLogger {
    private static isEnabled = import.meta.env.DEV;

    static logRequest(config: InternalAxiosRequestConfig): void {
        if (!this.isEnabled) return;

        console.group(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        console.log('Headers:', config.headers);
        if (config.data) {
            console.log('Data:', config.data);
        }
        if (config.params) {
            console.log('Params:', config.params);
        }
        console.groupEnd();
    }

    static logResponse(response: AxiosResponse): void {
        if (!this.isEnabled) return;

        console.group(`✅ API Response: ${response.status} ${response.config.url}`);
        console.log('Data:', response.data);
        console.log('Headers:', response.headers);
        console.groupEnd();
    }

    static logError(error: AxiosError): void {
        if (!this.isEnabled) return;

        console.group(`❌ API Error: ${error.config?.url}`);
        console.log('Status:', error.response?.status);
        console.log('Message:', error.message);
        console.log('Response:', error.response?.data);
        console.groupEnd();
    }
}


// Error handler - UPDATED VERSION
class ApiErrorHandler {
    static handleError(error: AxiosError): Promise<never> {
        const apiError: ClientApiError = {
            message: 'An unexpected error occurred',
            status: error.response?.status || 0,
            code: error.code || 'UNKNOWN_ERROR',
            details: error.response?.data,
            timestamp: new Date().toISOString()
        };

        // Handle specific error cases
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 400:
                    // For 400 errors, preserve the entire data object for field-level errors
                    apiError.message = (data as any)?.message || (data as any)?.error || 'Bad request. Please check your input.';
                    // Keep the full details for field-level validation errors
                    apiError.details = data;
                    break;
                case 401:
                    apiError.message = 'Authentication required. Please log in.';
                    // Clear tokens on authentication error
                    TokenManager.clearTokens();
                    // Redirect to login if needed
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                    break;
                case 403:
                    apiError.message = 'Access denied. You don\'t have permission for this action.';
                    break;
                case 404:
                    apiError.message = 'Resource not found.';
                    break;
                case 422:
                    apiError.message = (data as any)?.message || 'Validation error. Please check your input.';
                    apiError.details = data;
                    break;
                case 429:
                    apiError.message = 'Too many requests. Please try again later.';
                    break;
                case 500:
                    apiError.message = 'Server error. Please try again later.';
                    break;
                case 502:
                case 503:
                case 504:
                    apiError.message = 'Service temporarily unavailable. Please try again later.';
                    break;
                default:
                    apiError.message = (data as any)?.message || `Request failed with status ${status}`;
            }
        } else if (error.request) {
            apiError.message = 'Network error. Please check your connection.';
        }

        ApiLogger.logError(error);
        
        // Create a custom error object that preserves the response structure
        const customError: any = new Error(apiError.message);
        customError.response = {
            data: apiError.details,
            status: apiError.status
        };
        customError.code = apiError.code;
        
        return Promise.reject(customError);
    }
}

// Create axios instance
const axiosClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request interceptor
axiosClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add authentication token
        const token = TokenManager.getAccessToken();
        if (token && !TokenManager.isTokenExpired(token)) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp for performance monitoring
        (config as ExtendedAxiosRequestConfig).metadata = { startTime: Date.now() };

        // Log request
        ApiLogger.logRequest(config);

        return config;
    },
    (error: AxiosError) => {
        ApiLogger.logError(error);
        return Promise.reject(error);
    }
);

// Response interceptor - UPDATED VERSION
axiosClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Calculate request duration
        const duration = Date.now() - ((response.config as ExtendedAxiosRequestConfig).metadata?.startTime || 0);

        // Log response
        ApiLogger.logResponse(response);

        // Log performance warning for slow requests
        if (duration > 5000) {
            console.warn(`⚠️ Slow API request: ${response.config.url} took ${duration}ms`);
        }

        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle token refresh for 401 errors ONLY if it's not a login/register request
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Skip token refresh for auth endpoints
            const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                                  originalRequest.url?.includes('/auth/register');
            
            if (!isAuthEndpoint) {
                originalRequest._retry = true;

                const refreshToken = TokenManager.getRefreshToken();
                if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
                    try {
                        const response = await axios.post(
                            `${axiosClient.defaults.baseURL}/auth/refresh/`,
                            { refresh: refreshToken }
                        );

                        const { access, refresh: newRefresh } = response.data;
                        TokenManager.setTokens(access, newRefresh || refreshToken);

                        // Retry original request with new token
                        originalRequest.headers.Authorization = `Bearer ${access}`;
                        return axiosClient(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, clear tokens and redirect to login
                        TokenManager.clearTokens();
                        if (window.location.pathname !== '/login') {
                            window.location.href = '/login';
                        }
                    }
                }
            }
        }

        // For validation errors (400, 422), preserve the response data
        if (error.response?.status === 400 || error.response?.status === 422) {
            ApiLogger.logError(error);
            // Return the error with full response data intact
            return Promise.reject(error);
        }

        // Try retry interceptor for other errors
        try {
            return await defaultRetryInterceptor.createInterceptor()(error);
        } catch (retryError) {
            // If retry fails, handle error but DON'T show notification for validation errors
            const apiError = defaultErrorHandler.handleError(error);

            // Only show notification for non-validation errors
            if (error.response?.status !== 400 && error.response?.status !== 422) {
                notificationService.error('Request Failed', apiError.message, undefined, apiError.requestId);
            }

            return Promise.reject(error); // Return original error with response intact
        }
    }
);

// API client wrapper with additional methods
class ApiClient {
    private client: AxiosInstance;

    constructor(client: AxiosInstance) {
        this.client = client;
    }

    

    // Generic request method
    async request<T = any>(config: AxiosRequestConfig): Promise<T> {
        const response = await this.client.request<T>(config);
        return response.data;
    }

    // GET request
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    // POST request
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    // PUT request
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    // PATCH request
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    // DELETE request
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    // Upload file
    async uploadFile<T = any>(
        url: string,
        file: File,
        onUploadProgress?: (progressEvent: any) => void
    ): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await this.client.post<T>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress,
        });

        return response.data;
    }

    // Download file
    async downloadFile(url: string, filename?: string): Promise<void> {
        const response = await this.client.get(url, {
            responseType: 'blob',
        });

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    }

    // Get paginated data
    async getPaginated<T = any>(
        url: string,
        params?: Record<string, any>
    ): Promise<PaginatedResponse<T>> {
        const response = await this.client.get<PaginatedResponse<T>>(url, { params });
        return response.data;
    }

    // Health check
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return this.get('/health/');
    }

    // Set authentication tokens
    setTokens(accessToken: string, refreshToken: string): void {
        TokenManager.setTokens(accessToken, refreshToken);
    }

    // Clear authentication tokens
    clearTokens(): void {
        TokenManager.clearTokens();
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        const token = TokenManager.getAccessToken();
        return token !== null && !TokenManager.isTokenExpired(token);
    }

    // Get current user's token
    getAccessToken(): string | null {
        return TokenManager.getAccessToken();
    }
    
}

// Create and export API client instance
const apiClient = new ApiClient(axiosClient);

export default apiClient;
export { TokenManager, ApiLogger, ApiErrorHandler };
export type { InternalAxiosRequestConfig };
