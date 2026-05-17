import { notFound } from "next/navigation";
import Image from "next/image";

interface ManualSection {
  heading: string;
  content: string;
  image?: string;
  caption?: string;
}

interface ManualContent {
  title: string;
  description: string;
  sections: ManualSection[];
}

const manualData: Record<string, ManualContent> = {
  dashboard: {
    title: "แดชบอร์ด",
    description: "แนวทางใช้งานหน้าแดชบอร์ดสำหรับเริ่มเวร เช็กงานเร่งด่วน และติดตามภาพรวมประจำวัน",
    sections: [
      {
        heading: "เป้าหมายของหน้านี้",
        content:
          "แดชบอร์ดเป็นหน้าเริ่มต้นที่ใช้สรุปสถานะงานของทีมพยาบาลในวันนั้น เช่น จำนวนผู้พักอาศัย รายการที่ต้องติดตามทันที และทางลัดไปยังโมดูลสำคัญ\n\nแนะนำให้เริ่มทุกกะงานจากหน้านี้ก่อน เพื่อจัดลำดับความสำคัญงานได้เร็วขึ้น",
        image: "/images/manual/nurse/dashboard/dashboard-01-overview.png",
        caption: "ภาพรวมหน้าแดชบอร์ดสำหรับตรวจสถานะงานก่อนเริ่มเวร",
      },
    ],
  },
  "elderly-management": {
    title: "ข้อมูลผู้สูงอายุ",
    description: "คู่มือการเพิ่ม แก้ไข และตรวจสอบข้อมูลผู้พักอาศัยให้ถูกต้องครบถ้วน",
    sections: [
      {
        heading: "การเพิ่มผู้พักอาศัยใหม่",
        content:
          "1. เข้าหน้า ข้อมูลผู้สูงอายุ และกดปุ่มเพิ่มข้อมูล\n2. กรอกข้อมูลพื้นฐานให้ครบ: ชื่อ-สกุล, ห้องพัก, วันเกิด, เพศ, ข้อมูลติดต่อฉุกเฉิน\n3. ตรวจสอบข้อมูลสำคัญด้านการดูแล: โรคประจำตัว, ประวัติแพ้ยา/อาหาร, ข้อจำกัดการเคลื่อนไหว\n4. แนบข้อมูลประกอบที่จำเป็น (ถ้ามี)\n5. กดบันทึก และตรวจสอบว่ารายชื่อปรากฏในตารางเรียบร้อย",
        image: "/images/manual/nurse/elderly/elderly-01-create-form.png",
        caption: "แบบฟอร์มเพิ่มผู้พักอาศัยใหม่พร้อมฟิลด์สำคัญที่ต้องกรอก",
      },
      {
        heading: "การแก้ไขข้อมูลเดิมอย่างปลอดภัย",
        content:
          "1. ค้นหาผู้พักอาศัยจากชื่อ ห้อง หรือข้อมูลระบุตัวตน\n2. เปิดหน้ารายละเอียดและกดแก้ไข\n3. ปรับเฉพาะฟิลด์ที่ยืนยันแล้วว่าเปลี่ยนจริง\n4. บันทึก และทวนสอบหน้ารายละเอียดอีกครั้ง\n5. หากแก้ไขข้อมูลสำคัญ (ยา/แพ้ยา/ติดต่อฉุกเฉิน) ให้แจ้งทีมที่เกี่ยวข้องทันที",
        image: "/images/manual/nurse/elderly/elderly-02-edit-safe.png",
        caption: "ตัวอย่างหน้ารายละเอียดและจุดแก้ไขข้อมูลอย่างปลอดภัย",
      },
    ],
  },
  "medical-records": {
    title: "เวชระเบียน (EMR)",
    description: "แนวทางบันทึกและตรวจสอบข้อมูลการดูแลใน EMR ให้ครบถ้วน ถูกต้อง และตรวจสอบย้อนหลังได้",
    sections: [
      {
        heading: "ภาพรวมการทำงานใน EMR",
        content:
          "EMR ใช้จัดเก็บข้อมูลดูแลรายวัน เช่น สัญญาณชีพ บันทึกพยาบาล คำสั่งแพทย์ และข้อมูลติดตามอื่น ๆ\n\nหลักสำคัญคือบันทึกให้เร็วพอ และถูกต้องพอ พร้อมเวลาและบริบทที่ชัดเจน",
        image: "/images/manual/nurse/emr/emr-01-overview.png",
        caption: "ภาพรวมหน้า EMR และแถบข้อมูลที่ใช้บ่อย",
      },
      {
        heading: "ขั้นตอนบันทึกที่แนะนำ",
        content:
          "1. เลือกผู้พักอาศัยให้ถูกต้องก่อนทุกครั้ง\n2. เลือกประเภทบันทึกให้ตรงเหตุการณ์ (เช่น Vital Signs, Nurse Note, Doctor Order)\n3. กรอกข้อมูลโดยใช้หน่วยมาตรฐานและเวลาจริง\n4. อ่านทวนก่อนบันทึก โดยเฉพาะตัวเลขสำคัญและข้อความอธิบายอาการ\n5. บันทึกแล้วตรวจสอบว่ารายการขึ้นในไทม์ไลน์",
        image: "/images/manual/nurse/emr/emr-02-entry-steps.png",
        caption: "ตัวอย่างลำดับการบันทึกข้อมูล EMR จากต้นจนจบ",
      },
      {
        heading: "หลักการเขียนบันทึกที่ดี",
        content:
          "- เขียนข้อเท็จจริง ไม่คาดเดา\n- แยกอาการที่สังเกตได้ ออกจากการประเมิน\n- ระบุเวลา เหตุการณ์ การตอบสนองต่อการดูแล\n- หากมีเหตุเร่งด่วน ให้ระบุการส่งต่อหรือการแจ้งแพทย์อย่างชัดเจน\n- หลีกเลี่ยงคำย่อที่ทำให้ตีความหลายแบบ",
        image: "/images/manual/nurse/emr/emr-03-writing-standard.png",
        caption: "ตัวอย่างรูปแบบการเขียนบันทึกที่ตรวจสอบย้อนหลังได้ง่าย",
      },
    ],
  },
  medication: {
    title: "จัดการยา",
    description: "วิธีใช้งานหน้าจัดการยา ตั้งแต่การให้ยา แก้ไขรายการยา ไปจนถึงตรวจสอบประวัติการให้ยา",
    sections: [
      {
        heading: "โครงสร้างหน้าใช้งาน",
        content:
          "โมดูลจัดการยาแบ่งหลัก ๆ เป็น 3 ส่วน\n1. หน้าการให้ยาตามช่วงเวลา\n2. หน้าจัดการ/แก้ไขรายการยา\n3. หน้าประวัติการให้ยาเพื่อทบทวนย้อนหลัง",
        image: "/images/manual/nurse/medication/medication-01-overview.png",
        caption: "ภาพรวมองค์ประกอบหลักของหน้าจัดการยา",
      },
      {
        heading: "ขั้นตอนการให้ยา",
        content:
          "1. เลือกช่วงเวลาให้ยาที่ถูกต้อง\n2. ตรวจสอบผู้พักอาศัย ชื่อยา ขนาดยา และเวลาที่ต้องให้\n3. กดให้ยารายรายการ หรือให้ยาทั้งหมดตามความเหมาะสม\n4. หากงดยา ต้องระบุเหตุผลให้ชัดเจน\n5. ตรวจสอบสถานะหลังบันทึกว่าระบบอัปเดตแล้ว",
        image: "/images/manual/nurse/medication/medication-02-administer-flow.png",
        caption: "ตัวอย่างขั้นตอนการให้ยาและการยืนยันสถานะหลังบันทึก",
      },
      {
        heading: "การเพิ่ม/แก้ไขรายการยา",
        content:
          "1. เปิดหน้าจัดการข้อมูลยา\n2. กดเพิ่มยาใหม่ หรือแก้ไขรายการเดิม\n3. กรอกความถี่ ช่วงเวลา และ timing ก่อน/หลังอาหารให้ครบ\n4. บันทึกและทวนรายการในหน้าหลักอีกครั้ง\n5. หากมีการเปลี่ยนแผนยา ให้แจ้งทีมที่เกี่ยวข้องทันที",
        image: "/images/manual/nurse/medication/medication-03-edit-plan.png",
        caption: "ตัวอย่างฟอร์มแก้ไขรายการยาและค่าที่ต้องทวนก่อนบันทึก",
      },
    ],
  },
  appointments: {
    title: "ตารางกิจกรรม",
    description: "คู่มือจัดการตารางกิจกรรม การนัดหมาย และการติดตามความต่อเนื่องของกิจกรรมรายวัน",
    sections: [
      {
        heading: "สร้างกิจกรรม/นัดหมาย",
        content:
          "1. เลือกวันที่จากปฏิทิน\n2. เพิ่มกิจกรรมและกำหนดช่วงเวลา\n3. ใส่รายละเอียดจำเป็น เช่น สถานที่ กลุ่มเป้าหมาย\n4. บันทึกและตรวจสอบในมุมมองปฏิทิน",
        image: "/images/manual/nurse/activity/activity-01-create.png",
        caption: "ตัวอย่างการสร้างกิจกรรมใหม่จากปฏิทิน",
      },
      {
        heading: "การติดตามและปรับแผน",
        content:
          "1. ตรวจสอบกิจกรรมของวันปัจจุบันก่อนเริ่มเวร\n2. แก้ไขเวลาหรือข้อมูลเมื่อมีการเปลี่ยนแปลงจริง\n3. หากยกเลิกกิจกรรม ให้ระบุสาเหตุและแจ้งผู้เกี่ยวข้อง\n4. ใช้ข้อมูลย้อนหลังประเมินความสม่ำเสมอของแผนดูแล",
        image: "/images/manual/nurse/activity/activity-02-follow-up.png",
        caption: "ตัวอย่างการติดตามสถานะกิจกรรมและการปรับแผน",
      },
      {
        heading: "แนวปฏิบัติทีมงาน",
        content:
          "- ตั้งชื่อกิจกรรมให้สื่อความหมาย\n- หลีกเลี่ยงเวลาซ้อนกับงานดูแลหลัก\n- ตรวจสอบปฏิทินร่วมก่อนเพิ่มกิจกรรมใหม่",
        image: "/images/manual/nurse/activity/activity-03-team-rules.png",
        caption: "ตัวอย่างรูปแบบกิจกรรมที่ตั้งชื่อและชัดเจน",
      },
    ],
  },
  "care-plans": {
    title: "ตั้งค่าส่วนตัว",
    description: "แนวทางจัดการข้อมูลโปรไฟล์และความปลอดภัยบัญชีผู้ใช้งานสำหรับเจ้าหน้าที่",
    sections: [
      {
        heading: "การดูแลโปรไฟล์",
        content:
          "1. เข้าหน้าตั้งค่าส่วนตัว\n2. อัปเดตข้อมูลติดต่อและรูปโปรไฟล์ให้เป็นปัจจุบัน\n3. บันทึกและตรวจสอบการแสดงผล",
        image: "/images/manual/nurse/profile/profile-01-update.png",
        caption: "ตัวอย่างการแก้ไขโปรไฟล์และตรวจผลลัพธ์หลังบันทึก",
      },
      {
        heading: "ความปลอดภัยบัญชี",
        content:
          "1. ใช้รหัสผ่านที่เดายากและไม่ซ้ำระบบอื่น\n2. เปลี่ยนรหัสผ่านทันทีเมื่อสงสัยว่าบัญชีมีความเสี่ยง\n3. ออกจากระบบทุกครั้งเมื่อใช้อุปกรณ์ร่วม\n4. ไม่แชร์บัญชีกับผู้อื่น",
        image: "/images/manual/nurse/profile/profile-02-security.png",
        caption: "ตัวอย่างแนวทางตั้งค่าความปลอดภัยบัญชีผู้ใช้งาน",
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
                {section.caption && <p className="mt-2 text-sm text-gray-500">{section.caption}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(manualData).map((slug) => ({
    slug,
  }));
}
