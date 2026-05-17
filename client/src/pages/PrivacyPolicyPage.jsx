import { ShieldCheck, Mail, Bell, Database, Lock, UserCheck } from "lucide-react";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";

const updatedOn = "May 17, 2026";

const policySections = [
  {
    icon: UserCheck,
    title: "Information We Collect",
    text:
      "We may collect your name, mobile number, email address, appointment requests, patient profile details, treatment updates, therapy files, feedback, and messages you share with Omm Physio World.",
  },
  {
    icon: Database,
    title: "How We Use Information",
    text:
      "We use this information to manage appointments, treatment sessions, clinical notes, therapy plans, payment updates, patient support, staff coordination, and clinic communication.",
  },
  {
    icon: Bell,
    title: "Notifications",
    text:
      "If you allow notifications in the mobile app, we may send appointment updates, session reminders, therapy updates, payment reminders, clinic follow-up reminders, and important clinic announcements.",
  },
  {
    icon: Lock,
    title: "Data Protection",
    text:
      "We use reasonable administrative and technical safeguards to protect patient and account information. Access is limited to authorized clinic staff based on their role and permissions.",
  },
  {
    icon: ShieldCheck,
    title: "Sharing Information",
    text:
      "We do not sell your personal information. We may share limited information only with clinic staff, service providers, or authorities when required for patient care, app operation, or legal compliance.",
  },
  {
    icon: Mail,
    title: "Your Choices",
    text:
      "You can contact us to request correction, update, or deletion of your account information. Some treatment or billing records may need to be retained where required for clinic records.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <PublicLayout>
      <Seo
        title="Privacy Policy | Omm Physio World"
        description="Privacy Policy for Omm Physio World website and mobile app, including patient account, appointment, notification, and clinic communication data."
        path="/privacy-policy"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Privacy Policy for Omm Physio World website and mobile app services.",
            path: "/privacy-policy",
            pageName: "Privacy Policy",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Privacy Policy", path: "/privacy-policy" },
          ]),
        ]}
      />

      <section className="page-section relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
        <div className="absolute left-8 top-10 h-64 w-64 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute right-6 top-32 h-72 w-72 rounded-full bg-lime-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700">
              <ShieldCheck size={17} />
              Privacy Policy
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              How Omm Physio World protects your information.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              This Privacy Policy explains how Omm Physio World collects, uses, stores,
              and protects information shared through our website, admin system, and
              mobile apps.
            </p>
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Last updated: {updatedOn}
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {policySections.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                  <Icon size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-950">
              Website Cookies And Analytics
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Our website may use basic cookies, browser storage, or analytics tools to
              improve performance, remember preferences, support login sessions, and
              understand how visitors use the website.
            </p>

            <h2 className="mt-8 text-2xl font-semibold text-slate-950">
              Contact For Privacy Requests
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              For privacy questions, account updates, or deletion requests, contact
              Omm Physio World at <a className="font-semibold text-cyan-700" href="mailto:contact@ommphysioworld.com">contact@ommphysioworld.com</a> or
              call <a className="font-semibold text-cyan-700" href="tel:+918895555519">+91 88955 55519</a>.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
