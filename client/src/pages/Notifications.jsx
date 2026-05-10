import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Search,
  Send,
  Users,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const formatDateTime = (value) => {
  if (!value) {
    return "Now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function Notifications() {
  const [patients, setPatients] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [audience, setAudience] = useState("selected");
  const [selectedPatientIds, setSelectedPatientIds] = useState([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");

  const filteredPatients = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return patients;
    }

    return patients.filter((patient) =>
      [patient.name, patient.email, patient.mobile]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(keyword))
    );
  }, [patients, query]);

  const selectedPatients = useMemo(
    () => patients.filter((patient) => selectedPatientIds.includes(patient.id)),
    [patients, selectedPatientIds]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [patientsResponse, notificationsResponse] = await Promise.all([
        API.get("/patients"),
        API.get("/notifications/admin"),
      ]);
      setPatients(patientsResponse.data || []);
      setHistory(notificationsResponse.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load notification data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const togglePatient = (patientId) => {
    setSelectedPatientIds((current) =>
      current.includes(patientId)
        ? current.filter((id) => id !== patientId)
        : [...current, patientId]
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim() || !message.trim()) {
      setError("Title and message are required.");
      return;
    }

    if (audience !== "all" && selectedPatientIds.length === 0) {
      setError("Choose at least one patient or send to all patients.");
      return;
    }

    setSaving(true);
    try {
      const response = await API.post("/notifications/custom", {
        title: title.trim(),
        body: message.trim(),
        audience,
        patientIds: audience === "all" ? [] : selectedPatientIds,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      });
      setSuccess(response.data?.message || "Notification sent.");
      setTitle("");
      setMessage("");
      setScheduledFor("");
      setSelectedPatientIds([]);
      await loadData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to send notification.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 text-white shadow-xl">
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.24),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.18),_transparent_32%)]" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-200">
                  Patient Notifications
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight">
                  Send updates, reminders, offers, and festive wishes.
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                  Appointment, treatment, notes, therapy, payment, and follow-up notifications are automated.
                  Use this module for custom messages from admin or staff.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MetricCard icon={Users} label="Patients" value={patients.length} />
                <MetricCard icon={Bell} label="History" value={history.length} />
                <MetricCard icon={CheckCircle2} label="Selected" value={audience === "all" ? "All" : selectedPatientIds.length} />
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
          <form
            onSubmit={submit}
            className="rounded-[2rem] border border-white bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <Send size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">Create notification</h2>
                <p className="text-sm text-slate-500">Users will see it inside the app and Android notification bar after sync.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="Example: Diwali wellness offer"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-32 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="Write the notification message patients should receive."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Schedule</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <CalendarClock size={18} className="text-slate-400" />
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(event) => setScheduledFor(event.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </div>
                <span className="text-xs text-slate-400">Leave empty to send immediately.</span>
              </label>

              <div className="grid gap-3 rounded-3xl bg-slate-50 p-4">
                <span className="text-sm font-bold text-slate-700">Audience</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setAudience("selected")}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      audience === "selected" ? "bg-slate-950 text-white" : "bg-white text-slate-600"
                    }`}
                  >
                    Selected patients
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudience("all")}
                    className={`rounded-full px-4 py-2 text-sm font-bold ${
                      audience === "all" ? "bg-slate-950 text-white" : "bg-white text-slate-600"
                    }`}
                  >
                    All patients
                  </button>
                </div>

                {audience === "selected" ? (
                  <>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <Search size={17} className="text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        className="w-full bg-transparent text-sm outline-none"
                        placeholder="Search patient by name, email, or mobile"
                      />
                    </div>

                    <div className="max-h-80 space-y-2 overflow-auto pr-1">
                      {loading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 size={16} className="animate-spin" />
                          Loading patients...
                        </div>
                      ) : filteredPatients.length === 0 ? (
                        <p className="text-sm text-slate-500">No matching patients.</p>
                      ) : (
                        filteredPatients.map((patient) => {
                          const selected = selectedPatientIds.includes(patient.id);
                          return (
                            <button
                              type="button"
                              key={patient.id}
                              onClick={() => togglePatient(patient.id)}
                              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                                selected
                                  ? "border-sky-300 bg-sky-50"
                                  : "border-slate-100 bg-white hover:border-slate-200"
                              }`}
                            >
                              <span>
                                <span className="block text-sm font-bold text-slate-900">{patient.name}</span>
                                <span className="block text-xs text-slate-500">{patient.mobile || patient.email}</span>
                              </span>
                              <span
                                className={`h-5 w-5 rounded-full border ${
                                  selected ? "border-sky-600 bg-sky-600" : "border-slate-300 bg-white"
                                }`}
                              />
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    This notification will go to every active patient record.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {saving ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </form>

          <aside className="rounded-[2rem] border border-white bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Recent history</h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest automated and custom patient notifications.
            </p>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin" />
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No notifications have been created yet.
                </p>
              ) : (
                history.slice(0, 20).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          {item.patientName || "Patient"} | {item.category}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                        {item.readAt ? "Read" : "Unread"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      {formatDateTime(item.scheduledFor)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>

        {selectedPatients.length ? (
          <div className="rounded-3xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-900">
            Selected: {selectedPatients.map((patient) => patient.name).join(", ")}
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
      <Icon size={18} className="text-emerald-200" />
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/50">{label}</p>
    </div>
  );
}
