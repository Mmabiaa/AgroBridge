# Design Document: Production-Ready Frontend for AgroBridge

## Overview

This document outlines the technical design for the AgroBridge frontend application, a production-ready React-based platform that integrates with 18 Django microservices. The design emphasizes scalability, maintainability, performance, security, and exceptional user experience across all devices and network conditions.

### Design Goals

1. **Seamless Backend Integration**: Connect all frontend features to real backend endpoints
2. **Type Safety**: Leverage TypeScript for compile-time error detection
3. **Performance**: Achieve sub-2-second page loads on 3G connections
4. **Scalability**: Support 100,000+ concurrent users
5. **Maintainability**: Enable rapid feature development with clear patterns
6. **Accessibility**: Meet WCAG 2.1 Level AA standards
7. **Offline-First**: Provide core functionality without internet
8. **Security**: Protect against common web vulnerabilities

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   React UI   │  │  Service     │  │   Local      │     │
│  │  Components  │◄─┤   Worker     │◄─┤   Storage    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                  │                                 │
│  ┌──────▼──────────────────▼────────┐                      │
│  │     State Management Layer        │                      │
│  │  (React Query + Context API)      │                      │
│  └──────┬────────────────────────────┘                      │
│         │                                                    │
│  ┌──────▼────────────────────────────┐                      │
│  │      API Integration Layer         │                      │
│  │  (Axios + Interceptors + MSW)      │                      │
│  └──────┬────────────────────────────┘                      │
└─────────┼──────────────────────────────────────────────────┘
          │
          │ HTTP/REST + WebSocket
          │
┌─────────▼──────────────────────────────────────────────────┐
│              Backend Services (Django)                       │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Farms │ Marketplace │ AI │ IoT │ ... (18 services) │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack


#### Core Technologies

- **Framework**: React 18.3+ with Concurrent Features
- **Language**: TypeScript 5.5+ (Strict Mode)
- **Build Tool**: Vite 5.4+ for fast builds and HMR
- **Routing**: React Router v6.26+ with lazy loading
- **State Management**: 
  - React Query 5.56+ for server state
  - Context API for global UI state
  - React Hook Form 7.53+ for form state
- **Styling**: 
  - Tailwind CSS 3.4+ for utility-first styling
  - Shadcn/ui for component library
  - CSS Modules for component-specific styles
- **HTTP Client**: Axios 1.10+ with interceptors
- **WebSocket**: Native WebSocket API with reconnection logic
- **Testing**:
  - Jest for unit tests
  - React Testing Library for component tests
  - Mock Service Worker (MSW) for API mocking
  - Playwright for E2E tests
- **Code Quality**:
  - ESLint with Airbnb config
  - Prettier for formatting
  - Husky for pre-commit hooks
  - TypeScript strict mode

#### Supporting Libraries

- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts 2.12+
- **Date Handling**: date-fns 3.6+
- **Animations**: Framer Motion 12.23+
- **Icons**: Lucide React 0.462+
- **Notifications**: Sonner for toast messages
- **File Upload**: React Dropzone
- **Image Optimization**: Sharp (build-time)
- **Internationalization**: i18next
- **Error Tracking**: Sentry SDK
- **Analytics**: Google Analytics 4 / Amplitude


## Components and Interfaces

### Directory Structure

```
frontend/
├── public/
│   ├── icons/
│   ├── images/
│   └── manifest.json
├── src/
│   ├── api/                      # API integration layer
│   │   ├── services/             # Service modules per microservice
│   │   │   ├── auth.service.ts
│   │   │   ├── farms.service.ts
│   │   │   ├── marketplace.service.ts
│   │   │   └── ... (18 services)
│   │   ├── hooks/                # React Query hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useFarms.ts
│   │   │   └── ...
│   │   ├── types/                # API response types
│   │   ├── axiosClient.ts        # Configured Axios instance
│   │   ├── config.ts             # API endpoints and config
│   │   ├── errorHandler.ts       # Error handling utilities
│   │   └── queryClient.ts        # React Query configuration
│   ├── components/               # UI components (Atomic Design)
│   │   ├── atoms/                # Basic building blocks
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Badge/
│   │   │   └── ...
│   │   ├── molecules/            # Simple component combinations
│   │   │   ├── FormField/
│   │   │   ├── Card/
│   │   │   ├── SearchBar/
│   │   │   └── ...
│   │   ├── organisms/            # Complex components
│   │   │   ├── Navigation/
│   │   │   ├── FarmCard/
│   │   │   ├── ProductGrid/
│   │   │   └── ...
│   │   ├── templates/            # Page layouts
│   │   │   ├── DashboardLayout/
│   │   │   ├── MarketplaceLayout/
│   │   │   └── ...
│   │   └── ui/                   # Shadcn/ui components
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── FeatureFlagsContext.tsx
│   ├── hooks/                    # Custom React hooks
│   │   ├── useDebounce.ts
│   │   ├── useIntersectionObserver.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useWebSocket.ts
│   │   └── ...
│   ├── lib/                      # Utility functions
│   │   ├── utils.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── pages/                    # Route components
│   │   ├── Dashboard/
│   │   ├── Marketplace/
│   │   ├── Farms/
│   │   └── ... (30+ pages)
│   ├── styles/                   # Global styles
│   │   ├── globals.css
│   │   ├── tokens.css            # Design tokens
│   │   └── themes.css
│   ├── types/                    # TypeScript types
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── common.ts
│   ├── utils/                    # Helper utilities
│   │   ├── auth.ts
│   │   ├── storage.ts
│   │   └── validation.ts
│   ├── App.tsx                   # Root component
│   ├── main.tsx                  # Entry point
│   └── vite-env.d.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── vite.config.ts
```


### Component Architecture Patterns

#### Atomic Design Implementation

**Atoms** - Basic UI elements
```typescript
// Button atom with variants
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// Input atom with validation states
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number';
  error?: string;
  touched?: boolean;
  onChange: (value: string) => void;
}
```

**Molecules** - Component combinations
```typescript
// FormField molecule combining Label + Input + Error
interface FormFieldProps {
  label: string;
  name: string;
  type: string;
  error?: string;
  required?: boolean;
}

// SearchBar molecule with debounced input
interface SearchBarProps {
  placeholder: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
}
```

**Organisms** - Complex feature components
```typescript
// ProductCard organism for marketplace
interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
  onFavorite: (id: string) => void;
  showActions?: boolean;
}

// FarmDashboard organism with multiple data sources
interface FarmDashboardProps {
  farmId: string;
  dateRange: DateRange;
}
```

### API Integration Layer

#### Service Architecture

Each backend microservice has a corresponding frontend service module:

```typescript
// Example: farms.service.ts
import { apiClient } from '../axiosClient';
import { Farm, Field, Crop, FarmStatistics } from '../types';

export const farmsService = {
  // List farms with pagination
  async listFarms(params?: { page?: number; limit?: number }) {
    const response = await apiClient.get<PaginatedResponse<Farm>>(
      '/api/v1/farms/',
      { params }
    );
    return response.data;
  },

  // Get farm details
  async getFarm(id: string) {
    const response = await apiClient.get<Farm>(`/api/v1/farms/${id}`);
    return response.data;
  },

  // Create farm
  async createFarm(data: CreateFarmDto) {
    const response = await apiClient.post<Farm>('/api/v1/farms/', data);
    return response.data;
  },

  // Update farm
  async updateFarm(id: string, data: UpdateFarmDto) {
    const response = await apiClient.put<Farm>(`/api/v1/farms/${id}`, data);
    return response.data;
  },

  // Delete farm
  async deleteFarm(id: string) {
    await apiClient.delete(`/api/v1/farms/${id}`);
  },

  // Get farm statistics
  async getFarmStatistics(id: string) {
    const response = await apiClient.get<FarmStatistics>(
      `/api/v1/farms/${id}/statistics`
    );
    return response.data;
  },

  // Field operations
  async listFields(farmId: string) {
    const response = await apiClient.get<Field[]>(
      `/api/v1/farms/${farmId}/fields`
    );
    return response.data;
  },

  async createField(farmId: string, data: CreateFieldDto) {
    const response = await apiClient.post<Field>(
      `/api/v1/farms/${farmId}/fields`,
      data
    );
    return response.data;
  },

  // Crop operations
  async listCrops(farmId: string) {
    const response = await apiClient.get<Crop[]>(
      `/api/v1/farms/${farmId}/crops`
    );
    return response.data;
  },

  async plantCrop(farmId: string, data: PlantCropDto) {
    const response = await apiClient.post<Crop>(
      `/api/v1/farms/${farmId}/crops`,
      data
    );
    return response.data;
  },
};
```

#### React Query Hooks

```typescript
// Example: useFarms.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmsService } from '../services/farms.service';

// Query keys for cache management
export const farmKeys = {
  all: ['farms'] as const,
  lists: () => [...farmKeys.all, 'list'] as const,
  list: (filters: string) => [...farmKeys.lists(), { filters }] as const,
  details: () => [...farmKeys.all, 'detail'] as const,
  detail: (id: string) => [...farmKeys.details(), id] as const,
  statistics: (id: string) => [...farmKeys.detail(id), 'statistics'] as const,
};

// List farms hook
export function useFarms(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: farmKeys.list(JSON.stringify(params)),
    queryFn: () => farmsService.listFarms(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get farm details hook
export function useFarm(id: string) {
  return useQuery({
    queryKey: farmKeys.detail(id),
    queryFn: () => farmsService.getFarm(id),
    enabled: !!id,
  });
}

// Create farm mutation
export function useCreateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: farmsService.createFarm,
    onSuccess: () => {
      // Invalidate and refetch farms list
      queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
    },
  });
}

// Update farm mutation with optimistic update
export function useUpdateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFarmDto }) =>
      farmsService.updateFarm(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: farmKeys.detail(id) });

      // Snapshot previous value
      const previousFarm = queryClient.getQueryData(farmKeys.detail(id));

      // Optimistically update
      queryClient.setQueryData(farmKeys.detail(id), (old: Farm) => ({
        ...old,
        ...data,
      }));

      return { previousFarm };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(farmKeys.detail(id), context?.previousFarm);
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: farmKeys.detail(id) });
    },
  });
}

// Delete farm mutation
export function useDeleteFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: farmsService.deleteFarm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: farmKeys.lists() });
    },
  });
}
```


## Data Models

### Core Type Definitions

```typescript
// User and Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  profile_completed: boolean;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'farmer' | 'buyer' | 'poultry_keeper' | 'expert' | 'ngo' | 'admin';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
}

// Farm Management
export interface Farm {
  id: string;
  name: string;
  description?: string;
  location: GeoLocation;
  area: number;
  area_unit: 'hectares' | 'acres';
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface Field {
  id: string;
  farm: string;
  name: string;
  area: number;
  soil_type?: string;
  coordinates: GeoLocation[];
  created_at: string;
}

export interface Crop {
  id: string;
  field: string;
  crop_type: string;
  variety?: string;
  planting_date: string;
  expected_harvest_date?: string;
  status: 'planted' | 'growing' | 'harvested';
  quantity?: number;
}

export interface FarmStatistics {
  total_area: number;
  active_fields: number;
  total_crops: number;
  yield_this_season: number;
  revenue_this_month: number;
  expenses_this_month: number;
}

// Marketplace
export interface Product {
  id: string;
  seller: User;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  unit: string;
  quantity_available: number;
  images: ProductImage[];
  location: GeoLocation;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
}

export interface Order {
  id: string;
  buyer: User;
  seller: User;
  product: Product;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  delivery_address: string;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'refunded';

// AI Assistant
export interface Conversation {
  id: string;
  user: string;
  title: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface Message {
  id: string;
  conversation: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  user: string;
  type: 'crop' | 'treatment' | 'market' | 'financial';
  title: string;
  description: string;
  confidence: number;
  is_active: boolean;
  created_at: string;
}

// IoT Devices
export interface IoTDevice {
  id: string;
  farm: string;
  name: string;
  device_type: 'sensor' | 'actuator' | 'camera';
  status: 'online' | 'offline' | 'error';
  battery_level?: number;
  last_seen: string;
  location?: GeoLocation;
  created_at: string;
}

export interface SensorData {
  id: string;
  device: string;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  light_intensity?: number;
  timestamp: string;
}

// Notifications
export interface Notification {
  id: string;
  user: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

// Financial
export interface FinancialRecord {
  id: string;
  user: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  categories: BudgetCategory[];
  start_date: string;
  end_date: string;
}

export interface BudgetCategory {
  name: string;
  allocated_amount: number;
  spent_amount: number;
}

// Common Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}
```


## Error Handling

### Error Handling Strategy

```typescript
// errorHandler.ts
import { AxiosError } from 'axios';
import { toast } from 'sonner';

export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AxiosError) {
      return this.handleAxiosError(error);
    }
    
    if (error instanceof Error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
    };
  }

  private static handleAxiosError(error: AxiosError): AppError {
    const statusCode = error.response?.status;
    const data = error.response?.data as any;

    // Network error
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      };
    }

    // Authentication errors
    if (statusCode === 401) {
      return {
        code: 'AUTH_ERROR',
        message: data?.message || 'Authentication required',
        statusCode,
      };
    }

    // Authorization errors
    if (statusCode === 403) {
      return {
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action',
        statusCode,
      };
    }

    // Validation errors
    if (statusCode === 400) {
      return {
        code: 'VALIDATION_ERROR',
        message: data?.message || 'Invalid input',
        statusCode,
        details: data?.details,
      };
    }

    // Not found
    if (statusCode === 404) {
      return {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        statusCode,
      };
    }

    // Rate limiting
    if (statusCode === 429) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        statusCode,
      };
    }

    // Server errors
    if (statusCode && statusCode >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Server error. Please try again later.',
        statusCode,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: data?.message || 'An error occurred',
      statusCode,
    };
  }

  static showToast(error: AppError) {
    const { code, message } = error;

    switch (code) {
      case 'NETWORK_ERROR':
        toast.error('Network Error', {
          description: message,
          action: {
            label: 'Retry',
            onClick: () => window.location.reload(),
          },
        });
        break;

      case 'AUTH_ERROR':
        toast.error('Authentication Required', {
          description: message,
          action: {
            label: 'Login',
            onClick: () => (window.location.href = '/login'),
          },
        });
        break;

      case 'VALIDATION_ERROR':
        toast.error('Validation Error', {
          description: message,
        });
        break;

      default:
        toast.error('Error', {
          description: message,
        });
    }
  }
}

// Axios interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const appError = ErrorHandler.handle(error);
    
    // Don't show toast for certain errors (handled by components)
    const silentErrors = ['VALIDATION_ERROR'];
    if (!silentErrors.includes(appError.code)) {
      ErrorHandler.showToast(appError);
    }

    return Promise.reject(appError);
  }
);
```

### Error Boundary Component

```typescript
// ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = '/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```


## Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          (10% - Critical user flows)
                 /______\
                /        \
               / Integration \     (30% - API + Component integration)
              /______________\
             /                \
            /   Unit Tests      \  (60% - Functions, hooks, utilities)
           /____________________\
```

### Unit Testing

```typescript
// Example: useFarms.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFarms, useCreateFarm } from './useFarms';
import { farmsService } from '../services/farms.service';

// Mock the service
jest.mock('../services/farms.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useFarms', () => {
  it('should fetch farms successfully', async () => {
    const mockFarms = [
      { id: '1', name: 'Farm 1', area: 10 },
      { id: '2', name: 'Farm 2', area: 20 },
    ];

    (farmsService.listFarms as jest.Mock).mockResolvedValue({
      results: mockFarms,
      count: 2,
    });

    const { result } = renderHook(() => useFarms(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.results).toEqual(mockFarms);
  });

  it('should handle error when fetching farms fails', async () => {
    (farmsService.listFarms as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const { result } = renderHook(() => useFarms(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateFarm', () => {
  it('should create farm and invalidate cache', async () => {
    const newFarm = { name: 'New Farm', area: 15 };
    const createdFarm = { id: '3', ...newFarm };

    (farmsService.createFarm as jest.Mock).mockResolvedValue(createdFarm);

    const { result } = renderHook(() => useCreateFarm(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newFarm);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(createdFarm);
  });
});
```

### Integration Testing with MSW

```typescript
// Example: Marketplace.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { Marketplace } from './Marketplace';
import { TestProviders } from '@/tests/utils/TestProviders';

const server = setupServer(
  rest.get('/api/v1/marketplace/products', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          {
            id: '1',
            name: 'Tomatoes',
            price: 50,
            seller: { name: 'John Doe' },
          },
          {
            id: '2',
            name: 'Potatoes',
            price: 30,
            seller: { name: 'Jane Smith' },
          },
        ],
        count: 2,
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Marketplace', () => {
  it('should display products', async () => {
    render(
      <TestProviders>
        <Marketplace />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
      expect(screen.getByText('Potatoes')).toBeInTheDocument();
    });
  });

  it('should filter products by search', async () => {
    const user = userEvent.setup();

    render(
      <TestProviders>
        <Marketplace />
      </TestProviders>
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    await user.type(searchInput, 'Tomatoes');

    await waitFor(() => {
      expect(screen.getByText('Tomatoes')).toBeInTheDocument();
      expect(screen.queryByText('Potatoes')).not.toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    server.use(
      rest.get('/api/v1/marketplace/products', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    render(
      <TestProviders>
        <Marketplace />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
    });
  });
});
```

### E2E Testing with Playwright

```typescript
// Example: marketplace.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Marketplace Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should browse and purchase product', async ({ page }) => {
    // Navigate to marketplace
    await page.goto('/marketplace');
    await expect(page.locator('h1')).toContainText('Marketplace');

    // Search for product
    await page.fill('[placeholder="Search products..."]', 'Tomatoes');
    await page.waitForTimeout(500); // Debounce

    // Click on product
    await page.click('text=Tomatoes');
    await expect(page).toHaveURL(/\/marketplace\/products\/\d+/);

    // Add to cart
    await page.click('button:has-text("Add to Cart")');
    await expect(page.locator('.toast')).toContainText('Added to cart');

    // Go to cart
    await page.click('[aria-label="Cart"]');
    await expect(page.locator('.cart-item')).toContainText('Tomatoes');

    // Proceed to checkout
    await page.click('button:has-text("Checkout")');
    await expect(page).toHaveURL('/checkout');

    // Fill delivery details
    await page.fill('[name="address"]', '123 Main St');
    await page.fill('[name="phone"]', '+1234567890');

    // Complete order
    await page.click('button:has-text("Place Order")');
    await expect(page.locator('.success-message')).toContainText(
      'Order placed successfully'
    );
  });

  test('should handle out of stock product', async ({ page }) => {
    await page.goto('/marketplace/products/999');

    const addToCartButton = page.locator('button:has-text("Add to Cart")');
    await expect(addToCartButton).toBeDisabled();
    await expect(page.locator('.stock-status')).toContainText('Out of Stock');
  });
});
```

### Performance Testing

```typescript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: 'npm run preview',
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/dashboard',
        'http://localhost:4173/marketplace',
      ],
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
  },
};
```


## Security Implementation

### Authentication Flow

```typescript
// axiosClient.ts - JWT token management
import axios from 'axios';
import { API_CONFIG } from './config';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(
          `${API_CONFIG.BASE_URL}/api/v1/auth/refresh`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### XSS Prevention

```typescript
// sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}

export function sanitizeUserInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Usage in components
function UserComment({ comment }: { comment: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHTML(comment),
      }}
    />
  );
}
```

### Content Security Policy

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'csp-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:8000 ws://localhost:8000",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          );
          next();
        });
      },
    },
  ],
});
```

### Input Validation with Zod

```typescript
// validation schemas
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    password_confirm: z.string(),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    role: z.enum(['farmer', 'buyer', 'poultry_keeper', 'expert', 'ngo', 'admin']),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: 'Passwords do not match',
    path: ['password_confirm'],
  });

export const createFarmSchema = z.object({
  name: z.string().min(1, 'Farm name is required').max(100),
  description: z.string().max(500).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }),
  area: z.number().positive('Area must be positive'),
  area_unit: z.enum(['hectares', 'acres']),
});

// Usage in forms
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

function LoginForm() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    // Data is validated and type-safe
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### Secure Storage

```typescript
// secureStorage.ts
class SecureStorage {
  private static encrypt(data: string): string {
    // In production, use proper encryption
    return btoa(data);
  }

  private static decrypt(data: string): string {
    try {
      return atob(data);
    } catch {
      return '';
    }
  }

  static setItem(key: string, value: any): void {
    const serialized = JSON.stringify(value);
    const encrypted = this.encrypt(serialized);
    localStorage.setItem(key, encrypted);
  }

  static getItem<T>(key: string): T | null {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as T;
    } catch {
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }
}

export default SecureStorage;
```


## Performance Optimization

### Code Splitting Strategy

```typescript
// App.tsx - Route-based code splitting
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Eager load critical routes
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Lazy load feature routes
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Marketplace = lazy(() => import('@/pages/Marketplace'));
const Farms = lazy(() => import('@/pages/Farms'));
const AgriGPT = lazy(() => import('@/pages/AgriGPT'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Community = lazy(() => import('@/pages/Community'));
const Learning = lazy(() => import('@/pages/Learning'));
const Settings = lazy(() => import('@/pages/Settings'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/marketplace/*" element={<Marketplace />} />
        <Route path="/farms/*" element={<Farms />} />
        <Route path="/agrigpt" element={<AgriGPT />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/community/*" element={<Community />} />
        <Route path="/learning/*" element={<Learning />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### Image Optimization

```typescript
// OptimizedImage.tsx
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  lazy = true,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate WebP version if supported
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}
```

### Virtual Scrolling for Large Lists

```typescript
// VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateSize?: number;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimateSize = 100,
  overscan = 5,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

// Usage
function ProductList({ products }: { products: Product[] }) {
  return (
    <VirtualList
      items={products}
      renderItem={(product) => <ProductCard product={product} />}
      estimateSize={200}
    />
  );
}
```

### Debouncing and Throttling

```typescript
// hooks/useDebounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search
function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data } = useQuery({
    queryKey: ['search', debouncedSearchTerm],
    queryFn: () => searchProducts(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length > 0,
  });

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### React Query Cache Configuration

```typescript
// queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Persist cache to localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'AGROBRIDGE_CACHE',
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist successful queries
      return query.state.status === 'success';
    },
  },
});
```

### Bundle Size Optimization

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'query-vendor': ['@tanstack/react-query'],
          'chart-vendor': ['recharts'],
          
          // Feature chunks
          'marketplace': ['./src/pages/Marketplace'],
          'farms': ['./src/pages/Farms'],
          'analytics': ['./src/pages/Analytics'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```


## Responsive Design System

### Breakpoints and Grid System

```typescript
// tailwind.config.js
export default {
  theme: {
    screens: {
      'xs': '320px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
};

// Responsive container component
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn(
      'w-full mx-auto px-4',
      'sm:px-6 md:px-8',
      'max-w-7xl',
      className
    )}>
      {children}
    </div>
  );
}
```

### Mobile-First Navigation

```typescript
// MobileNavigation.tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden p-2">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <nav className="flex flex-col gap-4 mt-8">
          <NavLink href="/dashboard" onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink href="/farms" onClick={() => setOpen(false)}>
            Farms
          </NavLink>
          <NavLink href="/marketplace" onClick={() => setOpen(false)}>
            Marketplace
          </NavLink>
          {/* More links */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// Desktop Navigation
export function DesktopNavigation() {
  return (
    <nav className="hidden lg:flex items-center gap-6">
      <NavLink href="/dashboard">Dashboard</NavLink>
      <NavLink href="/farms">Farms</NavLink>
      <NavLink href="/marketplace">Marketplace</NavLink>
      {/* More links */}
    </nav>
  );
}
```

### Responsive Layout Components

```typescript
// ResponsiveGrid.tsx
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export function ResponsiveGrid({
  children,
  cols = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    `gap-${gap}`,
    `grid-cols-${cols.xs || 1}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  );

  return <div className={gridClasses}>{children}</div>;
}

// Usage
function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ResponsiveGrid cols={{ xs: 1, sm: 2, md: 3, lg: 4 }}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ResponsiveGrid>
  );
}
```

### Touch-Optimized Components

```typescript
// TouchOptimizedButton.tsx
export function TouchOptimizedButton({
  children,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Minimum touch target size (44x44px)
        'min-h-[44px] min-w-[44px]',
        'px-4 py-2',
        // Touch feedback
        'active:scale-95 transition-transform',
        'touch-manipulation',
        props.className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

## Offline Support and PWA

### Service Worker Configuration

```typescript
// vite-plugin-pwa.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export const pwaConfig = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
  manifest: {
    name: 'AgroBridge',
    short_name: 'AgroBridge',
    description: 'AI-powered agricultural platform',
    theme_color: '#10b981',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.agrobridge\.com\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
          },
        },
      },
    ],
  },
});
```

### Offline Queue

```typescript
// offlineQueue.ts
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data: any;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private readonly STORAGE_KEY = 'offline_queue';

  constructor() {
    this.loadQueue();
    window.addEventListener('online', () => this.processQueue());
  }

  private loadQueue() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      this.queue = JSON.parse(stored);
    }
  }

  private saveQueue() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
  }

  add(request: Omit<QueuedRequest, 'id' | 'timestamp'>) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.queue.push(queuedRequest);
    this.saveQueue();
  }

  async processQueue() {
    if (!navigator.onLine || this.queue.length === 0) return;

    const requests = [...this.queue];
    this.queue = [];
    this.saveQueue();

    for (const request of requests) {
      try {
        await apiClient({
          url: request.url,
          method: request.method,
          data: request.data,
        });
      } catch (error) {
        // Re-queue failed requests
        this.queue.push(request);
      }
    }

    this.saveQueue();
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineQueue();
```

### Offline Indicator

```typescript
// OfflineIndicator.tsx
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert variant="destructive" className="fixed bottom-4 right-4 w-auto">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        You are offline. Changes will be synced when connection is restored.
      </AlertDescription>
    </Alert>
  );
}
```


## Internationalization (i18n)

### i18next Configuration

```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';
import swTranslations from './locales/sw.json';
import haTranslations from './locales/ha.json';
import amTranslations from './locales/am.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      fr: { translation: frTranslations },
      sw: { translation: swTranslations },
      ha: { translation: haTranslations },
      am: { translation: amTranslations },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
```

### Translation Files Structure

```json
// locales/en.json
{
  "common": {
    "welcome": "Welcome",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit"
  },
  "auth": {
    "login": "Login",
    "register": "Register",
    "logout": "Logout",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot Password?",
    "loginSuccess": "Login successful",
    "loginError": "Invalid credentials"
  },
  "dashboard": {
    "title": "Dashboard",
    "overview": "Overview",
    "recentActivity": "Recent Activity",
    "quickActions": "Quick Actions"
  },
  "farms": {
    "title": "My Farms",
    "createFarm": "Create Farm",
    "farmName": "Farm Name",
    "area": "Area",
    "location": "Location",
    "statistics": "Statistics"
  },
  "marketplace": {
    "title": "Marketplace",
    "products": "Products",
    "orders": "Orders",
    "addToCart": "Add to Cart",
    "checkout": "Checkout",
    "price": "Price",
    "quantity": "Quantity"
  }
}
```

### Usage in Components

```typescript
// Example component with translations
import { useTranslation } from 'react-i18next';

function Dashboard() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.overview')}</p>
      
      <select onChange={(e) => changeLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="sw">Kiswahili</option>
        <option value="ha">Hausa</option>
        <option value="am">አማርኛ</option>
      </select>
    </div>
  );
}
```

## Monitoring and Analytics

### Sentry Integration

```typescript
// sentry.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && error.message?.includes('ResizeObserver')) {
        return null;
      }
    }
    return event;
  },
});

// Custom error tracking
export function trackError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    contexts: { custom: context },
  });
}

// Performance monitoring
export function trackPerformance(name: string, duration: number) {
  Sentry.addBreadcrumb({
    category: 'performance',
    message: `${name} took ${duration}ms`,
    level: 'info',
  });
}
```

### Google Analytics 4

```typescript
// analytics.ts
import ReactGA from 'react-ga4';

export function initAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    ReactGA.initialize(measurementId);
  }
}

export function trackPageView(path: string) {
  ReactGA.send({ hitType: 'pageview', page: path });
}

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  ReactGA.event({
    category,
    action,
    label,
    value,
  });
}

// Usage in components
function ProductCard({ product }: { product: Product }) {
  const handleAddToCart = () => {
    trackEvent('Marketplace', 'Add to Cart', product.name, product.price);
    // Add to cart logic
  };

  return (
    <button onClick={handleAddToCart}>
      Add to Cart
    </button>
  );
}
```

### Core Web Vitals Monitoring

```typescript
// webVitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics service
  console.log(metric);
  
  // Send to Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// Call in main.tsx
reportWebVitals();
```

## Deployment Configuration

### Docker Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production image
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist
      
      - name: Deploy to production
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: agrobridge/frontend:latest
```

## Summary

This design document provides a comprehensive technical blueprint for the production-ready AgroBridge frontend. Key highlights:

### Architecture
- Modern React 18 with TypeScript strict mode
- Atomic Design component structure
- React Query for server state management
- Comprehensive API integration layer for all 18 microservices

### Performance
- Code splitting and lazy loading
- Image optimization and virtual scrolling
- Bundle size optimization (<250KB gzipped)
- Lighthouse score targets >90

### Security
- JWT authentication with automatic refresh
- XSS prevention with DOMPurify
- Content Security Policy
- Input validation with Zod schemas

### User Experience
- Responsive design (mobile-first)
- Offline support with PWA
- Real-time updates via WebSocket
- Internationalization (5 languages)

### Quality Assurance
- 80%+ test coverage
- Unit, integration, and E2E tests
- Performance monitoring
- Error tracking with Sentry

### DevOps
- Docker containerization
- CI/CD with GitHub Actions
- Blue-green deployment
- Comprehensive monitoring

The design ensures scalability, maintainability, and exceptional user experience across all devices and network conditions.
