import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import {
  Users,
  CalendarDays,
  Wallet,
  UserCog,
  ArrowUpRight,
  Clock3,
  Activity,
  CheckCircle2,
} from "lucide-react";

const chartColors = ["#2563eb", "#0891b2", "#10b981", "#f59e0b", "#e11d48"];

const formatChartValue = (value, type = "number") =>
  type === "currency" ? `Rs. ${Number(value || 0).toLocaleString("en-IN")}` : value;

function HorizontalChartCard({ title, subtitle, items = [], type = "number" }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="motion-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{formatChartValue(item.value, type)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(4, (Number(item.value || 0) / maxValue) * 100)}%`,
                  backgroundColor: chartColors[index % chartColors.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartCard({ title, subtitle, items = [] }) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);
  let cursor = 0;
  const segments = items
    .map((item, index) => {
      const value = Number(item.value || 0);
      const start = cursor;
      cursor += total ? (value / total) * 100 : 0;
      return `${chartColors[index % chartColors.length]} ${start}% ${cursor}%`;
    })
    .join(", ");
  const chartBackground = total ? `conic-gradient(${segments})` : "#e2e8f0";

  return (
    <div className="motion-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <div
          className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
          style={{ background: chartBackground }}
        >
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <span className="text-2xl font-semibold text-slate-950">{total}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Total
            </span>
          </div>
        </div>

        <div className="w-full space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                {item.label}
              </span>
              <span className="text-slate-500">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VerticalChartCard({ title, subtitle, items = [] }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value || 0)), 1);

  return (
    <div className="motion-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex h-52 items-end gap-3 rounded-2xl bg-slate-50 px-4 py-5">
        {items.map((item, index) => (
          <div key={item.key || item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="text-xs font-medium text-slate-500">
              {formatChartValue(item.value, "currency")}
            </div>
            <div className="flex h-28 w-full items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-2xl bg-gradient-to-t from-blue-700 to-cyan-400"
                style={{
                  height: `${Math.max(8, (Number(item.value || 0) / maxValue) * 100)}%`,
                  opacity: 0.55 + index * 0.07,
                }}
              />
            </div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await API.get("/dashboard");
        setData(response.data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const statsData = data?.stats || {};

    return [
      {
        title: "Total Patients",
        value: statsData.totalPatients ?? 0,
        change: "Registered patient records",
        icon: Users,
        tone: "bg-blue-50 text-blue-600",
      },
      {
        title: "Today's Schedule",
        value: statsData.todaysSchedule ?? statsData.appointmentsToday ?? 0,
        change: "Appointments and sessions due today",
        icon: CalendarDays,
        tone: "bg-emerald-50 text-emerald-600",
      },
      {
        title: "Recorded Payments",
        value: `Rs. ${Number(statsData.revenue || 0).toLocaleString("en-IN")}`,
        change: "Treatment-session payments",
        icon: Wallet,
        tone: "bg-amber-50 text-amber-600",
      },
      {
        title: "Team Members",
        value: statsData.staff ?? 0,
        change: "Staff accounts in OPW",
        icon: UserCog,
        tone: "bg-violet-50 text-violet-600",
      },
    ];
  }, [data]);

  const quickStats = useMemo(() => {
    const quickStatsData = data?.quickStats || {};

    return [
      {
        label: "Pending Requests",
        value: quickStatsData.pendingRequests ?? quickStatsData.pendingAppointmentRequests ?? 0,
        icon: CheckCircle2,
      },
      {
        label: "Active Sessions",
        value: quickStatsData.activeSessions ?? quickStatsData.activeTreatmentSessions ?? 0,
        icon: Activity,
      },
      {
        label: "Next Schedule",
        value: quickStatsData.nextSchedule || "Not scheduled",
        icon: Clock3,
      },
    ];
  }, [data]);

  const todaysSchedule = data?.todaysSchedule || [];
  const upcomingSchedule = data?.upcomingSchedule || [];
  const charts = data?.charts || {};
  const appointmentStatusChart = charts.appointmentStatus || [];
  const sessionStatusChart = charts.sessionStatus || [];
  const revenueByMonth = charts.revenueByMonth || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="motion-panel rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                Clinic Operations
              </p>
              <h1 className="text-2xl font-semibold leading-tight">
                Today&apos;s OPW operations at a glance.
              </h1>
              <p className="text-sm leading-6 text-white/75">
                Review today&apos;s schedule, pending appointment requests,
                active treatment sessions, patient records, and collected session
                payments.
              </p>
              {error && (
                <div className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {quickStats.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur"
                >
                  <div className="mb-2 inline-flex rounded-lg bg-white/10 p-1.5 text-white">
                    <Icon size={18} />
                  </div>
                  <p className="text-lg font-semibold">{loading ? "..." : value}</p>
                  <p className="text-xs text-white/70">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stagger-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ title, value, change, icon: Icon, tone }) => (
            <div
              key={title}
              className="motion-card rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">{title}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">
                    {loading ? "..." : value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${tone}`}>
                  <Icon size={22} />
                </div>
              </div>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-sm text-slate-600">
                <ArrowUpRight size={15} />
                {change}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <HorizontalChartCard
            title="Appointment Requests"
            subtitle="Pending, approved, rescheduled, completed, and cancelled requests."
            items={appointmentStatusChart}
          />
          <PieChartCard
            title="Treatment Sessions"
            subtitle="Active and completed treatment session count."
            items={sessionStatusChart}
          />
          <VerticalChartCard
            title="Payment Trend"
            subtitle="Recorded treatment payments over the last six months."
            items={revenueByMonth}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <section className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Today's Schedule
                </h2>
                <p className="text-sm text-slate-500">
                  Only items scheduled for today.
                </p>
              </div>

              <div className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {todaysSchedule.length} items
              </div>
            </div>

            <div className="stagger-grid space-y-4">
              {todaysSchedule.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No schedule items for today.
                </div>
              ) : (
                todaysSchedule.map((item) => (
                  <div
                    key={`${item.patient}-${item.time}-${item.service}`}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 font-semibold text-blue-600">
                        {item.patient.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{item.patient}</p>
                        <p className="text-sm text-slate-500">{item.service}</p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                      {item.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Upcoming Schedule
                  </h2>
                  <p className="text-sm text-slate-500">
                    Future appointments and sessions after today.
                  </p>
                </div>

                <div className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                  {upcomingSchedule.length} items
                </div>
              </div>

              <div className="space-y-3">
                {upcomingSchedule.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No upcoming schedule items.
                  </div>
                ) : (
                  upcomingSchedule.map((item) => (
                    <div
                      key={`upcoming-${item.patient}-${item.time}-${item.service}`}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-slate-900">{item.patient}</p>
                          <p className="text-sm text-slate-500">{item.service}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            item.kind === "session"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {item.kind === "session" ? "Session" : "Appointment"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                        {item.time}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Clinic Performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Daily operational summary.
              </p>

              <div className="mt-6 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>Appointment Utilization</span>
                    <span>{Math.min(100, (todaysSchedule.length || 0) * 20)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-blue-600"
                      style={{ width: `${Math.min(100, (todaysSchedule.length || 0) * 20)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>Billing Progress</span>
                    <span>{Math.min(100, Number(data?.stats?.revenue || 0) > 0 ? 68 : 0)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Number(data?.stats?.revenue || 0) > 0 ? 68 : 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm text-slate-600">
                    <span>Staff Availability</span>
                    <span>{Math.min(100, (data?.stats?.staff || 0) * 20)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, (data?.stats?.staff || 0) * 20)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="motion-card rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Notes
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Highlights to keep your team aligned today.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  Patient data, services, and staff records now load directly from MongoDB.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  Today&apos;s schedule now shows only same-date items, and later dates appear in Upcoming Schedule.
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  Payment totals are calculated from treatment-session payments recorded in patient profiles.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
