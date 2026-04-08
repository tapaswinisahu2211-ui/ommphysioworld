import {
  CalendarDays,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Send,
  Stethoscope,
  UploadCloud,
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
  { key: "notes", label: "Notes", icon: FileText },
  { key: "appointments", label: "Appointment", icon: CalendarDays },
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

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const [patientUser, setPatientUser] = useState(() => getPatientUser());
  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [sendingAppointment, setSendingAppointment] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [noteForm, setNoteForm] = useState({
    title: "",
    note: "",
    documents: [],
  });
  const [appointmentForm, setAppointmentForm] = useState({
    service: "",
    date: "",
    time: "",
    message: "",
  });
  const [appointmentRequests, setAppointmentRequests] = useState([]);
  const [services, setServices] = useState([]);

  const patientId = patientUser?.patientId || "";

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

  const clinicalNotes = patient?.clinicalNotes || [];
  const appointments = patient?.appointments || [];
  const bookedAppointmentRequestIds = new Set(
    appointments.map((appointment) => appointment.requestId).filter(Boolean)
  );
  const visibleAppointmentRequests = appointmentRequests.filter(
    (request) =>
      !bookedAppointmentRequestIds.has(request.id) &&
      !["cancelled", "completed"].includes(request.status || "")
  );
  const treatmentPlans = patient?.treatmentPlans || [];
  const directPayments = patient?.payments || [];
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
      { label: "Clinical Notes", value: clinicalNotes.length, icon: FolderOpen },
      { label: "Appointments", value: appointments.length, icon: CalendarDays },
      { label: "Sessions", value: treatmentPlans.length, icon: Stethoscope },
      { label: "Payments", value: payments.length, icon: CreditCard },
    ],
    [appointments.length, clinicalNotes.length, payments.length, treatmentPlans.length]
  );

  const handleLogout = () => {
    clearPatientUser();
    setPatientUser(null);
    navigate("/patient-login?redirect=/patient-dashboard", { replace: true });
  };

  const handleClinicalNoteSubmit = async (event) => {
    event.preventDefault();

    if (!noteForm.title.trim() && !noteForm.note.trim() && !noteForm.documents.length) {
      setStatus({ type: "error", message: "Please add note details or upload a document." });
      return;
    }

    try {
      setSavingNote(true);
      const payload = new FormData();
      payload.append("title", noteForm.title.trim() || "Previous Doctor Clinical Note");
      payload.append("note", noteForm.note.trim());
      payload.append("addedByType", "patient");
      payload.append("addedByLabel", patientUser.name || "Patient");
      noteForm.documents.forEach((file) => payload.append("documents", file));

      const response = await API.post(`/patients/${patientId}/clinical-notes`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPatient(response.data);
      setNoteForm({ title: "", note: "", documents: [] });
      setStatus({ type: "success", message: "Clinical note shared with clinic." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to save clinical note.",
      });
    } finally {
      setSavingNote(false);
    }
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
      const response = await API.post("/appointments", {
        name: patientUser.name,
        email: patientUser.email,
        phone: patientUser.mobile,
        patientId,
        service: appointmentForm.service.trim(),
        date: appointmentForm.date,
        time: appointmentForm.time,
        message: appointmentForm.message.trim(),
      });

      setAppointmentForm({ service: "", date: "", time: "", message: "" });
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
                <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                  <Panel title="Share Clinical Note" subtitle="Upload PDF/images and previous doctor notes.">
                    <form onSubmit={handleClinicalNoteSubmit} className="grid gap-4">
                      <input
                        className="input rounded-2xl border-slate-200 bg-slate-50"
                        placeholder="Note title"
                        value={noteForm.title}
                        onChange={(event) => setNoteForm({ ...noteForm, title: event.target.value })}
                      />
                      <textarea
                        className="input min-h-[150px] rounded-2xl border-slate-200 bg-slate-50"
                        placeholder="Clinical note details"
                        value={noteForm.note}
                        onChange={(event) => setNoteForm({ ...noteForm, note: event.target.value })}
                      />
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="input rounded-2xl border-slate-200 bg-slate-50 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                        onChange={(event) =>
                          setNoteForm({
                            ...noteForm,
                            documents: Array.from(event.target.files || []),
                          })
                        }
                      />
                      <button disabled={savingNote} className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                        <UploadCloud size={18} />
                        {savingNote ? "Sharing..." : "Share With Clinic"}
                      </button>
                    </form>
                  </Panel>
                  <Panel title="Clinical Notes & Documents" subtitle="Notes added by you or OPW will appear here.">
                    <RecordList emptyText="No clinical notes yet.">
                      {clinicalNotes.map((note) => (
                        <RecordCard key={note.id || note._id} title={note.title || "Clinical Note"} subtitle={note.note || "No note details added."}>
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
                  <Panel title="Request Appointment" subtitle="Only logged-in patients can submit this request.">
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
