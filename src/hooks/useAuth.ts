import { useState, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import type { LoginResponse } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<LoginResponse | null>(() => {
    // Initialize state from localStorage on mount
    return authService.getCurrentUser();
  });

  const login = useCallback(async (credentials: { username?: string; email?: string; password: string }) => {
    const userData = await authService.login(credentials);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const isAuthenticated = !!user && authService.isAuthenticated();
  const isLoading = false;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
