import { Clock, MapPin, ImageIcon } from 'lucide-react';
// ลบแล้วใส่ข้อมูลจริงจากกิจกรรมที่เข้าร่วมรายคน ดึงการ์ด รูปถ่ายในกิจกรรมนั้นๆ
interface Activity {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  image: string;
}

interface DailyActivitiesProps {
  activities?: Activity[];
}

export function DailyActivities({ activities }: DailyActivitiesProps) {
  // Mock data
  const defaultActivities: Activity[] = [
    {
      id: '1',
      time: '9:00-10:30',
      title: 'กายภาพบำบัดประจำวัน',
      description: 'รายละเอียด: ฝึกการยืดเหยียดกล้ามเนื้อ ขา แขน',
      location: 'ห้องโถงกลาง',
      image: '/images/activity-1.jpg',
    },
    {
      id: '2',
      time: '16:00-17:00',
      title: 'กิจกรรมนันทนาการ',
      description: 'รายละเอียด: -',
      location: 'ห้องกิจกรรม',
      image: '/images/activity-2.jpg',
    },
  ];

  const dailyActivities = activities || defaultActivities;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        กิจกรรมประจำวันที่เข้าร่วม
      </h2>
      <div className="space-y-4">
        {dailyActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex flex-col md:flex-row gap-4 p-4 border border-blue-200 bg-blue-50 rounded-lg hover:shadow-md transition-shadow"
          >
            {/* Image Placeholder */}
            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-linear-to-br from-blue-200 to-blue-300 shrink-0 flex items-center justify-center">
              <ImageIcon size={48} className="text-blue-600 opacity-50" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-white bg-blue-500 px-3 py-1.5 rounded flex items-center gap-2">
                  <Clock className="text-white" size={16} />
                  {activity.time}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {activity.title}
              </h3>
              {activity.description && (
                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
              )}
              {activity.location && activity.location !== '-' && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={16} />
                  <span>{activity.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
