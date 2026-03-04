import apiClient, { ApiResponse } from '@/lib/axios.ts/api-client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  VerifyOTPRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  User,
} from '@/types/auth';

class AuthService {
  /**
   * Map API role names to internal role names
   */
  private mapRoleToInternal(roleName: string): string {
    const roleMapping: Record<string, string> = {
      'medical staff': 'nurse',
      'nurse': 'nurse',
      'พยาบาล': 'nurse',
      'kitchen': 'kitchen',
      'ครัว': 'kitchen',
      'relative': 'relative',
      'ญาติ': 'relative',
    };
    
    const normalized = roleName.toLowerCase().trim();
    return roleMapping[normalized] || roleName;
  }

  /**
   * Fetch user profile from /api/user/
   */
  async fetchUserProfile(): Promise<User | null> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      const response = await apiClient.get<ApiResponse<User>>('/api/user/');
      return response.data.result;
    } catch {
      return null;
    }
  }

  /**
   * Login user with username/email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      credentials
    );
    
    // Store token first
    if (response.data.result.token) {
      localStorage.setItem('access_token', response.data.result.token);
      // Store in cookie for middleware
      document.cookie = `auth_token=${response.data.result.token}; path=/; max-age=2592000; SameSite=Lax`;
    }
    
    // Fetch full user profile to get first_name, last_name, etc.
    const profile = await this.fetchUserProfile();
    
    // Get role name from profile or response
    const apiRoleName = profile?.role?.name || response.data.result.role_name || '';
    
    // Map API role to internal role
    const internalRole = this.mapRoleToInternal(apiRoleName);
    
    const userData: LoginResponse = {
      ...response.data.result,
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      role_name: internalRole,
    };
    
    console.log('[Auth Service] Role mapping:', {
      apiRoleName,
      internalRole,
      username: userData.username
    });
    
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Store role in cookie for middleware
    if (userData.role_name) {
      const normalizedRole = userData.role_name.toLowerCase();
      document.cookie = `user_role=${normalizedRole}; path=/; max-age=2592000; SameSite=Lax`;
      console.log('[Auth Service] Cookie set:', normalizedRole);
    }
    
    return userData;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<User> {
    const formData = new FormData();
    
    formData.append('username', data.username);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('role_name', data.role_name);
    
    if (data.nickname) {
      formData.append('nickname', data.nickname);
    }
    
    if (data.gender) {
      formData.append('gender', data.gender);
    }
    
    if (data.profile_image) {
      formData.append('profile_image', data.profile_image);
    }
    
    const response = await apiClient.post<ApiResponse<User>>(
      '/api/auth/register',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data.result;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      // Clear localStorage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      // Clear cookies
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }

  /**
   * Request OTP for forgot password
   */
  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      '/api/auth/forgotpassword',
      data
    );
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: VerifyOTPRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      '/api/auth/forgotpassword/otp',
      data
    );
  }

  /**
   * Change password (forgot password flow)
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.patch<ApiResponse<void>>(
      '/api/auth/forgotpassword/changepassword',
      data
    );
  }

  /**
   * Reset password (authenticated user)
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await apiClient.patch<ApiResponse<void>>(
      '/api/auth/resetpassword',
      data
    );
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser(): LoginResponse | null {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Get access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
