"use client";

import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockResidents } from "./emr.mock";

export function IndividualView() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("ทุกชั้น");
  const [selectedStatus, setSelectedStatus] = useState("ทุกสถานะ");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState("ทุกช่วย");

  const handleRowClick = (residentId: number) => {
    router.push(`/emr/${residentId}`);
  };

  return (
    <div>
      {/* Filters Row */}
      <div className="flex items-center gap-4 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-[rgba(204,204,204,1)] placeholder:text-[rgba(204,204,204,1)]"
          />
        </div>

        <span className="text-sm text-gray-600">ชั้น</span>

        {/* Floor Dropdown */}
        <div className="relative">
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer text-black"
          >
            <option>ทุกชั้น</option>
            <option>ชั้น 1</option>
            <option>ชั้น 2</option>
            <option>ชั้น 3</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <span className="text-sm text-gray-600">การช่วยเหลือตัวเอง</span>

        {/* Help Level Dropdown */}
        <div className="relative">
          <select
            value={selectedHelpLevel}
            onChange={(e) => setSelectedHelpLevel(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer text-black"
          >
            <option>ทุกช่วย</option>
            <option>ช่วยเหลือตัวเองได้</option>
            <option>ต้องการความช่วยเหลือ</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <span className="text-sm text-gray-600">สถานะ</span>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer text-black"
          >
            <option>ทุกสถานะ</option>
            <option>ปกติ</option>
            <option>ต้องติดตาม</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid rgba(103, 103, 103, 0.48)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: 'rgba(239, 242, 247, 1)', borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}>
                <th className="text-left py-3 px-4 font-semibold" style={{ fontSize: '20px', color: '#000' }}>ชื่อ-นามสกุล</th>
                <th className="text-left py-3 px-4 font-semibold" style={{ fontSize: '20px', color: '#000' }}>ชื่อเล่น</th>
                <th className="text-left py-3 px-4 font-semibold" style={{ fontSize: '20px', color: '#000' }}>ห้อง</th>
                <th className="text-left py-3 px-4 font-semibold" style={{ fontSize: '20px', color: '#000' }}>การช่วยเหลือตัวเอง</th>
              </tr>
            </thead>
            <tbody>
              {mockResidents
                .filter((resident) =>
                  resident.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((resident) => (
                  <tr
                    key={resident.id}
                    onClick={() => handleRowClick(resident.id)}
                    className="bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(103, 103, 103, 0.48)' }}
                  >
                    <td className="py-3 px-4" style={{ fontSize: '16px', color: '#000' }}>{resident.name}</td>
                    <td className="py-3 px-4" style={{ fontSize: '16px', color: '#000' }}>{resident.nickname}</td>
                    <td className="py-3 px-4" style={{ fontSize: '16px', color: '#000' }}>{resident.room}</td>
                    <td className="py-3 px-4" style={{ fontSize: '16px', color: '#000' }}>{resident.status}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
