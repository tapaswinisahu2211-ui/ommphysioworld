import AdminFooter from "../components/AdminFooter";
import { useEffect, useState } from "react";
import DashboardChatWidget from "../components/DashboardChatWidget";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import API from "../services/api";
import { getStoredUser } from "../utils/auth";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const currentUser = getStoredUser();

    if (!currentUser.id) {
      return undefined;
    }

    const pingSession = async () => {
      try {
        await API.post("/session/ping", { userId: currentUser.id });
      } catch (error) {
        console.error("Failed to update online status:", error);
      }
    };

    pingSession();
    const intervalId = window.setInterval(pingSession, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(180deg,#eef5ff,#f8fafc_24%,#f4f7fb)]">

      {/* SIDEBAR */}
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} />
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="relative h-full w-[86vw] max-w-[340px]">
            <Sidebar
              collapsed={false}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {/* MAIN */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* TOPBAR */}
        <Topbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* CONTENT */}
        <div className="dashboard-shell min-h-0 flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <div className="pb-24">
            {children}
            <AdminFooter />
          </div>
        </div>
        <DashboardChatWidget />
      </div>
    </div>
  );
}
