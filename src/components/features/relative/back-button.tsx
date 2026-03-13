'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  text?: string;
  href?: string;
}

export function BackButton({ text = 'ย้อนกลับ', href = '/relative/dashboard' }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-[#0093EF] hover:text-[#0082D4] font-medium transition-colors mb-6"
    >
      <ChevronLeft size={20} />
      <span>{text}</span>
    </button>
  );
}
