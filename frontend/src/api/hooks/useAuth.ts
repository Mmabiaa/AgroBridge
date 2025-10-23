/**
 * React Query hooks for authentication with caching and optimization
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import authService from '../services/authService';
import { queryKeys, cacheUtils } from '../queryClient';
import type {
  LoginCredentials,
  RegisterData,
  User,
  AuthResponse,
  PasswordResetConfirm,
  ChangePasswordData,
} from '../basicTypes';

// Query hooks
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: authService.getCurrentUser,
    enabled: authService.isAuthenticated(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Mutation hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      // Cache user data immediately
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      
      // Invalidate and refetch user-specific data
      queryClient.invalidateQueries({ queryKey: queryKeys.farms.userFarms() });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.products.userProducts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orders.userOrders() });
    },
    onError: () => {
      // Clear any cached user data on login failure
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: (userData: RegisterData) => authService.register(userData),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      cacheUtils.clearCache();
    },
    onSettled: () => {
      // Always clear cache even if logout request fails
      cacheUtils.clearCache();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['auth', 'update_profile'],
    mutationFn: (updateData: Partial<User>) => authService.updateProfile(updateData),
    onMutate: async (updateData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.user() });
      
      // Snapshot previous value
      const previousUser = queryClient.getQueryData(queryKeys.auth.user());
      
      // Optimistically update user data
      queryClient.setQueryData(queryKeys.auth.user(), (old: User | undefined) => {
        if (!old) return old;
        return { ...old, ...updateData };
      });
      
      return { previousUser };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.auth.user(), context.previousUser);
      }
    },
    onSettled: () => {
      // Refetch user data to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    },
  });
};

export const useRequestPasswordReset = () => {
  return useMutation({
    mutationKey: ['auth', 'request_password_reset'],
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  });
};

export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationKey: ['auth', 'confirm_password_reset'],
    mutationFn: (resetData: PasswordResetConfirm) => authService.confirmPasswordReset(resetData),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationKey: ['auth', 'change_password'],
    mutationFn: (passwordData: ChangePasswordData) => authService.changePassword(passwordData),
  });
};

export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationKey: ['auth', 'verify_email'],
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      // Refetch user data to get updated verification status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });
    },
  });
};

export const useResendEmailVerification = () => {
  return useMutation({
    mutationKey: ['auth', 'resend_email_verification'],
    mutationFn: authService.resendEmailVerification,
  });
};

// Utility hooks
export const useAuthStatus = () => {
  const { data: user, isLoading, error } = useCurrentUser();
  
  return {
    isAuthenticated: authService.isAuthenticated(),
    user,
    isLoading,
    error,
    isVerified: (user as any)?.is_email_verified || false,
  };
};

// Prefetch utilities
export const useAuthPrefetch = () => {
  const queryClient = useQueryClient();
  
  const prefetchUser = () => {
    if (authService.isAuthenticated()) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.auth.user(),
        queryFn: authService.getCurrentUser,
        staleTime: 10 * 60 * 1000,
      });
    }
  };
  
  return { prefetchUser };
};