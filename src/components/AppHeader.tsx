"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";
import CreateCompanyModal from "@/components/CreateCompanyModal";

export default function AppHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const setCompanyId = useAppStore((s) => s.setCompanyId);

  useEffect(() => {
    // Skip auth check on login page to avoid redirect loops or weird behavior
    // But we still might want to check if they ARE logged in to redirect them OUT of login (though the login page handles that)
    const session = sessionStorage.getItem('isAuthenticated');
    const email = sessionStorage.getItem('userEmail');
    const uid = sessionStorage.getItem('userId');

    if (session === 'true') {
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
              // Only open modal if we are securely logged in and not on a public page (though all are protected except login)
              if (pathname !== '/login') {
                setIsCompanyModalOpen(true);
              }
            }
          })
          .catch((err) => console.error("Error fetching company:", err));
      }
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserId(null);
      setCompany(null);
      setCompanyId(null);
    }
  }, [pathname, setCompanyId]); // Re-run on path change to re-validate if needed

  const handleSignOut = () => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
    setCompanyId(null);
    setIsAuthenticated(false);
    setUserEmail(null);
    setCompany(null);
    router.push('/login');
  };

  const handleCompanyCreated = (newCompany: Company) => {
    setCompany(newCompany);
    setCompanyId(newCompany.id);
    setIsCompanyModalOpen(false);
  };

  // Do not render header on login page
  if (pathname === '/login') {
    return null;
  }

  // If not authenticated and not on login page, we might want to redirect
  // But this component is just the header. The page protection logic is technically separate, 
  // but originally was bundled. We'll leave strict protection to the pages or a separate wrapper.
  // For now, if not authenticated, we'll render a minimal header or nothing.
  if (!isAuthenticated) {
     return null; 
  }

  return (
    <>
      <CreateCompanyModal
        isOpen={isCompanyModalOpen}
        userId={userId}
        onCompanyCreated={handleCompanyCreated}
      />
      
      <header className="bg-neutral-900 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/attendance">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white hover:text-blue-400 transition-colors">
                {company ? `📋 ${company.name}` : "📋 PRESENTLY"}
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                Manage employees, groups, and generate monthly reports
              </p>
            </div>
          </Link>
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
    </>
  );
}
