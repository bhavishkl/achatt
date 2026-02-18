"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { TabKey, Company } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import EmployeesTab from "@/components/EmployeesTab";
import WeekOffTab from "@/components/WeekOffTab";
import HolidayTab from "@/components/HolidayTab";
import LeaveTab from "@/components/LeaveTab";
import ShiftTab from "@/components/ShiftTab";
import ReportTab from "@/components/ReportTab";
import PunchUploadTab from "@/components/PunchUploadTab";
import CreateCompanyModal from "@/components/CreateCompanyModal";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "employees", label: "Employees", icon: "👥" },
  { key: "weekoff", label: "Week Off", icon: "📅" },
  { key: "holiday", label: "Holidays", icon: "🎉" },
  { key: "leave", label: "Leaves", icon: "🏖️" },
  { key: "shift", label: "Shifts", icon: "⏰" },
  { key: "punch", label: "Punch Upload", icon: "💼" },
  { key: "report", label: "Report", icon: "📊" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabKey>("employees");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const router = useRouter();
  const setCompanyId = useAppStore((s) => s.setCompanyId);

  useEffect(() => {
    const session = sessionStorage.getItem('isAuthenticated');
    const email = sessionStorage.getItem('userEmail');
    const uid = sessionStorage.getItem('userId');

    if (session !== 'true') {
      router.push('/login');
    } else {
      // eslint-disable-next-line
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserId(uid);

      if (uid) {
        fetch(`/api/user/company?userId=${uid}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.company) {
              setCompany(data.company);
              setCompanyId(data.company.id);
            } else {
              setIsCompanyModalOpen(true);
            }
          })
          .catch((err) => console.error("Error fetching company:", err));
      }
    }
  }, [router, setCompanyId]);

  const handleSignOut = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
    setCompanyId(null);
    router.push('/login');
  };

  const handleCompanyCreated = (newCompany: Company) => {
    setCompany(newCompany);
    setCompanyId(newCompany.id);
    setIsCompanyModalOpen(false);
  };

  if (!isAuthenticated) {
    // You can render a loading spinner here while checking for auth
    return (
        <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <p className="text-white">Loading...</p>
        </main>
    );
  }


  return (
    <main className="min-h-screen bg-neutral-950">
      <CreateCompanyModal
        isOpen={isCompanyModalOpen}
        userId={userId}
        onCompanyCreated={handleCompanyCreated}
      />
      
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {company ? `📋 ${company.name}` : "📋 PRESENTLY"}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              Manage employees, groups, and generate monthly reports
            </p>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && <p className="text-sm text-neutral-300">{userEmail}</p>}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

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
