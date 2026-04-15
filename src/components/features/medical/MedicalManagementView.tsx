"use client";

import { useState } from "react";
import { Calendar, ArrowLeft, Search, ChevronDown, Download, Plus, Sunrise, Sun, Sunset, MoonStar } from "lucide-react";
import { MedicationCard } from "./MedicationCard";
import { PatientProfileCard } from "./PatientProfileCard";
import { RoutineMedsTable } from "./tables/RoutineMedsTable";
import { CombinedMedsTable } from "./tables/CombinedMedsTable";
import { HistoryTable } from "./tables/HistoryTable";
import { Pagination } from "@/components/ui/pagination";
import { AddMedicationModal } from "./modals";
import {
  mockPatientMedications,
  mockRoutineMedications,
  mockPrnMedicationsByPatientId,
  mockMedicationHistory,
  TimeSlot } from "./medical.mock";

type ViewType = "main" | "details" | "history";

export function MedicalManagementView() {
  const [currentView, setCurrentView] = useState<ViewType>("main");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>("เช้า");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedDate] = useState("31/12/2568");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("ทุกชั้น");
  const [selectedHelpLevel, setSelectedHelpLevel] = useState("ทั้งหมด");
  const [selectedStatus, setSelectedStatus] = useState("ทั้งหมด");
  const [detailsTab, setDetailsTab] = useState<"meds" | "history">("meds");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [medsDisplayMode, setMedsDisplayMode] = useState<"split" | "combined">("split");

  // Calculate stats
  const pendingCount = mockPatientMedications.reduce((acc, p) => acc + p.pendingCount, 0);
  const completedCount = mockPatientMedications.reduce(
    (acc, p) => acc + p.medications.filter((m) => m.status === "ให้ยา").length,
    0
  );

  // Filter patients
  const filteredPatients = mockPatientMedications.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFloor = selectedFloor === "ทุกชั้น" || patient.floor.toString() === selectedFloor;
    const matchesHelp = selectedHelpLevel === "ทั้งหมด" || patient.helpLevel === selectedHelpLevel;
    return matchesSearch && matchesFloor && matchesHelp;
  });

  // Filter history
  const filteredHistory = mockMedicationHistory.filter((entry) => {
    const matchesSearch = entry.patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "ทั้งหมด" || entry.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const selectedPatient = mockPatientMedications.find((p) => p.id === selectedPatientId);
  const selectedPrnMedications = selectedPatientId
    ? (mockPrnMedicationsByPatientId[selectedPatientId] ?? [])
    : [];

  const getTimeSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case "เช้า":
        return <Sunrise className="w-4 h-4" />;
      case "กลางวัน":
        return <Sun className="w-4 h-4" />;
      case "เย็น":
        return <Sunset className="w-4 h-4" />;
      case "ก่อนนอน":
        return <MoonStar className="w-4 h-4" />;
      default:
        return null;
    }
  };

  // View 1: Main Medication Management
  const renderMainView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-headline-5 font-bold text-gray-800">จัดการยา</h1>
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
          <span className="text-body-small font-medium text-blue-500">{selectedDate}</span>
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* Top Filters - Time Slots and Stats */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {(["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"] as TimeSlot[]).map((slot) => (
            <button
              key={slot}
              onClick={() => setSelectedTimeSlot(slot)}
              className={`px-4 py-2 rounded-full text-body-small font-medium transition-colors inline-flex items-center gap-2 ${
                selectedTimeSlot === slot
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {getTimeSlotIcon(slot)}
              {slot}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="min-w-40 px-6 py-3 bg-white border border-gray-300 rounded-lg text-center text-body-large font-semibold text-yellow-600">
            รอให้ยา <span className="ml-1">{pendingCount}</span>
          </div>
          <div className="min-w-40 px-6 py-3 bg-white border border-gray-300 rounded-lg text-center text-body-large font-semibold text-green-600">
            ให้ยาแล้ว <span className="ml-1">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left side filters */}
        <div className="flex items-center gap-4 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-md min-w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
            />
          </div>

          <span className="text-body-small text-gray-600">ชั้น</span>

          {/* Floor Dropdown */}
          <div className="relative">
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
            >
              <option>ทุกชั้น</option>
              <option>1</option>
              <option>2</option>
              <option>3</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <span className="text-body-small text-gray-600">การช่วยเหลือตัวเอง</span>

          {/* Help Level Dropdown */}
          <div className="relative">
            <select
              value={selectedHelpLevel}
              onChange={(e) => setSelectedHelpLevel(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
            >
              <option>ทั้งหมด</option>
              <option>ช่วยเหลือตัวเองได้</option>
              <option>ต้องการความช่วยเหลือ</option>
              <option>ติดเตียง</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* History Button */}
        <button
          onClick={() => setCurrentView("history")}
          className="px-4 py-2 border-2 border-gray-300 bg-gray-100 text-gray-700 rounded-lg text-body-small font-medium hover:bg-gray-200 transition-colors"
        >
          [ ประวัติการให้ยา ]
        </button>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.length === 0 ? (
          <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white py-12 px-4 text-center">
            <div className="text-sm text-gray-600">ไม่พบรายชื่อผู้พัก</div>
            <div className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือปรับตัวกรองชั้นและการช่วยเหลือตัวเอง</div>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <MedicationCard
              key={patient.id}
              patient={patient}
              onViewDetails={(id) => {
                setSelectedPatientId(id);
                setCurrentView("details");
              }}
              onGiveAllMeds={(id) => {
                console.log("Give all meds for patient:", id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );

  // View 2: Patient Details and Medication Info
  const renderDetailsView = () => (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView("main")}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-body-small font-medium">ย้อนกลับ</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-5 font-bold text-gray-800">ข้อมูลและประวัติการให้ยา</h1>
          <p className="text-body-small text-gray-500 mt-3">{selectedPatient?.name}</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDetailsTab("meds")}
              className={`px-4 py-2 rounded-md text-body-small font-medium transition-colors ${
                detailsTab === "meds"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ข้อมูลยา
            </button>
            <button
              onClick={() => setDetailsTab("history")}
              className={`px-4 py-2 rounded-md text-body-small font-medium transition-colors ${
                detailsTab === "history"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ประวัติการให้ยา
            </button>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
            <span className="text-body-small font-medium text-blue-500">{selectedDate}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Patient Profile Card */}
      {selectedPatient && (
        <PatientProfileCard
          name={selectedPatient.name}
          room={selectedPatient.room}
          allergies={selectedPatient.allergies}
          chronicDiseases={["ความดันโลหิตสูง", "โรคหัวใจ", "เบาหวาน Type 2"]}
        />
      )}

      {/* Search and Add Button - Shared across both tables */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อยา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
          />
        </div>
        <button
          onClick={() => setShowAddMedicationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มยาใหม่</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-body-small text-gray-600">มุมมองตารางยา:</span>
        <button
          type="button"
          onClick={() => setMedsDisplayMode("split")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            medsDisplayMode === "split"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          แยกประเภท
        </button>
        <button
          type="button"
          onClick={() => setMedsDisplayMode("combined")}
          className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            medsDisplayMode === "combined"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          ตารางรวม
        </button>
      </div>

      {medsDisplayMode === "split" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Routine Meds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-headline-7 font-semibold text-gray-800 mb-4">ยาประจำ</h3>
            <RoutineMedsTable
              medications={mockRoutineMedications}
              onAddMed={() => console.log("Add med")}
              onEditMed={(id) => console.log("Edit med:", id)}
              onDeleteMed={(id) => console.log("Delete med:", id)}
              patientName={selectedPatient?.name}
              patientRoom={selectedPatient?.room}
            />
          </div>

          {/* Right Column - PRN Meds */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-headline-7 font-semibold text-gray-800 mb-4">ยาตามอาการ / ชั่วคราว</h3>
            <RoutineMedsTable
              medications={selectedPrnMedications}
              onAddMed={() => console.log("Add PRN med")}
              onEditMed={(id) => console.log("Edit PRN med:", id)}
              onDeleteMed={(id) => console.log("Delete PRN med:", id)}
              patientName={selectedPatient?.name}
              patientRoom={selectedPatient?.room}
              emptyMessage="ไม่พบรายการยาตามอาการ / ชั่วคราว"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-headline-7 font-semibold text-gray-800 mb-4">ตารางยารวม</h3>
          <CombinedMedsTable
            routineMedications={mockRoutineMedications}
            prnMedications={selectedPrnMedications}
            onEditMed={(id) => console.log("Edit med:", id)}
            onDeleteMed={(id) => console.log("Delete med:", id)}
          />
        </div>
      )}

      {/* Add Medication Modal */}
      <AddMedicationModal
        isOpen={showAddMedicationModal}
        onClose={() => setShowAddMedicationModal(false)}
        onSubmit={(data) => {
          console.log("Add medication:", data);
          setShowAddMedicationModal(false);
        }}
      />
    </div>
  );

  // View 3: Medication History
  const renderHistoryView = () => (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView("main")}
        className="flex items-center gap-2 text-blue-500 hover:text-blue-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-body-small font-medium">ย้อนกลับ</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-headline-5 font-bold text-gray-800">ประวัติการให้ยา</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-400 bg-white shadow-sm rounded-lg placeholder:text-[#CCCCCC] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small text-black"
          />
        </div>

        <span className="text-body-small text-gray-600">ชั้น</span>

        {/* Floor Dropdown */}
        <div className="relative">
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
          >
            <option>ทุกชั้น</option>
            <option>1</option>
            <option>2</option>
            <option>3</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <span className="text-body-small text-gray-600">สถานะ</span>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-body-small bg-white cursor-pointer text-black"
          >
            <option>ทั้งหมด</option>
            <option>ให้แล้ว</option>
            <option>งด</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
            <span className="text-body-small font-medium text-blue-500">{selectedDate}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-body-small font-medium hover:bg-blue-600 transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            <span>พิมพ์ / Export PDF</span>
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <HistoryTable history={filteredHistory} />
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1400px] mx-auto">
        {currentView === "main" && renderMainView()}
        {currentView === "details" && renderDetailsView()}
        {currentView === "history" && renderHistoryView()}
      </div>
    </div>
  );
}
