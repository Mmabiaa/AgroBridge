/**
 * React Query hooks for users service
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import usersService from '../services/users.service';
import type {
  UserProfile,
  UpdateProfileRequest,
  UserPreferences,
  UserListParams,
} from '../services/users.service';

// Query keys
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (params?: UserListParams) => [...usersKeys.lists(), params] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  profile: () => [...usersKeys.all, 'profile'] as const,
  preferences: () => [...usersKeys.all, 'preferences'] as const,
};

// Query hooks
export const useUsers = (params?: UserListParams) => {
  return useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => usersService.getUsers(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersService.getUser(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: usersKeys.profile(),
    queryFn: usersService.getProfile,
    staleTime: 10 * 60 * 1000,
  });
};

export const usePreferences = () => {
  return useQuery({
    queryKey: usersKeys.preferences(),
    queryFn: usersService.getPreferences,
    staleTime: 10 * 60 * 1000,
  });
};

// Mutation hooks
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => usersService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.profile() });
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) =>
      usersService.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.preferences() });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => usersService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.profile() });
    },
  });
};

export const useDeleteAvatar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersService.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.profile() });
    },
  });
};

export const useVerifyPhone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => usersService.verifyPhone(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.profile() });
    },
  });
};

export const useResendPhoneVerification = () => {
  return useMutation({
    mutationFn: usersService.resendPhoneVerification,
  });
};

export const useDeactivateAccount = () => {
  return useMutation({
    mutationFn: (password: string) => usersService.deactivateAccount(password),
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: (password: string) => usersService.deleteAccount(password),
  });
};
