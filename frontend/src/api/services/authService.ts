/**
 * Authentication API service
 */
import apiClient from '../axiosClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  message: string;
  tokens?: {
    access: string;
    refresh: string;
  };
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
  password_confirm: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
  refresh?: string;
}

class AuthService {
  private readonly baseUrl = '/auth';

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      `${this.baseUrl}/login/`,
      credentials
    );
    
    // Store tokens
    apiClient.setTokens(response.tokens.access, response.tokens.refresh);
    
    return response;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await apiClient.post<RegisterResponse>(
        `${this.baseUrl}/register/`,
        userData
      );
      
      // If registration includes tokens, store them
      if ('tokens' in response && response.tokens) {
        const tokens = response.tokens as { access: string; refresh: string };
        apiClient.setTokens(tokens.access, tokens.refresh);
      }
      
      return response;
    } catch (error: any) {
      // Log registration errors for debugging
      console.error('Registration API error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/logout/`);
    } finally {
      // Always clear tokens, even if logout request fails
      apiClient.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(
      `${this.baseUrl}/refresh/`,
      { refresh: refreshToken }
    );
    
    // Update stored tokens
    apiClient.setTokens(response.access, response.refresh || refreshToken);
    
    return response;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/request-password-reset/`,
      { email }
    );
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/reset-password/`,
      data
    );
  }

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/me/change-password/`,
      data
    );
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<LoginResponse['user']> {
    return apiClient.get<LoginResponse['user']>(`${this.baseUrl}/me/`);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<LoginResponse['user']>): Promise<LoginResponse['user']> {
    return apiClient.patch<LoginResponse['user']>(`${this.baseUrl}/me/update/`, data);
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/verify-email/`,
      { token }
    );
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/resend-verification/`
    );
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.isAuthenticated();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return apiClient.getAccessToken();
  }

  /**
   * Clear authentication tokens
   */
  clearTokens(): void {
    apiClient.clearTokens();
  }
}

export default new AuthService();