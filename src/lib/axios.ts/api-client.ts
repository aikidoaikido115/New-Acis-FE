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
    // Log detailed error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.debug('[API Client Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }

    if (error.response) {
      // Server responded with error
      return Promise.reject({
        message: error.response.data?.message || `Request failed with status ${error.response.status}`,
        status_code: error.response.status,
        status: error.response.data?.status || 'Error',
        response: error.response,
      });
    }
    
    if (error.request) {
      // Request made but no response received
      return Promise.reject({
        message: 'ไม่ได้รับการตอบกลับจากเซิร์ฟเวอร์ กรุณาตรวจสอบการเชื่อมต่อ',
        status_code: 0,
        status: 'Network Error',
      });
    }

    // Something else happened
    return Promise.reject({
      message: error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
      status_code: 0,
      status: 'Error',
    });
  }
);

export default apiClient;
