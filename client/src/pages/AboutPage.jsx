import { Award, HeartHandshake, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import doctorImage from "../assets/dr-tapaswini-sahu.jpg";
import aboutTreatmentImage from "../assets/about-treatment.jpeg";

const copy = {
  eyebrow: "About Omm Physio World",
  title: "Recovery care that feels calm, modern, and deeply personal.",
  text: "We support patients with physiotherapy care that blends expert treatment, honest guidance, and a reassuring environment. From pain relief to rehabilitation and posture support, our goal is to help every patient move with more confidence.",
  doctor: "Doctor",
  doctorText: "Dedicated to thoughtful physiotherapy support, guided recovery, and long-term patient wellbeing.",
  cta: "Book Your Visit",
  whyChoose: "Why Patients Choose Us",
  patientCentered: "Patient-centered",
  patientCenteredText: "We explain clearly, treat thoughtfully, and keep care plans realistic.",
  metrics: [
    { label: "Years of care", value: "6+" },
    { label: "Guided plans", value: "200+" },
    { label: "Patient trust", value: "High" },
  ],
  values: [
    { title: "Compassionate Care", text: "We focus on listening carefully and creating treatment journeys that feel human, clear, and encouraging." },
    { title: "Clinical Precision", text: "Every therapy plan is shaped around patient condition, movement goals, and practical day-to-day improvement." },
    { title: "Trusted Guidance", text: "We aim to be a long-term recovery partner, not just a quick appointment provider." },
  ],
  clinicAlt: "Modern therapy clinic interior",
  supportAlt: "Patient receiving physiotherapy support",
};

const aboutImages = {
  clinic: doctorImage,
  support: aboutTreatmentImage,
};

export default function AboutPage() {
  const t = copy;
  const values = [
    { ...t.values[0], icon: HeartHandshake },
    { ...t.values[1], icon: Stethoscope },
    { ...t.values[2], icon: Award },
  ];

  return (
    <PublicLayout>
      <Seo
        title="About Omm Physio World Physiotherapy Clinic"
        description="Learn about Omm Physio World, a Baripada physiotherapy clinic focused on recovery care, posture support, rehabilitation, and patient-first treatment."
        path="/about"
        schema={[
          createMedicalBusinessSchema({
            description:
              "About the Omm Physio World physiotherapy clinic, its patient-first approach, and recovery-focused care in Baripada.",
            path: "/about",
            pageName: "About",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <section className="page-section relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
              {t.eyebrow}
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950">
              {t.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {t.text}
            </p>
            <div className="motion-card flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-sm sm:flex-row sm:items-center">
              <div className="h-24 w-24 overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50 shadow-sm">
                <img
                  src={doctorImage}
                  alt="Dr. Tapaswini Sahu at Omm Physio World"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                  {t.doctor}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  Dr. Tapaswini Sahu, BPT, MPT (Ortho)
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {t.doctorText}
                </p>
              </div>
            </div>
            <Link
              to="/patient-login?redirect=/patient-dashboard"
              className="inline-flex rounded-full bg-slate-950 px-6 py-3.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              {t.cta}
            </Link>
          </div>

          <div className="motion-panel relative overflow-hidden rounded-[36px] border border-white/50 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_36%)]" />
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                {t.whyChoose}
              </p>
              <div className="mt-8 space-y-6">
                <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-2xl font-semibold">{t.patientCentered}</p>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    {t.patientCenteredText}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {t.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur"
                    >
                      <p className="text-2xl font-semibold">{metric.value}</p>
                      <p className="mt-2 text-sm text-white/70">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="stagger-grid mt-14 grid gap-5 md:grid-cols-3">
          {values.map(({ title, text, icon: Icon }) => (
            <div
              key={title}
              className="motion-card group rounded-[32px] border border-slate-200 bg-white/95 p-7 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600 transition group-hover:bg-slate-950 group-hover:text-white">
                <Icon size={22} />
              </div>
              <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
              <p className="mt-4 leading-7 text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="motion-card motion-image overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-xl">
            <img
              src={aboutImages.clinic}
              alt={t.clinicAlt}
              className="h-[360px] w-full object-cover"
            />
          </div>

          <div className="motion-card motion-image overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-xl">
            <img
              src={aboutImages.support}
              alt={t.supportAlt}
              className="h-[360px] w-full object-cover"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
