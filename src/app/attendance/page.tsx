"use client";

import { useState } from "react";
import type { TabKey } from "@/lib/types";
import EmployeesTab from "@/components/EmployeesTab";
import WeekOffTab from "@/components/WeekOffTab";
import HolidayTab from "@/components/HolidayTab";
import LeaveTab from "@/components/LeaveTab";
import ShiftTab from "@/components/ShiftTab";
import ReportTab from "@/components/ReportTab";
import PunchUploadTab from "@/components/PunchUploadTab";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "employees", label: "Employees", icon: "👥" },
  { key: "weekoff", label: "Week Off", icon: "📅" },
  { key: "holiday", label: "Holidays", icon: "🎉" },
  { key: "leave", label: "Leaves", icon: "🏖️" },
  { key: "shift", label: "Shifts", icon: "⏰" },
  { key: "punch", label: "Punch Upload", icon: "💼" },
  { key: "report", label: "Report", icon: "📊" },
];

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("employees");

  return (
    <main className="min-h-screen bg-neutral-950">
      {/* Tab navigation */}
      <nav className="bg-neutral-900/50 border-b border-neutral-800 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Tab content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "employees" && <EmployeesTab />}
        {activeTab === "weekoff" && <WeekOffTab />}
        {activeTab === "holiday" && <HolidayTab />}
        {activeTab === "leave" && <LeaveTab />}
        {activeTab === "shift" && <ShiftTab />}
        {activeTab === "punch" && <PunchUploadTab />}
        {activeTab === "report" && <ReportTab />}
      </div>
    </main>
  );
}
