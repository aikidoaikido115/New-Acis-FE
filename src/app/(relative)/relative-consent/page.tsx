'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogoRelative } from '@/components/shared/branding/relative-app-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export default function ConsentPage() {
  const router = useRouter();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ตรวจสอบว่า login แล้วหรือยัง
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login/relative');
    }
  }, [router]);

  const handleAccept = () => {
    if (!isAccepted) return;
    
    setIsLoading(true);
    
    // บันทึกว่ายอมรับ consent แล้ว (แยกตาม user_id เพื่อไม่ต้องทำซ้ำ)
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      localStorage.setItem(`consent_accepted_${user.user_id}`, 'true');
    }
    
    // ไปหน้า dashboard
    router.push('/relative/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6">
      <AppLogoRelative />
      
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[800px] mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          ข้อกำหนดและนโยบายความเป็นส่วนตัว
        </h2>
        
        <div className="space-y-6 max-h-[400px] overflow-y-auto px-4 mb-6 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              1. นโยบายความเป็นส่วนตัว (Privacy Policy)
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">
              ระบบนี้จัดทำขึ้นเพื่อให้ญาติสามารถติดตาม สถานะโดยรวมของผู้สูงอายุที่อยู่ในการดูแลของศูนย์ฯ 
              ข้อมูลที่แสดงเป็นข้อมูลระดับสรุป เช่น สถานะสุขภาพ กิจกรรมประจำวัน การรับประทานอาหารและยา 
              ข้อมูลทั้งหมดได้รับการดูแลตามมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล (PDPA) 
              ผู้ใช้งานสามารถเข้าถึงได้เฉพาะข้อมูลของผู้สูงอายุที่เกี่ยวข้องเท่านั้น
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              2. ข้อกำหนดการใช้งาน (Terms & Conditions)
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">
              บัญชีผู้ใช้งานนี้ใช้สำหรับการติดตามข้อมูลผู้สูงอายุเท่านั้น 
              ผู้ใช้งานต้องเก็บรักษาข้อมูลการเข้าสู่ระบบเป็นความลับ 
              ห้ามคัดลอก บันทึกภาพ หรือเผยแพร่ข้อมูลในระบบให้บุคคลภายนอก 
              การใช้งานระบบถือว่าผู้ใช้งานยอมรับนโยบายและข้อกำหนดของศูนย์ฯ
            </p>
          </div>
        </div>

        <div className="border-t pt-6 space-y-6">
          <div className="flex items-start gap-3 bg-monochrome-50 p-4 rounded-lg">
            <Checkbox 
              id="accept-consent" 
              checked={isAccepted}
              onCheckedChange={(checked) => setIsAccepted(checked as boolean)}
              className="mt-1"
              disabled={isLoading}
            />
            <label 
              htmlFor="accept-consent" 
              className="text-sm text-gray-700 cursor-pointer select-none leading-relaxed font-medium"
            >
              ข้าพเจ้าได้อ่านและยอมรับ นโยบายความเป็นส่วนตัว และ ข้อกำหนดและเงื่อนไขการใช้งาน
            </label>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              type="button"
              onClick={handleAccept}
              disabled={!isAccepted || isLoading}
              className="bg-[#4A8B6A] hover:bg-[#3d7357] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยอมรับและดำเนินการต่อ
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            * หากไม่ยอมรับข้อกำหนด คุณจะไม่สามารถเข้าใช้งานระบบได้
          </p>
        </div>
      </div>
    </div>
  );
}
