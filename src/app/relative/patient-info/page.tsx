'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { RelativeSidebar } from '@/components/features/relative/sidebar';
import { AlertTriangle,Calendar,ClipboardList,HeartPulse,IdCard,MapPin,Menu,Phone,Pill,ShieldCheck,User} from 'lucide-react';
import { AppFooterRelative } from '@/components/features/relative/footer-relative';
import { BackButton } from '@/components/features/relative/back-button';
import { relativePortalService, type RelativePatientInfoData } from '@/services/relative-portal.service';

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

type EmergencyHospital = {
  name: string;
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
  cprStatus: string;
  emergencyHospitals: EmergencyHospital[];
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

function PatientInfoSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-32 rounded bg-gray-200 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-5 w-full rounded bg-gray-200 animate-pulse" />
            <div className="h-5 w-10/12 rounded bg-gray-200 animate-pulse" />
            <div className="h-5 w-9/12 rounded bg-gray-200 animate-pulse" />
          </div>
          <div className="space-y-4">
            <div className="h-5 w-9/12 rounded bg-gray-200 animate-pulse" />
            <div className="h-5 w-10/12 rounded bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-36 rounded bg-gray-200 animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-24 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-24 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-24 w-full rounded bg-gray-200 animate-pulse" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="h-6 w-40 rounded bg-gray-200 animate-pulse mb-6" />
        <div className="space-y-4">
          <div className="h-20 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-20 w-full rounded bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

const toTelHref = (phone: string) => phone.replace(/[^0-9+]/g, "");

function formatThaiDateFromISO(value?: string): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ][parsed.getMonth()];
  const year = parsed.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

function mapGender(gender?: string): string {
  const normalized = (gender || '').trim().toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'ชาย';
  if (normalized === 'female' || normalized === 'f') return 'หญิง';
  return gender || '-';
}

function toPatientInfoView(data: RelativePatientInfoData): PatientInfo {
  const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || '-';

  return {
    fullName,
    nickname: data.nickname,
    gender: mapGender(data.gender),
    birthDate: formatThaiDateFromISO(data.date_of_birth),
    ageLabel: `${Math.max(data.age || 0, 0)} ปี`,
    idNumber: data.id_card_number || '-',
    address: data.purpose_of_stay || '-',
    chronicDiseases: data.pre_existing_conditions || [],
    medications: data.medications || [],
    surgeries: data.surgical_history || [],
    allergies: data.drug_allergies || [],
    foodAllergies: data.food_allergies || [],
    cprStatus: data.resuscitation_status || '-',
    emergencyHospitals:
      data.emergency_hospitals && data.emergency_hospitals.length > 0
        ? data.emergency_hospitals
        : data.emergency_hospital || data.emergency_hospital_phone
          ? [{
              name: data.emergency_hospital || '-',
              phone: data.emergency_hospital_phone || '-',
            }]
          : [],
    emergencyContacts: data.emergency_contacts || [],
  };
}

export default function RelativePatientInfoPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await relativePortalService.getPatientInfo();
        setPatientInfo(toPatientInfoView(data));
      } catch {
        setError('ไม่สามารถโหลดข้อมูลผู้สูงอายุได้');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPatientInfo();
  }, []);

  const isInitialLoading = isLoading && !patientInfo;

  const displayPatientInfo: PatientInfo = patientInfo || {
    fullName: '-',
    gender: '-',
    birthDate: '-',
    ageLabel: '-',
    idNumber: '-',
    address: '-',
    chronicDiseases: [],
    medications: [],
    surgeries: [],
    allergies: [],
    foodAllergies: [],
    cprStatus: '-',
    emergencyHospitals: [],
    emergencyContacts: [],
  };

  const displayName = displayPatientInfo.nickname
    ? `${displayPatientInfo.fullName} (${displayPatientInfo.nickname})`
    : displayPatientInfo.fullName;

  const basicInfoLeft: BasicInfoItem[] = [
    {
      label: 'ชื่อ - สกุล',
      value: displayName,
      icon: <User size={16} className="text-gray-500" />,
    },
    {
      label: 'วันเกิด',
      value: `${displayPatientInfo.birthDate} (${displayPatientInfo.ageLabel})`,
      icon: <Calendar size={16} className="text-gray-500" />,
    },
    {
      label: 'ที่อยู่',
      value: displayPatientInfo.address,
      icon: <MapPin size={16} className="text-gray-500" />,
    },
  ];

  const basicInfoRight: BasicInfoItem[] = [
    {
      label: 'เพศ',
      value: displayPatientInfo.gender,
      icon: <User size={16} className="text-gray-500" />,
    },
    {
      label: 'เลขบัตรประชาชน',
      value: displayPatientInfo.idNumber,
      icon: <IdCard size={16} className="text-gray-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block fixed top-0 left-0 h-full w-80 z-50 pointer-events-auto">
        <RelativeSidebar isOpen={true} />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-80 min-h-screen min-w-0">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50"
        >
          <Menu size={24} />
        </button>

        {/* Content */}
        <div className="flex-1 px-6 py-6 pt-20 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
            <BackButton />

          <div className="max-w-full space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">ประวัติผู้สูงอายุ</h1>

            {isInitialLoading && <PatientInfoSkeleton />}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-600">
                {error}
              </div>
            )}
            
            {/* TODO: เปลี่ยน sectioncard เป็นดึงข้อมูลจริงจาก ระบบเจ้าหน้าที่ */}
            {/* Basic Info */}
            {!isInitialLoading && (
            <>
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
                    {displayPatientInfo.chronicDiseases.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-600"
                      >
                        {item}
                      </span>
                    ))}
                    {displayPatientInfo.chronicDiseases.length === 0 && (
                      <span className="text-sm text-gray-500">ไม่มีข้อมูล</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Pill size={16} className="text-gray-500" />
                    ยาที่ใช้ประจำ
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">ชื่อยา</th>
                          <th className="text-left px-3 py-2 font-medium">ปริมาณ/ขนาด</th>
                          <th className="text-left px-3 py-2 font-medium">ความถี่/วัน</th>
                          <th className="text-left px-3 py-2 font-medium">หมายเหตุ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayPatientInfo.medications.map((med, index) => (
                          <tr key={`${med.name}-${med.dose}-${med.frequency}-${index}`} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-700">{med.name}</td>
                            <td className="px-3 py-2 text-gray-700">{med.dose}</td>
                            <td className="px-3 py-2 text-gray-700">{med.frequency}</td>
                            <td className="px-3 py-2 text-gray-700">{med.notes}</td>
                          </tr>
                        ))}
                        {displayPatientInfo.medications.length === 0 && (
                          <tr className="border-t border-gray-100">
                            <td className="px-3 py-3 text-gray-500" colSpan={4}>ไม่มีข้อมูล</td>
                          </tr>
                        )}
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
                    {displayPatientInfo.surgeries.map((item, index) => (
                      <span
                        key={`${item}-${index}`}
                        className="px-3 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {item}
                      </span>
                    ))}
                    {displayPatientInfo.surgeries.length === 0 && (
                      <span className="text-sm text-gray-500">ไม่มีข้อมูล</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                      <AlertTriangle size={16} />
                      แพ้ยา
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {displayPatientInfo.allergies.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-600"
                        >
                          {item}
                        </span>
                      ))}
                      {displayPatientInfo.allergies.length === 0 && (
                        <span className="text-sm text-gray-500">ไม่มีข้อมูล</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-amber-600 mb-2">
                      <AlertTriangle size={16} />
                      แพ้อาหาร
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {displayPatientInfo.foodAllergies.map((item, index) => (
                        <span
                          key={`${item}-${index}`}
                          className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700"
                        >
                          {item}
                        </span>
                      ))}
                      {displayPatientInfo.foodAllergies.length === 0 && (
                        <span className="text-sm text-gray-500">ไม่มีข้อมูล</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <ShieldCheck size={16} className="text-gray-500" />
                    การกู้ชีพเมื่อหยุดหายใจ
                  </div>
                  <span className="inline-flex items-center px-3 py-1 text-xs rounded-full bg-emerald-500 text-white">
                    {displayPatientInfo.cprStatus}
                  </span>
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
                  {displayPatientInfo.emergencyHospitals.length > 0 ? (
                    <div className="space-y-2">
                      {displayPatientInfo.emergencyHospitals.map((hospital, index) => (
                        <div
                          key={`${hospital.name}-${index}`}
                          className="flex items-center justify-between bg-red-50 border border-red-100 px-4 py-3 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">{hospital.name}</span>
                          {hospital.phone ? (
                            <a
                              href={`tel:${toTelHref(hospital.phone)}`}
                              className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline"
                              aria-label={`โทรหา ${hospital.name}`}
                            >
                              <Phone size={16} />
                              {hospital.phone}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm text-gray-400">
                              <Phone size={16} />-
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">ไม่มีข้อมูล</div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User size={16} className="text-gray-500" />
                    ผู้ติดต่อฉุกเฉิน
                  </div>
                  <div className="space-y-2">
                    {displayPatientInfo.emergencyContacts.map((contact) => (
                      <div
                        key={contact.name}
                        className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                      >
                        <div>
                          <p className="text-sm text-gray-700">{contact.name}</p>
                          <p className="text-xs text-gray-500">{contact.relation}</p>
                        </div>
                        <a
                          href={`tel:${toTelHref(contact.phone)}`}
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                          aria-label={`โทรหา ${contact.name}`}
                        >
                          <Phone size={16} />
                          {contact.phone}
                        </a>
                      </div>
                    ))}
                    {displayPatientInfo.emergencyContacts.length === 0 && (
                      <div className="bg-gray-50 px-4 py-3 rounded-lg text-sm text-gray-500">ไม่มีข้อมูล</div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
            </>
            )}
          </div>
        </div>

        <AppFooterRelative />
      </div>
      {/* Sidebar for mobile */}
      <RelativeSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  );
}
