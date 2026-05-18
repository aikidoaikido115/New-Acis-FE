import { notFound } from "next/navigation";
import { ManualDetailContent, type ManualSection } from "@/components/features/user-manual/ManualDetailContent";

interface ManualContent {
  title: string;
  description: string;
  sections: ManualSection[];
}

const manualData: Record<string, ManualContent> = {
  "manage-meal": {
    title: "จัดการมื้ออาหาร",
    description: "คู่มือฉบับละเอียดสำหรับเจ้าหน้าที่ครัว: วางแผนเมนู บันทึกจำนวนเสิร์ฟ ตรวจความเสี่ยงแพ้อาหาร และทบทวนประวัติ",
    sections: [
      {
        heading: "เป้าหมายของโมดูลจัดการมื้ออาหาร",
        content:
          "โมดูลนี้ใช้วางแผนเมนูรายมื้อ (เช้า/กลางวัน/เย็น) ให้สอดคล้องกับจำนวนผู้พักอาศัยและข้อมูลความเสี่ยงแพ้อาหาร\n\nผลลัพธ์ที่ต้องได้ในแต่ละมื้อคือ\n- มีเมนูหลักที่ชัดเจน\n- มีจำนวนเสิร์ฟที่พอเพียง\n- มีแนวทางรองรับผู้แพ้อาหาร (เมนูรอง)\n- มีข้อมูลบันทึกย้อนกลับได้",
        image: "/images/manual/kitchen/manage-meal/manage-meal-01-overview.png",
        caption: "ภาพรวมหน้าจัดการมื้ออาหารสำหรับเริ่มวางแผนรายมื้อ",
      },
      {
        heading: "ขั้นตอนทำงานหลักต่อ 1 มื้อ",
        content:
          "1. เปิดเมนู จัดการมื้ออาหาร\n2. ตรวจสอบสรุปจำนวนผู้พักและข้อมูลแพ้อาหารด้านบน\n3. เลือกแท็บมื้อที่ต้องการทำงาน (เช้า/กลางวัน/เย็น)\n4. เลือกเมนูหลัก และกรอกจำนวนเสิร์ฟ (ตัวเลขเท่านั้น)\n5. หากจำเป็น ให้เพิ่มเมนูรองสำหรับผู้แพ้อาหาร\n6. ตรวจสอบความถูกต้องทั้งหมดก่อนบันทึก\n7. กดบันทึก และเช็กผลลัพธ์ว่ารายการแสดงในประวัติได้",
        image: "/images/manual/kitchen/manage-meal/manage-meal-02-main-flow.png",
        caption: "ลำดับการทำงานหลักตั้งแต่เลือกเมนูจนบันทึกสำเร็จ",
      },
      {
        heading: "การใช้ข้อมูลแพ้อาหารอย่างถูกวิธี",
        content:
          "- ดูกล่องสรุปรายการแพ้อาหารก่อนเลือกเมนูทุกครั้ง\n- หากมีผู้แพ้อาหารกลุ่มใหญ่ ให้พิจารณาเมนูหลักที่ปลอดภัยกว่าเพื่อลดงานแยก\n- ใช้เมนูรองเพื่อชดเชยเฉพาะกรณีจำเป็น\n- ห้ามบันทึกเมนูแบบคาดเดาเมื่อข้อมูลแพ้อาหารยังไม่ชัดเจน ให้ประสานทีมพยาบาลก่อน",
        image: "/images/manual/kitchen/manage-meal/manage-meal-03-allergy-panel.png",
        caption: "ตัวอย่างกล่องข้อมูลแพ้อาหารและการเลือกเมนูรอง",
      },
      {
        heading: "โหมด AI ตรวจสอบแพ้อาหาร",
        content:
          "ค่าเริ่มต้นระบบจะเปิด AI ตรวจสอบความเสี่ยงแพ้อาหาร\n\nแนวทางใช้งาน\n1. เปิดโหมด AI ในงานประจำ เพื่อช่วยคัดกรองความเสี่ยงเบื้องต้น\n2. หากปิด AI หมายถึงทีมครัวต้องตรวจทานเองทั้งหมดแบบ manual\n3. เมื่อระบบแจ้งเตือนความเสี่ยง ให้หยุดทบทวนเมนูก่อนบันทึก\n4. หากจำเป็นต้องบันทึกต่อ ควรมีเหตุผลประกอบและแจ้งทีมที่เกี่ยวข้อง",
        image: "/images/manual/kitchen/manage-meal/manage-meal-04-ai-warning.png",
        caption: "ตัวอย่างแจ้งเตือน AI เมื่อตรวจพบความเสี่ยงแพ้อาหาร",
      },
      {
        heading: "การทบทวนประวัติแผนอาหาร",
        content:
          "1. เปิดหน้ารายการแผนอาหารที่บันทึก\n2. ค้นหาด้วยชื่อเมนู หรือกรองตามวันและมื้อ\n3. ตรวจสอบเมนูหลัก เมนูรอง จำนวนเสิร์ฟ และผู้บันทึก\n4. ใช้ข้อมูลนี้เพื่อวางแผนวัตถุดิบและปรับปรุงเมนูในรอบถัดไป",
        image: "/images/manual/kitchen/manage-meal/manage-meal-05-history.png",
        caption: "ตัวอย่างหน้าประวัติแผนอาหารและการกรองข้อมูลย้อนหลัง",
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
      <ManualDetailContent title={content.title} description={content.description} sections={content.sections} />
    </div>
  );
}

export function generateStaticParams() {
  return Object.keys(manualData).map((slug) => ({
    slug,
  }));
}
