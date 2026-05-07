"use client";

import { useState } from "react";
import { Users, User } from "lucide-react";
import { IndividualView } from "@/components/features/EMR/IndividualView";
import { OverviewView } from "@/components/features/EMR/OverviewView";

export default function EMRPage() {
  const [mainView, setMainView] = useState<"overview" | "individual">("overview");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-headline-5 font-bold text-gray-800">เวชระเบียน</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMainView("overview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-small font-medium transition-all ${
                mainView === "overview"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white text-black border border-black hover:bg-gray-50"
              }`}
            >
              <Users className="w-4 h-4" />
              ดูรวม
            </button>
            <button
              onClick={() => setMainView("individual")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-body-small font-medium transition-all ${
                mainView === "individual"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-white text-black border border-black hover:bg-gray-50"
              }`}
            >
              <User className="w-4 h-4" />
              รายคน
            </button>
          </div>
        </div>

        {mainView === "individual" ? <IndividualView /> : <OverviewView />}
      </div>
    </div>
  );
}
