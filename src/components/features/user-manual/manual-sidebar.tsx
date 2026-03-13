"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Stethoscope, 
  Calendar,
  ClipboardList 
} from "lucide-react";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const manualSections: ManualSection[] = [
  {
    id: "dashboard",
    title: "แดชบอร์ด",
    icon: <LayoutDashboard size={32} />
  },
  {
    id: "elderly-management",
    title: "แก้ไขข้อมูลผู้สูงอายุ",
    icon: <Users size={32} />
  },
  {
    id: "medical-records",
    title: "เวชระเบียน",
    icon: <FileText size={32} />
  },
  {
    id: "medication",
    title: "จัดการยา",
    icon: <Stethoscope size={32} />
  },
  {
    id: "appointments",
    title: "ตารางกิจกรรม",
    icon: <Calendar size={32} />
  },
  {
    id: "care-plans",
    title: "ตั้งค่าส่วนตัว",
    icon: <ClipboardList size={32} />
  }
];

export function ManualSidebar() {
  const pathname = usePathname();
  
  const isActive = (sectionId: string) => {
    return pathname === `/user-manual/${sectionId}`;
  };

  return (
    <div className="w-full bg-white p-8">
      <h2 className="text-xl font-bold text-gray-800 mb-6">คู่มือการใช้งาน</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {manualSections.map((section) => (
          <Link
            key={section.id}
            href={`/user-manual/${section.id}`}
            className={`
              flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all text-gray-800 bg-white
              ${isActive(section.id)
                ? "border-[rgba(0,147,239,1)]"
                : "border-gray-200 hover:border-[rgba(0,147,239,1)]"
              }
            `}
          >
            <div className="flex items-center justify-center">
              {section.icon}
            </div>
            <span className="text-xs text-center font-medium leading-tight">
              {section.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
