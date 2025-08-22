import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('agrobridge_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   body: new URLSearchParams({ username: email, password })
      // });
      // const data = await response.json();
      
      // Mock API response for now
      const userRole = role || 'farmer'; // Default to farmer if no role specified
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: userRole,
        isAuthenticated: true,
        permissions: getDefaultPermissions(userRole),
        accessibleRoutes: getDefaultRoutes(userRole)
      };
      
      setUser(mockUser);
      localStorage.setItem('agrobridge_user', JSON.stringify(mockUser));
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'isAuthenticated' | 'permissions' | 'accessibleRoutes'> & { password: string }) => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData)
      // });
      // const data = await response.json();
      
      // Mock API response for now
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isAuthenticated: true,
        permissions: getDefaultPermissions(userData.role),
        accessibleRoutes: getDefaultRoutes(userData.role)
      };
      
      setUser(newUser);
      localStorage.setItem('agrobridge_user', JSON.stringify(newUser));
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrobridge_user');
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