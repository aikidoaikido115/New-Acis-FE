'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function RelativeLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Routes that don't need authentication
  const publicRelativeRoutes = ['/relative/login', '/relative/register'];
  const isPublicRoute = publicRelativeRoutes.includes(pathname);

  useEffect(() => {
    // Only check consent if authenticated
    if (isAuthenticated && user) {
      // ตรวจสอบว่ายอมรับ consent แล้วหรือยัง
      const consentAccepted = localStorage.getItem(`consent_accepted_${user.user_id}`);
      if (!consentAccepted && pathname !== '/relative/consent') {
        router.push('/relative/consent');
      }
    }
  }, [router, isAuthenticated, user, pathname]);

  // If it's a public route, don't wrap with ProtectedRoute
  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <ProtectedRoute allowedRoles={["relative", "Relative", "RELATIVE"]}>
      {children}
    </ProtectedRoute>
  );
}
