import { useState, useCallback, useEffect } from 'react';
import { authService } from '@/services/auth.service';
import type { LoginResponse } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on client-side only (after hydration)
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

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

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
