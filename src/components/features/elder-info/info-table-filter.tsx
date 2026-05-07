"use client";
import { Search, RotateCcw } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";
import { useState, useEffect, useMemo } from "react";
import { intakeService } from '@/services/intake.service';

interface ElderTableFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedFloor: string;
  onFloorChange: (value: string) => void;
  selectedCareType: string;
  onCareTypeChange: (value: string) => void;
  showActive: boolean;
  onShowActiveToggle: () => void;
  availableFloors?: string[]; // 1. เพิ่ม Prop รับข้อมูลชั้นจากหน้าหลัก
}

export function ElderTableFilter({
  searchTerm,
  onSearchChange,
  selectedFloor,
  onFloorChange,
  selectedCareType,
  onCareTypeChange,
  showActive,
  onShowActiveToggle,
  availableFloors = [], // รับค่าชั้นเข้ามา (ค่าตั้งต้นคืออาเรย์ว่าง)
}: ElderTableFilterProps) {
  
  // 2. สร้างตัวเลือก "ชั้น" แบบ Dynamic ตามข้อมูลที่ส่งเข้ามา
  const floorOptions = useMemo(() => {
    // เรียงลำดับชั้นจากน้อยไปมาก
    const sortedFloors = [...availableFloors].sort((a, b) => Number(a) - Number(b));
    
    return [
      { value: "all", label: "ทุกชั้น" },
      ...sortedFloors.map(floor => ({ value: floor, label: `ชั้น ${floor}` }))
    ];
  }, [availableFloors]);

  const [intakeOptions, setIntakeOptions] = useState<Array<{ value: string; label: string }>>([
    { value: "all", label: "ทุกประเภท" }
  ]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const labels = await intakeService.getAllLabels();
        if (!mounted) return;
        const opts = [
          { value: "all", label: "ทุกประเภท" },
          ...labels.map((l) => ({ value: l.label_name, label: l.label_name }))
        ];
        setIntakeOptions(opts);
      } catch (err) {
        // ถ้า API พัง ให้ใช้ค่า Default เบื้องต้น
        setIntakeOptions([
          { value: "all", label: "ทุกประเภท" },
          { value: "ผู้สูงอายุทั่วไป", label: "ผู้สูงอายุทั่วไป" },
          { value: "ช่วยเหลือตัวเองได้บางส่วน", label: "ช่วยเหลือตัวเองได้บางส่วน" },
          { value: "ผู้สูงอายุติดเตียง", label: "ผู้สูงอายุติดเตียง" },
        ]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="border-b border-slate-200 px-3 py-3">
      {/* Mobile: Compact layout */}
      <div className="flex flex-col gap-2 md:hidden">
        {/* Search bar with status button */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center flex-1 min-w-0">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหา..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 pl-8 pr-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
          
          <button
            type="button"
            onClick={onShowActiveToggle}
            className={`inline-flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition whitespace-nowrap shrink-0 h-9 ${
              showActive
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <RotateCcw className={`h-3.5 w-3.5 transition-transform ${showActive ? "rotate-0" : "rotate-180"}`} />
            <span>{showActive ? "ในศูนย์" : "ออกแล้ว"}</span>
          </button>
        </div>
        
        {/* Filters in one row */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="whitespace-nowrap">ชั้น</span>
            <Dropdown
              options={floorOptions}
              value={selectedFloor}
              onChange={onFloorChange}
              className="w-20"
            />
          </div>
          
          <div className="flex items-center gap-1.5 text-slate-600 flex-1 min-w-0">
            <span className="whitespace-nowrap">ประเภท</span>
            <Dropdown
              options={intakeOptions}
              value={selectedCareType}
              onChange={onCareTypeChange}
              className="flex-1 min-w-0 max-w-40"
            />
          </div>
        </div>
      </div>

      {/* Tablet: Horizontal with status button in same row as filters */}
      <div className="hidden md:flex lg:hidden md:flex-col md:gap-3">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหารายชื่อ..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">ชั้น</span>
            <Dropdown
              options={floorOptions}
              value={selectedFloor}
              onChange={onFloorChange}
              className="w-24"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">ประเภท</span>
            <Dropdown
              options={intakeOptions}
              value={selectedCareType}
              onChange={onCareTypeChange}
              className="w-42"
            />
          </div>
          
          <button
            type="button"
            onClick={onShowActiveToggle}
            className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ml-auto ${
              showActive
                ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            <RotateCcw className={`h-4 w-4 transition-transform ${showActive ? "rotate-0" : "rotate-180"}`} />
            <span>{showActive ? "พักในศูนย์" : "ออกแล้ว"}</span>
          </button>
        </div>
      </div>

      {/* Desktop: Traditional horizontal layout */}
      <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex items-center w-80">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหารายชื่อ..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">ชั้น</span>
            <Dropdown
              options={floorOptions}
              value={selectedFloor}
              onChange={onFloorChange}
              className="w-24"
            />
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="whitespace-nowrap">ประเภท</span>
            <Dropdown
              options={intakeOptions}
              value={selectedCareType}
              onChange={onCareTypeChange}
              className="w-56"
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={onShowActiveToggle}
          className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition whitespace-nowrap ${
            showActive
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
              : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          }`}
        >
          <RotateCcw className={`h-4 w-4 transition-transform ${showActive ? "rotate-0" : "rotate-180"}`} />
          <span>{showActive ? "พักอยู่ในศูนย์" : "ออกจากศูนย์แล้ว"}</span>
        </button>
      </div>
    </div>
  );
}