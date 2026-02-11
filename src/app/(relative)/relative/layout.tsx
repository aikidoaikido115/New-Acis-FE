'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RelativeLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const router = useRouter();

  useEffect(() => {
    // ตรวจสอบว่า login แล้วหรือยัง
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login/relative');
      return;
    }

    // ตรวจสอบว่ายอมรับ consent แล้วหรือยัง (ตาม user_id)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const consentAccepted = localStorage.getItem(`consent_accepted_${user.user_id}`);
      if (!consentAccepted) {
        router.push('/relative-consent');
      }
    } else {
      router.push('/login/relative');
    }
  }, [router]);

  return <>{children}</>;
}
