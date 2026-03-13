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
  dashboard: {
    title: "แดชบอร์ด",
    description: "คู่มือการใช้งานหน้าแดชบอร์ดหลักของระบบ",
    sections: [
      {
        heading: "ภาพรวมแดชบอร์ด",
        content: "หน้าแดชบอร์ดแสดงข้อมูลสรุปที่สำคัญของระบบ รวมถึงจำนวนผู้สูงอายุ การนัดหมาย และสถิติต่างๆ ที่ช่วยให้คุณเห็นภาพรวมของการดูแลได้อย่างรวดเร็ว",
      },
      {
        heading: "วิธีการใช้งาน",
        content: "1. เข้าสู่ระบบด้วยบัญชีผู้ใช้ของคุณ\n2. หน้าแดshบอร์ดจะแสดงทันทีหลังจากเข้าสู่ระบบ\n3. คลิกที่การ์ดต่างๆ เพื่อดูรายละเอียดเพิ่มเติม\n4. ใช้เมนูด้านซ้ายเพื่อเข้าถึงฟังก์ชันต่างๆ",
      },
    ],
  },
  "elderly-management": {
    title: "แก้ไขข้อมูลผู้สูงอายุ",
    description: "คู่มือการจัดการข้อมูลผู้สูงอายุในระบบ",
    sections: [
      {
        heading: "การเพิ่มผู้สูงอายุใหม่",
        content: "1. คลิกปุ่ม 'เพิ่มผู้สูงอายุ' ที่มุมขวาบน\n2. กรอกข้อมูลส่วนบุคคลที่จำเป็น\n3. อัปโหลดรูปภาพและเอกสารประกอบ\n4. คลิก 'บันทึก' เพื่อเพิ่มข้อมูล",
      },
      {
        heading: "การแก้ไขข้อมูล",
        content: "1. ค้นหาผู้สูงอายุที่ต้องการแก้ไข\n2. คลิกที่ชื่อหรือปุ่ม 'แก้ไข'\n3. ปรับเปลี่ยนข้อมูลตามต้องการ\n4. คลิก 'บันทึกการเปลี่ยนแปลง'",
      },
    ],
  },
  "medical-records": {
    title: "เวชระเบียน",
    description: "คู่มือการใช้งานระบบเวชระเบียนอิเล็กทรอนิกส์",
    sections: [
      {
        heading: "การดูเวชระเบียน",
        content: "1. เลือกผู้สูงอายุที่ต้องการดูประวัติ\n2. คลิกที่เมนู 'เวชระเบียน'\n3. ระบบจะแสดงประวัติการรักษาทั้งหมด\n4. คลิกที่รายการเพื่อดูรายละเอียดเพิ่มเติม",
      },
      {
        heading: "การบันทึกข้อมูลการรักษา",
        content: "1. คลิกปุ่ม 'บันทึกการรักษาใหม่'\n2. กรอกข้อมูลวันที่และเวลา\n3. ระบุอาการและการวินิจฉัย\n4. บันทึกยาและการรักษาที่ให้\n5. คลิก 'บันทึก' เพื่อเก็บข้อมูล",
      },
    ],
  },
  medication: {
    title: "จัดการยา",
    description: "คู่มือการบริหารจัดการยาในระบบ",
    sections: [
      {
        heading: "การเพิ่มรายการยา",
        content: "1. เข้าสู่หน้า 'จัดการยา'\n2. คลิกปุ่ม 'เพิ่มยาใหม่'\n3. กรอกชื่อยาและรายละเอียด\n4. ระบุจำนวนคงเหลือและวันหมดอายุ\n5. คลิก 'บันทึก'",
      },
      {
        heading: "การจ่ายยา",
        content: "1. เลือกผู้สูงอายุที่ต้องการจ่ายยา\n2. คลิก 'จ่ายยา'\n3. เลือกรายการยาและระบุจำนวน\n4. กรอกคำแนะนำการใช้ยา\n5. ยืนยันการจ่ายยา",
      },
    ],
  },
  appointments: {
    title: "ตารางกิจกรรม",
    description: "คู่มือการจัดการตารางนัดหมายและกิจกรรม",
    sections: [
      {
        heading: "การสร้างนัดหมาย",
        content: "1. คลิกที่วันที่ต้องการในปฏิทิน\n2. เลือก 'สร้างนัดหมายใหม่'\n3. กรอกรายละเอียดนัดหมาย\n4. เลือกผู้สูงอายุที่เกี่ยวข้อง\n5. คลิก 'บันทึก'",
      },
      {
        heading: "การดูตารางนัดหมาย",
        content: "1. เข้าสู่หน้า 'ตารางกิจกรรม'\n2. เลือกมุมมองที่ต้องการ (วัน/สัปดาห์/เดือน)\n3. คลิกที่นัดหมายเพื่อดูรายละเอียด\n4. สามารถแก้ไขหรือยกเลิกนัดหมายได้",
      },
    ],
  },
  "care-plans": {
    title: "แผนการดูแล",
    description: "คู่มือการจัดทำและติดตามแผนการดูแลผู้สูงอายุ",
    sections: [
      {
        heading: "การสร้างแผนการดูแล",
        content: "1. เลือกผู้สูงอายุที่ต้องการทำแผน\n2. คลิก 'สร้างแผนการดูแลใหม่'\n3. กำหนดเป้าหมายการดูแล\n4. ระบุกิจกรรมและความถี่\n5. กำหนดผู้รับผิดชอบ\n6. คลิก 'บันทึกแผน'",
      },
      {
        heading: "การติดตามผล",
        content: "1. เข้าสู่หน้าแผนการดูแล\n2. คลิกที่แผนที่ต้องการติดตาม\n3. บันทึกความคืบหน้า\n4. ปรับแผนตามความเหมาะสม\n5. บันทึกการเปลี่ยนแปลง",
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.description}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-8 space-y-8">
        {content.sections.map((section, index) => (
          <div key={index} className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-800">{section.heading}</h2>
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
        <p className="text-sm text-gray-700">
          💡 <strong>เคล็ดลับ:</strong> ใช้เมนูด้านซ้ายเพื่อเรียกดูคู่มือส่วนอื่นๆ ของระบบ
        </p>
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(manualData).map((slug) => ({
    slug,
  }));
}
