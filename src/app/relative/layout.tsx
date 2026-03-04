'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/shared/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

export default function RelativeLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only check consent if authenticated
    if (isAuthenticated && user) {
      // ตรวจสอบว่ายอมรับ consent แล้วหรือยัง
      const consentAccepted = localStorage.getItem(`consent_accepted_${user.user_id}`);
      if (!consentAccepted) {
        router.push('/relative/consent');
      }
    }
  }, [router, isAuthenticated, user]);

  return (
    <ProtectedRoute allowedRoles={["relative", "Relative", "RELATIVE"]}>
      {children}
    </ProtectedRoute>
  );
}
