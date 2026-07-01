import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Calculator,
  CalendarRange,
  ClipboardList,
  IndianRupee,
  Users,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getMonthStartKey = () => `${getTodayKey().slice(0, 7)}-01`;

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const staffReportKey = (report) => report?.staffId || report?.staffName || "unassigned";

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function ReportsPage() {
  const [fromDate, setFromDate] = useState(getMonthStartKey());
  const [toDate, setToDate] = useState(getTodayKey());
  const [selectedStaffKey, setSelectedStaffKey] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
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

  const staffWorkReports = useMemo(() => data?.staffWorkReports || [], [data]);
  const staffOptions = useMemo(
    () =>
      staffWorkReports.map((report) => ({
        key: staffReportKey(report),
        label: report.staffName || "Unassigned staff",
      })),
    [staffWorkReports]
  );

  useEffect(() => {
    if (staffOptions.length === 0) {
      setSelectedStaffKey("");
      return;
    }

    if (!staffOptions.some((option) => option.key === selectedStaffKey)) {
      setSelectedStaffKey(staffOptions[0].key);
    }
  }, [selectedStaffKey, staffOptions]);

  const selectedReport =
    staffWorkReports.find((report) => staffReportKey(report) === selectedStaffKey) ||
    staffWorkReports[0];
  const patientRows = selectedReport?.patients || [];
  const totalDoneDays = Number(selectedReport?.totalDoneDays || 0);
  const totalClinicDays = Number(selectedReport?.totalClinicDays || 0);
  const totalHomeVisitDays = Number(selectedReport?.totalHomeVisitDays || 0);
  const totalPaidAmount = Number(selectedReport?.totalPaidAmount || 0);
  const totalCommissionBaseAmount = Number(
    selectedReport?.totalCommissionBaseAmount ?? totalPaidAmount
  );
  const commissionRate = Math.max(0, Number(commissionPercent || 0));
  const commissionAmount = (totalCommissionBaseAmount * commissionRate) / 100;
  const activeRange = data?.range || { from: fromDate, to: toDate };

  const handleApply = (event) => {
    event.preventDefault();
    if (fromDate && toDate && fromDate > toDate) {
      setError("From date cannot be after to date.");
      return;
    }
    loadReport();
  };

  const cards = [
    {
      label: "Treatment Days",
      value: totalDoneDays,
      note: "Done sessions by selected staff",
      icon: ClipboardList,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Paid By Patients",
      value: formatMoney(totalPaidAmount),
      note: "Payments linked to those patients",
      icon: IndianRupee,
      tone: "bg-amber-50 text-amber-700",
    },
    {
      label: "Clinic Days",
      value: totalClinicDays,
      note: "Treatment days at clinic",
      icon: Users,
      tone: "bg-sky-50 text-sky-700",
    },
    {
      label: "Home Visit Days",
      value: totalHomeVisitDays,
      note: "Treatment days at patient home",
      icon: CalendarRange,
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Commission",
      value: formatMoney(commissionAmount),
      note: `${commissionRate || 0}% after excluding consultant charges`,
      icon: Calculator,
      tone: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-teal-950 to-cyan-900 px-5 py-5 text-white shadow-md">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Report Desk</p>
              <h1 className="text-2xl font-semibold leading-tight">Staff Work Report</h1>
              <p className="text-sm leading-6 text-white/75">
                Select a staff member and date range to check patient-wise treatment days,
                collected patient payments, and commission calculation.
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
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                From Date
              </span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Staff
              </span>
              <select
                value={selectedStaffKey}
                onChange={(event) => setSelectedStaffKey(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              >
                {staffOptions.length === 0 ? (
                  <option value="">No staff work found</option>
                ) : (
                  staffOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Commission %
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={commissionPercent}
                onChange={(event) => setCommissionPercent(event.target.value)}
                placeholder="Example: 10"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {loading ? "Loading..." : "Apply"}
            </button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {cards.map(({ label, value, note, icon: Icon, tone }) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
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
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Patient-Wise Work</h2>
              <p className="text-sm text-slate-500">
                Shows how many treatment days the selected staff completed for each patient.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              <CalendarRange size={16} />
              {formatDate(activeRange.from)} to {formatDate(activeRange.to)}
            </div>
          </div>

          {patientRows.length === 0 ? (
            <EmptyState message="No staff treatment work found for this range." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Treatment Days</th>
                    <th className="px-3 py-3">Clinic / Home</th>
                    <th className="px-3 py-3">Paid By Patient</th>
                    <th className="px-3 py-3">Commission Base</th>
                    <th className="px-3 py-3">Commission</th>
                    <th className="px-3 py-3">Done Dates</th>
                    <th className="px-3 py-3 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {patientRows.map((patient) => {
                    const entries = patient.entries || [];
                    const patientCommissionBase = Number(
                      patient.commissionBaseAmount ?? patient.paidAmount ?? 0
                    );
                    const patientCommissionAmount = (patientCommissionBase * commissionRate) / 100;
                    const dateSummary = entries
                      .slice(0, 5)
                      .map((entry) => {
                        const location = entry.treatmentLocationLabel
                          ? `, ${entry.treatmentLocationLabel}`
                          : "";
                        return `${formatDate(entry.date)} (${entry.treatmentType || "Treatment"}${location})`;
                      })
                      .join(", ");
                    const extraCount = Math.max(0, entries.length - 5);

                    return (
                      <tr key={patient.patientId} className="border-b border-slate-100 align-top">
                        <td className="px-3 py-3">
                          <p className="font-medium text-slate-900">{patient.patientName}</p>
                          <p className="text-xs text-slate-500">{patient.patientMobile || "-"}</p>
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            {patient.doneDays || 0} days
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                              {patient.clinicDays || 0} clinic
                            </span>
                            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                              {patient.homeVisitDays || 0} home
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 font-semibold text-slate-900">
                          {formatMoney(patient.paidAmount)}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-slate-900">
                            {formatMoney(patientCommissionBase)}
                          </p>
                          <p className="text-xs text-slate-500">Consultant charge excluded</p>
                        </td>
                        <td className="px-3 py-3 font-semibold text-violet-700">
                          {formatMoney(patientCommissionAmount)}
                        </td>
                        <td className="max-w-xl px-3 py-3 text-slate-600">
                          {dateSummary || "-"}
                          {extraCount > 0 ? `, +${extraCount} more` : ""}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            to={`/patients/${patient.patientId}`}
                            className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Patient
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
