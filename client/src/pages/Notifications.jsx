import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Megaphone,
  Pencil,
  Search,
  Send,
  Trash2,
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

const emptyPromotionForm = {
  badge: "OPW Offer",
  title: "",
  message: "",
  actionLabel: "",
  actionUrl: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const toDateTimeInputValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
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
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historySort, setHistorySort] = useState("unread-first");
  const [selectedHistoryIds, setSelectedHistoryIds] = useState([]);
  const [deletingHistory, setDeletingHistory] = useState(false);
  const [promotions, setPromotions] = useState([]);
  const [promotionForm, setPromotionForm] = useState(emptyPromotionForm);
  const [promotionEditingId, setPromotionEditingId] = useState("");
  const [promotionSaving, setPromotionSaving] = useState(false);
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

  const historyCounts = useMemo(() => {
    const read = history.filter((item) => item.readAt).length;
    return {
      total: history.length,
      read,
      unread: Math.max(history.length - read, 0),
    };
  }, [history]);

  const filteredHistory = useMemo(() => {
    const keyword = historyQuery.trim().toLowerCase();
    const filtered = history.filter((item) => {
      const read = Boolean(item.readAt);
      const statusMatch =
        historyStatus === "all" ||
        (historyStatus === "read" && read) ||
        (historyStatus === "unread" && !read);

      if (!statusMatch) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return [
        item.title,
        item.body,
        item.patientName,
        item.category,
        item.createdByLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);
    });

    return [...filtered].sort((a, b) => {
      if (historySort === "unread-first" && Boolean(a.readAt) !== Boolean(b.readAt)) {
        return a.readAt ? 1 : -1;
      }

      if (historySort === "read-first" && Boolean(a.readAt) !== Boolean(b.readAt)) {
        return a.readAt ? -1 : 1;
      }

      return new Date(b.scheduledFor || b.createdAt || 0) - new Date(a.scheduledFor || a.createdAt || 0);
    });
  }, [history, historyQuery, historySort, historyStatus]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [patientsResponse, notificationsResponse, promotionsResponse] = await Promise.all([
        API.get("/patients"),
        API.get("/notifications/admin?limit=1000"),
        API.get("/promotions/admin"),
      ]);
      setPatients(patientsResponse.data || []);
      setHistory(notificationsResponse.data || []);
      setPromotions(promotionsResponse.data || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load notification data.");
    } finally {
      setLoading(false);
    }
  };

  const updatePromotionForm = (key, value) => {
    setPromotionForm((current) => ({ ...current, [key]: value }));
  };

  const resetPromotionForm = () => {
    setPromotionForm(emptyPromotionForm);
    setPromotionEditingId("");
  };

  const submitPromotion = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!promotionForm.title.trim() || !promotionForm.message.trim()) {
      setError("Banner title and message are required.");
      return;
    }

    setPromotionSaving(true);
    try {
      const payload = {
        ...promotionForm,
        startsAt: promotionForm.startsAt ? new Date(promotionForm.startsAt).toISOString() : null,
        endsAt: promotionForm.endsAt ? new Date(promotionForm.endsAt).toISOString() : null,
      };
      const response = promotionEditingId
        ? await API.put(`/promotions/admin/${promotionEditingId}`, payload)
        : await API.post("/promotions/admin", payload);

      setSuccess(response.data?.message || "Promotion banner saved.");
      resetPromotionForm();
      await loadData();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save promotion banner.");
    } finally {
      setPromotionSaving(false);
    }
  };

  const editPromotion = (promotion) => {
    setPromotionEditingId(promotion.id);
    setPromotionForm({
      badge: promotion.badge || "OPW Offer",
      title: promotion.title || "",
      message: promotion.message || "",
      actionLabel: promotion.actionLabel || "",
      actionUrl: promotion.actionUrl || "",
      startsAt: toDateTimeInputValue(promotion.startsAt),
      endsAt: toDateTimeInputValue(promotion.endsAt),
      isActive: Boolean(promotion.isActive),
    });
  };

  const deletePromotion = async (promotionId) => {
    if (!promotionId || !window.confirm("Delete this website and app banner?")) {
      return;
    }

    setError("");
    setSuccess("");
    try {
      await API.delete(`/promotions/admin/${promotionId}`);
      setSuccess("Promotion banner deleted.");
      if (promotionEditingId === promotionId) {
        resetPromotionForm();
      }
      await loadData();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete promotion banner.");
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

  const toggleHistorySelection = (notificationId) => {
    setSelectedHistoryIds((current) =>
      current.includes(notificationId)
        ? current.filter((id) => id !== notificationId)
        : [...current, notificationId]
    );
  };

  const toggleAllVisibleHistory = () => {
    const visibleIds = filteredHistory.map((item) => item.id);
    const allVisibleSelected = visibleIds.every((id) => selectedHistoryIds.includes(id));
    setSelectedHistoryIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  };

  const deleteNotificationHistory = async (notificationIds) => {
    const ids = notificationIds.filter(Boolean);

    if (!ids.length || deletingHistory) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${ids.length} notification${ids.length === 1 ? "" : "s"} from history?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingHistory(true);
    setError("");
    setSuccess("");
    try {
      if (ids.length === 1) {
        await API.delete(`/notifications/admin/${ids[0]}`);
      } else {
        await API.post("/notifications/admin/delete", { notificationIds: ids });
      }

      setHistory((current) => current.filter((item) => !ids.includes(item.id)));
      setSelectedHistoryIds((current) => current.filter((id) => !ids.includes(id)));
      setSuccess(`${ids.length} notification${ids.length === 1 ? "" : "s"} deleted.`);
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete notification history.");
    } finally {
      setDeletingHistory(false);
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard icon={Users} label="Patients" value={patients.length} />
                <MetricCard icon={Bell} label="History" value={historyCounts.total} />
                <MetricCard icon={CheckCircle2} label="Read" value={historyCounts.read} />
                <MetricCard icon={Bell} label="Unread" value={historyCounts.unread} />
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <form
            onSubmit={submitPromotion}
            className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-sm"
          >
            <div className="relative p-5 sm:p-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_32%)]" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Megaphone size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
                    Website & App Banner
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {promotionEditingId ? "Edit active offer" : "Create offer or festival popup"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This appears on website load and inside the patient app dashboard.
                  </p>
                </div>
              </div>

              <div className="relative mt-6 grid gap-4 lg:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Badge</span>
                  <input
                    value={promotionForm.badge}
                    onChange={(event) => updatePromotionForm("badge", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="OPW Offer"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Title</span>
                  <input
                    value={promotionForm.title}
                    onChange={(event) => updatePromotionForm("title", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Festival physiotherapy offer"
                  />
                </label>
                <label className="grid gap-2 lg:col-span-2">
                  <span className="text-sm font-bold text-slate-700">Banner text</span>
                  <textarea
                    value={promotionForm.message}
                    onChange={(event) => updatePromotionForm("message", event.target.value)}
                    className="min-h-28 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Short message patients should see on first load."
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Button label</span>
                  <input
                    value={promotionForm.actionLabel}
                    onChange={(event) => updatePromotionForm("actionLabel", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="Book appointment"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Button link</span>
                  <input
                    value={promotionForm.actionUrl}
                    onChange={(event) => updatePromotionForm("actionUrl", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    placeholder="https://ommphysioworld.com/book-appointment"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">Start date</span>
                  <input
                    type="datetime-local"
                    value={promotionForm.startsAt}
                    onChange={(event) => updatePromotionForm("startsAt", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-slate-700">End date</span>
                  <input
                    type="datetime-local"
                    value={promotionForm.endsAt}
                    onChange={(event) => updatePromotionForm("endsAt", event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              </div>

              <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-3 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={promotionForm.isActive}
                    onChange={(event) => updatePromotionForm("isActive", event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  />
                  Make this the active banner
                </label>
                <div className="flex gap-2">
                  {promotionEditingId ? (
                    <button
                      type="button"
                      onClick={resetPromotionForm}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                  <button
                    type="submit"
                    disabled={promotionSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {promotionSaving ? <Loader2 size={17} className="animate-spin" /> : <Megaphone size={17} />}
                    {promotionEditingId ? "Update Banner" : "Save Banner"}
                  </button>
                </div>
              </div>
            </div>
          </form>

          <aside className="rounded-[2rem] border border-white bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Banner history</h2>
            <p className="mt-2 text-sm text-slate-500">Only one banner can be active at a time.</p>
            <div className="mt-5 space-y-3">
              {promotions.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No banner created yet.
                </p>
              ) : (
                promotions.slice(0, 6).map((promotion) => (
                  <div key={promotion.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-black ${
                            promotion.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-white text-slate-500"
                          }`}
                        >
                          {promotion.isActive ? "Active" : "Inactive"}
                        </span>
                        <h3 className="mt-3 text-sm font-black text-slate-950">{promotion.title}</h3>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{promotion.message}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => editPromotion(promotion)}
                          className="rounded-full bg-white p-2 text-slate-600 shadow-sm hover:text-sky-700"
                          aria-label="Edit banner"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePromotion(promotion.id)}
                          className="rounded-full bg-white p-2 text-rose-600 shadow-sm hover:text-rose-700"
                          aria-label="Delete banner"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Updated: {formatDateTime(promotion.updatedAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

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

          <aside className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">History rules</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Notification history is now kept separately below. Old history is cleaned automatically after 15 days, based on the notification schedule date.
            </p>
            <div className="mt-5 grid gap-3">
              <MetricTile label="Read" value={historyCounts.read} />
              <MetricTile label="Unread" value={historyCounts.unread} />
              <MetricTile label="Selected for delete" value={selectedHistoryIds.length} />
            </div>
          </aside>
        </div>

        <section className="rounded-[2rem] border border-white bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                Notification History
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Read and unread notifications
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter by status, sort read/unread first, and delete one or multiple history items.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["all", "unread", "read"].map((status) => (
                <button
                  type="button"
                  key={status}
                  onClick={() => setHistoryStatus(status)}
                  className={`rounded-full px-4 py-2 text-sm font-black capitalize ${
                    historyStatus === status
                      ? "bg-slate-950 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status} {status === "all" ? historyCounts.total : historyCounts[status]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Search size={17} className="text-slate-400" />
              <input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search history by patient, title, message, or sender"
              />
            </div>
            <select
              value={historySort}
              onChange={(event) => setHistorySort(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-sky-400 focus:bg-white"
            >
              <option value="unread-first">Unread first</option>
              <option value="read-first">Read first</option>
              <option value="newest">Newest first</option>
            </select>
            <button
              type="button"
              onClick={toggleAllVisibleHistory}
              disabled={!filteredHistory.length}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {filteredHistory.every((item) => selectedHistoryIds.includes(item.id)) && filteredHistory.length
                ? "Clear visible"
                : "Select visible"}
            </button>
            <button
              type="button"
              onClick={() => deleteNotificationHistory(selectedHistoryIds)}
              disabled={!selectedHistoryIds.length || deletingHistory}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={17} />
              Delete selected
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Loading history...
              </div>
            ) : filteredHistory.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                No notification history found for this view.
              </p>
            ) : (
              filteredHistory.map((item) => {
                const selected = selectedHistoryIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition ${
                      selected ? "border-sky-300 bg-sky-50" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <button
                        type="button"
                        onClick={() => toggleHistorySelection(item.id)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <span
                          className={`mt-1 h-5 w-5 shrink-0 rounded-md border ${
                            selected ? "border-sky-600 bg-sky-600" : "border-slate-300 bg-white"
                          }`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-slate-900">{item.title}</span>
                          <span className="mt-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {item.patientName || "Patient"} | {item.category} | {item.createdByLabel || "OPW"}
                          </span>
                        </span>
                      </button>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-black ${
                            item.readAt ? "bg-white text-slate-500" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.readAt ? "Read" : "Unread"}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteNotificationHistory([item.id])}
                          disabled={deletingHistory}
                          className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      Scheduled: {formatDateTime(item.scheduledFor)} | Created: {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

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

function MetricTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
