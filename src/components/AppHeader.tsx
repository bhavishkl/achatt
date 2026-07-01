"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import CreateCompanyModal from "@/components/CreateCompanyModal";
import { useAppStore } from "@/lib/store";
import type { Company } from "@/lib/types";

type AppHeaderProps = {
  children: React.ReactNode;
};

const NAV_LINKS = [
  { href: "/opd", label: "Frontdesk", description: "OPD registration, billing, and vitals", icon: "🏥" },
  { href: "/doctor", label: "Doctor", description: "Consultations and prescriptions", icon: "👨‍⚕️" },
  { href: "/attendance", label: "Attendance", description: "Employees, shifts, and reports", icon: "⏱" },
  { href: "/", label: "Inpatients", description: "Admissions, bills, and discharge history", icon: "🛏" },
  { href: "/apt", label: "Appointments", description: "Daily OP queue and follow-ups", icon: "🗓" },
  { href: "/dcard", label: "Discharge Card", description: "Templates and exported summaries", icon: "📄" },
];

export default function AppHeader({ children }: AppHeaderProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean;
    userEmail: string | null;
    userId: string | null;
  }>({ isAuthenticated: false, userEmail: null, userId: null });
  const [authLoaded, setAuthLoaded] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const setCompanyId = useAppStore((s) => s.setCompanyId);

  useEffect(() => {
    setAuthState({
      isAuthenticated:
        (sessionStorage.getItem("isAuthenticated") ?? localStorage.getItem("isAuthenticated")) === "true",
      userEmail: sessionStorage.getItem("userEmail") ?? localStorage.getItem("userEmail"),
      userId: sessionStorage.getItem("userId") ?? localStorage.getItem("userId"),
    });
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    if (!authLoaded) return;

    if (!authState.isAuthenticated) {
      if (pathname !== "/login") {
        router.push("/login");
      }
      return;
    }

    if (!authState.userId) {
      return;
    }

    let isCancelled = false;

    fetch(`/api/user/company?userId=${authState.userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) {
          return;
        }

        if (data.company) {
          setCompany(data.company);
          setCompanyId(data.company.id);
          setIsCompanyModalOpen(false);
        } else {
          setCompany(null);
          setCompanyId(null);
          if (pathname !== "/login" && pathname !== "/company-profile") {
            setIsCompanyModalOpen(true);
          }
        }
      })
      .catch((err) => console.error("Error fetching company:", err));

    return () => {
      isCancelled = true;
    };
  }, [authLoaded, authState.isAuthenticated, authState.userId, pathname, router, setCompanyId]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileNavOpen]);

  const handleSignOut = () => {
    sessionStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    setCompanyId(null);
    setCompany(null);
    setIsMobileNavOpen(false);
    router.push("/login");
  };

  const handleCompanyCreated = (newCompany: Company) => {
    setCompany(newCompany);
    setCompanyId(newCompany.id);
    setIsCompanyModalOpen(false);
  };

  if (pathname === "/login") {
    return <>{children}</>;
  }

  if (!authLoaded) {
    return null;
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  const companyName = company?.name || "Presently";

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-800 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">Workspace</p>
        <p className="mt-2 text-lg font-semibold text-white">{companyName}</p>
        <p className="mt-1 text-sm text-neutral-400">Core navigation for attendance, patients, and appointments.</p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileNavOpen(false)}
              className={`block rounded-2xl border px-4 py-3 transition-colors ${
                isActive
                  ? "border-blue-500/40 bg-blue-500/10 text-white"
                  : "border-transparent bg-neutral-900 text-neutral-300 hover:border-neutral-800 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-lg">{link.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{link.label}</p>
                  <p className="mt-1 text-xs text-neutral-500">{link.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-800 px-4 py-4">
        <p className="truncate text-sm text-neutral-300">{authState.userEmail}</p>
        <button
          onClick={handleSignOut}
          className="mt-3 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <CreateCompanyModal
        isOpen={isCompanyModalOpen}
        userId={authState.userId}
        onCompanyCreated={handleCompanyCreated}
      />

      <div className="min-h-screen bg-neutral-950 text-white">
        <header className="app-header sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 lg:hidden"
                aria-label="Open navigation"
              >
                <span className="text-lg">☰</span>
              </button>

              <Link href="/attendance" className="min-w-0">
                <p className="truncate text-base font-semibold text-white sm:text-lg">{companyName}</p>
                <p className="hidden text-sm text-neutral-400 sm:block">Hospital operations dashboard</p>
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {authState.userEmail ? (
                <p className="hidden max-w-56 truncate text-sm text-neutral-400 md:block">{authState.userEmail}</p>
              ) : null}
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 sm:px-4"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1600px]">
          <aside className="sticky top-[var(--app-header-height)] hidden h-[calc(100vh-var(--app-header-height))] w-80 shrink-0 border-r border-neutral-800 bg-neutral-950 lg:block">
            {navContent}
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        {isMobileNavOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true" role="dialog">
            <button
              type="button"
              className="absolute inset-0 bg-black/70"
              onClick={() => setIsMobileNavOpen(false)}
              aria-label="Close navigation"
            />
            <aside className="absolute left-0 top-0 h-full w-[min(20rem,88vw)] border-r border-neutral-800 bg-neutral-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-400">Navigation</p>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200"
                  aria-label="Close navigation"
                >
                  <span className="text-lg">×</span>
                </button>
              </div>
              {navContent}
            </aside>
          </div>
        ) : null}
      </div>
    </>
  );
}
