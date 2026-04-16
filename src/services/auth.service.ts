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
   * Fetch user profile from /api/user/
   */
  async fetchUserProfile(): Promise<User | null> {
    try {
      if (typeof window === 'undefined') return null;

      const token = localStorage.getItem('access_token');
      if (!token) return null;
      
      const response = await apiClient.get<ApiResponse<User>>('/api/user/');
      return response.data.result;
    } catch {
      return null;
    }
  }
  /**
   * Map role ID to internal role name
   */
  private mapRoleIdToInternal(roleId?: string): string | null {
    if (!roleId) return null;

    const roleIdMap: Record<string, string> = {
      '1': 'nurse',
      '2': 'kitchen',
      '3': 'relative',
    };
    
    return roleIdMap[roleId] || null;
  }

  /**
   * Map role name variants to internal role name
   */
  private mapRoleNameToInternal(roleName?: string): string | null {
    if (!roleName) return null;

    const normalizedRole = roleName.trim().toLowerCase();

    if (
      normalizedRole === 'medical staff' ||
      normalizedRole === 'nurse' ||
      normalizedRole.includes('medical') ||
      normalizedRole.includes('nurse')
    ) {
      return 'nurse';
    }

    if (
      normalizedRole === 'kitchen staff' ||
      normalizedRole === 'kitchen' ||
      normalizedRole.includes('kitchen')
    ) {
      return 'kitchen';
    }

    if (normalizedRole === 'relative' || normalizedRole.includes('relative')) {
      return 'relative';
    }

    return null;
  }

  /**
   * Resolve internal role from user profile payload
   */
  private resolveInternalRole(profile: User): string {
    return (
      this.mapRoleIdToInternal(profile.role_id) ||
      this.mapRoleNameToInternal(profile.role_name) ||
      this.mapRoleNameToInternal(profile.role?.name) ||
      'nurse'
    );
  }

  /**
   * Login user with username/email and password
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      credentials
    );
    
    const apiResult = response.data.result;
    
    if (!apiResult.token) {
      throw new Error('No token received from server');
    }
    
    localStorage.setItem('access_token', apiResult.token);
    
    const profile = await this.fetchUserProfile();
    
    if (!profile) {
      throw new Error('Failed to fetch user profile');
    }
    
    const mappedRole = this.resolveInternalRole(profile);
    
    const userData: LoginResponse = {
      ...apiResult,
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      role_name: mappedRole,
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    
    document.cookie = `auth_token=${apiResult.token}; path=/; max-age=2592000; SameSite=Lax`;
    document.cookie = `user_role=${mappedRole}; path=/; max-age=2592000; SameSite=Lax`;
    
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
   * Update authenticated user profile (multipart)
   */
  async updateProfile(data: {
    username?: string;
    first_name?: string;
    last_name?: string;
    nickname?: string;
    phone?: string;
    gender?: string;
    profile_image?: File;
  }): Promise<User> {
    const formData = new FormData();

    if (data.username) formData.append('username', data.username);
    if (data.first_name) formData.append('first_name', data.first_name);
    if (data.last_name) formData.append('last_name', data.last_name);
    if (data.nickname) formData.append('nickname', data.nickname);
    if (data.phone) formData.append('phone', data.phone);
    if (data.gender) formData.append('gender', data.gender);
    if (data.profile_image) formData.append('profile_image', data.profile_image);

    const response = await apiClient.patch<ApiResponse<User>>('/api/user', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.result;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Try to call logout API, but don't fail if it errors
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      // API error is not critical, continue with cleanup
      console.warn('Logout API failed:', error);
    } finally {
      // Always clean up local storage and cookies
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        // Clear cookies so middleware redirects to login
        document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'user_role=; path=/; max-age=0; SameSite=Lax';
      }
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
