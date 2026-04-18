import {
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings2,
  UserCircle2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import { MAILBOX_REFRESH_EVENT, notifyMailboxChanged } from "../services/mailboxEvents";
import { canViewModule, getStoredUser, isAdminUser } from "../utils/auth";

const pageMeta = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Monitor clinic performance, schedules, and patient activity.",
  },
  "/patients": {
    title: "Patients",
    subtitle: "Manage patient records, profiles, and care history.",
  },
  "/patients/archive": {
    title: "Patient Archive",
    subtitle: "Review archived patients and permanently delete them when needed.",
  },
  "/treatment-tracker": {
    title: "Treatment Tracker",
    subtitle: "Track upcoming appointments, active sessions, and overdue follow-ups.",
  },
  "/services": {
    title: "Services",
    subtitle: "Organize treatment offerings and clinic service details.",
  },
  "/therapy": {
    title: "Therapy",
    subtitle: "Upload and organize therapy media for each service.",
  },
  "/shop-admin": {
    title: "Shop",
    subtitle: "Manage products, stock, and incoming website purchases.",
  },
  "/feedback": {
    title: "Feedback",
    subtitle: "Approve patient reviews before publishing them on the website.",
  },
  "/job-requirements": {
    title: "Job Requirements",
    subtitle: "Post employee requirements and publish them on the career page.",
  },
  "/staff": {
    title: "Staff",
    subtitle: "Review team members, roles, and admin access.",
  },
  "/staff/:id": {
    title: "Staff Profile",
    subtitle: "Manage module permissions and staff access rules.",
  },
  "/my-profile": {
    title: "My Profile",
    subtitle: "View your basic staff profile and joining details.",
  },
  "/mailbox": {
    title: "Mailbox",
    subtitle: "Review career applications and contact messages in one inbox.",
  },
  "/profile": {
    title: "Admin Profile",
    subtitle: "Update your primary admin account and contact information.",
  },
};

export default function Topbar({ collapsed, setCollapsed, onOpenMobileMenu }) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mailboxItems, setMailboxItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const currentUser = useMemo(() => getStoredUser(), []);
  const adminUser = isAdminUser(currentUser);
  const canViewMailbox = canViewModule("mailbox", currentUser);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!canViewMailbox) {
      return undefined;
    }

    let isMounted = true;

    const loadMailboxItems = async () => {
      try {
        const response = await API.get("/mailbox");
        if (isMounted) {
          setMailboxItems(response.data);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadMailboxItems();

    const intervalId = window.setInterval(loadMailboxItems, 5000);
    const handleRefresh = () => loadMailboxItems();

    window.addEventListener(MAILBOX_REFRESH_EVENT, handleRefresh);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener(MAILBOX_REFRESH_EVENT, handleRefresh);
    };
  }, [canViewMailbox]);

  const handleLogout = async () => {
    try {
      if (currentUser?.id) {
        await API.post("/session/logout", { userId: currentUser.id });
      }
    } catch (error) {
      console.log("Logout status update skipped:", error?.response?.data?.message || error.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");
      navigate("/admin");
    }
  };

  const activePage = useMemo(() => {
    if (location.pathname === "/patients/archive") {
      return pageMeta["/patients/archive"];
    }

    if (location.pathname.startsWith("/patients/") || location.pathname.startsWith("/patient/")) {
      return {
        title: "Patient Profile",
        subtitle: "Review appointments, payments, and case notes.",
      };
    }

    if (location.pathname.startsWith("/staff/") || location.pathname === "/my-profile") {
      return {
        title: "Staff Profile",
        subtitle: "Manage module permissions and staff access rules.",
      };
    }

    return pageMeta[location.pathname] || pageMeta["/dashboard"];
  }, [location.pathname]);

  const initials = (currentUser.name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const unreadNotifications = mailboxItems.filter((item) => !item.isRead);
  const notificationCount = unreadNotifications.length;
  const recentNotifications = unreadNotifications.slice(0, 8);

  const handleNotificationClick = async (item) => {
    try {
      if (!item.isRead) {
        await API.patch(`/mailbox/${item.type}/${item.id}/read`, { isRead: true });
        setMailboxItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? { ...entry, isRead: true, readAt: new Date().toISOString() }
              : entry
          )
        );
        notifyMailboxChanged();
      }
    } catch (error) {
      console.error("Failed to update notification:", error);
    } finally {
      setNotificationsOpen(false);
      navigate("/mailbox", {
        state: {
          selectedId: item.id,
          selectedType: item.type,
        },
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 px-3 py-3 backdrop-blur-xl md:px-6 md:py-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              if (window.innerWidth < 768) {
                onOpenMobileMenu?.();
                return;
              }

              setCollapsed(!collapsed);
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:h-11 md:w-11"
          >
            <Menu size={19} />
          </button>

          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {adminUser ? "Admin Workspace" : "Staff Workspace"}
            </p>
            <h2 className="truncate text-xl font-semibold text-slate-900 md:text-2xl">
              {activePage.title}
            </h2>
            <p className="hidden text-sm text-slate-500 sm:block">
              {activePage.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:gap-3">
          <div className="relative w-full sm:flex-1 md:w-[320px] md:flex-none">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 md:left-4 md:size-[18px]"
            />
            <input
              type="text"
              placeholder="Search pages, patients, services..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 md:py-3 md:pl-11 md:pr-4"
            />
          </div>

          <div className="flex items-center justify-between gap-2 sm:justify-start md:gap-3">
            {canViewMailbox ? (
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 md:h-11 md:w-11"
              >
                <Bell size={19} />
                {notificationCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                ) : null}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[calc(100vw-1.5rem)] max-w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Notifications</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {notificationCount} unread message{notificationCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate("/mailbox");
                        }}
                        className="text-xs font-medium text-sky-700 hover:text-sky-800"
                      >
                        Show all
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {recentNotifications.length ? (
                      recentNotifications.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => handleNotificationClick(item)}
                          className={`mb-2 w-full rounded-2xl border px-4 py-3 text-left transition last:mb-0 ${
                            item.isRead
                              ? "border-slate-200 bg-slate-50 hover:bg-white"
                              : "border-sky-200 bg-sky-50 hover:border-sky-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-2xl bg-white p-2 text-slate-600 shadow-sm">
                              <Mail size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {item.senderName || "New message"}
                                </p>
                                {!item.isRead ? (
                                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                                ) : null}
                              </div>
                              <p className="mt-1 truncate text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                {item.type === "career"
                                  ? "Career"
                                  : "Contact"}
                              </p>
                              <p className="mt-1 truncate text-sm text-slate-600">
                                {item.subject}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-12 text-center">
                        <Bell size={24} className="mx-auto text-slate-300" />
                        <p className="mt-3 text-sm font-medium text-slate-700">
                          No notifications yet
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Only unread mails appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            ) : null}

            <div
              className="relative rounded-2xl border border-slate-200 bg-white p-1 shadow-sm"
              ref={dropdownRef}
            >
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-300 font-semibold text-slate-950 md:h-11 md:w-11">
                  {currentUser.profileImageUrl ? (
                    <img
                      src={`${API.defaults.baseURL}${currentUser.profileImageUrl}`}
                      alt={currentUser.name || "Profile"}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-slate-900">
                    {currentUser.name || "Admin User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {currentUser.email || "contact@ommphysioworld.com"}
                  </p>
                </div>

                <ChevronDown size={16} className="hidden text-slate-400 md:block" />
              </button>

              {open && (
                <div className="absolute right-0 top-full z-50 mt-3 w-[calc(100vw-1.5rem)] max-w-64 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {currentUser.name || "Admin User"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {currentUser.email || "contact@ommphysioworld.com"}
                    </p>
                  </div>

                  {adminUser ? (
                    <>
                      <button
                        onClick={() => {
                          navigate("/profile");
                          setOpen(false);
                        }}
                        className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <UserCircle2 size={18} />
                        Admin Profile
                      </button>

                      <button
                        onClick={() => setOpen(false)}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      >
                        <Settings2 size={18} />
                        Quick Settings
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        navigate("/my-profile");
                        setOpen(false);
                      }}
                      className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <UserCircle2 size={18} />
                      My Profile
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
