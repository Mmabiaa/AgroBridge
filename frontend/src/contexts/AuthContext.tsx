import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCurrentUser, useLogin, useRegister, useLogout } from '../api/hooks/useAuth';

export type UserRole = 'farmer' | 'buyer' | 'poultry_keeper' | 'ngo' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAuthenticated: boolean;
  permissions: string[];
  accessibleRoutes: string[];
  profileData?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'isAuthenticated' | 'permissions' | 'accessibleRoutes'> & { password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  canAccessRoute: (route: string) => boolean;
  updateUserProfile: (profileData: Record<string, any>) => void;
  updateUserRole: (role: UserRole) => void;
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
  const { data: currentUser, isLoading: userLoading, error: userError } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const isLoading = userLoading || loginMutation.isPending || registerMutation.isPending;

  useEffect(() => {
    if (currentUser) {
      const mappedUser: User = {
        id: currentUser.id,
        email: currentUser.email,
        name: `${currentUser.first_name} ${currentUser.last_name}`.trim(),
        role: currentUser.role as UserRole,
        isAuthenticated: true,
        permissions: getDefaultPermissions(currentUser.role as UserRole),
        accessibleRoutes: getDefaultRoutes(currentUser.role as UserRole),
        profileData: currentUser,
      };
      setUser(mappedUser);
    } else if (userError) {
      setUser(null);
    }
  }, [currentUser, userError]);

  const login = async (email: string, password: string, role?: UserRole) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      const mappedUser: User = {
        id: result.user.id,
        email: result.user.email,
        name: `${result.user.first_name} ${result.user.last_name}`.trim(),
        role: result.user.role as UserRole,
        isAuthenticated: true,
        permissions: getDefaultPermissions(result.user.role as UserRole),
        accessibleRoutes: getDefaultRoutes(result.user.role as UserRole),
        profileData: result.user,
      };
      
      setUser(mappedUser);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isAuthenticated' | 'permissions' | 'accessibleRoutes'> & { password: string }) => {
    try {
      const [firstName, ...lastNameParts] = userData.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const registerData = {
        username: userData.email.split('@')[0],
        email: userData.email,
        password: userData.password,
        password_confirm: userData.password,
        first_name: firstName,
        last_name: lastName,
        role: userData.role,
      };
      
      const result = await registerMutation.mutateAsync(registerData);
      
      // After successful registration, login automatically
      await login(userData.email, userData.password, userData.role);
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
      localStorage.removeItem('agrobridge_user');
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  const canAccessRoute = (route: string): boolean => {
    return user?.accessibleRoutes.includes(route) ?? false;
  };

  const updateUserProfile = (profileData: Record<string, any>) => {
    if (user) {
      const updatedUser = { ...user, profileData };
      setUser(updatedUser);
      localStorage.setItem('agrobridge_user', JSON.stringify(updatedUser));
    }
  };

  const updateUserRole = (role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('agrobridge_user', JSON.stringify(updatedUser));
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
      updateUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};