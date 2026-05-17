import { AlertCircle, CheckCircle2, Mail, ShieldCheck, Trash2 } from "lucide-react";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";

const retainedItems = [
  "Appointment and payment records that must be retained for clinic, billing, or legal record keeping.",
  "Anonymized service usage records that no longer identify the patient account.",
];

const deletedItems = [
  "Patient login account and profile details.",
  "Saved contact details connected only to the app account.",
  "App notification tokens and account access data.",
  "Optional messages or feedback that are not required for clinic records.",
];

export default function DeleteAccountPage() {
  return (
    <PublicLayout>
      <Seo
        title="Delete Account Request | Omm Physio World"
        description="Request deletion of your Omm Physio World patient app account and associated personal data."
        path="/delete-account"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Account deletion request page for Omm Physio World patient app users.",
            path: "/delete-account",
            pageName: "Delete Account Request",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Delete Account", path: "/delete-account" },
          ]),
        ]}
      />

      <section className="page-section relative overflow-hidden px-4 py-14 sm:px-6 lg:px-8">
        <div className="absolute left-8 top-8 h-64 w-64 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-72 w-72 rounded-full bg-lime-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">
          <div className="rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
              <Trash2 size={17} />
              Delete Account Request
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Request deletion of your Omm Physio World account.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              Patient app users can request account and associated personal data deletion
              by contacting Omm Physio World from the registered mobile number or email.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
            <div className="rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
                <Mail className="text-cyan-700" size={22} />
                How to request deletion
              </h2>
              <ol className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                <li>
                  1. Send an email to{" "}
                  <a className="font-semibold text-cyan-700" href="mailto:contact@ommphysioworld.com?subject=Delete%20My%20Omm%20Physio%20World%20Account">
                    contact@ommphysioworld.com
                  </a>{" "}
                  with the subject “Delete My Omm Physio World Account”.
                </li>
                <li>
                  2. Include your registered name, mobile number, and email address so
                  we can verify the account.
                </li>
                <li>
                  3. Our clinic team will verify the request and process deletion within
                  a reasonable time after confirmation.
                </li>
              </ol>
              <a
                href="mailto:contact@ommphysioworld.com?subject=Delete%20My%20Omm%20Physio%20World%20Account"
                className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Email deletion request
              </a>
            </div>

            <div className="rounded-[30px] border border-cyan-100 bg-cyan-50/80 p-6">
              <h2 className="flex items-center gap-2 text-2xl font-semibold text-slate-950">
                <ShieldCheck className="text-cyan-700" size={22} />
                Verification
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                To protect patient privacy, we may contact you on your registered phone
                number or email before deleting the account.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                You can also call us at{" "}
                <a className="font-semibold text-cyan-700" href="tel:+918895555519">
                  +91 88955 55519
                </a>{" "}
                for help with the request.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                <CheckCircle2 className="text-emerald-600" size={21} />
                Data we delete
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {deletedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="rounded-[30px] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-950">
                <AlertCircle className="text-amber-600" size={21} />
                Data we may retain
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                {retainedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
