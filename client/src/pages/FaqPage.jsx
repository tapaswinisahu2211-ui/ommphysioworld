import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, HelpCircle, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";

const faqItems = [
  {
    category: "Pain Relief",
    question: "Can physiotherapy help with back pain?",
    answer:
      "Yes. Physiotherapy can help many back pain cases by improving mobility, reducing muscle tightness, strengthening support muscles, and correcting posture or movement patterns. The exact plan depends on assessment.",
    keywords: ["back pain", "low back", "spine", "pain relief", "posture"],
  },
  {
    category: "Pain Relief",
    question: "What should I do for neck stiffness or shoulder pain?",
    answer:
      "Avoid forceful stretching at home. A physiotherapist can check posture, muscle tightness, joint movement, and daily habits, then guide safe exercises and treatment.",
    keywords: ["neck", "shoulder", "stiffness", "office posture", "cervical"],
  },
  {
    category: "Rehab",
    question: "Do you support post-injury rehabilitation?",
    answer:
      "Yes. OmmPhysio World supports guided rehabilitation after sprain, strain, sports injury, weakness, or mobility restriction. Rehab usually includes pain control, movement retraining, strengthening, and gradual return to activity.",
    keywords: ["injury", "rehab", "sports", "sprain", "weakness"],
  },
  {
    category: "Posture",
    question: "Can posture correction reduce recurring pain?",
    answer:
      "In many cases, yes. Poor sitting, phone use, work setup, and muscle imbalance can increase strain. We help patients understand their posture habits and follow practical correction exercises.",
    keywords: ["posture", "office", "desk", "recurring pain", "ergonomics"],
  },
  {
    category: "Treatment",
    question: "How many sessions will I need?",
    answer:
      "It depends on the condition, pain duration, strength, mobility, and recovery goal. After assessment, the clinic team can suggest a practical treatment/session plan.",
    keywords: ["session", "treatment plan", "how many", "duration"],
  },
  {
    category: "Appointments",
    question: "How do I book an appointment?",
    answer:
      "Create a patient account, login, and request an appointment from your dashboard. The clinic team can approve or reschedule it, and the update will be visible in your web and mobile account.",
    keywords: ["appointment", "book", "reschedule", "approve", "login"],
  },
  {
    category: "Clinical Notes",
    question: "Can I share previous doctor notes or reports?",
    answer:
      "Yes. After login, you can add clinical notes and upload PDF/image documents from your dashboard. These documents help the clinic understand your history before planning care.",
    keywords: ["clinical notes", "report", "pdf", "image", "doctor notes"],
  },
  {
    category: "Help",
    question: "What if I am not sure which service I need?",
    answer:
      "Use Live Chat if a staff member is online, or send a message from the contact form. You can briefly describe your pain, duration, and previous treatment so the team can guide the next step.",
    keywords: ["help", "which service", "live chat", "contact", "guidance"],
  },
];

const categoryCards = [
  "Back pain",
  "Neck stiffness",
  "Posture correction",
  "Sports injury",
  "Doctor reports",
  "Appointment help",
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) {
      return faqItems;
    }

    return faqItems.filter((item) =>
      [item.category, item.question, item.answer, ...item.keywords]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [normalizedQuery]);

  return (
    <PublicLayout>
      <Seo
        title="FAQ and Patient Help | OmmPhysio World"
        description="Find physiotherapy FAQ answers about pain relief, posture correction, rehabilitation, clinical notes, appointments, and how OmmPhysio World can help."
        path="/faq"
      />

      <section className="page-section relative px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="rounded-[36px] border border-slate-200 bg-white/90 p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                <Sparkles size={16} />
                Smart FAQ Search
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                Learn about your pain, recovery, and how to get help.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Search common physiotherapy questions about back pain, neck stiffness,
                posture, rehab, clinical notes, appointment requests, and treatment sessions.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
                  {filteredItems.length} answers available
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                  Web and mobile patient guidance
                </span>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
                  <Search size={20} className="text-sky-600" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ask about back pain, posture, rehab, appointment..."
                    className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categoryCards.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setQuery(item)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[36px] bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-800 p-6 text-white shadow-2xl shadow-sky-900/20">
              <p className="text-sm uppercase tracking-[0.22em] text-white/55">
                How We Help
              </p>
              <div className="mt-5 space-y-4">
                {[
                  "Understand your symptoms and recovery goal.",
                  "Share previous doctor notes and reports after login.",
                  "Request an appointment from patient dashboard.",
                  "Track appointment, session, and payment updates in your account.",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                    <HelpCircle className="mt-0.5 shrink-0 text-sky-200" size={18} />
                    <p className="text-sm leading-6 text-white/82">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[26px] border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                  Quick Tip
                </p>
                <p className="mt-2 text-sm leading-6 text-white/82">
                  If you are unsure which FAQ fits your pain, search with simple words like
                  back pain, posture, appointment, note, or report.
                </p>
              </div>
              <Link
                to="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
              >
                Contact the clinic
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <article
                  key={item.question}
                  className={`rounded-[30px] border bg-white/90 shadow-sm backdrop-blur transition ${
                    expandedQuestion === item.question
                      ? "border-sky-200 shadow-[0_18px_40px_rgba(14,165,233,0.12)]"
                      : "border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuestion((current) =>
                        current === item.question ? "" : item.question
                      )
                    }
                    className="flex w-full flex-col gap-3 p-5 text-left sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {item.category}
                      </span>
                      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Tap to {expandedQuestion === item.question ? "hide" : "view"} answer
                      </p>
                      <h2 className="mt-3 text-lg font-semibold text-slate-950 sm:text-xl">
                        {item.question}
                      </h2>
                    </div>
                    <ChevronDown
                      className={`shrink-0 text-slate-400 transition-transform ${
                        expandedQuestion === item.question ? "rotate-180 text-sky-600" : ""
                      }`}
                    />
                  </button>
                  {expandedQuestion === item.question && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
                      </div>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center">
                <h2 className="text-xl font-semibold text-slate-950">
                  No matching FAQ found
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Try a shorter search like pain, posture, report, appointment, or contact us for help.
                </p>
                <Link
                  to="/contact"
                  className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                >
                  Contact Us
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
