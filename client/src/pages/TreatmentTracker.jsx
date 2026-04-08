import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  PhoneCall,
  RotateCcw,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const panelClass = "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm";

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
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

function PatientCard({ patient, type, onOpen }) {
  const latestSessionText =
    type === "active" && patient.activeTreatmentPlan
      ? `${formatDate(patient.activeTreatmentPlan.fromDate)} to ${formatDate(
          patient.activeTreatmentPlan.toDate
        )}`
      : patient.latestSession
      ? `${formatDate(patient.latestSession.date)}${
          patient.latestSession.service ? ` • ${patient.latestSession.service}` : ""
        }`
      : "No session yet";

  const conditionText =
    type === "active" && patient.activeTreatmentPlan?.treatmentTypes?.length
      ? patient.activeTreatmentPlan.treatmentTypes.join(", ")
      : patient.disease || "Not added";

  const compactAppointmentText = patient.nextAppointment
    ? formatDate(patient.nextAppointment.date)
    : latestSessionText;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900">{patient.name}</p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                type === "upcoming"
                  ? "bg-blue-50 text-blue-700"
                  : type === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {type === "upcoming"
                ? "Upcoming"
                : type === "active"
                ? "In Treatment"
                : "Follow-up"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {compactAppointmentText}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {patient.mobile || patient.email || "No contact"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpen(patient.id)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Eye size={16} />
          Open
        </button>
      </div>

      <div className="hidden">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Next Appointment</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {patient.nextAppointment
              ? `${formatDate(patient.nextAppointment.date)}${
                  patient.nextAppointment.service ? ` • ${patient.nextAppointment.service}` : ""
                }`
              : "No upcoming appointment"}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Latest Session</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{latestSessionText}</p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            {type === "active" ? "Treatment Types" : "Condition"}
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900">{conditionText}</p>
        </div>
      </div>

      {type === "followup" ? (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Last session was {patient.daysSinceLastSession} day
          {patient.daysSinceLastSession === 1 ? "" : "s"} ago.
        </div>
      ) : null}
    </div>
  );
}

function AppointmentRequestCard({
  request,
  form,
  onFormChange,
  onApprove,
  onReschedule,
  onCancel,
  saving,
}) {
  const isPending = !request.status || request.status === "pending";
  const statusStyles = {
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-emerald-50 text-emerald-700",
    rescheduled: "bg-sky-50 text-sky-700",
    cancelled: "bg-rose-50 text-rose-700",
  };
  const confirmedText =
    request.confirmedDate || request.confirmedTime
      ? `${formatDate(request.confirmedDate)}${request.confirmedTime ? ` at ${request.confirmedTime}` : ""}`
      : "Not confirmed yet";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900">
              {request.name || "Patient"}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                statusStyles[request.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {request.status || "pending"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {request.service || "Appointment"} | {formatDate(request.requestedDate)}
            {request.requestedTime ? ` at ${request.requestedTime}` : ""}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {request.phone || request.email || "No contact"}
          </p>
        </div>
        {!isPending ? (
          <p className="shrink-0 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Confirmed: {confirmedText}
          </p>
        ) : null}
      </div>

      <div className="hidden">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-400">Service</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {request.service || "Not provided"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3 md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-400">Message</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {request.message || "No message added."}
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-[140px_120px_minmax(160px,1fr)_auto_auto_auto]">
          <input
            type="date"
            value={form.date}
            onChange={(event) => onFormChange(request.id, "date", event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <input
            type="time"
            value={form.time}
            onChange={(event) => onFormChange(request.id, "time", event.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <input
            type="text"
            value={form.note}
            onChange={(event) => onFormChange(request.id, "note", event.target.value)}
            placeholder="Admin note"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => onApprove(request)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            Approve
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onReschedule(request)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            <RotateCcw size={16} />
            Reschedule
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onCancel(request)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <XCircle size={16} />
            Cancel
          </button>
        </div>
      ) : null}

      {request.decisionNote ? (
        <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Admin note: {request.decisionNote}
        </div>
      ) : null}
    </div>
  );
}

function TodayAppointmentCard({
  appointment,
  form,
  onFormChange,
  onUpdateStatus,
  onOpen,
  saving,
}) {
  const status = appointment.status || "approved";
  const isActionable = ["approved", "rescheduled"].includes(status);
  const statusStyles = {
    approved: "bg-emerald-50 text-emerald-700",
    rescheduled: "bg-sky-50 text-sky-700",
    completed: "bg-slate-900 text-white",
    cancelled: "bg-rose-50 text-rose-700",
  };
  const confirmedText = `${formatDate(appointment.confirmedDate)}${
    appointment.confirmedTime ? ` at ${appointment.confirmedTime}` : ""
  }`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900">
              {appointment.name || "Patient"}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                statusStyles[status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {status === "completed" ? "done" : status}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {appointment.service || "Appointment"} | {confirmedText}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {appointment.phone || appointment.email || "No contact"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Today
          </p>
          {appointment.patientId ? (
            <button
              type="button"
              onClick={() => onOpen(appointment.patientId)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Eye size={16} />
              Open
            </button>
          ) : null}
        </div>
      </div>

      {appointment.decisionNote && !isActionable ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
          Remark: {appointment.decisionNote}
        </div>
      ) : null}

      {isActionable ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(180px,1fr)_auto_auto]">
          <input
            type="text"
            value={form.remark}
            onChange={(event) => onFormChange(appointment.id, "remark", event.target.value)}
            placeholder="Remark required"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => onUpdateStatus(appointment, "completed")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            <CheckCircle2 size={16} />
            Done
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onUpdateStatus(appointment, "cancelled")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            <XCircle size={16} />
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TodaySessionCard({ session, onUpdateStatus, onOpen, saving }) {
  const isDone = session.status === "done";
  const treatmentText = Array.isArray(session.treatmentTypes) && session.treatmentTypes.length
    ? session.treatmentTypes.join(", ")
    : "Treatment session";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-900">
              {session.patientName || "Patient"}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                isDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {isDone ? "Done" : "Not done"}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-600">
            {treatmentText} | {formatDate(session.date)}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-400">
            {session.patientMobile || session.patientEmail || "No contact"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving || isDone}
            onClick={() => onUpdateStatus(session, "done")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            Done
          </button>
          <button
            type="button"
            disabled={saving || !isDone}
            onClick={() => onUpdateStatus(session, "not_done")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            <XCircle size={16} />
            Not done
          </button>
          <button
            type="button"
            onClick={() => onOpen(session.patientId)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Eye size={16} />
            Open
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TreatmentTracker() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    appointmentRequests: [],
    todaysAppointments: [],
    todaysSessions: [],
    upcomingAppointments: [],
    activeSessions: [],
    followUpNeeded: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionForms, setActionForms] = useState({});
  const [todayForms, setTodayForms] = useState({});
  const [savingRequestId, setSavingRequestId] = useState("");
  const [savingTodayId, setSavingTodayId] = useState("");
  const [savingSessionDayId, setSavingSessionDayId] = useState("");

  const loadTracker = async () => {
    try {
      const response = await API.get("/treatment-tracker");
      setData(response.data);
      setError("");
      setActionForms((current) => {
        const next = { ...current };
        (response.data.appointmentRequests || []).forEach((request) => {
          if (!next[request.id]) {
            next[request.id] = {
              date: request.confirmedDate || request.requestedDate || "",
              time: request.confirmedTime || request.requestedTime || "",
              note: request.decisionNote || "",
            };
          }
        });
        return next;
      });
      setTodayForms((current) => {
        const next = { ...current };
        (response.data.todaysAppointments || []).forEach((appointment) => {
          if (!next[appointment.id]) {
            next[appointment.id] = {
              remark: appointment.decisionNote || "",
            };
          }
        });
        return next;
      });
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load treatment tracker.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracker();
    const intervalId = window.setInterval(loadTracker, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  const updateActionForm = (requestId, key, value) => {
    setActionForms((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || {}),
        [key]: value,
      },
    }));
  };

  const updateTodayForm = (appointmentId, key, value) => {
    setTodayForms((current) => ({
      ...current,
      [appointmentId]: {
        ...(current[appointmentId] || {}),
        [key]: value,
      },
    }));
  };

  const updateAppointmentRequest = async (request, action) => {
    const form = actionForms[request.id] || {};
    const date =
      form.date || request.confirmedDate || request.requestedDate || "";

    if (!date) {
      setError("Please select a date before updating this appointment.");
      return;
    }

    try {
      setSavingRequestId(request.id);
      await API.patch(`/appointments/${request.id}/${action}`, {
        date,
        time: form.time || request.confirmedTime || request.requestedTime || "",
        note: form.note || "",
      });
      await loadTracker();
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update appointment.");
    } finally {
      setSavingRequestId("");
    }
  };

  const cancelAppointmentRequest = async (request) => {
    const form = actionForms[request.id] || {};
    const remark = form.note || "";

    if (!remark.trim()) {
      setError("Please add an admin note before cancelling this appointment.");
      return;
    }

    try {
      setSavingRequestId(request.id);
      await API.patch(`/appointments/${request.id}/status`, {
        status: "cancelled",
        remark,
      });
      await loadTracker();
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to cancel appointment.");
    } finally {
      setSavingRequestId("");
    }
  };

  const updateTodayAppointmentStatus = async (appointment, status) => {
    const form = todayForms[appointment.id] || {};
    const remark = form.remark || "";

    if (!remark.trim()) {
      setError("Please add a remark before marking the appointment.");
      return;
    }

    try {
      setSavingTodayId(appointment.id);
      await API.patch(`/appointments/${appointment.id}/status`, {
        status,
        remark,
      });
      await loadTracker();
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update today's appointment.");
    } finally {
      setSavingTodayId("");
    }
  };

  const updateTodaySessionStatus = async (session, status) => {
    try {
      setSavingSessionDayId(session.dayId);
      await API.patch(
        `/patients/${session.patientId}/treatment-plans/${session.planId}/session-days/${session.dayId}`,
        { status }
      );
      await loadTracker();
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update today's session.");
    } finally {
      setSavingSessionDayId("");
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Appointment Requests",
        value: data.appointmentRequests.length,
        icon: CalendarClock,
        tone: "bg-sky-50 text-sky-600",
      },
      {
        label: "Today's Appointments",
        value: data.todaysAppointments.length,
        icon: CalendarClock,
        tone: "bg-cyan-50 text-cyan-600",
      },
      {
        label: "Upcoming Appointments",
        value: data.upcomingAppointments.length,
        icon: CalendarClock,
        tone: "bg-blue-50 text-blue-600",
      },
      {
        label: "Active Sessions",
        value: data.activeSessions.length,
        icon: Activity,
        tone: "bg-emerald-50 text-emerald-600",
      },
      {
        label: "Need Follow-up",
        value: data.followUpNeeded.length,
        icon: PhoneCall,
        tone: "bg-amber-50 text-amber-600",
      },
    ],
    [data]
  );

  const openProfile = (patientId) => navigate(`/patients/${patientId}`);

  const sections = [
    {
      key: "upcoming",
      title: "Upcoming Appointment List",
      subtitle: "Patients who already have future appointments scheduled.",
      items: data.upcomingAppointments,
      empty: "No upcoming appointments found.",
    },
    {
      key: "active",
      title: "Session List",
      subtitle: "Patients with active treatment sessions started from patient profile.",
      items: data.activeSessions,
      empty: "No active treatment sessions found.",
    },
    {
      key: "followup",
      title: "Treatment Completed Follow-up",
      subtitle: "Patients whose last session was more than 7 days ago and may need a condition update.",
      items: data.followUpNeeded,
      empty: "No follow-up cases are pending right now.",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-950 via-cyan-950 to-emerald-900 px-5 py-4 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">Treatment Flow</p>
              <div>
                <h1 className="text-2xl font-semibold">Treatment Tracker</h1>
                <p className="mt-1 max-w-3xl text-sm text-white/75">
                  Review upcoming appointments, patients currently in treatment,
                  and completed cases that are due for a condition follow-up after 7 days.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Tracker Logic</p>
              <p className="mt-1 text-xs text-white/80">
                Session list now comes from active treatment sessions started inside patient profile.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {loading ? "..." : value}
                  </p>
                </div>
                <div className={`rounded-xl p-2.5 ${tone}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <section className={panelClass}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Today&apos;s Sessions
                </h2>
                <p className="text-sm text-slate-500">
                  Patient-wise treatment sessions scheduled for today.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {loading ? "..." : data.todaysSessions.length} sessions
              </div>
            </div>

            <div className="space-y-4">
              {!loading && data.todaysSessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No treatment sessions scheduled for today.
                </div>
              ) : (
                data.todaysSessions.map((session) => (
                  <TodaySessionCard
                    key={`${session.planId}-${session.dayId}`}
                    session={session}
                    onUpdateStatus={updateTodaySessionStatus}
                    onOpen={openProfile}
                    saving={savingSessionDayId === session.dayId}
                  />
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Today&apos;s Appointments
                </h2>
                <p className="text-sm text-slate-500">
                  Mark today&apos;s confirmed appointments as done or cancelled with an admin remark.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {loading ? "..." : data.todaysAppointments.length} today
              </div>
            </div>

            <div className="space-y-4">
              {!loading && data.todaysAppointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No appointments scheduled for today.
                </div>
              ) : (
                data.todaysAppointments.map((appointment) => (
                  <TodayAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    form={
                      todayForms[appointment.id] || {
                        remark: appointment.decisionNote || "",
                      }
                    }
                    onFormChange={updateTodayForm}
                    onUpdateStatus={updateTodayAppointmentStatus}
                    onOpen={openProfile}
                    saving={savingTodayId === appointment.id}
                  />
                ))
              )}
            </div>
          </section>

          <section className={panelClass}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Appointment Requests
                </h2>
                <p className="text-sm text-slate-500">
                  Patient appointment requests now live here, not in mailbox.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {loading ? "..." : data.appointmentRequests.length} requests
              </div>
            </div>

            <div className="space-y-4">
              {!loading && data.appointmentRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No appointment requests found.
                </div>
              ) : (
                data.appointmentRequests.map((request) => (
                  <AppointmentRequestCard
                    key={request.id}
                    request={request}
                    form={
                      actionForms[request.id] || {
                        date: request.confirmedDate || request.requestedDate || "",
                        time: request.confirmedTime || request.requestedTime || "",
                        note: request.decisionNote || "",
                      }
                    }
                    onFormChange={updateActionForm}
                    onApprove={(item) => updateAppointmentRequest(item, "approve")}
                    onReschedule={(item) =>
                      updateAppointmentRequest(item, "reschedule")
                    }
                    onCancel={cancelAppointmentRequest}
                    saving={savingRequestId === request.id}
                  />
                ))
              )}
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.key} className={panelClass}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                  <p className="text-sm text-slate-500">{section.subtitle}</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                  {loading ? "..." : section.items.length} patients
                </div>
              </div>

              <div className="space-y-4">
                {!loading && section.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    {section.empty}
                  </div>
                ) : (
                  section.items.map((patient) => (
                    <PatientCard
                      key={`${section.key}-${patient.id}`}
                      patient={patient}
                      type={section.key}
                      onOpen={openProfile}
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>

        <section className={panelClass}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">How This Works</h2>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <p>Dashboard revenue includes payments added inside treatment sessions from patient profile.</p>
                <p>Dashboard today&apos;s schedule includes active treatment sessions that cover today&apos;s date range.</p>
                <p>Session list in treatment tracker comes from active treatment sessions started in patient profile.</p>
                <p>Follow-up list still highlights patients whose latest completed session is older than 7 days.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
