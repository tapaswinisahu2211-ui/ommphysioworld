import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Download,
  FileText,
  Files,
  Image,
  IndianRupee,
  Mail,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Stethoscope,
  Trash2,
  UserCircle2,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";

const formatDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

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

  if (status === "pending") {
    return "Pending";
  }

  return "Scheduled";
};

const getTodayKey = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

export default function PatientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [editBasic, setEditBasic] = useState(false);
  const [showClinicalNoteModal, setShowClinicalNoteModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({ date: "", time: "", service: "" });
  const [services, setServices] = useState([]);
  const [appointmentActionForms, setAppointmentActionForms] = useState({});
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [appointmentRequestForms, setAppointmentRequestForms] = useState({});
  const [clinicalNoteForm, setClinicalNoteForm] = useState({
    title: "",
    note: "",
    documents: [],
  });
  const [treatmentForm, setTreatmentForm] = useState({
    treatmentTypeInput: "",
    treatmentTypes: [],
    fromDate: "",
    toDate: "",
    totalAmount: "",
    advanceAmount: "",
    paymentMethod: "",
    paymentNotes: "",
  });
  const [editingPlanId, setEditingPlanId] = useState("");
  const [planPaymentForm, setPlanPaymentForm] = useState({
    planId: "",
    amount: "",
    method: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPatient = useCallback(async () => {
    try {
      const [response, requestResponse] = await Promise.all([
        API.get(`/patients/${id}`),
        API.get(`/patients/${id}/appointment-requests`),
      ]);
      setPatient(response.data);
      setAppointmentRequests(requestResponse.data || []);
      setAppointmentRequestForms((current) => {
        const next = { ...current };
        (requestResponse.data || []).forEach((request) => {
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
      setAppointmentActionForms((current) => {
        const next = { ...current };
        (response.data.appointments || []).forEach((appointment) => {
          if (!next[appointment.id]) {
            next[appointment.id] = {
              date: appointment.date || "",
              time: appointment.time || "",
              remark: appointment.remark || "",
            };
          }
        });
        return next;
      });
      setForm({
        name: response.data.name,
        email: response.data.email,
        mobile: response.data.mobile,
      });
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load patient profile.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

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

  const closeDrawer = () => {
    setEditBasic(false);
    setShowClinicalNoteModal(false);
    setShowAppointmentModal(false);
    setShowTreatmentModal(false);
    setEditingPlanId("");
    setPlanPaymentForm({ planId: "", amount: "", method: "" });
  };

  const handleBasicUpdate = async (e) => {
    e.preventDefault();

    try {
      const response = await API.put(`/patients/${id}`, {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
      });
      setPatient(response.data);
      setForm((current) => ({ ...current, ...response.data }));
      setEditBasic(false);
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to update patient.");
    }
  };

  const handleAddClinicalNote = async (e) => {
    e.preventDefault();

    try {
      const payload = new FormData();
      payload.append("title", clinicalNoteForm.title);
      payload.append("note", clinicalNoteForm.note);
      payload.append("addedByType", "opw");
      payload.append("addedByLabel", "OPW");
      clinicalNoteForm.documents.forEach((file) => {
        payload.append("documents", file);
      });

      const response = await API.post(`/patients/${id}/clinical-notes`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPatient(response.data);
      setClinicalNoteForm({
        title: "",
        note: "",
        documents: [],
      });
      setShowClinicalNoteModal(false);
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save clinical note.");
    }
  };

  const handleDeleteClinicalNote = async (noteId) => {
    try {
      const response = await API.delete(`/patients/${id}/clinical-notes/${noteId}`);
      setPatient(response.data);
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete clinical note.");
    }
  };

  const addTreatmentType = () => {
    const value = treatmentForm.treatmentTypeInput.trim();

    if (!value || treatmentForm.treatmentTypes.includes(value)) {
      return;
    }

    setTreatmentForm((current) => ({
      ...current,
      treatmentTypes: [...current.treatmentTypes, value],
      treatmentTypeInput: "",
    }));
  };

  const removeTreatmentType = (type) => {
    setTreatmentForm((current) => ({
      ...current,
      treatmentTypes: current.treatmentTypes.filter((item) => item !== type),
    }));
  };

  const handleStartTreatment = async (e) => {
    e.preventDefault();

    try {
      const pendingType = treatmentForm.treatmentTypeInput.trim();
      const treatmentTypes = pendingType
        ? Array.from(new Set([...treatmentForm.treatmentTypes, pendingType]))
        : treatmentForm.treatmentTypes;

      const response = await API.post(`/patients/${id}/treatment-plans`, {
        treatmentTypes,
        fromDate: treatmentForm.fromDate,
        toDate: treatmentForm.toDate,
        totalAmount: Number(treatmentForm.totalAmount || 0),
        advanceAmount: Number(treatmentForm.advanceAmount || 0),
        paymentMethod: treatmentForm.paymentMethod,
        paymentNotes: treatmentForm.paymentNotes,
      });

      setPatient(response.data);
      setTreatmentForm({
        treatmentTypeInput: "",
        treatmentTypes: [],
        fromDate: "",
        toDate: "",
        totalAmount: "",
        advanceAmount: "",
        paymentMethod: "",
        paymentNotes: "",
      });
      setShowTreatmentModal(false);
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to start treatment.");
    }
  };

  const startEditingPlan = (plan) => {
    setEditingPlanId(plan.id);
    setTreatmentForm({
      treatmentTypeInput: "",
      treatmentTypes: plan.treatmentTypes || [],
      fromDate: plan.fromDate || "",
      toDate: plan.toDate || "",
      totalAmount: String(plan.totalAmount || ""),
      advanceAmount: String(plan.advanceAmount || ""),
      paymentMethod: plan.paymentMethod || "",
      paymentNotes: plan.paymentNotes || "",
    });
    setShowTreatmentModal(true);
  };

  const handleUpdateTreatment = async (e) => {
    e.preventDefault();

    try {
      const pendingType = treatmentForm.treatmentTypeInput.trim();
      const treatmentTypes = pendingType
        ? Array.from(new Set([...treatmentForm.treatmentTypes, pendingType]))
        : treatmentForm.treatmentTypes;

      const response = await API.put(`/patients/${id}/treatment-plans/${editingPlanId}`, {
        treatmentTypes,
        fromDate: treatmentForm.fromDate,
        toDate: treatmentForm.toDate,
        totalAmount: Number(treatmentForm.totalAmount || 0),
        paymentMethod: treatmentForm.paymentMethod,
        paymentNotes: treatmentForm.paymentNotes,
      });

      setPatient(response.data);
      setTreatmentForm({
        treatmentTypeInput: "",
        treatmentTypes: [],
        fromDate: "",
        toDate: "",
        totalAmount: "",
        advanceAmount: "",
        paymentMethod: "",
        paymentNotes: "",
      });
      setEditingPlanId("");
      setShowTreatmentModal(false);
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to update treatment.");
    }
  };

  const handleTreatmentStatus = async (planId, status) => {
    try {
      const response = await API.patch(`/patients/${id}/treatment-plans/${planId}/status`, {
        status,
      });
      setPatient(response.data);
      setError("");
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update treatment status.");
    }
  };

  const handleSessionDayStatus = async (planId, dayId, status) => {
    try {
      const response = await API.patch(
        `/patients/${id}/treatment-plans/${planId}/session-days/${dayId}`,
        { status }
      );
      setPatient(response.data);
      setError("");
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update session day.");
    }
  };

  const handleDeleteTreatmentPlan = async (planId) => {
    try {
      const response = await API.delete(`/patients/${id}/treatment-plans/${planId}`);
      setPatient(response.data);
      setError("");
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete treatment plan.");
    }
  };

  const handleAddPlanPayment = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post(
        `/patients/${id}/treatment-plans/${planPaymentForm.planId}/payments`,
        {
          amount: Number(planPaymentForm.amount || 0),
          method: planPaymentForm.method,
        }
      );

      setPatient(response.data);
      setPlanPaymentForm({ planId: "", amount: "", method: "" });
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to add payment.");
    }
  };

  const handleAddAppointment = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post(`/patients/${id}/appointments`, appointmentForm);
      setPatient(response.data);
      setAppointmentForm({ date: "", time: "", service: "" });
      setShowAppointmentModal(false);
      setError("");
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to add appointment.");
    }
  };

  const updateAppointmentActionForm = (appointmentId, key, value) => {
    setAppointmentActionForms((current) => ({
      ...current,
      [appointmentId]: {
        ...(current[appointmentId] || {}),
        [key]: value,
      },
    }));
  };

  const updateAppointmentRequestForm = (requestId, key, value) => {
    setAppointmentRequestForms((current) => ({
      ...current,
      [requestId]: {
        ...(current[requestId] || {}),
        [key]: value,
      },
    }));
  };

  const handleAppointmentRequestDecision = async (request, action) => {
    const form = appointmentRequestForms[request.id] || {};
    const date = form.date || request.requestedDate || "";

    if (!date) {
      setError("Please select a date before updating this request.");
      return;
    }

    try {
      await API.patch(`/appointments/${request.id}/${action}`, {
        date,
        time: form.time || request.requestedTime || "",
        note: form.note || "",
      });
      await loadPatient();
      setError("");
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update appointment request.");
    }
  };

  const handleAppointmentStatus = async (appointment, status) => {
    const form = appointmentActionForms[appointment.id] || {};
    const date = form.date || appointment.date || "";
    const time = form.time || appointment.time || "";
    const remark = form.remark || "";

    if (status === "rescheduled" && !date) {
      setError("Please select a date before rescheduling this appointment.");
      return;
    }

    if (["completed", "cancelled"].includes(status) && !remark.trim()) {
      setError("Please add a remark before updating this appointment.");
      return;
    }

    try {
      const response = await API.patch(`/patients/${id}/appointments/${appointment.id}`, {
        status,
        date,
        time,
        remark,
      });
      setPatient(response.data);
      setError("");
    } catch (updateError) {
      setError(updateError.response?.data?.message || "Failed to update appointment.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500 shadow-sm">
          Loading patient profile...
        </div>
      </DashboardLayout>
    );
  }

  if (!patient) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <button
            onClick={() => navigate("/patients")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
          >
            <ArrowLeft size={16} /> Back to Patients
          </button>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error || "Patient not found."}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const activeTreatmentCount = (patient.treatmentPlans || []).filter(
    (plan) => plan.status === "active"
  ).length;
  const activeAppointments = (patient.appointments || []).filter(
    (appointment) => !["completed", "cancelled"].includes(appointment.status || "")
  );
  const todayKey = getTodayKey();
  const appointmentHistory = (patient.appointments || []).filter((appointment) =>
    ["completed", "cancelled"].includes(appointment.status || "")
  );
  const linkedAppointmentRequestIds = new Set(
    (patient.appointments || []).map((appointment) => appointment.requestId).filter(Boolean)
  );
  const visibleAppointmentRequests = appointmentRequests.filter(
    (request) =>
      !linkedAppointmentRequestIds.has(request.id) &&
      (!request.status || request.status === "pending")
  );

  const summaryCards = [
    {
      label: "Patient ID",
      value: `#${patient.id.slice(-6)}`,
      icon: UserCircle2,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Active Treatments",
      value: activeTreatmentCount,
      icon: Stethoscope,
      tone: "bg-cyan-50 text-cyan-700",
    },
    {
      label: "Session Payments",
      value: (patient.treatmentPlans || []).reduce(
        (sum, plan) => sum + (plan.payments?.length || 0),
        0
      ),
      icon: CreditCard,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Clinical Notes",
      value: patient.clinicalNotes?.length || 0,
      icon: Files,
      tone: "bg-violet-50 text-violet-600",
    },
  ];

  const panelClass = "rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]";

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1440px] space-y-3 overflow-x-hidden">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_32%),linear-gradient(120deg,#020617,#0f172a_52%,#075985)] px-4 py-3 text-white shadow-[0_16px_48px_rgba(2,6,23,0.16)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
                <span className="text-lg font-semibold">{patient.name.charAt(0)}</span>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => navigate("/patients")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 hover:bg-white/15"
                >
                  <ArrowLeft size={16} />
                  Back to Patients
                </button>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                    Patient Profile
                  </p>
                  <h1 className="text-xl font-semibold tracking-tight">{patient.name}</h1>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-white/75">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <Mail size={14} />
                    {patient.email}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                    <Phone size={14} />
                    {patient.mobile}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditBasic(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className={`${panelClass} p-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-0.5 text-xl font-semibold text-slate-900">{value}</p>
                </div>
                <div className={`rounded-xl p-2 ${tone}`}>
                  <Icon size={17} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,430px)]">
          <div className="min-w-0 space-y-4">
            <section className={`${panelClass} p-4`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Treatment Sessions</h2>
                  <p className="text-sm text-slate-500">
                    Start treatment with multiple treatment types, timeline, and payment structure.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (activeTreatmentCount > 0) {
                      setError("A treatment session is already active. Complete it before starting another one.");
                      return;
                    }

                    setShowTreatmentModal(true);
                  }}
                  disabled={activeTreatmentCount > 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                >
                  <Plus size={15} />
                  {activeTreatmentCount > 0 ? "Active Session Running" : "Session Start"}
                </button>
              </div>

              <div className="space-y-4">
                {!patient.treatmentPlans?.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No treatment session started yet.
                  </div>
                ) : (
                  patient.treatmentPlans.map((plan) => (
                    <div key={plan.id} className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#fff,#f8fafc)] p-4">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold text-slate-900">Treatment Plan</p>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                plan.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {plan.status === "completed" ? "Completed" : "Active"}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            Added {formatDate(plan.createdAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingPlan(plan)}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          {plan.status === "active" ? (
                            <button
                              type="button"
                              onClick={() => handleTreatmentStatus(plan.id, "completed")}
                              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              Mark Completed
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTreatmentStatus(plan.id, "active")}
                              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                            >
                              Mark Active
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteTreatmentPlan(plan.id)}
                            className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {plan.treatmentTypes.map((type) => (
                          <span
                            key={`${plan.id}-${type}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                          >
                            {type}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl border border-slate-100 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">From Date</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{plan.fromDate || "Not added"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">To Date</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{plan.toDate || "Not added"}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Total Amount</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{formatMoney(plan.totalAmount)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Balance</p>
                          <p className="mt-2 text-sm font-medium text-slate-900">{formatMoney(plan.balanceAmount)}</p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Session Days</p>
                            <p className="text-xs text-slate-500">
                              Only today&apos;s session can be marked done or not done.
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {plan.sessionDays?.length || 0} days
                          </span>
                        </div>

                        {plan.sessionDays?.length ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {plan.sessionDays.map((day) => {
                              const isDone = day.status === "done";
                              const isToday = day.date === todayKey;

                              return (
                                <div
                                  key={day.id}
                                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-slate-800">
                                      {day.date || "Date not added"}
                                    </p>
                                    <span
                                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                        isDone
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {isDone ? "Done" : "Not done"}
                                    </span>
                                  </div>
                                  {isToday ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSessionDayStatus(
                                          plan.id,
                                          day.id,
                                          isDone ? "not_done" : "done"
                                        )
                                      }
                                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                                        isDone
                                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                                      }`}
                                    >
                                      {isDone ? "Not done" : "Done"}
                                    </button>
                                  ) : (
                                    <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500">
                                      Locked
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                            No daily session entries yet. Edit the session dates once to generate them.
                          </p>
                        )}
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fafc)] p-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <IndianRupee size={16} />
                          <p className="text-sm font-semibold">Payment Structure</p>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Total Paid</p>
                            <p className="mt-1 text-sm text-slate-800">{formatMoney(plan.advanceAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Method</p>
                            <p className="mt-1 text-sm text-slate-800">{plan.paymentMethod || "Not added"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Rest Balance</p>
                            <p className="mt-1 text-sm font-semibold text-slate-800">{formatMoney(plan.balanceAmount)}</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Notes</p>
                          <p className="mt-1 text-sm text-slate-800">{plan.paymentNotes || "No notes added"}</p>
                        </div>

                        <form
                          onSubmit={handleAddPlanPayment}
                          className="mt-4 rounded-2xl bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                            <input
                              type="hidden"
                              value={planPaymentForm.planId}
                              readOnly
                            />
                            <div className="flex-1">
                              <label className="text-xs uppercase tracking-wide text-slate-400">
                                Add Payment
                              </label>
                              <input
                                type="number"
                                min="0"
                                className="input mt-2"
                                placeholder="Amount"
                                value={planPaymentForm.planId === plan.id ? planPaymentForm.amount : ""}
                                onChange={(e) =>
                                  setPlanPaymentForm({
                                    planId: plan.id,
                                    amount: e.target.value,
                                    method:
                                      planPaymentForm.planId === plan.id
                                        ? planPaymentForm.method
                                        : plan.paymentMethod || "",
                                  })
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-xs uppercase tracking-wide text-slate-400">
                                Method
                              </label>
                              <input
                                className="input mt-2"
                                placeholder="Payment method"
                                value={planPaymentForm.planId === plan.id ? planPaymentForm.method : ""}
                                onChange={(e) =>
                                  setPlanPaymentForm({
                                    planId: plan.id,
                                    amount:
                                      planPaymentForm.planId === plan.id ? planPaymentForm.amount : "",
                                    method: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <button
                              type="submit"
                              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700"
                              onClick={() =>
                                setPlanPaymentForm((current) => ({
                                  planId: plan.id,
                                  amount: current.planId === plan.id ? current.amount : "",
                                  method:
                                    current.planId === plan.id
                                      ? current.method
                                      : plan.paymentMethod || "",
                                }))
                              }
                            >
                              Add Payment
                            </button>
                          </div>
                        </form>

                        <div className="mt-4">
                          <p className="text-xs uppercase tracking-wide text-slate-400">
                            Payment History
                          </p>
                          {plan.payments?.length ? (
                            <div className="mt-3 space-y-2">
                              {plan.payments.map((payment) => (
                                <div
                                  key={payment.id}
                                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {formatMoney(payment.amount)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {payment.method || "Method not added"}
                                    </p>
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    {formatDate(payment.createdAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">
                              No payment entries yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className={`${panelClass} p-4`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Clinical Notes</h2>
                  <p className="text-sm text-slate-500">
                    Add multiple notes with multiple images or PDF documents.
                  </p>
                </div>
                <button
                  onClick={() => setShowClinicalNoteModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Plus size={15} />
                  Add Note
                </button>
              </div>

              {patient.disease ? (
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Primary Condition</p>
                  <p className="mt-2 text-slate-900">{patient.disease}</p>
                </div>
              ) : null}

              {patient.notes ? (
                <div className="mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Legacy Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">{patient.notes}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                {!patient.clinicalNotes?.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No clinical notes added yet.
                  </div>
                ) : (
                  patient.clinicalNotes.map((entry) => (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FileText size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {entry.title || "Clinical Note"}
                              </p>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                {entry.addedByLabel || (entry.addedByType === "patient" ? "Patient" : "OPW")}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {formatDate(entry.createdAt)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClinicalNote(entry.id)}
                          className="shrink-0 rounded-xl p-2 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {entry.note || "No note text added."}
                      </p>

                      <div className="mt-2">
                        {entry.documents?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {entry.documents.map((document) => {
                              const isImage = document.mimeType?.startsWith("image/");
                              return (
                                <a
                                  key={document.id}
                                  href={`${API.defaults.baseURL}${document.downloadUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-white"
                                >
                                  {isImage ? <Image size={14} /> : <Download size={14} />}
                                  {document.name}
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">
                            No documents uploaded for this note.
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="min-w-0 space-y-4 lg:sticky lg:top-4">
            <section className={`${panelClass} overflow-hidden p-4`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Appointments</h2>
                  <p className="text-sm text-slate-500">Requests, scheduled appointments, and patient-visible history.</p>
                </div>
                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={15} />
                  Add
                </button>
              </div>

              <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Appointment Requests
                    </h3>
                    <p className="text-sm text-slate-500">
                      Requests raised by this patient before they become booked appointments.
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {visibleAppointmentRequests.length} requests
                  </span>
                </div>

                <div className="space-y-3">
                  {visibleAppointmentRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-amber-200 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                      No separate appointment requests.
                    </div>
                  ) : (
                    visibleAppointmentRequests.map((request) => {
                      const requestForm = appointmentRequestForms[request.id] || {
                        date: request.requestedDate || "",
                        time: request.requestedTime || "",
                        note: request.decisionNote || "",
                      };

                      return (
                        <div
                          key={request.id}
                          className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-slate-900">
                                  {request.service || "Appointment"}
                                </p>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                  Pending
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                Requested: {request.requestedDate || "Date not added"}
                                {request.requestedTime ? ` at ${request.requestedTime}` : ""}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {request.phone || request.email || "No contact"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                            <input
                              type="date"
                              value={requestForm.date}
                              onChange={(event) =>
                                updateAppointmentRequestForm(
                                  request.id,
                                  "date",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                            />
                            <input
                              type="time"
                              value={requestForm.time}
                              onChange={(event) =>
                                updateAppointmentRequestForm(
                                  request.id,
                                  "time",
                                  event.target.value
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                            />
                            <input
                              value={requestForm.note}
                              onChange={(event) =>
                                updateAppointmentRequestForm(
                                  request.id,
                                  "note",
                                  event.target.value
                                )
                              }
                              placeholder="OPW note"
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:col-span-2"
                            />
                            <button
                              type="button"
                              onClick={() => handleAppointmentRequestDecision(request, "approve")}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              <CheckCircle2 size={15} />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAppointmentRequestDecision(request, "reschedule")}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                            >
                              <RotateCcw size={15} />
                              Reschedule
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {activeAppointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
                    No active appointment scheduled.
                  </div>
                ) : (
                  activeAppointments.map((appointment) => {
                    const actionForm = appointmentActionForms[appointment.id] || {
                      date: appointment.date || "",
                      time: appointment.time || "",
                      remark: appointment.remark || "",
                    };

                    return (
                      <div
                        key={appointment.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-slate-900">{appointment.service}</p>
                              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                                {getAppointmentStatusLabel(appointment.status)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {appointment.date}
                              {appointment.time ? ` at ${appointment.time}` : ""}
                            </p>
                            {appointment.remark ? (
                              <p className="mt-1 text-xs text-slate-500">
                                OPW remark: {appointment.remark}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-2">
                          <input
                            type="date"
                            value={actionForm.date}
                            onChange={(event) =>
                              updateAppointmentActionForm(
                                appointment.id,
                                "date",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                          />
                          <input
                            type="time"
                            value={actionForm.time}
                            onChange={(event) =>
                              updateAppointmentActionForm(
                                appointment.id,
                                "time",
                                event.target.value
                              )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                          />
                          <input
                            value={actionForm.remark}
                            onChange={(event) =>
                              updateAppointmentActionForm(
                                appointment.id,
                                "remark",
                                event.target.value
                              )
                            }
                            placeholder="Remark"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 sm:col-span-2"
                          />
                          <button
                            type="button"
                            onClick={() => handleAppointmentStatus(appointment, "rescheduled")}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700"
                          >
                            <RotateCcw size={15} />
                            Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAppointmentStatus(appointment, "completed")}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            <CheckCircle2 size={15} />
                            Done
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAppointmentStatus(appointment, "cancelled")}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 sm:col-span-2"
                          >
                            <XCircle size={15} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-5">
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-slate-900">Appointment History</h3>
                  <p className="text-sm text-slate-500">
                    Completed and cancelled appointment updates visible to the patient.
                  </p>
                </div>

                <div className="space-y-3">
                  {appointmentHistory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No appointment history yet.
                    </div>
                  ) : (
                    appointmentHistory.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-slate-900">{appointment.service}</p>
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  appointment.status === "cancelled"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-slate-900 text-white"
                                }`}
                              >
                                {getAppointmentStatusLabel(appointment.status)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {appointment.date}
                              {appointment.time ? ` at ${appointment.time}` : ""}
                            </p>
                          </div>
                          {appointment.remark ? (
                            <p className="rounded-xl bg-white px-3 py-2 text-xs font-medium text-slate-600">
                              OPW remark: {appointment.remark}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>

      {[editBasic, showClinicalNoteModal, showAppointmentModal, showTreatmentModal].some(Boolean) && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
          onClick={closeDrawer}
        >
          <div
            className={`relative mx-auto w-full rounded-[28px] border border-white/70 bg-white p-5 shadow-2xl shadow-slate-950/30 ${
              showTreatmentModal ? "max-w-3xl" : "max-w-lg"
            }`}
            style={{ marginTop: "max(1.5rem, env(safe-area-inset-top))", marginBottom: "1.5rem" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className={`mb-6 flex items-start justify-between ${
                showTreatmentModal
                  ? "rounded-[24px] bg-gradient-to-br from-slate-950 via-cyan-950 to-sky-800 p-5 text-white"
                  : "rounded-[24px] border border-slate-200 bg-slate-50 p-4"
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${showTreatmentModal ? "text-cyan-100" : "text-blue-600"}`}>
                  Patient Update
                </p>
                <h3 className={`text-2xl font-semibold ${showTreatmentModal ? "text-white" : "text-slate-900"}`}>
                  {editBasic && "Edit Patient"}
                  {showClinicalNoteModal && "Clinical Notes"}
                  {showAppointmentModal && "Add Appointment"}
                  {showTreatmentModal && (editingPlanId ? "Edit Session" : "Session Start")}
                </h3>
                {showTreatmentModal ? (
                  <p className="mt-2 text-sm text-cyan-50/80">
                    {editingPlanId
                      ? "Extend date range or update treatment details. Existing daily status stays safe."
                      : "Only one active treatment session can run for a patient at a time."}
                  </p>
                ) : null}
              </div>

              <button
                className={`rounded-xl border p-2 ${
                  showTreatmentModal
                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={closeDrawer}
              >
                <X size={18} />
              </button>
            </div>

            {editBasic && (
              <form onSubmit={handleBasicUpdate} className="space-y-4">
                <input
                  className="input"
                  placeholder="Full name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Mobile number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
                <button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800">
                  Save Changes
                </button>
              </form>
            )}

            {showTreatmentModal && (
              <form onSubmit={editingPlanId ? handleUpdateTreatment : handleStartTreatment} className="space-y-5">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900">
                        Treatment Types
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Add one or multiple care items for this session.
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {treatmentForm.treatmentTypes.length} added
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 bg-white"
                      placeholder="Add treatment type"
                      value={treatmentForm.treatmentTypeInput}
                      onChange={(e) =>
                        setTreatmentForm((current) => ({
                          ...current,
                          treatmentTypeInput: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTreatmentType();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addTreatmentType}
                      className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {treatmentForm.treatmentTypes.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeTreatmentType(type)}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-cyan-100 bg-cyan-50/60 p-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-900">Session Period</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Updating the end date extends daily session status automatically.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Start Date
                      </span>
                      <input
                        type="date"
                        className="input bg-white"
                        required
                        value={treatmentForm.fromDate}
                        onChange={(e) =>
                          setTreatmentForm((current) => ({ ...current, fromDate: e.target.value }))
                        }
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                        End Date
                      </span>
                      <input
                        type="date"
                        className="input bg-white"
                        required
                        value={treatmentForm.toDate}
                        onChange={(e) =>
                          setTreatmentForm((current) => ({ ...current, toDate: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-900">Payment Details</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {editingPlanId
                        ? "Plan amount can be edited here. Add extra payments from the session card."
                        : "Add total and first payment if collected at session start."}
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="number"
                      min="0"
                      className="input"
                      placeholder="Total amount"
                      value={treatmentForm.totalAmount}
                      onChange={(e) =>
                        setTreatmentForm((current) => ({ ...current, totalAmount: e.target.value }))
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      className="input"
                      placeholder="Advance amount"
                      disabled={Boolean(editingPlanId)}
                      value={treatmentForm.advanceAmount}
                      onChange={(e) =>
                        setTreatmentForm((current) => ({ ...current, advanceAmount: e.target.value }))
                      }
                    />
                  </div>

                  <input
                    className="input mt-4"
                    placeholder="Payment method"
                    value={treatmentForm.paymentMethod}
                    onChange={(e) =>
                      setTreatmentForm((current) => ({ ...current, paymentMethod: e.target.value }))
                    }
                  />

                  <textarea
                    className="input mt-4 min-h-[110px]"
                    placeholder="Payment structure notes"
                    value={treatmentForm.paymentNotes}
                    onChange={(e) =>
                      setTreatmentForm((current) => ({ ...current, paymentNotes: e.target.value }))
                    }
                  />
                </div>

                <button className="w-full rounded-2xl bg-cyan-700 px-4 py-3 font-semibold text-white shadow-lg shadow-cyan-700/20 hover:bg-cyan-800">
                  {editingPlanId ? "Save Session" : "Start Treatment"}
                </button>
              </form>
            )}

            {showClinicalNoteModal && (
              <form onSubmit={handleAddClinicalNote} className="space-y-4">
                <input
                  className="input"
                  placeholder="Note title"
                  value={clinicalNoteForm.title}
                  onChange={(e) =>
                    setClinicalNoteForm((current) => ({
                      ...current,
                      title: e.target.value,
                    }))
                  }
                />
                <textarea
                  className="input min-h-[160px]"
                  placeholder="Clinical note"
                  value={clinicalNoteForm.note}
                  onChange={(e) =>
                    setClinicalNoteForm((current) => ({
                      ...current,
                      note: e.target.value,
                    }))
                  }
                />
                <div className="rounded-2xl border border-dashed border-slate-300 p-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Upload images or PDF files
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    multiple
                    className="mt-3 block w-full text-sm text-slate-600"
                    onChange={(e) =>
                      setClinicalNoteForm((current) => ({
                        ...current,
                        documents: Array.from(e.target.files || []),
                      }))
                    }
                  />
                  {clinicalNoteForm.documents.length ? (
                    <div className="mt-3 space-y-2">
                      {clinicalNoteForm.documents.map((file) => (
                        <p key={`${file.name}-${file.size}`} className="text-sm text-slate-500">
                          {file.name}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white hover:bg-slate-800">
                  Save Note
                </button>
              </form>
            )}

            {showAppointmentModal && (
              <form onSubmit={handleAddAppointment} className="space-y-4">
                <input
                  type="date"
                  className="input"
                  value={appointmentForm.date}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      date: e.target.value,
                    })
                  }
                />
                <input
                  type="time"
                  className="input"
                  value={appointmentForm.time}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      time: e.target.value,
                    })
                  }
                />
                <select
                  className="input"
                  value={appointmentForm.service}
                  onChange={(e) =>
                    setAppointmentForm({
                      ...appointmentForm,
                      service: e.target.value,
                    })
                  }
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.name}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <button className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700">
                  Save Appointment
                </button>
              </form>
            )}

          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
