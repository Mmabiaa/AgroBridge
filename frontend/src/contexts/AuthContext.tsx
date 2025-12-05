import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentUser, useLogin, useRegister, useLogout, useUpdateProfile } from '../api/hooks/useAuth';
import { realTimeSync } from '../api/realTimeSync';
import apiClient from '../api/axiosClient';

export type UserRole = 'farmer' | 'buyer' | 'poultry_keeper' | 'expert' | 'ngo' | 'admin';

// Define the actual API response types based on your backend
interface ApiUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  // Optional fields that might not be present in all responses
  phone?: string;
  is_verified?: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  language?: string;
  timezone?: string;
}

// Define the login response type
interface LoginResponse {
  user: ApiUser;
  tokens?: {
    access: string;
    refresh: string;
  };
  message?: string;
}

// Your frontend User interface
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  name: string;
  role: UserRole;
  phone?: string;
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  profile_completed: boolean;
  onboarding_completed: boolean;
  language: string;
  timezone: string;
  isAuthenticated: boolean;
  permissions: string[];
  accessibleRoutes: string[];
  profileData?: ApiUser;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterUserData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  updateUserProfile: (profileData: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterUserData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone?: string;
}

// Define the API client interface
interface ApiClient {
  getAccessToken: () => string | null;
  isAuthenticated: () => boolean;
  defaults?: {
    headers?: {
      Authorization?: string;
    };
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to safely map API user to frontend User
const mapApiUserToUser = (apiUser: ApiUser, isAuthenticated: boolean = true): User => {
  return {
    id: apiUser.id,
    username: apiUser.username,
    email: apiUser.email,
    first_name: apiUser.first_name,
    last_name: apiUser.last_name,
    name: `${apiUser.first_name} ${apiUser.last_name}`.trim() || apiUser.username,
    role: apiUser.role as UserRole,
    phone: apiUser.phone,
    is_verified: apiUser.is_verified ?? false,
    email_verified: apiUser.email_verified ?? false,
    phone_verified: apiUser.phone_verified ?? false,
    profile_completed: apiUser.profile_completed ?? false,
    onboarding_completed: apiUser.onboarding_completed ?? false,
    language: apiUser.language ?? 'en',
    timezone: apiUser.timezone ?? 'UTC',
    isAuthenticated,
    permissions: getDefaultPermissions(apiUser.role as UserRole),
    accessibleRoutes: getDefaultRoutes(apiUser.role as UserRole),
    profileData: apiUser,
  };
};

// Helper functions for default permissions and routes
const getDefaultPermissions = (role: UserRole): string[] => {
  const rolePermissions: Record<UserRole, string[]> = {
    farmer: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'use_crop_detection', 'use_voice_commands', 'view_marketplace',
      'place_orders', 'view_orders', 'view_learning', 'view_community',
      'use_satellite_integration', 'use_iot_sensors', 'use_drone_integration',
      'use_ar_visualization', 'view_financial_planning', 'create_plans',
      'view_smart_scheduling'
    ],
    poultry_keeper: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'use_crop_detection', 'use_voice_commands', 'view_marketplace',
      'place_orders', 'view_orders', 'view_learning', 'view_community',
      'use_iot_sensors', 'view_financial_planning', 'create_plans',
      'view_smart_scheduling'
    ],
    buyer: [
      'view_dashboard', 'view_marketplace', 'place_orders', 'view_orders',
      'view_learning', 'view_community', 'view_financial_planning', 'use_voice_commands'
    ],
    expert: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'view_marketplace', 'view_learning', 'view_community', 'moderate_community',
      'create_content', 'edit_content', 'view_financial_planning', 'use_voice_commands'
    ],
    ngo: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'view_marketplace', 'view_learning', 'view_community', 'moderate_community',
      'create_content', 'edit_content', 'use_satellite_integration',
      'use_iot_sensors', 'view_financial_planning', 'manage_content', 'use_voice_commands'
    ],
    admin: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'use_crop_detection', 'use_voice_commands', 'view_marketplace',
      'create_product', 'edit_product', 'delete_product', 'view_orders',
      'view_learning', 'create_content', 'edit_content', 'delete_content',
      'view_community', 'moderate_community', 'use_satellite_integration',
      'use_iot_sensors', 'use_drone_integration', 'use_ar_visualization',
      'use_blockchain', 'view_financial_planning', 'create_plans',
      'view_smart_scheduling', 'manage_users', 'manage_system',
      'view_admin_dashboard', 'manage_content', 'view_logs'
    ]
  };
  return rolePermissions[role] || [];
};

const getDefaultRoutes = (role: UserRole): string[] => {
  const roleRoutes: Record<UserRole, string[]> = {
    farmer: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/crop-disease-detection', '/voice-commands', '/marketplace',
      '/learning', '/community', '/financial-planning', '/smart-scheduling'
    ],
    poultry_keeper: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/crop-disease-detection', '/voice-commands', '/marketplace',
      '/learning', '/community', '/financial-planning', '/smart-scheduling'
    ],
    buyer: [
      '/dashboard', '/marketplace', '/learning', '/community',
      '/financial-planning', '/voice-commands'
    ],
    expert: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/marketplace', '/learning', '/community', '/financial-planning', '/voice-commands'
    ],
    ngo: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/marketplace', '/learning', '/community', '/financial-planning', '/voice-commands'
    ],
    admin: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/crop-disease-detection', '/voice-commands', '/marketplace',
      '/learning', '/community', '/financial-planning', '/smart-scheduling',
      '/admin'
    ]
  };
  return roleRoutes[role] || [];
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Use API hooks
  const { data: currentUser, isLoading: userLoading, error: userError, refetch: refetchUser } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const updateProfileMutation = useUpdateProfile();

  const isLoading = userLoading || loginMutation.isPending || registerMutation.isPending || updateProfileMutation.isPending;
  const isAuthenticated = apiClient.isAuthenticated() && !!user;

  const clearAuthData = (): void => {
    // Clear tokens from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Type-safe apiClient access
    const client = apiClient as unknown as ApiClient;
    
    // Clear any authorization headers if they exist
    if (client.defaults?.headers) {
      delete client.defaults.headers.Authorization;
    }
  };

  // Effect to handle user authentication state
  useEffect(() => {
    if (currentUser) {
      const mappedUser = mapApiUserToUser(currentUser as ApiUser, true);
      setUser(mappedUser);
      
      // DISABLED: realTimeSync WebSocket - using NotificationContext instead
      // realTimeSync.startConnection();
    } else if (userError || !apiClient.isAuthenticated()) {
      setUser(null);
      
      // DISABLED: realTimeSync WebSocket - using NotificationContext instead
      // realTimeSync.stopConnection();
    }
  }, [currentUser, userError]);

  // Check for existing authentication on app startup
  useEffect(() => {
    const token = apiClient.getAccessToken();
    
    // Check if token exists and is valid
    if (token) {
      // Verify token is not expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp < currentTime) {
          // Token is expired, clear it
          console.log('Token expired on startup, clearing...');
          clearAuthData();
          setUser(null);
          return;
        }
      } catch (error) {
        // Invalid token format, clear it
        console.error('Invalid token format on startup:', error);
        clearAuthData();
        setUser(null);
        return;
      }
      
      // Token is valid, fetch user if needed
      if (!user && !userLoading && apiClient.isAuthenticated()) {
        refetchUser();
      }
    }
  }, [user, userLoading, refetchUser]);

  const login = async (email: string, password: string): Promise<void> => {
    // Clear any existing expired tokens before login
    clearAuthData();
    
    const result = await loginMutation.mutateAsync({ username: email, password }) as LoginResponse;
    
    const mappedUser = mapApiUserToUser(result.user, true);
    setUser(mappedUser);
    
    // DISABLED: realTimeSync WebSocket - using NotificationContext instead
    // realTimeSync.startConnection();
  };

  const register = async (userData: RegisterUserData): Promise<void> => {
    await registerMutation.mutateAsync(userData);
    
    // After successful registration, login automatically
    await login(userData.email, userData.password);
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Call logout API only if we have a refresh token
      if (refreshToken) {
        // Option 1: If your useLogout hook doesn't accept parameters, call the API directly
        await apiClient.post('auth/logout/', { refresh: refreshToken });
        
        // Option 2: Or if you want to use the mutation without parameters
        // await logoutMutation.mutateAsync();
      } else {
        // If no refresh token, just call the mutation without parameters
        await logoutMutation.mutateAsync();
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with cleanup even if API call fails
    } finally {
      // Always clear local data and stop WebSocket
      clearAuthData();
      setUser(null);
      
      // Stop WebSocket connection
      realTimeSync.stopConnection();
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  const canAccessRoute = (route: string): boolean => {
    return user?.accessibleRoutes.includes(route) ?? false;
  };

  const updateUserProfile = async (profileData: Partial<User>): Promise<void> => {
    const updatedUser = await updateProfileMutation.mutateAsync(profileData) as ApiUser;
    
    // Update local user state with the response from server
    if (user) {
      const mappedUser = mapApiUserToUser(updatedUser, true);
      setUser(mappedUser);
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        // The axios interceptor will handle token refresh automatically
        // We just need to trigger a user data refetch
        await refetchUser();
      }
    } catch (error) {
      // If refresh fails, logout the user
      await logout();
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    hasPermission,
    canAccessRoute,
    updateUserProfile,
    refreshToken,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};