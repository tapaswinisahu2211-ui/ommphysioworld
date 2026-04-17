import { BriefcaseBusiness, FileText, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import API from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import {
  cleanEmail,
  cleanPhone,
  firstValidationError,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

const copy = {
  en: {
    eyebrow: "Career",
    title: "Join our staff and grow with a patient-first physiotherapy team.",
    text:
      "We are always happy to connect with compassionate people who want to support recovery, movement, and better patient care.",
    perks: [
      "Apply directly from the website",
      "Send your resume and role interest in one step",
      "Applications are delivered to the clinic inbox",
    ],
    roleTitle: "Why apply here",
    roleText:
      "Whether you are applying for therapist, receptionist, assistant, or support staff roles, you can share your details and we will review your application.",
    deliveryTitle: "Direct review",
    deliveryText:
      "Your application is saved and also sent to the clinic email for faster follow-up.",
    formTitle: "Staff Application Form",
    formText:
      "Fill in your details and tell us which role you want to apply for.",
    submitted: "Your staff application has been sent successfully.",
    fallbackError: "Unable to submit your application right now.",
    fullName: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    role: "Role You Are Applying For",
    experience: "Years of Experience",
    message: "Tell us about your skills, background, or availability",
    uploadLabel: "Upload Resume",
    uploadHelp:
      "You can upload a resume in PDF, DOC, DOCX, or image format.",
    submitting: "Submitting...",
    submit: "Apply Now",
  },
  hi: {},
  or: {},
};

export default function CareerPage() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    experience: "",
    message: "",
    resume: null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const role = searchParams.get("role");

    if (role) {
      setForm((current) => ({
        ...current,
        role,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitted(false);
    setError("");

    const validationError = firstValidationError([
      !form.name.trim() ? "Full name is required." : "",
      validateEmailField(form.email),
      validatePhoneField(form.phone),
      !form.role.trim() ? "Role is required." : "",
      !form.experience.trim() ? "Experience is required." : "",
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
      payload.append("role", form.role.trim());
      payload.append("experience", form.experience.trim());
      payload.append("message", form.message.trim());

      if (form.resume) {
        payload.append("resume", form.resume);
      }

      await API.post("/staff-applications", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSubmitted(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "",
        experience: "",
        message: "",
        resume: null,
      });
      e.target.reset();
    } catch (submitError) {
      setError(submitError.response?.data?.message || t.fallbackError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <Seo
        title="Career Opportunities at Omm Physio World"
        description="Apply for staff roles at Omm Physio World. Submit your details and resume for physiotherapy, reception, assistant, and clinic support opportunities."
        path="/career"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Career and staff application page for physiotherapy, reception, assistant, and support roles at Omm Physio World.",
            path: "/career",
            pageName: "Career",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Career", path: "/career" },
          ]),
        ]}
      />
      <section className="page-section mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="motion-panel relative overflow-hidden rounded-[30px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_38%)]" />
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.22em] text-white/60">
                {t.eyebrow}
              </p>
              <h1 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                {t.text}
              </p>

              <div className="stagger-grid mt-5 space-y-3">
                {t.perks.map((perk) => (
                  <div
                    key={perk}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm backdrop-blur"
                  >
                    {perk}
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="motion-card rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="mb-2 inline-flex rounded-2xl bg-white/10 p-2.5 text-white">
                    <BriefcaseBusiness size={18} />
                  </div>
                  <p className="text-lg font-semibold">{t.roleTitle}</p>
                  <p className="mt-1.5 text-sm leading-6 text-white/70">{t.roleText}</p>
                </div>
                <div className="motion-card rounded-[24px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="mb-2 inline-flex rounded-2xl bg-white/10 p-2.5 text-white">
                    <Send size={18} />
                  </div>
                  <p className="text-lg font-semibold">{t.deliveryTitle}</p>
                  <p className="mt-1.5 text-sm leading-6 text-white/70">{t.deliveryText}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="motion-card rounded-[36px] border border-slate-200 bg-white/95 p-8 shadow-sm backdrop-blur">
            <h2 className="text-3xl font-semibold text-slate-950">
              {t.formTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{t.formText}</p>

            {submitted && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {t.submitted}
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
              <input
                className="input rounded-2xl border-slate-200 bg-slate-50"
                placeholder={t.role}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              />
              <input
                className="input rounded-2xl border-slate-200 bg-slate-50"
                placeholder={t.experience}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                required
              />
              <div className="md:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                  <FileText size={16} />
                  {t.uploadLabel}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="input rounded-2xl border-slate-200 bg-slate-50 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      resume:
                        e.target.files && e.target.files[0] ? e.target.files[0] : null,
                    })
                  }
                />
                <p className="mt-2 text-xs text-slate-500">{t.uploadHelp}</p>
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

