'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/shared/branding/staff-app-logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth.service';
import type { RegisterRequest } from '@/types/auth';

export default function ConsentPage() {
  const router = useRouter();
  const [isAccepted, setIsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const registrationData = sessionStorage.getItem('registrationData');
    if (!registrationData) {
      router.push('/register');
    }
  }, [router]);

  const handleBack = () => {
    router.push('/register');
  };

  const handleAccept = async () => {
    if (!isAccepted) return;

    setIsLoading(true);
    setError("");

    try {
      const registrationDataStr = sessionStorage.getItem('registrationData');
      const profileImageDataStr = sessionStorage.getItem('profileImageData');

      if (!registrationDataStr) {
        throw new Error('ไม่พบข้อมูลการลงทะเบียน');
      }

      const registrationData = JSON.parse(registrationDataStr);
      
      let profileImageFile: File | undefined = undefined;
      if (profileImageDataStr) {
        const response = await fetch(profileImageDataStr);
        const blob = await response.blob();
        profileImageFile = new File([blob], "profile.jpg", { type: blob.type });
      }

      const registerData: RegisterRequest = {
        username: registrationData.username,
        email: registrationData.email,
        password: registrationData.password,
        first_name: registrationData.first_name,
        last_name: registrationData.last_name,
        nickname: registrationData.nickname || undefined,
        role_name: registrationData.role_name,
        gender: registrationData.gender,
        profile_image: profileImageFile,
      };

      await authService.register(registerData);

      sessionStorage.removeItem('registrationData');
      sessionStorage.removeItem('profileImageData');

      router.push('/login?registered=true');
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'ลงทะเบียนไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linear-to-br from-[#1E88E5] to-[#42A5F5] p-6">
      <AppLogo />
      
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-[800px] mx-auto mt-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          ข้อกำหนดและนโยบายความเป็นส่วนตัว
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-6 max-h-[400px] overflow-y-auto px-4 mb-6 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              1. นโยบายความเป็นส่วนตัว (Privacy Policy)
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">
              ระบบนี้จัดทำขึ้นเพื่อสนับสนุนการดูแลผู้สูงอายุภายในศูนย์ฯ โดยมีการจัดเก็บข้อมูลส่วนบุคคล และข้อมูลด้านสุขภาพ เช่น ประวัติสุขภาพ ประวัติการรักษา และข้อมูลที่เกี่ยวข้อง เพื่อใช้สำหรับวัตถุประสงค์ทางการแพทย์ และการบริหารจัดการภายในศูนย์ฯ เท่านั้น ข้อมูลทั้งหมดจะถูกจัดเก็บและดูแลรักษาอย่างปลอดภัย ตามมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล (PDPA) และระเบียบของศูนย์ฯ การเข้าถึงข้อมูลจำกัดเฉพาะเจ้าหน้าที่ที่ได้รับมอบหมาย และเกี่ยวข้องกับการปฏิบัติงานเท่านั้น ห้ามเปิดเผยข้อมูลแก่บุคคลภายนอก โดยไม่ได้รับอนุญาตจากศูนย์ฯ อย่างเป็นทางการ
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">
              2. ข้อกำหนดการใช้งาน (Terms & Conditions)
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-justify">
              บัญชีผู้ใช้งานนี้จัดทำขึ้นสำหรับการใช้งานภายในศูนย์ฯ เท่านั้น ผู้ใช้งานมีหน้าที่เก็บรักษาชื่อผู้ใช้และรหัสผ่านเป็นความลับ และต้องไม่เปิดเผยให้บุคคลอื่นทราบ ห้ามคัดลอก นำออก หรือเผยแพร่ข้อมูลผู้ป่วย หรือข้อมูลภายในระบบไปใช้นอกวัตถุประสงค์ หรือโดยไม่ได้รับอนุญาตจากศูนย์ฯ การใช้งานระบบจะมีการบันทึกข้อมูลการใช้งาน (Log) เพื่อการตรวจสอบและความปลอดภัยของระบบ หากมีการฝ่าฝืนข้อกำหนด ศูนย์ฯ ขอสงวนสิทธิ์ในการดำเนินการตามระเบียบ และมาตรการที่กำหนดไว้
            </p>
          </div>
        </div>

        <div className="border-t pt-6 space-y-6">
          <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
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
              onClick={handleBack}
              disabled={isLoading}
              className="bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 disabled:opacity-50"
            >
              ย้อนกลับ
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              disabled={!isAccepted || isLoading}
              className="bg-[#4A8B6A] hover:bg-[#3d7357] text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "กำลังลงทะเบียน..." : "ยอมรับและลงทะเบียน"}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            * หากไม่ยอมรับข้อกำหนด คุณจะไม่สามารถลงทะเบียนเข้าใช้งานระบบได้
          </p>
        </div>
      </div>
    </div>
  );
}
