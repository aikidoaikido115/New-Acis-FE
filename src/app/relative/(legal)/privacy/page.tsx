'use client';

import { useState } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { Menu } from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { BackButton } from '@/components/features/relative/back-button';

const PRIVACY_CONTENT = {
  title: "นโยบายความเป็นส่วนตัว",
  latest_update: "12 กุมภาพันธ์ 2569",
  sections: [
    {
      title: "1. วัตถุประสงค์ของระบบ",
      content:
        "ระบบนี้จัดทำขึ้นเพื่อให้ญาติสามารถติดตาม สถานะโดยรวมของผู้สูงอายุที่อยู่ภายใต้การดูแลของศูนย์ฯ โดยข้อมูลที่แสดงในระบบจะเป็นข้อมูลในระดับสรุป เช่น สถานะสุขภาพเบื้องต้น การทำกิจกรรมประจำวัน การรับประทานอาหาร และการรับประทานยา เพื่อสนับสนุนการรับรู้ข้อมูลอย่างเหมาะสมและลดความกังวลที่อาจเกิดจากการตีความข้อมูลเชิงลึกทางการแพทย์",
    },
    {
      title: "2. การจัดเก็บและปกป้องข้อมูล",
      content:
        "ระบบมีการจัดเก็บและแสดงข้อมูลส่วนบุคคลและข้อมูลด้านสุขภาพเฉพาะที่จำเป็นต่อวัตถุประสงค์ดังกล่าว โดยข้อมูลทั้งหมดจะถูกจัดเก็บและดูแลรักษาอย่างปลอดภัย ตามมาตรฐานการคุ้มครองข้อมูลส่วนบุคคล (PDPA) และระเบียบของศูนย์ฯ",
    },
    {
      title: "3. การเข้าถึงข้อมูล",
      content:
        "การเข้าถึงข้อมูลในระบบของญาติ:\n\n• จำกัดเฉพาะข้อมูลของผู้สูงอายุที่มีความเกี่ยวข้องโดยตรงเท่านั้น\n• ไม่สามารถเข้าถึงข้อมูลของผู้สูงอายุรายอื่น\n• ไม่สามารถแก้ไข เปลี่ยนแปลง หรือเพิ่มข้อมูลทางการแพทย์ได้",
    },
    {
      title: "4. ข้อจำกัดการใช้งาน",
      content:
        "ข้อมูลที่แสดงในระบบ ไม่ใช้แทนคำวินิจฉัยหรือคำแนะนำทางการแพทย์ หากมีข้อสงสัยหรือความกังวลเกี่ยวกับอาการของผู้สูงอายุ ญาติควรติดต่อเจ้าหน้าที่ของศูนย์ฯ โดยตรง",
    },
  ],
};

export default function PrivacyPage() {
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
                  {PRIVACY_CONTENT.title}
                </h1>
                <p className="text-sm text-gray-500">
                  แก้ไขล่าสุดเมื่อ: {PRIVACY_CONTENT.latest_update}
                </p>
              </div>

              {/* Content Sections */}
              <div className="space-y-8">
                {PRIVACY_CONTENT.sections.map((section: any, index: number) => (
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
        <AppFooterRelative   />
      </div>
      {/* Sidebar for mobile */}
      <RelativeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}