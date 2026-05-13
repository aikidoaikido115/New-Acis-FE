"use client";

import { useState } from "react";
import { Clock, MapPin, ImageIcon, X, Download, Search } from "lucide-react";
import type { ActivityParticipation } from "@/types/activity-participation";

interface Activity {
  id: string;
  time: string;
  title: string;
  description?: string;
  location?: string;
  image: string;
  lastUpdatedAt?: string;
}

interface DailyActivitiesProps {
  activities?: Activity[];
  participations?: ActivityParticipation[];
  lastUpdatedAt?: string;
}

export function DailyActivities({ activities, participations, lastUpdatedAt }: DailyActivitiesProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formatTime = (value?: string): string => {
    if (!value) return "-";

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    const match = value.match(/(\d{2}):(\d{2})(?::\d{2})?/);
    if (match) return `${match[1]}:${match[2]}`;
    return "-";
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `activity-image-${new Date().getTime()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading image:", error);
      window.open(imageUrl, "_blank");
    }
  };

  let displayItems: any[] = [];

  if (participations && participations.length > 0) {
    displayItems = participations.map((p) => ({
      id: `${p.resident_id}-${p.as_id}`,
      time: `${formatTime(p.activity_schedule?.start_time)}-${formatTime(p.activity_schedule?.end_time)}`,
      title: p.activity_schedule?.activity?.activity_name || "กิจกรรม",
      description: p.activity_schedule?.activity?.description,
      location: p.activity_schedule?.activity?.location,
      participated: p.is_participating,
      scheduleStatus: p.activity_schedule?.status,
      isCancelled: p.activity_schedule?.status === "cancelled",
      images: (p.img_urls || []).map((img) => img.url).filter(Boolean),
      lastUpdatedAt: lastUpdatedAt,
    }));
  } else {
    displayItems = (activities || []).map((a) => ({
      ...a,
      lastUpdatedAt: lastUpdatedAt || a.lastUpdatedAt,
    }));
  }

  const dailyActivities = displayItems;

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            กิจกรรมประจำวันที่เข้าร่วม
          </h2>
        </div>
        
        {dailyActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <span className="mb-4">
              <svg width="123" height="123" viewBox="0 0 123 123" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M99.9375 20.5H23.0625C22.3829 20.5 21.7311 20.77 21.2505 21.2505C20.77 21.7311 20.5 22.3829 20.5 23.0625V99.9375C20.5 100.617 20.77 101.269 21.2505 101.749C21.7311 102.23 22.3829 102.5 23.0625 102.5H99.9375C100.617 102.5 101.269 102.23 101.749 101.749C102.23 101.269 102.5 100.617 102.5 99.9375V23.0625C102.5 22.3829 102.23 21.7311 101.749 21.2505C101.269 20.77 100.617 20.5 99.9375 20.5ZM23.0625 15.375C21.0236 15.375 19.0683 16.1849 17.6266 17.6266C16.1849 19.0683 15.375 21.0236 15.375 23.0625V99.9375C15.375 101.976 16.1849 103.932 17.6266 105.373C19.0683 106.815 21.0236 107.625 23.0625 107.625H99.9375C101.976 107.625 103.932 106.815 105.373 105.373C106.815 103.932 107.625 101.976 107.625 99.9375V23.0625C107.625 21.0236 106.815 19.0683 105.373 17.6266C103.932 16.1849 101.976 15.375 99.9375 15.375H23.0625Z" fill="#676767"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M80.6598 35.2235C80.6598 37.7696 79.6483 40.2115 77.8479 42.012C76.0475 43.8124 73.6056 44.8239 71.0594 44.8239C68.5132 44.8239 66.0713 43.8124 64.2709 42.012C62.4705 40.2115 61.459 37.7696 61.459 35.2235C61.459 32.6773 62.4705 30.2354 64.2709 28.4349C66.0713 26.6345 68.5132 25.623 71.0594 25.623C73.6056 25.623 76.0475 26.6345 77.8479 28.4349C79.6483 30.2354 80.6598 32.6773 80.6598 35.2235ZM35.875 76.8743H50.8092L62.0689 87.9853L67.363 100.193C67.904 101.44 68.9182 102.421 70.1826 102.921C71.4469 103.42 72.8578 103.396 74.1049 102.856C75.352 102.315 76.3332 101.3 76.8325 100.036C77.3318 98.7716 77.3083 97.3607 76.7674 96.1136L71.0786 82.9936C70.8174 82.3925 70.4434 81.8471 69.9768 81.3869L65.4001 76.8743H87.125C88.4842 76.8743 89.7878 77.4143 90.7489 78.3754C91.7101 79.3365 92.25 80.6401 92.25 81.9993V102.499H97.375V81.9993C97.375 79.2809 96.2951 76.6737 94.3728 74.7515C92.4506 72.8292 89.8435 71.7493 87.125 71.7493H79.1095C80.3215 71.4604 81.3867 70.7398 82.1059 69.7224C82.8252 68.705 83.1491 67.4604 83.0172 66.2215C82.8853 64.9825 82.3066 63.834 81.3893 62.9909C80.472 62.1477 79.2789 61.6676 78.0332 61.6403C73.5386 61.5378 72.1908 60.7895 71.2247 59.9208C70.5764 59.334 69.8512 58.4448 68.8467 56.9022C68.1241 55.7952 67.3809 54.5473 66.4687 53.0175L65.2054 50.9085L65.0952 50.7291C64.7415 50.1209 64.3601 49.5292 63.9523 48.9559C63.4526 48.282 62.5276 47.1878 60.9747 46.542C59.4141 45.8911 57.9663 46.0039 57.072 46.1448C56.2242 46.301 55.3858 46.5046 54.5607 46.7547C52.3365 47.3928 50.4838 49.0815 49.2692 50.4011C47.7482 52.076 46.4557 53.945 45.4254 55.9592C43.3626 59.9516 41.5689 65.9863 44.1109 71.6161L44.1724 71.7493H35.875C33.1565 71.7493 30.5494 72.8292 28.6272 74.7515C26.7049 76.6737 25.625 79.2809 25.625 81.9993V102.499H30.75V81.9993C30.75 80.6401 31.29 79.3365 32.2511 78.3754C33.2122 77.4143 34.5158 76.8743 35.875 76.8743ZM75.1581 71.7493H60.2085L57.7588 69.3329L61.6358 64.4872C62.4507 65.5788 63.3424 66.6141 64.3674 67.5366C67.3784 70.2477 70.8506 71.3752 75.1581 71.7493ZM43.2345 77.0973L51.6293 85.1486L49.5049 92.316C49.3751 92.755 49.1889 93.1701 48.9463 93.5613L44.4209 100.854C43.7043 102.009 42.5581 102.832 41.2347 103.142C39.9112 103.452 38.5188 103.224 37.3638 102.507C36.2088 101.79 35.3858 100.644 35.0758 99.3208C34.7659 97.9973 34.9943 96.6049 35.711 95.4499L39.8751 88.7438L42.7015 79.2036L43.2345 77.0973Z" fill="#676767"/>
              </svg>
            </span>
            <div className="text-xl">ไม่มีกิจกรรมในวันนี้</div>
          </div>
        ) : (
          <div className="space-y-4">
            {dailyActivities.map((item) => {
              const hasImages = item.images && item.images.length > 0;
              const isCancelled = item.isCancelled === true;
              const isParticipated = !isCancelled && item.participated === true;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col md:flex-row gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    isParticipated 
                      ? "border-blue-200 bg-blue-50" 
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {hasImages ? (
                    <div 
                      className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 cursor-pointer relative group"
                      onClick={() => setSelectedImage(item.images[0])}
                    >
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Search className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 flex items-center justify-center ${
                      isParticipated 
                        ? "bg-linear-to-br from-blue-200 to-blue-300" 
                        : "bg-linear-to-br from-gray-100 to-gray-200"
                    }`}>
                      <ImageIcon size={48} className={`opacity-50 ${isParticipated ? "text-blue-600" : "text-gray-400"}`} />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-semibold text-white px-3 py-1.5 rounded flex items-center gap-2 ${
                        isParticipated ? "bg-blue-500" : "bg-gray-400"
                      }`}>
                        <Clock size={16} />
                        {item.time}
                      </span>
                      {item.participated !== undefined && (
                        <span className={`text-xs px-3 py-1.5 rounded font-semibold ${
                          isCancelled
                            ? "bg-red-100 text-red-700"
                            : item.participated
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {isCancelled ? "ศูนย์งดกิจกรรม" : item.participated ? "เข้าร่วม" : "ไม่เข้าร่วม"}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${isParticipated ? "text-gray-800" : "text-gray-500"}`}>
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    {item.location && item.location !== "-" && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin size={16} />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {hasImages && item.images.length > 1 && (
                      <div className="mt-3 text-xs text-gray-600">
                        มีรูปภาพ {item.images.length} รูป
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 sm:p-8 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)} 
        >
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-linear-to-b from-black/60 to-transparent z-10 pointer-events-none">
            <div className="flex gap-4 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(selectedImage);
                }}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors shadow-lg"
                title="บันทึกรูปภาพ"
              >
                <Download size={24} />
              </button>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors shadow-lg pointer-events-auto"
              title="ปิด"
            >
              <X size={24} />
            </button>
          </div>

          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Activity full size"
              className="max-w-full max-h-[85vh] object-contain rounded select-none shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}