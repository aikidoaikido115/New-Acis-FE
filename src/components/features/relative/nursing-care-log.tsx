import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CareLogItem {
  id: string;
  text: string;
  status: 'completed' | 'alert';
}

interface NursingCareLogProps {
  logs?: CareLogItem[];
}

export function NursingCareLog({ logs }: NursingCareLogProps) {
  // Mock data
  const defaultLogs: CareLogItem[] = [
    {
      id: '1',
      text: 'รับประทานอาหารได้ตามปกติ',
      status: 'completed',
    },
    {
      id: '2',
      text: 'รับประทานยาครบตามแผน',
      status: 'completed',
    },
    {
      id: '3',
      text: 'ทำแผลแล้ว / อยู่ระหว่างติดตาม',
      status: 'alert',
    },
  ];

  const careLog = logs || defaultLogs;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        บันทึกการดูแลทางพยาบาล
      </h2>
      <div className="space-y-3">
        {careLog.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-4 rounded-lg border-l-4 ${
              item.status === 'completed'
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            {item.status === 'completed' ? (
              <CheckCircle2 className="text-green-600 shrink-0" size={24} />
            ) : (
              <AlertCircle className="text-red-600 shrink-0" size={24} />
            )}
            <span
              className={`text-sm font-medium ${
                item.status === 'completed' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
