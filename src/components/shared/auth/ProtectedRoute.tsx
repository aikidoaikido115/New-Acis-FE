'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
  roleRoutes?: Record<string, string>;
}

const DEFAULT_ROLE_ROUTES: Record<string, string> = {
  nurse: '/dashboard',
  superuser: '/dashboard',
  kitchen: '/manage-meal',
  admin: '/admin/users',
  relative: '/relative/dashboard',
};

export function ProtectedRoute({ children, redirectTo = '/login', allowedRoles = [], roleRoutes = DEFAULT_ROLE_ROUTES }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (allowedRoles.length > 0 && user?.role_name) {
      const userRole = user.role_name.toLowerCase();
      const hasPermission = allowedRoles.some((role) => role.toLowerCase() === userRole);

      if (!hasPermission) {
        const targetRoute = roleRoutes[userRole] || redirectTo;
        router.push(targetRoute);
      }
    }
  }, [allowedRoles, isAuthenticated, isLoading, redirectTo, roleRoutes, router, user?.role_name]);

  // Show loading state while checking authentication/role
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if role check failed
  if (allowedRoles.length > 0 && user?.role_name) {
    const userRole = user.role_name.toLowerCase();
    const hasPermission = allowedRoles.some((role) => role.toLowerCase() === userRole);
    if (!hasPermission) {
      return null;
    }
  }

  return <>{children}</>;
}
