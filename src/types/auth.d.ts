// Auth Request Types
export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  role_name: string;
  gender?: string;
  profile_image?: File;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface ChangePasswordRequest {
  email: string;
  new_password: string;
}

export interface ResetPasswordRequest {
  old_password: string;
  new_password: string;
}

// Auth Response Types
export interface LoginResponse {
  token: string;
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image: string;
  role_name: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface User {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nickname?: string;
  gender?: string;
  profile_image?: string;
  role_id?: string;
  role?: Role;
  role_name?: string;
  created_at: string;
  updated_at: string;
}

// Auth State
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}
