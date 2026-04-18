import { CalendarDays, CheckCircle2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import { clearPatientUser, getPatientUser } from "../utils/patientAuth";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import {
  cleanEmail,
  cleanPhone,
  firstValidationError,
  isFutureOrTodayDate,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

const copy = {
  benefits: ["Quick appointment request flow", "Friendly follow-up confirmation", "Easy service and date selection"],
  eyebrow: "Book Appointment",
  title: "Start your recovery journey with a calm, simple booking flow.",
  text: "Fill in your details and preferred service. The OPW team will review your request.",
  flexibleTiming: "Flexible Timing",
  flexibleTimingText: "Choose a date that works for your visit.",
  directDelivery: "Clinic Review",
  directDeliveryText: "Your request goes to the OPW team for confirmation.",
  formTitle: "Appointment Request Form",
  formText: "Share your details and the OPW team will review your appointment request.",
  submitted: "Your appointment request has been sent successfully.",
  fallbackError: "Unable to submit the appointment request right now.",
  fullName: "Full Name",
  email: "Email Address",
  phone: "Phone Number",
  service: "Service Needed",
  uploadLabel: "Upload Image or PDF",
  uploadHelp: "You can choose a prescription, report, scan, or related image. The selected file will be sent with the appointment email.",
  message: "Tell us about your pain, injury, or concern",
  submitting: "Submitting...",
  submit: "Submit Request",
};

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const t = copy;
  const [patientUser, setPatientUser] = useState(() => getPatientUser());
  const [form, setForm] = useState({
    name: patientUser?.name || "",
    email: patientUser?.email || "",
    phone: patientUser?.mobile || "",
    service: "",
    date: "",
    message: "",
    file: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (!patientUser) {
      navigate("/patient-login?redirect=/book-appointment", { replace: true });
    }
  }, [navigate, patientUser]);

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

  const handleLogout = () => {
    clearPatientUser();
    setPatientUser(null);
    navigate("/patient-login?redirect=/book-appointment", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSubmitted(false);
    setSuccessMessage("");

    const validationError = firstValidationError([
      !form.name.trim() ? "Full name is required." : "",
      validateEmailField(form.email),
      validatePhoneField(form.phone),
      !form.service.trim() ? "Service is required." : "",
      !form.date ? "Preferred date is required." : "",
      form.date && !isFutureOrTodayDate(form.date)
        ? "Preferred date cannot be in the past."
        : "",
    ]);

    if (validationError) {
      setError(validationError);
      setSubmitting(false);
      return;
    }

    try {
      const payload = new FormData();
      payload.append("name", form.name.trim());
      payload.append("email", cleanEmail(form.email));
      payload.append("phone", cleanPhone(form.phone));
      payload.append("service", form.service.trim());
      payload.append("date", form.date);
      payload.append("message", form.message);

      if (form.file) {
        payload.append("file", form.file);
      }

      const response = await API.post("/appointments", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmitted(true);
      setSuccessMessage(response.data?.message || t.submitted);
      setForm({
        name: patientUser?.name || form.name,
        email: patientUser?.email || form.email,
        phone: patientUser?.mobile || form.phone,
        service: "",
        date: "",
        message: "",
        file: null,
      });
      e.target.reset();
    } catch (submitError) {
      setError(
        submitError.response?.data?.message ||
          t.fallbackError
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!patientUser) {
    return null;
  }

  return (
    <PublicLayout>
      <Seo
        title="Book a Physiotherapy Appointment in Baripada"
        description="Book a physiotherapy appointment at Omm Physio World in Baripada for pain relief, rehab, posture care, and guided recovery support."
        path="/book-appointment"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Book a physiotherapy appointment in Baripada for pain relief, rehab, posture correction, and recovery support.",
            path: "/book-appointment",
            pageName: "Book Appointment",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Book Appointment", path: "/book-appointment" },
          ]),
        ]}
      />
      <section className="page-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="motion-panel relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%)]" />
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.22em] text-white/60">
                {t.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">
                {t.title}
              </h1>
              <p className="mt-5 text-sm leading-7 text-white/75">
                {t.text}
              </p>

              <div className="stagger-grid mt-8 space-y-4">
                {t.benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <CheckCircle2 size={18} />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="motion-card rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                    <CalendarDays size={20} />
                  </div>
                  <p className="text-xl font-semibold">{t.flexibleTiming}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {t.flexibleTimingText}
                  </p>
                </div>
                <div className="motion-card rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-3 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-xl font-semibold">{t.directDelivery}</p>
                  <p className="mt-2 text-sm text-white/70">
                    {t.directDeliveryText}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="motion-card rounded-[36px] border border-slate-200 bg-white/95 p-8 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-slate-950">
                  {t.formTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Logged in as {patientUser.name || patientUser.email}. {t.formText}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Logout
              </button>
            </div>

            {submitted && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage || t.submitted}
              </div>
            )}

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4 md:grid-cols-2">
              <input
                className="input rounded-2xl border-slate-200 bg-slate-50"
                placeholder={t.fullName}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="email"
                className="input rounded-2xl border-slate-200 bg-slate-50"
                placeholder={t.email}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <input
                className="input rounded-2xl border-slate-200 bg-slate-50"
                placeholder={t.phone}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <select
                className="input rounded-2xl border-slate-200 bg-slate-50"
                value={form.service}
                onChange={(e) => setForm({ ...form, service: e.target.value })}
                required
              >
                <option value="">{t.service}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.name}>
                    {service.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                className="input rounded-2xl border-slate-200 bg-slate-50"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-600">
                  {t.uploadLabel}
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="input rounded-2xl border-slate-200 bg-slate-50 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      file:
                        e.target.files && e.target.files[0] ? e.target.files[0] : null,
                    })
                  }
                />
                <p className="mt-2 text-xs text-slate-500">
                  {t.uploadHelp}
                </p>
              </div>
              <textarea
                className="input min-h-[170px] rounded-2xl border-slate-200 bg-slate-50 md:col-span-2"
                placeholder={t.message}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
              <button
                disabled={submitting}
                className="rounded-full bg-slate-950 px-5 py-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
              >
                {submitting ? t.submitting : t.submit}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
