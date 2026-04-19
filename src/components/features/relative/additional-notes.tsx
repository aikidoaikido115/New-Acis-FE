import { FileText } from 'lucide-react';

interface Note {
  id: string;
  text: string;
}

interface AdditionalNotesProps {
  notes?: Note[];
}

export function AdditionalNotes({ notes }: AdditionalNotesProps) {
  // Mock data ลบแล้วใส่ข้อมูลบันทึกจริงจาก API ใน emr ที่ พยาบาลบันทึกให้แต่ละคน
  const defaultNotes: Note[] = [
    {
      id: '1',
      text: 'วันนี้ร่าเริง แจ่มใส หน้าตาสดชื่น',
    },
    {
      id: '2',
      text: 'ทำกายภาพได้ตั้งแต่ต้นจนจบ',
    },
  ];

  const additionalNotes = notes || defaultNotes;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">บันทึกประจำวันสำหรับญาติ</h2>
      <ul className="space-y-2 list-disc list-inside">
        {additionalNotes.map((note) => (
          <li key={note.id} className="text-sm mt-4 text-gray-700">
            {note.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
