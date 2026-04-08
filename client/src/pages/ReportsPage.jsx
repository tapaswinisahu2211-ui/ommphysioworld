import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  CalendarRange,
  ClipboardList,
  CreditCard,
  IndianRupee,
  Users,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getMonthStartKey = () => {
  const today = getTodayKey();
  return `${today.slice(0, 7)}-01`;
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getAppointmentStatusLabel = (status) => {
  if (status === "completed") {
    return "Done";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "rescheduled") {
    return "Rescheduled";
  }

  return "Scheduled";
};

const appointmentStatusTone = (status) => {
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "cancelled") {
    return "bg-rose-50 text-rose-700";
  }

  if (status === "rescheduled") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-sky-50 text-sky-700";
};

const sessionStatusTone = (status) =>
  status === "done" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";

function TableEmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(getMonthStartKey());
  const [toDate, setToDate] = useState(getTodayKey());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/reports", {
        params: {
          from: fromDate,
          to: toDate,
        },
      });
      setData(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleApply = (event) => {
    event.preventDefault();

    if (fromDate && toDate && fromDate > toDate) {
      setError("From date cannot be after to date.");
      return;
    }

    loadReport();
  };

  const summary = data?.summary || {};
  const appointments = data?.appointments || [];
  const sessions = data?.sessions || [];
  const payments = data?.payments || [];
  const activeRange = data?.range || { from: fromDate, to: toDate };

  const summaryCards = [
    {
      label: "Patients Covered",
      value: summary.patientsCovered ?? 0,
      note: "Unique patients in selected range",
      icon: Users,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Appointments",
      value: summary.appointmentCount ?? 0,
      note: `${summary.completedAppointments ?? 0} completed`,
      icon: CalendarRange,
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Session Days",
      value: summary.sessionCount ?? 0,
      note: `${summary.completedSessions ?? 0} marked done`,
      icon: ClipboardList,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Payments",
      value: summary.paymentCount ?? 0,
      note: "Entries collected in range",
      icon: CreditCard,
      tone: "bg-violet-50 text-violet-700",
    },
    {
      label: "Collected Amount",
      value: formatMoney(summary.paymentAmount || 0),
      note: "Session and direct payments",
      icon: IndianRupee,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Report Desk</p>
              <h1 className="text-2xl font-semibold leading-tight">
                Patient appointment, session, and payment reports.
              </h1>
              <p className="text-sm leading-6 text-white/75">
                Filter by date range and review patient-wise appointment updates, daily session
                records, and payment entries from one admin report page.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/85">
              <BarChart3 size={16} />
              {formatDate(activeRange.from)} to {formatDate(activeRange.to)}
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={handleApply}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Filter Range</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select from date and to date to check patient report details.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  From Date
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  To Date
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {loading ? "Loading..." : "Apply Report"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate(getMonthStartKey());
                setToDate(getTodayKey());
              }}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Reset Dates
            </button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map(({ label, value, note, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {loading ? "..." : value}
                  </p>
                </div>
                <div className={`rounded-2xl p-3 ${tone}`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{note}</p>
            </div>
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Appointments</h2>
            <p className="text-sm text-slate-500">
              Patient-wise booked appointment records within the selected range.
            </p>
          </div>

          {appointments.length === 0 ? (
            <TableEmptyState message="No appointment records found for this range." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Service</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">OPW Remark</th>
                    <th className="px-3 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{appointment.patientName}</p>
                        <p className="text-xs text-slate-500">{appointment.patientMobile}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{appointment.service}</td>
                      <td className="px-3 py-3 text-slate-700">{appointment.date || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{appointment.time || "-"}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${appointmentStatusTone(
                            appointment.status
                          )}`}
                        >
                          {getAppointmentStatusLabel(appointment.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{appointment.remark || "-"}</td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          to={`/patients/${appointment.patientId}`}
                          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Patient
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Sessions</h2>
            <p className="text-sm text-slate-500">
              Daily session status records between selected dates.
            </p>
          </div>

          {sessions.length === 0 ? (
            <TableEmptyState message="No session day records found for this range." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Treatment</th>
                    <th className="px-3 py-3">Session Status</th>
                    <th className="px-3 py-3">Plan Period</th>
                    <th className="px-3 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{session.patientName}</p>
                        <p className="text-xs text-slate-500">{session.patientMobile}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{session.date || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{session.treatmentTypes}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sessionStatusTone(
                            session.status
                          )}`}
                        >
                          {session.status === "done" ? "Done" : "Not done"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {session.fromDate} to {session.toDate}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          to={`/patients/${session.patientId}`}
                          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Patient
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Payments</h2>
            <p className="text-sm text-slate-500">
              Session and direct payment entries for patients in the selected range.
            </p>
          </div>

          {payments.length === 0 ? (
            <TableEmptyState message="No payment records found for this range." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Treatment</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3">
                        <p className="font-medium text-slate-900">{payment.patientName}</p>
                        <p className="text-xs text-slate-500">{payment.patientMobile}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-700">{formatDate(payment.date)}</td>
                      <td className="px-3 py-3 text-slate-700">{payment.source}</td>
                      <td className="px-3 py-3 text-slate-600">{payment.treatmentTypes || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{payment.method || "-"}</td>
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {formatMoney(payment.amount)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          to={`/patients/${payment.patientId}`}
                          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Patient
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
