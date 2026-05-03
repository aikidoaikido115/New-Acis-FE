import { notFound } from "next/navigation";
import Image from "next/image";

interface ManualContent {
  title: string;
  description: string;
  sections: {
    heading: string;
    content: string;
    image?: string;
  }[];
}

const manualData: Record<string, ManualContent> = {
  "manage-meal": {
    title: "จัดการมื้ออาหาร",
    description: "คู่มือการใช้งานหน้าจัดการมื้ออาหารสำหรับเจ้าหน้าที่ฝ่ายครัว",
    sections: [
      {
        heading: "ภาพรวมหน้าจัดการมื้ออาหาร",
        content:
          "หน้านี้ใช้สำหรับจัดเตรียมเมนูอาหารรายมื้อ (เช้า/กลางวัน/เย็น) โดยอ้างอิงจำนวนผู้พักและสถิติการแพ้อาหารล่าสุด พร้อมบันทึกเป็นแผนอาหารของแต่ละมื้อ",
      },
      {
        heading: "ขั้นตอนใช้งานหลัก",
        content:
          "1. เข้าเมนู 'จัดการมื้ออาหาร'\n2. ตรวจสอบสรุปจำนวนผู้พัก และสถิติแพ้อาหาร\n3. เลือกแท็บมื้ออาหารที่ต้องการ (เช้า/กลางวัน/เย็น)\n4. เลือกเมนูหลักและกรอกจำนวนเสิร์ฟ (บังคับกรอก)\n5. เพิ่มเมนูรองสำหรับผู้แพ้อาหารได้สูงสุด 1 รายการต่อมื้อ (ไม่บังคับ)\n6. กดบันทึกมื้อนั้น",
      },
      {
        heading: "การจัดการเมนู",
        content:
          "- ช่องเมนูหลักและเมนูรองรองรับการค้นหา\n- หากไม่พบเมนูที่ต้องการ สามารถสร้างเมนูใหม่จากปุ่ม + เพิ่มเมนูได้\n- ช่องจำนวนเสิร์ฟรับเฉพาะตัวเลขเท่านั้น",
      },
      {
        heading: "การใช้ข้อมูลแพ้อาหาร",
        content:
          "- กล่อง 'รายการการแพ้อาหารของผู้พักอาศัย' สามารถพับ/ขยายได้\n- รายการนี้ใช้เพื่อช่วยวางแผนเมนูรองและปริมาณอาหาร\n- ไม่แสดงข้อมูลระบุตัวบุคคลรายคนในหน้าจัดการมื้ออาหาร",
      },
      {
        heading: "โหมด AI ตรวจสอบแพ้อาหาร",
        content:
          "- ค่าเริ่มต้นจะเปิดการตรวจสอบความเสี่ยงแพ้อาหารโดย AI\n- หากติ๊ก 'ปิดระบบ AI ตรวจสอบการแพ้อาหาร' ระบบจะบันทึกแบบ manual โดยให้เจ้าหน้าที่ตรวจสอบเอง\n- กรณี AI แจ้งความเสี่ยง ระบบจะแสดงข้อความแจ้งเตือนเพื่อให้ทบทวนเมนูก่อนบันทึก",
      },
      {
        heading: "รายการแผนอาหารที่บันทึก (ประวัติ)",
        content:
          "1. กดปุ่ม [ รายการแผนอาหารที่บันทึก ]\n2. ค้นหาประวัติด้วยชื่อเมนู\n3. กรองด้วยวันที่และมื้ออาหาร\n4. ตรวจสอบเมนูหลัก/เมนูรอง จำนวนเสิร์ฟ และผู้ทำรายการ\n5. ใช้ปุ่มย้อนกลับเพื่อกลับไปหน้าจัดการมื้ออาหาร",
      },
      {
        heading: "ข้อจำกัดปัจจุบัน",
        content:
          "- หน้าประวัติเป็นการดูข้อมูลย้อนหลัง (ยังไม่รองรับแก้ไข/ลบจากหน้านี้)\n- เมนูรองรองรับ 1 รายการต่อมื้อในฟอร์มปัจจุบัน\n- หน้านี้เน้นการวางแผนระดับมื้อ ไม่ใช่การจัดเมนูรายบุคคล",
      },
    ],
  },
};

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ManualDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const content = manualData[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-headline-4 font-bold text-gray-800 mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.description}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
        {content.sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h2 className="text-headline-6 font-semibold text-gray-800">{section.heading}</h2>
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</div>
            {section.image && (
              <div className="mt-4">
                <Image
                  src={section.image}
                  alt={section.heading}
                  width={800}
                  height={600}
                  className="rounded-lg border border-gray-200 w-full"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-body-small text-gray-700">
          💡 <strong>เคล็ดลับ:</strong> ใช้เมนูด้านซ้ายเพื่อกลับไปยังหน้าคู่มือหลักได้อย่างรวดเร็ว
        </p>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(manualData).map((slug) => ({
    slug }));
}
