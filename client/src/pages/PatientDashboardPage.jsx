import {
  CalendarDays,
  CircleX,
  CreditCard,
  Eye,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Send,
  Stethoscope,
  Trash2,
  UserCircle2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import { clearPatientUser, getPatientUser } from "../utils/patientAuth";
import { firstValidationError, isFutureOrTodayDate } from "../utils/validation";

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "appointments", label: "Appointment", icon: CalendarDays },
  { key: "notes", label: "Therapy", icon: FileText },
  { key: "sessions", label: "Session", icon: Stethoscope },
  { key: "payments", label: "Payment", icon: CreditCard },
];

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) {
    return "Not added";
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

const revokeObjectUrls = (urlMap = {}) => {
  Object.values(urlMap).forEach((url) => {
    if (url) {
      window.URL.revokeObjectURL(url);
    }
  });
};

const isInlinePreviewableTherapyItem = (item) =>
  item?.resourceType === "image" ||
  item?.resourceType === "gif" ||
  item?.resourceType === "video" ||
  item?.mimeType === "application/pdf";

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const [patientUser, setPatientUser] = useState(() => getPatientUser());
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [sendingAppointment, setSendingAppointment] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [activeFileAction, setActiveFileAction] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [therapyCardPreviewUrls, setTherapyCardPreviewUrls] = useState({});
  const [appointmentForm, setAppointmentForm] = useState({
    service: "",
    date: "",
    time: "",
    message: "",
    files: [],
  });
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [services, setServices] = useState([]);

  const patientId = patientUser?.patientId || "";
  const clinicalNotes = useMemo(() => patient?.clinicalNotes || [], [patient?.clinicalNotes]);
  const therapyRecommendations = useMemo(
    () => patient?.therapyRecommendations || [],
    [patient?.therapyRecommendations]
  );
  const appointments = useMemo(() => patient?.appointments || [], [patient?.appointments]);
  const treatmentPlans = useMemo(() => patient?.treatmentPlans || [], [patient?.treatmentPlans]);
  const directPayments = useMemo(() => patient?.payments || [], [patient?.payments]);

  const loadPatient = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [patientResponse, requestResponse] = await Promise.all([
        API.get(`/patients/${patientId}`),
        API.get(`/patients/${patientId}/appointment-requests`),
      ]);
      setPatient(patientResponse.data);
      setAppointmentRequests(requestResponse.data || []);
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to load patient dashboard.",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientUser) {
      navigate("/patient-login?redirect=/patient-dashboard", { replace: true });
      return;
    }

    loadPatient();
  }, [loadPatient, navigate, patientUser]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await API.get("/services");
        setServices(response.data || []);
      } catch (_) {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  useEffect(() => {
    if (activeTab !== "notes" || !therapyRecommendations.length) {
      setTherapyCardPreviewUrls((current) => {
        revokeObjectUrls(current);
        return {};
      });
      return undefined;
    }

    const previewItems = therapyRecommendations
      .flatMap((recommendation) => recommendation.items || [])
      .filter(isInlinePreviewableTherapyItem);

    if (!previewItems.length) {
      setTherapyCardPreviewUrls((current) => {
        revokeObjectUrls(current);
        return {};
      });
      return undefined;
    }

    let disposed = false;

    const loadTherapyCardPreviews = async () => {
      const nextUrls = {};

      await Promise.all(
        previewItems.map(async (item) => {
          try {
            const response = await API.get(item.fileUrl, { responseType: "blob" });
            nextUrls[item.id] = window.URL.createObjectURL(response.data);
          } catch (_) {
            nextUrls[item.id] = "";
          }
        })
      );

      if (disposed) {
        revokeObjectUrls(nextUrls);
        return;
      }

      setTherapyCardPreviewUrls((current) => {
        revokeObjectUrls(current);
        return nextUrls;
      });
    };

    loadTherapyCardPreviews();

    return () => {
      disposed = true;
    };
  }, [activeTab, therapyRecommendations]);

  useEffect(
    () => () => {
      revokeObjectUrls(therapyCardPreviewUrls);
    },
    [therapyCardPreviewUrls]
  );

  const bookedAppointmentRequestIds = new Set(
    appointments.map((appointment) => appointment.requestId).filter(Boolean)
  );
  const visibleAppointmentRequests = appointmentRequests.filter(
    (request) =>
      !bookedAppointmentRequestIds.has(request.id) &&
      !["cancelled", "completed"].includes(request.status || "")
  );
  const therapyItemCount = therapyRecommendations.reduce(
    (sum, recommendation) => sum + (recommendation.items?.length || 0),
    0
  );
  const treatmentPayments = treatmentPlans.flatMap((plan) =>
    (plan.payments || []).map((payment) => ({
      ...payment,
      treatmentName: Array.isArray(plan.treatmentTypes)
        ? plan.treatmentTypes.join(", ")
        : "Treatment",
    }))
  );
  const payments = [...directPayments, ...treatmentPayments];

  const stats = useMemo(
    () => [
      { label: "Therapy Items", value: therapyItemCount, icon: FolderOpen },
      { label: "Appointments", value: appointments.length, icon: CalendarDays },
      { label: "Sessions", value: treatmentPlans.length, icon: Stethoscope },
      { label: "Payments", value: payments.length, icon: CreditCard },
    ],
    [appointments.length, payments.length, therapyItemCount, treatmentPlans.length]
  );

  const handleLogout = () => {
    clearPatientUser();
    setPatientUser(null);
    navigate("/patient-login?redirect=/patient-dashboard", { replace: true });
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();

    const validationError = firstValidationError([
      !appointmentForm.service.trim() ? "Please add service." : "",
      !appointmentForm.date ? "Please add preferred date." : "",
      appointmentForm.date && !isFutureOrTodayDate(appointmentForm.date)
        ? "Preferred date cannot be in the past."
        : "",
    ]);

    if (validationError) {
      setStatus({ type: "error", message: validationError });
      return;
    }

    try {
      setSendingAppointment(true);
      const payload = new FormData();
      payload.append("name", patientUser.name || "");
      payload.append("email", patientUser.email || "");
      payload.append("phone", patientUser.mobile || "");
      payload.append("patientId", patientId);
      payload.append("service", appointmentForm.service.trim());
      payload.append("date", appointmentForm.date);
      payload.append("time", appointmentForm.time);
      payload.append("message", appointmentForm.message.trim());
      appointmentForm.files.forEach((file) => payload.append("files", file));

      const response = await API.post("/appointments", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAppointmentForm({ service: "", date: "", time: "", message: "", files: [] });
      setStatus({
        type: "success",
        message: response.data?.message || "Appointment request submitted.",
      });
      loadPatient();
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to submit appointment request.",
      });
    } finally {
      setSendingAppointment(false);
    }
  };

  const handleAppointmentFilesChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);

    if (!nextFiles.length) {
      return;
    }

    setAppointmentForm((current) => {
      const mergedFiles = [...current.files];

      nextFiles.forEach((file) => {
        const exists = mergedFiles.some(
          (entry) =>
            entry.name === file.name &&
            entry.size === file.size &&
            entry.lastModified === file.lastModified
        );

        if (!exists) {
          mergedFiles.push(file);
        }
      });

      return {
        ...current,
        files: mergedFiles,
      };
    });

    event.target.value = "";
  };

  const handleRemoveAppointmentFile = (fileToRemove) => {
    setAppointmentForm((current) => ({
      ...current,
      files: current.files.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      ),
    }));
  };

  const handleTherapyFileAction = async (item, action) => {
    const actionKey = `${action}:${item.id}`;

    try {
      setActiveFileAction(actionKey);
      setStatus({ type: "", message: "" });

      const response = await API.get(item.fileUrl, { responseType: "blob" });
      const objectUrl = window.URL.createObjectURL(response.data);

      setPreviewItem({
        ...item,
        objectUrl,
      });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to open therapy file.",
      });
    } finally {
      setActiveFileAction("");
    }
  };

  const closePreview = () => {
    if (previewItem?.objectUrl) {
      window.URL.revokeObjectURL(previewItem.objectUrl);
    }

    setPreviewItem(null);
  };

  if (!patientUser) {
    return null;
  }

  return (
    <PublicLayout>
      <section className="page-section mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800 px-6 py-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_34%)]" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                Patient Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Welcome, {patientUser.name || "Patient"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                View your notes, appointment requests, treatment sessions, and payment updates from OPW.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/90">
                <UserCircle2 size={18} />
                {patientUser.email}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {status.message ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.message}
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-[22px] border border-slate-200 bg-white/90 p-1.5 shadow-sm">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-900/15"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={17} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <div className="rounded-[26px] border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              Loading patient dashboard...
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-5 inline-flex rounded-2xl bg-sky-50 p-2.5 text-sky-700">
                          <Icon size={20} />
                        </div>
                        <p className="text-3xl font-semibold text-slate-950">{stat.value}</p>
                        <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <Panel title="Recommended Therapy" subtitle="Service-wise therapy shared by OPW for this patient.">
                    {!therapyRecommendations.length ? (
                      <div className="rounded-2xl bg-slate-50 px-4 py-5 text-sm leading-6 text-slate-500">
                        No therapy recommendations available yet.
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {therapyRecommendations.map((recommendation) => (
                          <div
                            key={recommendation.id}
                            className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] shadow-sm"
                          >
                            <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_40%),linear-gradient(135deg,#f8fbff,#eef6ff)] px-5 py-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/70">
                                    Therapy Service
                                  </p>
                                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                                    {recommendation.serviceName || "Therapy Service"}
                                  </h3>
                                  <p className="mt-1 text-sm text-slate-500">
                                    Updated on {formatDate(recommendation.updatedAt || recommendation.createdAt)}
                                  </p>
                                </div>
                                <span className="inline-flex w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                                  {(recommendation.items || []).length} item
                                  {(recommendation.items || []).length === 1 ? "" : "s"}
                                </span>
                              </div>

                              {recommendation.note ? (
                                <p className="mt-4 rounded-2xl bg-white/90 px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
                                  {recommendation.note}
                                </p>
                              ) : null}
                            </div>

                            <div className="grid gap-3 p-4 sm:grid-cols-2">
                              {(recommendation.items || []).map((item) => (
                                <div
                                  key={item.id}
                                  className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                  <div className="mb-4 overflow-hidden rounded-[20px] border border-slate-200 bg-slate-100">
                                    {therapyCardPreviewUrls[item.id] &&
                                    (item.resourceType === "image" ||
                                      item.resourceType === "gif") ? (
                                      <img
                                        src={therapyCardPreviewUrls[item.id]}
                                        alt={item.title || item.fileName || "Therapy Item"}
                                        className="h-48 w-full object-cover"
                                      />
                                    ) : null}

                                    {therapyCardPreviewUrls[item.id] &&
                                    item.resourceType === "video" ? (
                                      <video
                                        src={therapyCardPreviewUrls[item.id]}
                                        controls
                                        preload="metadata"
                                        className="h-48 w-full bg-black object-cover"
                                      />
                                    ) : null}

                                    {therapyCardPreviewUrls[item.id] &&
                                    item.mimeType === "application/pdf" ? (
                                      <iframe
                                        src={therapyCardPreviewUrls[item.id]}
                                        title={item.title || item.fileName || "Therapy PDF"}
                                        className="h-48 w-full bg-white"
                                      />
                                    ) : null}

                                    {!therapyCardPreviewUrls[item.id] ? (
                                      <div className="flex h-48 flex-col items-center justify-center gap-3 px-4 text-center">
                                        <div className="rounded-2xl bg-white p-4 text-slate-700 shadow-sm">
                                          <FileText size={28} />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-slate-900">
                                            {isInlinePreviewableTherapyItem(item)
                                              ? "Loading preview"
                                              : "Document file"}
                                          </p>
                                          <p className="mt-1 text-xs text-slate-500">
                                            {isInlinePreviewableTherapyItem(item)
                                              ? "Preparing secure preview..."
                                              : "Preview will open in the viewer"}
                                          </p>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-slate-950">
                                          {item.title || item.fileName || "Therapy Item"}
                                        </p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase text-slate-600">
                                          {item.resourceType || "file"}
                                        </span>
                                      </div>
                                      <p className="mt-1 truncate text-xs text-slate-500">
                                        {item.fileName || "No file name"}
                                      </p>
                                    </div>
                                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                                      <FolderOpen size={18} />
                                    </div>
                                  </div>

                                  <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600">
                                    {item.description || "Therapy content shared by OPW for your recovery plan."}
                                  </p>

                                  <div className="mt-4 flex items-center justify-between">
                                    <span className="text-xs font-medium text-slate-400">
                                      View only
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleTherapyFileAction(item, "view")}
                                      className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                                    >
                                      <Eye size={14} />
                                      View
                                    </button>
                                  </div>

                                  {activeFileAction === `view:${item.id}` ||
                                  activeFileAction === `download:${item.id}` ? (
                                    <p className="mt-2 text-xs font-medium text-slate-500">
                                      Working...
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Panel>
                  <Panel title="Doctors Note & Documents" subtitle="You can only view notes and files shared here.">
                    <RecordList emptyText="No doctor notes available yet.">
                      {clinicalNotes.map((note) => (
                        <RecordCard key={note.id || note._id} title={note.title || "Doctors Note"} subtitle={note.note || "No note details added."}>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Added by {note.addedByLabel || (note.addedByType === "patient" ? "Patient" : "OPW")}
                          </p>
                          {(note.documents || []).length ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {note.documents.map((document) => (
                                <span key={document.id || document.name} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                                  {document.name || "Document"}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </RecordCard>
                      ))}
                    </RecordList>
                  </Panel>
                </div>
              )}

              {activeTab === "appointments" && (
                <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <Panel
                    title="Request Appointment"
                    subtitle="Only logged-in patients can submit this request. Upload PDF/images and previous doctor notes."
                  >
                    <form onSubmit={handleAppointmentSubmit} className="grid gap-4">
                      <select
                        className="input rounded-2xl border-slate-200 bg-slate-50"
                        value={appointmentForm.service}
                        onChange={(event) => setAppointmentForm({ ...appointmentForm, service: event.target.value })}
                        required
                      >
                        <option value="">Select service</option>
                        {services.map((service) => (
                          <option key={service.id} value={service.name}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="date"
                        className="input rounded-2xl border-slate-200 bg-slate-50"
                        value={appointmentForm.date}
                        onChange={(event) => setAppointmentForm({ ...appointmentForm, date: event.target.value })}
                        required
                      />
                      <input
                        type="time"
                        className="input rounded-2xl border-slate-200 bg-slate-50"
                        value={appointmentForm.time}
                        onChange={(event) => setAppointmentForm({ ...appointmentForm, time: event.target.value })}
                      />
                      <textarea
                        className="input min-h-[140px] rounded-2xl border-slate-200 bg-slate-50"
                        placeholder="Tell us about your pain, injury, or preferred timing"
                        value={appointmentForm.message}
                        onChange={(event) => setAppointmentForm({ ...appointmentForm, message: event.target.value })}
                      />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <label className="mb-3 block text-sm font-medium text-slate-700">
                          Upload PDF/images and previous doctor notes
                        </label>
                        <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
                          Upload Documents
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={handleAppointmentFilesChange}
                          />
                        </label>
                        <p className="mt-2 text-xs text-slate-500">
                          Multiple documents/images can be added.
                        </p>
                        {appointmentForm.files.length ? (
                          <div className="mt-3 grid gap-2">
                            {appointmentForm.files.map((file) => (
                              <div
                                key={`${file.name}-${file.size}`}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white px-3 py-2 text-xs font-medium text-sky-700"
                              >
                                <span className="truncate">{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAppointmentFile(file)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                                  title="Remove file"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button disabled={sendingAppointment} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                        <Send size={18} />
                        {sendingAppointment ? "Sending..." : "Request Appointment"}
                      </button>
                    </form>
                  </Panel>
                  <div className="grid gap-5">
                    <Panel title="Appointment Request Updates" subtitle="Pending requests stay here; approved ones move to booked appointments.">
                      <RecordList emptyText="No pending appointment request updates.">
                        {visibleAppointmentRequests.map((request) => (
                          <RecordCard
                            key={request.id}
                            title={`${request.service || "Appointment"} - ${request.status || "pending"}`}
                            subtitle={`Requested: ${formatDate(request.requestedDate)}${request.requestedTime ? ` at ${request.requestedTime}` : ""}`}
                          >
                            {request.status !== "pending" ? (
                              <p className="mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700">
                                {request.status === "rescheduled" ? "Rescheduled" : "Confirmed"}:{" "}
                                {formatDate(request.confirmedDate)}
                                {request.confirmedTime ? ` at ${request.confirmedTime}` : ""}
                              </p>
                            ) : null}
                            {request.decisionNote ? (
                              <p className="mt-2 text-sm text-slate-500">
                                OPW note: {request.decisionNote}
                              </p>
                            ) : null}
                          </RecordCard>
                        ))}
                      </RecordList>
                    </Panel>
                    <Panel title="Booked Appointments" subtitle="Appointments confirmed by OPW will appear here.">
                      <RecordList emptyText="No booked appointments yet.">
                        {appointments.map((appointment) => (
                          <RecordCard
                            key={appointment.id || appointment._id}
                            title={appointment.service || "Appointment"}
                            subtitle={`${formatDate(appointment.date)}${appointment.time ? ` at ${appointment.time}` : ""}`}
                          >
                            <p className="mt-2 text-sm font-medium text-slate-600">
                              Status: {appointment.status === "completed" ? "Done" : appointment.status || "approved"}
                            </p>
                            {appointment.remark ? (
                              <p className="mt-2 rounded-2xl bg-sky-50 px-3 py-2 text-sm text-sky-700">
                                OPW remark: {appointment.remark}
                              </p>
                            ) : null}
                          </RecordCard>
                        ))}
                      </RecordList>
                    </Panel>
                  </div>
                </div>
              )}

              {activeTab === "sessions" && (
                <Panel title="Session / Treatment Details" subtitle="Treatment and session details from OPW.">
                  <RecordList emptyText="No session details added yet.">
                    {treatmentPlans.map((plan) => (
                      <RecordCard
                        key={plan.id || plan._id}
                        title={Array.isArray(plan.treatmentTypes) ? plan.treatmentTypes.join(", ") : "Treatment plan"}
                        subtitle={`From ${formatDate(plan.fromDate)} to ${formatDate(plan.toDate)}`}
                      >
                        <p className="mt-2 text-sm text-slate-500">
                          Total: {formatMoney(plan.totalAmount)} | Advance: {formatMoney(plan.advanceAmount)} | Balance: {formatMoney(plan.balanceAmount)}
                        </p>
                        {plan.sessionDays?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {plan.sessionDays.map((day) => {
                              const isDone = day.status === "done";

                              return (
                                <span
                                  key={day.id || day.date}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                    isDone
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-amber-50 text-amber-700"
                                  }`}
                                >
                                  {day.date}: {isDone ? "Done" : "Not done"}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </RecordCard>
                    ))}
                  </RecordList>
                </Panel>
              )}

              {activeTab === "payments" && (
                <Panel title="Payment Details" subtitle="Payment records from your OPW care plan.">
                  <RecordList emptyText="No payment details added yet.">
                    {payments.map((payment, index) => (
                      <RecordCard
                        key={payment.id || payment._id || index}
                        title={formatMoney(payment.amount)}
                        subtitle={[
                          payment.method || "Payment",
                          payment.treatmentName,
                          `Date: ${formatDate(payment.createdAt)}`,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      />
                    ))}
                  </RecordList>
                </Panel>
              )}
            </>
          )}
        </div>

        {previewItem ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sky-600">Therapy Preview</p>
                  <h3 className="truncate text-xl font-semibold text-slate-900">
                    {previewItem.title || previewItem.fileName || "Therapy File"}
                  </h3>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {previewItem.fileName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePreview}
                  className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  title="Close preview"
                >
                  <CircleX size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-4">
                {(previewItem.resourceType === "image" ||
                  previewItem.resourceType === "gif") ? (
                  <div className="flex min-h-[60vh] items-center justify-center">
                    <img
                      src={previewItem.objectUrl}
                      alt={previewItem.title || previewItem.fileName || "Therapy File"}
                      className="max-h-[75vh] max-w-full rounded-2xl bg-white object-contain shadow-sm"
                    />
                  </div>
                ) : null}

                {previewItem.resourceType === "video" ? (
                  <div className="flex min-h-[60vh] items-center justify-center">
                    <video
                      src={previewItem.objectUrl}
                      controls
                      className="max-h-[75vh] w-full rounded-2xl bg-black shadow-sm"
                    />
                  </div>
                ) : null}

                {previewItem.mimeType === "application/pdf" ? (
                  <iframe
                    src={previewItem.objectUrl}
                    title={previewItem.title || previewItem.fileName || "Therapy File"}
                    className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white"
                  />
                ) : null}

                {!(
                  previewItem.resourceType === "image" ||
                  previewItem.resourceType === "gif" ||
                  previewItem.resourceType === "video" ||
                  previewItem.mimeType === "application/pdf"
                ) ? (
                  <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 text-center">
                    <div className="rounded-3xl bg-slate-100 p-4 text-slate-700">
                      <FileText size={32} />
                    </div>
                    <h4 className="mt-5 text-xl font-semibold text-slate-900">
                      Preview not available for this file type
                    </h4>
                    <p className="mt-2 max-w-md text-sm text-slate-500">
                      This therapy file cannot be previewed directly inside the
                      patient panel.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </PublicLayout>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function RecordList({ emptyText, children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;

  if (!items || (Array.isArray(items) && !items.length)) {
    return <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">{emptyText}</p>;
  }

  return <div className="grid gap-3">{items}</div>;
}

function RecordCard({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      {children}
    </div>
  );
}
