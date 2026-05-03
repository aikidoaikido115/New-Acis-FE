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
          "หน้านี้ช่วยให้เจ้าหน้าที่ฝ่ายครัวสามารถวางแผนและจัดเตรียมอาหารสำหรับผู้ใช้งานทุกคนในแต่ละวันได้อย่างมีประสิทธิภาพ โดยจะแสดงสถิติรวมของกลุ่มอาการแพ้อาหาร (เช่น แพ้กุ้ง 2 คน) เพื่อให้คุณกำหนดเมนูหลัก เมนูรอง และจำนวนอาหารที่ต้องเตรียมสำหรับแต่ละกลุ่มได้อย่างเหมาะสม",
      },
      {
        heading: "วิธีการใช้งาน",
        content:
          "1. เข้าสู่ระบบด้วยบัญชีผู้ใช้ฝ่ายครัว\n2. ไปที่เมนู 'จัดการมื้ออาหาร'\n3. ตรวจสอบสถิติกลุ่มอาการแพ้อาหารที่แสดงบนหน้าจอ\n4. กำหนดเมนูหลัก/เมนูรอง และจำนวนอาหารที่ต้องเตรียมสำหรับแต่ละกลุ่ม\n5. ใช้ข้อมูลนี้ในการวางแผนและผลิตอาหารประจำวัน",
      },
      {
        heading: "หน้าที่หลัก",
        content:
          "รวบรวมข้อมูลสถานะการแพ้อาหารล่าสุดของผู้ใช้ที่พักอยู่ในศูนย์ดูแลผู้สูงอายุ เพื่อสรุปเป็นจำนวนคนรวมในแต่ละกลุ่มอาการแพ้",
      },
      {
        heading: "ข้อควรรู้",
        content:
          "- หน้านี้จะแสดงเฉพาะข้อมูลสถิติจำนวนรวม ไม่แสดงรายชื่อบุคคล\n- ไม่สามารถดูหรือแก้ไขข้อมูลส่วนตัวรายคน หรือกำหนดเมนูเฉพาะบุคคลได้\n- ข้อมูลที่แสดงจะอัปเดตตามสถานะล่าสุดของผู้ใช้งานที่ยังพักอยู่ในศูนย์ดูแลผู้สูงอายุเท่านั้น",
      },
      {
        heading: "ข้อจำกัด (Non-scope)",
        content:
          "หน้านี้ไม่รองรับการแสดงรายละเอียดรายชื่อบุคคล, การตรวจสอบข้อมูลส่วนตัวรายคน, หรือการกำหนดเมนูเฉพาะเจาะจงสำหรับบุคคล",
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
