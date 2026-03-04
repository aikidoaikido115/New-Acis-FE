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
   * Login user with username/email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      credentials
    );
    
    // Store token and user info in localStorage
    if (response.data.result.token) {
      localStorage.setItem('access_token', response.data.result.token);
      localStorage.setItem('user', JSON.stringify(response.data.result));
    }
    
    return response.data.result;
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
