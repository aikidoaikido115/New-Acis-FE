import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// API Response Types
export interface ApiResponse<T = unknown> {
  status: string;
  status_code: number;
  message: string;
  result: T;
}

export interface ApiError {
  status: string;
  status_code: number;
  message: string;
  result: unknown;
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response) {
      // Handle 401 Unauthorized - redirect to login
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      // Return formatted error
      return Promise.reject({
        message: error.response.data?.message || 'An error occurred',
        status_code: error.response.status,
        status: error.response.data?.status || 'Error',
      });
    }
    
    // Network error
    return Promise.reject({
      message: 'Network error. Please check your connection.',
      status_code: 0,
      status: 'Error',
    });
  }
);

export default apiClient;
