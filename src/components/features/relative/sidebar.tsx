'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, LogOut, User } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { relativePortalService } from '@/services/relative-portal.service';

interface RelativeSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function mapResidentStatusToThai(status?: string): string {
  const normalized = (status || '').trim().toLowerCase();
  if (normalized === 'active' || normalized === 'in_house') return 'พักอยู่ในศูนย์';
  if (normalized === 'inactive' || normalized === 'discharged' || normalized === 'checked_out') return 'ออกจากศูนย์แล้ว';
  return status || '-';
}

export function RelativeSidebar({ isOpen = true, onClose }: RelativeSidebarProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  const [elderInfo, setElderInfo] = useState({
    name: '-',
    gender: '-',
    age: 0,
    status: '-',
    profileImageUrl: '', 
  });

  useEffect(() => {
    const loadSidebarInfo = async () => {
      setIsLoading(true);
      try {
        const data = await relativePortalService.getPatientInfo();
        const normalizedGender = data.gender?.toLowerCase?.() || '';
        const genderText = normalizedGender === 'male' ? 'ชาย' : normalizedGender === 'female' ? 'หญิง' : data.gender || '-';

        const rawData = data as any;

        setElderInfo({
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || '-',
          gender: genderText,
          age: Math.max(data.age || 0, 0),
          status: mapResidentStatusToThai(data.status),
          profileImageUrl: rawData.profile_image || '', 
        });
      } catch {
        setElderInfo({
          name: '-',
          gender: '-',
          age: 0,
          status: '-',
          profileImageUrl: '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadSidebarInfo();
  }, []);

  const handleLogout = async () => {
    const residentId = localStorage.getItem('relative_portal_resident_id') || '';
    const token = localStorage.getItem('relative_portal_token') || '';

    const query = new URLSearchParams();
    if (residentId) query.set('resident_id', residentId);
    if (token) query.set('token', token);
    const backToMagicLogin = query.toString() ? `/relative/login?${query.toString()}` : '/relative/login';

    try {
      await authService.logout();
      router.push(backToMagicLogin);
    } catch {
      router.push(backToMagicLogin);
    }
  };

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-linear-to-b from-[#1E88E5] to-[#42A5F5] z-50 transition-transform duration-300 w-80 flex flex-col ${
          isOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        } lg:translate-x-0 lg:pointer-events-auto`}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white lg:hidden hover:bg-white/10 rounded-full p-2"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <Link href="/relative/dashboard" className="block">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 shrink-0 p-1">
              <Image
                src="/images/logo.png"
                alt="Elder Nursing Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                Elder Nursing
              </h1>
              <p className="text-white/90 text-xs">
                ระบบสำหรับติดตามอาการ
              </p>
            </div>
          </div>
        </div>
        </Link>

        <div className="flex-1 px-6 py-8 flex flex-col items-center">
          <div className="relative w-40 h-40 rounded-full bg-linear-to-br from-blue-300 to-blue-500 mb-6 overflow-hidden ring-4 ring-white/30 flex items-center justify-center">
            {isLoading ? (
              <div className="h-28 w-28 rounded-full bg-white/30 animate-pulse" />
            ) : elderInfo.profileImageUrl ? (
              <img 
                src={elderInfo.profileImageUrl} 
                alt={elderInfo.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  setElderInfo(prev => ({ ...prev, profileImageUrl: '' }));
                }}
              />
            ) : (
              <User size={80} className="text-white" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">
            {isLoading ? <span className="inline-block h-8 w-44 rounded bg-white/30 animate-pulse" /> : elderInfo.name}
          </h2>

          <p className="text-white/90 text-sm mb-8">
            {isLoading ? (
              <span className="inline-block h-5 w-36 rounded bg-white/30 animate-pulse" />
            ) : (
              <>เพศ {elderInfo.gender} | อายุ {elderInfo.age} ปี</>
            )}
          </p>

          <Link
            href="/relative/patient-info"
            className="text-white underline text-sm mb-6 hover:text-white/80 transition-colors"
          >
            {isLoading ? <span className="inline-block h-4 w-28 rounded bg-white/30 animate-pulse" /> : 'ประวัติผู้สูงอายุ'}
          </Link>

          <button className="bg-[#D4FDE7] text-green-700 font-light px-2 py-1 rounded-full transition-colors shadow-lg text-xs">
            {isLoading ? <span className="inline-block h-4 w-24 rounded bg-green-200 animate-pulse" /> : elderInfo.status}
          </button>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  );
}