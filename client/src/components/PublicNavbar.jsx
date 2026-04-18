import { Clock3, Download, LogOut, MapPin, Menu, Phone, UserCircle2, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logoImage from "../assets/opw.png";
import { clearPatientUser, getPatientUser } from "../utils/patientAuth";

const copy = {
  nav: [
    { label: "Home", path: "/" },
    { label: "About", path: "/about" },
    { label: "Services", path: "/care" },
    { label: "FAQ", path: "/faq" },
    { label: "Career", path: "/career/requirements" },
    { label: "Contact", path: "/contact" },
  ],
  hours: "Monday to Saturday, 9:00 AM to 7:00 PM",
  location: "Baripada, Odisha",
  reachClinic: "Reach Clinic",
  downloadApp: "Download our app",
  clinicName: "Omm Physio World",
  doctor: "Dr. Tapaswini Sahu",
};

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [patientUser, setPatientUser] = useState(() => getPatientUser());
  const navigate = useNavigate();
  const t = copy;
  const dashboardLabel = "Dashboard";
  const loginLabel = "Login";
  const registerLabel = "Register";
  const profileLabel = "Profile";
  const logoutLabel = "Logout";
  const visibleNav = patientUser
    ? [...t.nav, { label: dashboardLabel, path: "/patient-dashboard" }]
    : t.nav;

  const handleLogout = () => {
    clearPatientUser();
    setPatientUser(null);
    setProfileOpen(false);
    setOpen(false);
    navigate("/patient-login?redirect=/patient-dashboard");
  };

  const navLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
      isActive
        ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15"
        : "text-slate-600 hover:bg-white hover:text-slate-950"
    }`;

  const scrollPageTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-slate-200/10 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-4 text-white/80">
            <div className="inline-flex items-center gap-2">
              <Clock3 size={15} />
              {t.hours}
            </div>
            <div className="hidden h-4 w-px bg-white/20 lg:block" />
            <div className="inline-flex items-center gap-2">
              <MapPin size={15} />
              {t.location}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#download-app"
              onClick={(event) => event.preventDefault()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/95 transition hover:bg-white hover:text-slate-950"
              title="Download app"
            >
              <Download size={14} />
              {t.downloadApp}
            </a>
            <a
              href="tel:+918895555519"
              className="inline-flex items-center gap-2 text-white/95 transition hover:text-white"
            >
              <Phone size={15} />
              +91 88955 55519
            </a>
          </div>
        </div>
      </div>

      <div className="border-b border-white/60 bg-white/70 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 rounded-[30px] border border-white/70 bg-white/75 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur xl:px-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full">
                <img
                  src={logoImage}
                  alt="Omm Physio World logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <p className="text-xl font-semibold tracking-tight text-slate-950">
                  {t.clinicName}
                </p>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  {t.doctor}
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 p-1.5 lg:flex">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={navLinkClass}
                  onClick={scrollPageTop}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <Link
                to="/contact"
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.reachClinic}
              </Link>
              {patientUser ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((current) => !current)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
                    title={patientUser.name || "Patient profile"}
                  >
                    <UserCircle2 size={22} />
                  </button>
                  {profileOpen ? (
                    <div className="absolute right-0 top-14 w-56 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/15">
                      <div className="px-4 py-3">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {patientUser.name || "Patient"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {patientUser.email}
                        </p>
                      </div>
                      <Link
                        to="/patient-profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <UserCircle2 size={17} />
                        {profileLabel}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
                      >
                        <LogOut size={17} />
                        {logoutLabel}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <Link
                    to="/patient-register?redirect=/patient-dashboard"
                    className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-medium text-sky-700 hover:bg-sky-100"
                  >
                    {registerLabel}
                  </Link>
                  <Link
                    to="/patient-login?redirect=/patient-dashboard"
                    className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"
                  >
                    {loginLabel}
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 lg:hidden"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium ${
                      isActive
                        ? "bg-slate-950 text-white"
                        : "text-slate-700 hover:bg-slate-50"
                    }`
                  }
                  onClick={() => {
                    setOpen(false);
                    scrollPageTop();
                  }}
                >
                  {item.label}
                </NavLink>
              ))}

              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Link
                  to="/contact"
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700"
                  onClick={() => setOpen(false)}
                >
                  {t.reachClinic}
                </Link>
                {patientUser ? (
                  <Link
                    to="/patient-dashboard"
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white"
                    onClick={() => setOpen(false)}
                  >
                    {dashboardLabel}
                  </Link>
                ) : (
                  <Link
                    to="/patient-login?redirect=/patient-dashboard"
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white"
                    onClick={() => setOpen(false)}
                  >
                    {loginLabel}
                  </Link>
                )}
              </div>
              {patientUser ? (
                <>
                  <Link
                    to="/patient-profile"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-medium text-sky-700"
                  onClick={() => setOpen(false)}
                >
                  <UserCircle2 size={18} />
                  {profileLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-600"
                >
                  <LogOut size={18} />
                  {logoutLabel}
                </button>
              </>
            ) : (
              <Link
                to="/patient-register?redirect=/patient-dashboard"
                className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-medium text-sky-700"
                onClick={() => setOpen(false)}
              >
                {registerLabel}
              </Link>
            )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

