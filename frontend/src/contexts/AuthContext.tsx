import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentUser, useLogin, useRegister, useLogout, useUpdateProfile } from '../api/hooks/useAuth';
import { realTimeSync } from '../api/realTimeSync';
import apiClient from '../api/axiosClient';

export type UserRole = 'farmer' | 'buyer' | 'poultry_keeper' | 'expert' | 'ngo' | 'admin';

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
  profileData?: Record<string, any>;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
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

  useEffect(() => {
    if (currentUser) {
      const mappedUser: User = {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        name: `${currentUser.first_name} ${currentUser.last_name}`.trim() || currentUser.username,
        role: currentUser.role as UserRole,
        phone: (currentUser as any).phone,
        is_verified: (currentUser as any).is_verified || false,
        email_verified: (currentUser as any).email_verified || false,
        phone_verified: (currentUser as any).phone_verified || false,
        profile_completed: (currentUser as any).profile_completed || false,
        onboarding_completed: (currentUser as any).onboarding_completed || false,
        language: (currentUser as any).language || 'en',
        timezone: (currentUser as any).timezone || 'UTC',
        isAuthenticated: true,
        permissions: getDefaultPermissions(currentUser.role as UserRole),
        accessibleRoutes: getDefaultRoutes(currentUser.role as UserRole),
        profileData: currentUser,
      };
      setUser(mappedUser);
      
      // Start WebSocket connection when user is authenticated
      realTimeSync.startConnection();
    } else if (userError || !apiClient.isAuthenticated()) {
      setUser(null);
      
      // Stop WebSocket connection when user is not authenticated
      realTimeSync.stopConnection();
    }
  }, [currentUser, userError]);

  // Check for existing authentication on app startup
  useEffect(() => {
    const token = apiClient.getAccessToken();
    if (token && !user && !userLoading && apiClient.isAuthenticated()) {
      // Token exists but no user data, trigger user fetch
      refetchUser();
    }
  }, [user, userLoading, refetchUser]);

  const login = async (email: string, password: string) => {
    try {
      // The backend accepts either username or email in the username field
      const result = await loginMutation.mutateAsync({ username: email, password });
      
      const mappedUser: User = {
        id: result.user.id,
        username: result.user.username,
        email: result.user.email,
        first_name: result.user.first_name,
        last_name: result.user.last_name,
        name: `${result.user.first_name} ${result.user.last_name}`.trim() || result.user.username,
        role: result.user.role as UserRole,
        phone: (result.user as any).phone,
        is_verified: (result.user as any).is_verified || false,
        email_verified: (result.user as any).email_verified || false,
        phone_verified: (result.user as any).phone_verified || false,
        profile_completed: (result.user as any).profile_completed || false,
        onboarding_completed: (result.user as any).onboarding_completed || false,
        language: (result.user as any).language || 'en',
        timezone: (result.user as any).timezone || 'UTC',
        isAuthenticated: true,
        permissions: getDefaultPermissions(result.user.role as UserRole),
        accessibleRoutes: getDefaultRoutes(result.user.role as UserRole),
        profileData: result.user,
      };
      
      setUser(mappedUser);
      
      // Start WebSocket connection after successful login
      realTimeSync.startConnection();
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: RegisterUserData) => {
    try {
      await registerMutation.mutateAsync(userData);
      
      // After successful registration, login automatically
      await login(userData.email, userData.password);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Even if logout fails on server, clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      
      // Stop WebSocket connection on logout
      realTimeSync.stopConnection();
      
      // Clear tokens using the API client
      apiClient.clearTokens();
      
      // Clear any other auth-related localStorage items
      localStorage.removeItem('agrobridge_user');
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  const canAccessRoute = (route: string): boolean => {
    return user?.accessibleRoutes.includes(route) ?? false;
  };

  const updateUserProfile = async (profileData: Partial<User>) => {
    try {
      const updatedUser = await updateProfileMutation.mutateAsync(profileData);
      
      // Update local user state with the response from server
      if (user) {
        const mappedUser: User = {
          ...user,
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          name: `${updatedUser.first_name} ${updatedUser.last_name}`.trim() || updatedUser.username,
          role: updatedUser.role as UserRole,
          phone: (updatedUser as any).phone,
          is_verified: (updatedUser as any).is_verified || user.is_verified,
          email_verified: (updatedUser as any).email_verified || user.email_verified,
          phone_verified: (updatedUser as any).phone_verified || user.phone_verified,
          profile_completed: (updatedUser as any).profile_completed || user.profile_completed,
          onboarding_completed: (updatedUser as any).onboarding_completed || user.onboarding_completed,
          language: (updatedUser as any).language || user.language,
          timezone: (updatedUser as any).timezone || user.timezone,
          profileData: updatedUser,
        };
        setUser(mappedUser);
      }
    } catch (error) {
      throw error;
    }
  };

  const refreshToken = async () => {
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

  return (
    <AuthContext.Provider value={{ 
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};