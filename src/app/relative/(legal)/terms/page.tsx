'use client';

import { useState } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { Menu } from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { BackButton } from '@/components/features/relative/back-button';

// TODO: Import from constants when path alias works
const RELATIVE_TERMS_CONTENT = {
  title: "ข้อกำหนดการใช้งาน",
  latest_update: "12 กุมภาพันธ์ 2569",
  sections: [
    {
      title: "1. ขอบเขตการใช้งาน",
      content:
        "บัญชีผู้ใช้งานสำหรับญาติถูกจัดทำขึ้นเพื่อการติดตามข้อมูลผู้สูงอายุที่อยู่ในการดูแลของศูนย์ฯ เท่านั้น ผู้ใช้งานมีหน้าที่รับผิดชอบในการเก็บรักษาชื่อผู้ใช้และรหัสผ่านเป็นความลับ และต้องไม่เปิดเผยข้อมูลการเข้าสู่ระบบแก่บุคคลอื่น",
    },
    {
      title: "2. ข้อมูลการแสดงผล",
      content:
        "ผู้ใช้งานตกลงและรับทราบว่า:\n\n• ข้อมูลที่แสดงในระบบเป็นข้อมูลระดับสรุป เพื่อการรับรู้สถานะโดยรวม\n• บางรายละเอียดอาจไม่แสดงในระบบ เพื่อความเหมาะสม ความปลอดภัย และการป้องกันการตีความคลาดเคลื่อน\n• ศูนย์ฯ ขอสงวนสิทธิ์ในการปรับปรุงรูปแบบการแสดงผลข้อมูลให้เหมาะสมกับวัตถุประสงค์ของระบบ",
    },
    {
      title: "3. ข้อจำกัดการใช้งาน",
      content:
        "ห้ามคัดลอก บันทึกภาพหน้าจอ เผยแพร่ หรือส่งต่อข้อมูลจากระบบไปยังบุคคลภายนอก โดยไม่ได้รับอนุญาตจากศูนย์ฯ อย่างเป็นทางการ",
    },
    {
      title: "4. บันทึกการใช้งานและบทลงโทษ",
      content:
        "การใช้งานระบบอาจมีการบันทึกข้อมูลการใช้งาน (Log) เพื่อวัตถุประสงค์ด้านความปลอดภัย หากพบการใช้งานที่ไม่เหมาะสม หรือฝ่าฝืนข้อกำหนด ศูนย์ฯ ขอสงวนสิทธิ์ในการระงับหรือยกเลิกสิทธิ์การใช้งานโดยไม่ต้องแจ้งให้ทราบล่วงหน้า",
    },
  ],
};

export default function TermsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-80 z-50">
        <RelativeSidebar isOpen={true} />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-80 min-h-screen">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50"
        >
          <Menu size={24} />
        </button>
        {/* Content */}
        <div className="flex-1 p-8 pt-20 lg:pt-8">
        {/* Back Button */}
         <BackButton />
          <div className="max-w-4xl mx-auto">
            {/* Content Card */}
            <div className="bg-white rounded-2xl shadow-md p-8 md:p-12">
              {/* Header */}
              <div className="border-b border-gray-200 pb-6 mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {RELATIVE_TERMS_CONTENT.title}
                </h1>
                <p className="text-sm text-gray-500">
                  แก้ไขล่าสุดเมื่อ: {RELATIVE_TERMS_CONTENT.latest_update}
                </p>
              </div>

              {/* Content Sections */}
              <div className="space-y-8">
                {RELATIVE_TERMS_CONTENT.sections.map((section: any, index: number) => (
                  <div key={index} className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {section.title}
                    </h2>
                    <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-4">
                      {section.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <AppFooterRelative />
      </div>
      {/* Sidebar for mobile */}
      <RelativeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}