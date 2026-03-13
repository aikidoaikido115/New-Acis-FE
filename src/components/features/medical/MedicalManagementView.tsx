"use client";

import { useState } from "react";
import { Calendar, ArrowLeft, Search, ChevronDown, Download, Plus } from "lucide-react";
import { MedicationCard } from "./MedicationCard";
import { PatientProfileCard } from "./PatientProfileCard";
import { RoutineMedsTable } from "./tables/RoutineMedsTable";
import { HistoryTable } from "./tables/HistoryTable";
import { Pagination } from "@/components/ui/pagination";
import { AddMedicationModal } from "./modals";
import {
  mockPatientMedications,
  mockRoutineMedications,
  mockMedicationHistory,
  TimeSlot,
} from "./medical.mock";

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

  // View 1: Main Medication Management
  const renderMainView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">จัดการยา</h1>
        <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
          <span className="text-sm font-medium text-blue-500">{selectedDate}</span>
          <Calendar className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* Top Filters - Time Slots and Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          {/* Time Slot Pills */}
          <div className="flex items-center gap-2">
            {(["เช้า", "กลางวัน", "เย็น", "ก่อนนอน"] as TimeSlot[]).map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTimeSlot(slot)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTimeSlot === slot
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <span className="text-sm">
              <span className="text-yellow-600 font-semibold">รอให้ยา {pendingCount}</span>
            </span>
            <span className="text-sm">
              <span className="text-green-600 font-semibold">ให้แล้ว {completedCount}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side filters */}
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                <option>1</option>
                <option>2</option>
                <option>3</option>
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
            className="px-4 py-2 border-2 border-blue-500 text-blue-500 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            ประวัติการให้ยา
          </button>
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatients.map((patient) => (
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
        ))}
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
        <span className="text-sm font-medium">ย้อนกลับ</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ข้อมูลและประวัติการให้ยา</h1>
          <p className="text-sm text-gray-500">{selectedPatient?.name}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Tab Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDetailsTab("meds")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                detailsTab === "meds"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ข้อมูลยา
            </button>
            <button
              onClick={() => setDetailsTab("history")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
            <span className="text-sm font-medium text-blue-500">{selectedDate}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Patient Profile Card */}
      {selectedPatient && (
        <PatientProfileCard
          name={selectedPatient.name}
          room={selectedPatient.room}
          birthDate="น.ศ.1956.03.01(67ปี)"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <button
          onClick={() => setShowAddMedicationModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มยาใหม่</span>
        </button>
      </div>

      {/* Content Layout - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Routine Meds */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ยาประจำ</h3>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">ยาตามอาการ / ชั่วคราว</h3>
          <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-400 text-sm">ไม่มียาตามการ</p>
          </div>
        </div>
      </div>

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
        <span className="text-sm font-medium">ย้อนกลับ</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ประวัติการให้ยา</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 rounded-lg bg-white">
            <span className="text-sm font-medium text-blue-500">{selectedDate}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
            <Download className="w-4 h-4" />
            <span>พิมพ์ / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              <option>1</option>
              <option>2</option>
              <option>3</option>
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
              <option>ทั้งหมด</option>
              <option>ให้แล้ว</option>
              <option>งด</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
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
