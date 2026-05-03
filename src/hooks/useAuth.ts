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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleUserUpdated = () => {
      setUser(authService.getCurrentUser());
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'user') {
        setUser(authService.getCurrentUser());
      }
    };

    window.addEventListener('auth:user-updated', handleUserUpdated as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('auth:user-updated', handleUserUpdated as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let isActive = true;

    const refreshProfile = async () => {
      const profile = await authService.fetchUserProfile();
      if (!profile || !isActive) return;

      const nextProfileImage = profile.profile_image ?? "";
      if (nextProfileImage !== (user.profile_image ?? "")) {
        authService.updateCachedUser({ profile_image: nextProfileImage });
      }
    };

    refreshProfile();

    return () => {
      isActive = false;
    };
  }, [user?.user_id]);

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
