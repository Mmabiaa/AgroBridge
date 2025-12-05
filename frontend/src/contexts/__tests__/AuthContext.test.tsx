/**
 * AuthContext Tests
 * 
 * Note: These tests require a testing framework like Vitest to be set up.
 * To run these tests, install and configure Vitest:
 * 
 * npm install -D vitest @testing-library/react @testing-library/jest-dom
 * 
 * Then add to package.json scripts:
 * "test": "vitest",
 * "test:ui": "vitest --ui"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock the API hooks
vi.mock('../../api/hooks/useAuth', () => ({
  useCurrentUser: vi.fn(() => ({ data: null, isLoading: false, error: null, refetch: vi.fn() })),
  useLogin: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useRegister: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useLogout: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateProfile: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));

// Mock the real-time sync
vi.mock('../../api/realTimeSync', () => ({
  realTimeSync: {
    startConnection: vi.fn(),
    stopConnection: vi.fn(),
  },
}));

// Mock the API client
vi.mock('../../api/axiosClient', () => ({
  default: {
    isAuthenticated: vi.fn(() => false),
    getAccessToken: vi.fn(() => null),
    clearTokens: vi.fn(),
  },
}));

// Test component to access auth context
const TestComponent = () => {
  const { user, isLoading, isAuthenticated, hasPermission } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Not loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'Authenticated' : 'Not authenticated'}</div>
      <div data-testid="permission">{hasPermission('view_dashboard') ? 'Has permission' : 'No permission'}</div>
    </div>
  );
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should provide initial auth state', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('loading')).toHaveTextContent('Not loading');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('Not authenticated');
    expect(screen.getByTestId('permission')).toHaveTextContent('No permission');
  });

  it('should handle user authentication state', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'farmer',
      is_active: true,
    };

    // Mock the useCurrentUser hook to return a user
    const { useCurrentUser } = await import('../../api/hooks/useAuth');
    vi.mocked(useCurrentUser).mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    // Mock API client to return authenticated
    const apiClient = await import('../../api/axiosClient');
    vi.mocked(apiClient.default.isAuthenticated).mockReturnValue(true);

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('permission')).toHaveTextContent('Has permission');
    });
  });

  it('should handle login functionality', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'farmer',
        is_active: true,
      },
      tokens: {
        access: 'access-token',
        refresh: 'refresh-token',
      },
    });

    const { useLogin } = await import('../../api/hooks/useAuth');
    vi.mocked(useLogin).mockReturnValue({
      mutateAsync: mockLogin,
      isPending: false,
    } as any);

    const LoginTestComponent = () => {
      const { login } = useAuth();
      
      return (
        <button 
          onClick={() => login('test@example.com', 'password')}
          data-testid="login-button"
        >
          Login
        </button>
      );
    };

    renderWithProviders(<LoginTestComponent />);
    
    const loginButton = screen.getByTestId('login-button');
    loginButton.click();

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: 'test@example.com',
        password: 'password',
      });
    });
  });

  it('should handle logout functionality', async () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);

    const { useLogout } = await import('../../api/hooks/useAuth');
    vi.mocked(useLogout).mockReturnValue({
      mutateAsync: mockLogout,
      isPending: false,
    } as any);

    const LogoutTestComponent = () => {
      const { logout } = useAuth();
      
      return (
        <button 
          onClick={() => logout()}
          data-testid="logout-button"
        >
          Logout
        </button>
      );
    };

    renderWithProviders(<LogoutTestComponent />);
    
    const logoutButton = screen.getByTestId('logout-button');
    logoutButton.click();

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('should handle permission checking', () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'buyer',
      is_active: true,
    };

    const PermissionTestComponent = () => {
      const { hasPermission } = useAuth();
      
      return (
        <div>
          <div data-testid="dashboard-permission">
            {hasPermission('view_dashboard') ? 'Can view dashboard' : 'Cannot view dashboard'}
          </div>
          <div data-testid="admin-permission">
            {hasPermission('manage_users') ? 'Can manage users' : 'Cannot manage users'}
          </div>
        </div>
      );
    };

    renderWithProviders(<PermissionTestComponent />);
    
    // Buyer role should have dashboard permission but not admin permissions
    expect(screen.getByTestId('dashboard-permission')).toHaveTextContent('Can view dashboard');
    expect(screen.getByTestId('admin-permission')).toHaveTextContent('Cannot manage users');
  });
});