import {
  Activity,
  ArrowRight,
  Baby,
  Bone,
  Brain,
  Dumbbell,
  Footprints,
  HeartPulse,
  Move,
  PersonStanding,
  ShieldPlus,
  StretchHorizontal,
  TimerReset,
  UserRound,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import serviceManual from "../assets/service-manual.png";
import serviceNeurological from "../assets/service-neurological.png";
import serviceOrthopedic from "../assets/service-orthopedic.png";
import servicePainRelief from "../assets/service-pain-relief.png";
import servicePosture from "../assets/service-posture.webp";
import serviceSportsRehabilitation from "../assets/service-sports-rehabilitation.png";
import servicesHeroImage from "../assets/services-hero.png";

const featuredServices = [
  {
    icon: Activity,
    image: serviceOrthopedic,
  },
  {
    icon: Dumbbell,
    image: serviceSportsRehabilitation,
  },
  {
    icon: PersonStanding,
    image: servicePosture,
  },
  {
    icon: Waves,
    image: servicePainRelief,
  },
  {
    icon: Brain,
    image: serviceNeurological,
  },
  {
    icon: Move,
    image: serviceManual,
  },
];

const serviceGroups = [
  {
    items: [
      { label: "Pre and Post Operative Rehab", icon: TimerReset },
      { label: "Joint and Bone Rehabilitation", icon: Bone },
      { label: "Exercise Therapy", icon: StretchHorizontal },
      { label: "Balance and Gait Training", icon: Footprints },
    ],
  },
  {
    items: [
      { label: "Pediatric Physiotherapy", icon: Baby },
      { label: "Geriatric Physiotherapy", icon: UserRound },
      { label: "Women's Health Physiotherapy", icon: HeartPulse },
      { label: "Dry Needling and Trigger Point Care", icon: ShieldPlus },
    ],
  },
  {
    items: [
      { label: "Electrotherapy", icon: Activity },
      { label: "Pain Management", icon: Waves },
      { label: "Mobility And Strength Programs", icon: Dumbbell },
      { label: "Functional Movement Training", icon: PersonStanding },
    ],
  },
];

const heroImage = servicesHeroImage;

const copy = {
  eyebrow: "Services",
  title: "Complete physiotherapy services presented in a more practical, patient-friendly way.",
  text: "Our care covers pain relief, rehabilitation, posture correction, strength recovery, mobility improvement, and specialty physiotherapy support across different stages of life.",
  bookAppointment: "Book Appointment",
  talkToClinic: "Talk to the Clinic",
  heroAlt: "Modern physiotherapy treatment consultation",
  featuredServices: [
    { title: "Orthopedic Physiotherapy", text: "Care for joint pain, fractures, stiffness, ligament issues, and musculoskeletal recovery." },
    { title: "Sports Rehabilitation", text: "Performance-focused therapy for injury recovery, strengthening, mobility, and return to sport." },
    { title: "Posture And Spine Care", text: "Support for neck pain, back pain, posture correction, and workstation-related strain." },
    { title: "Pain Relief Therapy", text: "Hands-on and exercise-based therapy to reduce pain and improve day-to-day movement quality." },
    { title: "Neurological Physiotherapy", text: "Balance, coordination, gait, and functional support for neurological recovery needs." },
    { title: "Manual Therapy", text: "Hands-on joint and soft tissue techniques to ease stiffness, improve range, and relieve tension." },
  ],
  completeCare: "Complete Care",
  completeCareTitle: "Broader physiotherapy support for pain, rehab, movement, and long-term function",
  completeCareText: "Our clinic can support patients across orthopedic, neurological, sports, pediatric, geriatric, post-surgical, spinal, posture, balance, pain-relief, and functional rehabilitation needs. Each plan is adjusted to the patient's condition, comfort level, and recovery goal.",
  groups: ["Rehabilitation And Recovery", "Specialized Physiotherapy", "Supportive Treatment Options"],
};

export default function PublicServicesPage() {
  const t = copy;
  const localizedFeaturedServices = featuredServices.map((item, index) => ({
    ...item,
    ...t.featuredServices[index],
  }));
  const localizedGroups = serviceGroups.map((group, index) => ({
    title: t.groups[index],
    items: group.items,
  }));

  return (
    <PublicLayout>
      <Seo
        title="Physiotherapy Services in Baripada"
        description="Explore physiotherapy services at Omm Physio World including pain management, sports rehabilitation, posture correction, manual therapy, and mobility care."
        path="/care"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Physiotherapy services in Baripada including pain management, rehabilitation, posture support, and movement recovery.",
            path: "/care",
            pageName: "Services",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Services", path: "/care" },
          ]),
        ]}
      />
      <section className="page-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
              {t.eyebrow}
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950">
              {t.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              {t.text}
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/patient-login?redirect=/patient-dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                {t.bookAppointment}
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t.talkToClinic}
              </Link>
            </div>
          </div>

          <div className="motion-card motion-image overflow-hidden rounded-[38px] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
            <img
              src={heroImage}
              alt={t.heroAlt}
              className="h-[420px] w-full object-cover"
            />
          </div>
        </div>

        <div className="stagger-grid mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {localizedFeaturedServices.map(({ title, text, icon: Icon, image }) => (
            <div
              key={title}
              className="motion-card group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-7">
                <div className="mb-5 flex items-start justify-between">
                  <div className="inline-flex rounded-2xl bg-cyan-50 p-3 text-cyan-700 transition group-hover:bg-slate-950 group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition group-hover:w-28" />
                </div>

                <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
                <p className="mt-4 leading-7 text-slate-600">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="motion-card mt-12 rounded-[36px] border border-slate-200 bg-white/95 p-8 shadow-sm backdrop-blur lg:p-10">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            {t.completeCare}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            {t.completeCareTitle}
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
            {t.completeCareText}
          </p>

          <div className="stagger-grid mt-8 grid gap-5 lg:grid-cols-3">
            {localizedGroups.map((group) => (
              <div
                key={group.title}
                className="motion-card rounded-[30px] border border-slate-200 bg-slate-50/80 p-6"
              >
                <h3 className="text-xl font-semibold text-slate-950">
                  {group.title}
                </h3>
                <div className="mt-5 space-y-3">
                  {group.items.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="inline-flex rounded-xl bg-sky-50 p-2 text-sky-700">
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
