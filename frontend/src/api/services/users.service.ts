/**
 * Users API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'farmer' | 'buyer' | 'poultry_keeper' | 'expert' | 'ngo' | 'admin';
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  is_verified: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  profile_completed: boolean;
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  location?: UserProfile['location'];
  avatar?: File;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  };
  privacy: {
    show_email: boolean;
    show_phone: boolean;
    show_location: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  is_verified?: boolean;
  ordering?: string;
}

class UsersService {
  private readonly baseUrl = '/users';

  /**
   * Get list of users
   */
  async getUsers(params?: UserListParams): Promise<PaginatedResponse<UserProfile>> {
    return apiClient.getPaginated<UserProfile>(`${this.baseUrl}/`, params);
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`${this.baseUrl}/${userId}/`);
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>(`${this.baseUrl}/profile/`);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    // Handle file upload for avatar
    if (data.avatar) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'avatar' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'location' && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return apiClient.post<UserProfile>(`${this.baseUrl}/profile/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.patch<UserProfile>(`${this.baseUrl}/profile/`, data);
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>(`${this.baseUrl}/preferences/`);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.patch<UserPreferences>(`${this.baseUrl}/preferences/`, preferences);
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    return apiClient.uploadFile<{ avatar_url: string }>(
      `${this.baseUrl}/profile/avatar/`,
      file
    );
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/profile/avatar/`);
  }

  /**
   * Verify phone number
   */
  async verifyPhone(code: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/verify-phone/`, { code });
  }

  /**
   * Resend phone verification code
   */
  async resendPhoneVerification(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/resend-phone-verification/`);
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(password: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/deactivate/`, { password });
  }

  /**
   * Delete account
   */
  async deleteAccount(password: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/delete/`, { password });
  }
}

export default new UsersService();
