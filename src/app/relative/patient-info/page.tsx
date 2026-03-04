'use client';
import { useState, type ReactNode } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { AlertTriangle,Calendar,ClipboardList,HeartPulse,IdCard,MapPin,Menu,Phone,Pill,ShieldCheck,User} from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { BackButton } from '@/components/features/relative/back-button';

type BasicInfoItem = {
  label: string;
  value: string;
  icon: ReactNode;
};

type Medication = {
  name: string;
  dose: string;
  frequency: string;
  notes: string;
};

type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
};

type PatientInfo = {
  fullName: string;
  nickname?: string;
  gender: string;
  birthDate: string;
  ageLabel: string;
  idNumber: string;
  address: string;
  chronicDiseases: string[];
  medications: Medication[];
  surgeries: string[];
  allergies: string[];
  foodAllergies: string[];
  adlScore: number;
  adlNote: string;
  cprStatus: string;
  emergencyHospital: string;
  emergencyHospitalPhone: string;
  emergencyContacts: EmergencyContact[];
};

type InfoItemProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm text-gray-700">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

const mockPatientInfo: PatientInfo = {
  fullName: 'สมชาย ศรีบุญเมือง',
  nickname: 'พล',
  gender: 'ชาย',
  birthDate: '15 มิถุนายน 2504',
  ageLabel: '63 ปี',
  idNumber: '1-1234-56789-01-2',
  address: 'ห้างหุ้นส่วนจำกัดท้องฟ้า เพื่อการดูแลผู้สูงอายุ และการพยาบาลฟ้าใหม่',
  chronicDiseases: ['ความดันโลหิตสูง', 'โรคหัวใจ', 'เบาหวาน Type 2'],
  medications: [
    { name: 'Amlodipine', dose: '5mg', frequency: '1 ครั้ง (เช้า)', notes: 'ก่อนอาหาร' },
    { name: 'Metformin', dose: '500mg', frequency: '2 ครั้ง (เช้า-เย็น)', notes: 'หลังอาหาร' },
    { name: 'Aspirin', dose: '81mg', frequency: '1 ครั้ง (เช้า)', notes: '-' },
    { name: 'Atorvastatin', dose: '20mg', frequency: '1 ครั้ง (ก่อนนอน)', notes: '-' },
  ],
  surgeries: ['ผ่าตัดนิ่วในถุงน้ำดี (2567)', 'เปลี่ยนข้อเข่าด้านซ้าย (2563)'],
  allergies: ['Penicillin', 'Sulfa drugs'],
  foodAllergies: ['อาหารทะเล'],
  adlScore: 75,
  adlNote: 'ยังสามารถช่วยเหลือตนเองได้',
  cprStatus: 'CPR',
  emergencyHospital: 'โรงพยาบาลศรีราชา',
  emergencyHospitalPhone: '02-419-7000',
  emergencyContacts: [
    { name: 'สมพร ศรีบุญเมือง', relation: 'บุตรสาว', phone: '081-234-5678' },
    { name: 'สมศักดิ์ ศรีบุญเมือง', relation: 'บุตรชาย', phone: '089-876-5432' },
  ],
};

export default function RelativePatientInfoPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patientInfo] = useState<PatientInfo>(mockPatientInfo);

  const displayName = patientInfo.nickname
    ? `${patientInfo.fullName} (${patientInfo.nickname})`
    : patientInfo.fullName;

  const basicInfoLeft: BasicInfoItem[] = [
    {
      label: 'ชื่อ - สกุล',
      value: displayName,
      icon: <User size={16} className="text-gray-500" />,
    },
    {
      label: 'วันเกิด',
      value: `${patientInfo.birthDate} (${patientInfo.ageLabel})`,
      icon: <Calendar size={16} className="text-gray-500" />,
    },
    {
      label: 'ที่อยู่',
      value: patientInfo.address,
      icon: <MapPin size={16} className="text-gray-500" />,
    },
  ];

  const basicInfoRight: BasicInfoItem[] = [
    {
      label: 'เพศ',
      value: patientInfo.gender,
      icon: <User size={16} className="text-gray-500" />,
    },
    {
      label: 'เลขบัตรประชาชน',
      value: patientInfo.idNumber,
      icon: <IdCard size={16} className="text-gray-500" />,
    },
  ];

  const adlPercent = Math.min(100, Math.max(0, patientInfo.adlScore));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-80 z-50 pointer-events-auto">
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
        <div className="flex-1 p-2 pt-20 lg:pt-8">
          <BackButton />

          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">ข้อมูลผู้สูงอายุ</h1>
            
            TODO: เปลี่ยน sectioncard เป็นดึงข้อมูลจริงจาก ระบบเจ้าหน้าที่
            {/* Basic Info */}
            <SectionCard title="ข้อมูลพื้นฐาน">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {basicInfoLeft.map((item) => (
                    <InfoItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
                <div className="space-y-4">
                  {basicInfoRight.map((item) => (
                    <InfoItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </div>
              </div>
            </SectionCard>

            {/* Medical Info */}
            <SectionCard title="ข้อมูลทางการแพทย์">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <HeartPulse size={16} className="text-gray-500" />
                    โรคประจำตัว
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patientInfo.chronicDiseases.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Pill size={16} className="text-gray-500" />
                    ยาที่ใช้ประจำ
                  </div>
                  <div className="overflow-hidden rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">ชื่อยา</th>
                          <th className="text-left px-3 py-2 font-medium">โดส</th>
                          <th className="text-left px-3 py-2 font-medium">ความถี่/วัน</th>
                          <th className="text-left px-3 py-2 font-medium">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientInfo.medications.map((med) => (
                          <tr key={med.name} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700">{med.name}</td>
                            <td className="px-3 py-2 text-gray-700">{med.dose}</td>
                            <td className="px-3 py-2 text-gray-700">{med.frequency}</td>
                            <td className="px-3 py-2 text-gray-700">{med.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <ClipboardList size={16} className="text-gray-500" />
                    ประวัติการผ่าตัด
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patientInfo.surgeries.map((item) => (
                      <span
                        key={item}
                        className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                      <AlertTriangle size={16} />
                      แพ้ยา
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patientInfo.allergies.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
                      <AlertTriangle size={16} />
                      แพ้อาหาร
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patientInfo.foodAllergies.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <ShieldCheck size={16} className="text-gray-500" />
                      การประเมินกิจวัตรประจำวัน (ADL)
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-blue-600 font-semibold">
                        {patientInfo.adlScore} / 100
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${adlPercent}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">{patientInfo.adlNote}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <ShieldCheck size={16} className="text-gray-500" />
                      การกู้ชีพเมื่อหยุดหายใจ
                    </div>
                    <span className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-emerald-500 text-white">
                      {patientInfo.cprStatus}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Emergency */}
            <SectionCard title="ความปลอดภัยฉุกเฉิน">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <HeartPulse size={16} className="text-gray-500" />
                    โรงพยาบาลกรณีฉุกเฉิน
                  </div>
                  <div className="flex items-center justify-between bg-red-50 border border-red-100 px-4 py-3 rounded-lg">
                    <span className="text-sm text-gray-700">{patientInfo.emergencyHospital}</span>
                    <span className="inline-flex items-center gap-2 text-sm text-red-600">
                      <Phone size={16} />
                      {patientInfo.emergencyHospitalPhone}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User size={16} className="text-gray-500" />
                    ผู้ติดต่อฉุกเฉิน
                  </div>
                  <div className="space-y-2">
                    {patientInfo.emergencyContacts.map((contact) => (
                      <div
                        key={contact.name}
                        className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                      >
                        <div>
                          <p className="text-sm text-gray-700">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.relation}</p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm text-blue-600">
                          <Phone size={16} />
                          {contact.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <AppFooterRelative />
      </div>
      {/* Sidebar for mobile */}
      <RelativeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
