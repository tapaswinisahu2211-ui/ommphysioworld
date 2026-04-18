import {
  BarChart3,
  BriefcaseMedical,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  Mail,
  MessageSquareQuote,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { canViewModule, getStoredUser, isAdminUser } from "../utils/auth";

export default function Sidebar({ collapsed, onNavigate }) {
  const location = useLocation();
  const currentUser = getStoredUser();
  const adminUser = isAdminUser(currentUser);
  const initials = (currentUser.name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menus = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, hint: "Overview", moduleKey: "dashboard" },
    { name: "Patients", path: "/patients", icon: Users, hint: "Records", moduleKey: "patients" },
    { name: "Treatment Tracker", path: "/treatment-tracker", icon: ClipboardList, hint: "Follow-up", moduleKey: "treatment_tracker" },
    { name: "Services", path: "/services", icon: Stethoscope, hint: "Treatments", moduleKey: "services" },
    { name: "Therapy", path: "/therapy", icon: FolderOpen, hint: "Media", moduleKey: "therapy" },
    ...(adminUser
      ? [
          { name: "Feedback", path: "/feedback", icon: MessageSquareQuote, hint: "Reviews", moduleKey: "" },
          { name: "Job Requirements", path: "/job-requirements", icon: BriefcaseMedical, hint: "Careers", moduleKey: "" },
        ]
      : []),
    ...(adminUser
      ? [
          { name: "Report", path: "/reports", icon: BarChart3, hint: "Date-wise", moduleKey: "" },
        ]
      : []),
    { name: "Staff", path: "/staff", icon: UserCog, hint: "Team", moduleKey: "staff" },
    { name: "Mailbox", path: "/mailbox", icon: Mail, hint: "Inbox", moduleKey: "mailbox" },
  ].filter((menu) => canViewModule(menu.moduleKey, currentUser));

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,#06131f,#0f172a,#111827)] text-white shadow-2xl ${
        collapsed ? "md:w-28" : "md:w-80"
      } w-full transition-all duration-300`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.14),_transparent_28%)]" />

      <div className="relative flex h-full flex-col overflow-hidden px-4 py-5">
        <div
          className={`rounded-3xl border border-white/10 bg-white/5 backdrop-blur ${
            collapsed
              ? "mx-auto flex h-20 w-20 items-center justify-center"
              : "flex items-center justify-between px-4 py-4"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-950 shadow-lg">
              <BriefcaseMedical size={22} />
            </div>

            {!collapsed && (
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                  {adminUser ? "Admin Suite" : "Staff Suite"}
                </p>
                <h1 className="text-lg font-semibold text-white">Omm Physio World</h1>
              </div>
            )}
          </div>

          {!collapsed && (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Live
            </span>
          )}
        </div>

        <div className="mt-8 flex-1 overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!collapsed && (
            <p className="mb-3 px-3 text-xs uppercase tracking-[0.22em] text-white/35">
              Workspace
            </p>
          )}

          <nav className="space-y-2">
            {menus.map((menu) => {
              const active =
                location.pathname === menu.path ||
                (menu.path === "/patients" && location.pathname.startsWith("/patient"));

              return (
                <Link
                  key={menu.name}
                  to={menu.path}
                  onClick={onNavigate}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
                    active
                      ? "bg-white text-slate-950 shadow-lg"
                      : "text-white/72 hover:bg-white/8 hover:text-white"
                  } ${collapsed ? "mx-auto h-14 w-14 justify-center px-0 py-0" : ""}`}
                  title={collapsed ? menu.name : ""}
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-white/8 text-white/82 group-hover:bg-white/12"
                    }`}
                  >
                    <menu.icon size={19} />
                  </div>

                  {!collapsed && (
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{menu.name}</p>
                      <p
                        className={`truncate text-xs ${
                          active ? "text-slate-500" : "text-white/38"
                        }`}
                      >
                        {menu.hint}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto px-2">
          <div
            className={`rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur ${
              collapsed ? "mx-auto flex h-24 w-16 items-center justify-center p-0" : ""
            }`}
          >
            <div
              className={`flex ${collapsed ? "justify-center" : "items-center gap-3"}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 font-semibold text-slate-950">
                {initials}
              </div>

              {!collapsed && (
                <div>
                  <p className="text-sm font-medium text-white">
                    {currentUser.name || (adminUser ? "Admin Console" : "Staff Console")}
                  </p>
                  <p className="text-xs text-white/45">
                    {adminUser ? "Clinic operations" : currentUser.workType || "Clinic staff"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

