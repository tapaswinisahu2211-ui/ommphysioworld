import { useState } from "react";
import {
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { useLanguage } from "../context/LanguageContext";
import API from "../services/api";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import {
  cleanEmail,
  cleanPhone,
  firstValidationError,
  validateEmailField,
  validatePhoneField,
} from "../utils/validation";

const socialLinks = [
  {
    label: "WhatsApp",
    href: "https://wa.me/918895555519",
    badge: "WA",
    tone: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  {
    label: "Call",
    href: "tel:+918895555519",
    badge: "Call",
    tone: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
];

const copy = {
  en: {
    eyebrow: "Contact",
    title: "Reach the clinic easily and plan your visit with confidence.",
    text: "Whether you need help choosing the right therapy service or want to confirm clinic timings, we are here to help.",
    cards: [
      { title: "Clinic Address", detail: "City clinic road, near davaindia, Baripada" },
      { title: "Contact Details", detail: "+91 88955 55519 / contact@ommphysioworld.com" },
      { title: "Doctor", detail: "Dr. Tapaswini Sahu" },
      { title: "Working Hours", detail: "Monday to Saturday, 9:00 AM to 7:00 PM" },
    ],
    directionsTitle: "Need directions?",
    directionsText: "Use the map or open the exact clinic area in Google Maps for faster navigation.",
    openMaps: "Open in Google Maps",
    findUs: "Find Us",
    mapTitle: "Visit the clinic with live map directions",
    iframeTitle: "Omm Physio World location map",
  },
  hi: {
    eyebrow: "à¤¸à¤‚à¤ªà¤°à¥à¤•",
    title: "à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤¤à¤• à¤†à¤¸à¤¾à¤¨à¥€ à¤¸à¥‡ à¤ªà¤¹à¥à¤‚à¤šà¥‡à¤‚ à¤”à¤° à¤…à¤ªà¤¨à¥€ à¤µà¤¿à¤œà¤¿à¤Ÿ à¤†à¤¤à¥à¤®à¤µà¤¿à¤¶à¥à¤µà¤¾à¤¸ à¤¸à¥‡ à¤ªà¥à¤²à¤¾à¤¨ à¤•à¤°à¥‡à¤‚à¥¤",
    text: "à¤šà¤¾à¤¹à¥‡ à¤†à¤ªà¤•à¥‹ à¤¸à¤¹à¥€ à¤¥à¥‡à¤°à¥‡à¤ªà¥€ à¤¸à¥‡à¤µà¤¾ à¤šà¥à¤¨à¤¨à¥‡ à¤®à¥‡à¤‚ à¤®à¤¦à¤¦ à¤šà¤¾à¤¹à¤¿à¤ à¤¯à¤¾ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤•à¤¾ à¤¸à¤®à¤¯ à¤œà¤¾à¤¨à¤¨à¤¾ à¤¹à¥‹, à¤¹à¤® à¤†à¤ªà¤•à¥€ à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤¯à¤¹à¤¾à¤‚ à¤¹à¥ˆà¤‚à¥¤",
    cards: [
      { title: "à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤ªà¤¤à¤¾", detail: "à¤¸à¤¿à¤Ÿà¥€ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤°à¥‹à¤¡, à¤¦à¤µà¤¾à¤‡à¤‚à¤¡à¤¿à¤¯à¤¾ à¤•à¥‡ à¤ªà¤¾à¤¸, à¤¦à¥‡à¤‰à¤²à¤¸à¤¾à¤¹à¥€, à¤­à¤‚à¤œà¤ªà¥à¤°, à¤¬à¤¾à¤°à¤¿à¤ªà¤¦à¤¾, à¤“à¤¡à¤¿à¤¶à¤¾ 757001" },
      { title: "à¤¸à¤‚à¤ªà¤°à¥à¤• à¤µà¤¿à¤µà¤°à¤£", detail: "+91 88955 55519 / contact@ommphysioworld.com" },
      { title: "à¤¡à¥‰à¤•à¥à¤Ÿà¤°", detail: "à¤¡à¥‰. à¤¤à¤ªà¤¸à¥à¤µà¤¿à¤¨à¥€ à¤¸à¤¾à¤¹à¥‚" },
      { title: "à¤•à¤¾à¤°à¥à¤¯ à¤¸à¤®à¤¯", detail: "à¤¸à¥‹à¤®à¤µà¤¾à¤° à¤¸à¥‡ à¤¶à¤¨à¤¿à¤µà¤¾à¤°, à¤¸à¥à¤¬à¤¹ 9:00 à¤¬à¤œà¥‡ à¤¸à¥‡ à¤¶à¤¾à¤® 7:00 à¤¬à¤œà¥‡ à¤¤à¤•" },
    ],
    directionsTitle: "à¤°à¤¾à¤¸à¥à¤¤à¤¾ à¤šà¤¾à¤¹à¤¿à¤?",
    directionsText: "à¤¤à¥‡à¤œà¤¼ à¤¨à¥‡à¤µà¤¿à¤—à¥‡à¤¶à¤¨ à¤•à¥‡ à¤²à¤¿à¤ à¤®à¥ˆà¤ª à¤•à¤¾ à¤‰à¤ªà¤¯à¥‹à¤— à¤•à¤°à¥‡à¤‚ à¤¯à¤¾ Google Maps à¤®à¥‡à¤‚ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤•à¤¾ à¤¸à¤Ÿà¥€à¤• à¤¸à¥à¤¥à¤¾à¤¨ à¤–à¥‹à¤²à¥‡à¤‚à¥¤",
    openMaps: "Google Maps à¤®à¥‡à¤‚ à¤–à¥‹à¤²à¥‡à¤‚",
    findUs: "à¤¹à¤®à¥‡à¤‚ à¤–à¥‹à¤œà¥‡à¤‚",
    mapTitle: "à¤²à¤¾à¤‡à¤µ à¤®à¥ˆà¤ª à¤¦à¤¿à¤¶à¤¾-à¤¨à¤¿à¤°à¥à¤¦à¥‡à¤¶ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤• à¤†à¤à¤‚",
    iframeTitle: "à¤“à¤®à¤«à¤¿à¤œà¤¿à¤¯à¥‹ à¤µà¤°à¥à¤²à¥à¤¡ à¤²à¥‹à¤•à¥‡à¤¶à¤¨ à¤®à¥ˆà¤ª",
  },
  or: {
    eyebrow: "à¬¯à­‹à¬—à¬¾à¬¯à­‹à¬—",
    title: "à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬•à­ à¬¸à¬¹à¬œà¬°à­‡ à¬ªà¬¹à¬žà­à¬šà¬¨à­à¬¤à­ à¬à¬¬à¬‚ à¬†à¬ªà¬£à¬™à­à¬• à¬­à¬¿à¬œà¬¿à¬Ÿà­ à¬¨à¬¿à¬¶à­à¬šà¬¿à¬¤à¬¤à¬¾ à¬¸à¬¹ à¬ªà­à¬²à¬¾à¬¨ à¬•à¬°à¬¨à­à¬¤à­à¥¤",
    text: "à¬ à¬¿à¬•à­ à¬¥à­‡à¬°à¬¾à¬ªà¬¿ à¬¸à­‡à¬¬à¬¾ à¬šà­Ÿà¬¨ à¬•à¬°à¬¿à¬¬à¬¾à¬°à­‡ à¬¸à¬¾à¬¹à¬¾à¬¯à­à­Ÿ à¬¦à¬°à¬•à¬¾à¬° à¬¹à­‡à¬‰ à¬•à¬¿à¬®à­à¬¬à¬¾ à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬° à¬¸à¬®à­Ÿ à¬¨à¬¿à¬¶à­à¬šà¬¿à¬¤ à¬•à¬°à¬¿à¬¬à¬¾à¬•à­ à¬šà¬¾à¬¹à­à¬à¬¥à¬¿à¬²à­‡, à¬†à¬®à­‡ à¬¸à¬¹à¬¾à­Ÿà¬¤à¬¾ à¬ªà¬¾à¬‡à¬ à¬à¬ à¬¾à¬°à­‡ à¬…à¬›à­à¥¤",
    cards: [
      { title: "à¬•à­à¬²à¬¿à¬¨à¬¿à¬• à¬ à¬¿à¬•à¬£à¬¾", detail: "à¬¸à¬¿à¬Ÿà¬¿ à¬•à­à¬²à¬¿à¬¨à¬¿à¬• à¬°à­‹à¬¡à­, à¬¦à¬¬à¬¾à¬‡à¬£à­à¬¡à¬¿à¬† à¬ªà¬¾à¬–à¬°à­‡, à¬¦à­‡à¬‰à¬²à¬¸à¬¾à¬¹à¬¿, à¬­à¬žà­à¬œà¬ªà­à¬°, à¬¬à¬¾à¬°à¬¿à¬ªà¬¦à¬¾, à¬“à¬¡à¬¿à¬¶à¬¾ 757001" },
      { title: "à¬¯à­‹à¬—à¬¾à¬¯à­‹à¬— à¬¬à¬¿à¬¬à¬°à¬£à­€", detail: "+91 88955 55519 / contact@ommphysioworld.com" },
      { title: "à¬¡à¬¾à¬•à­à¬¤à¬°", detail: "à¬¡à¬¾. à¬¤à¬ªà¬¸à­à­±à¬¿à¬¨à­€ à¬¸à¬¾à¬¹à­" },
      { title: "à¬•à¬¾à¬°à­à¬¯à­à­Ÿ à¬¸à¬®à­Ÿ", detail: "à¬¸à­‹à¬®à¬¬à¬¾à¬°à¬°à­ à¬¶à¬¨à¬¿à¬¬à¬¾à¬°, à¬¸à¬•à¬¾à¬³ 9:00 à¬°à­ à¬¸à¬¨à­à¬§à­à­Ÿà¬¾ 7:00 à¬ªà¬°à­à¬¯à­à­Ÿà¬¨à­à¬¤" },
    ],
    directionsTitle: "à¬°à¬¾à¬¸à­à¬¤à¬¾ à¬¦à¬°à¬•à¬¾à¬° à¬•à¬¿?",
    directionsText: "à¬¤à­à­±à¬°à¬¿à¬¤ à¬¨à¬¾à¬­à¬¿à¬—à­‡à¬¸à¬¨ à¬ªà¬¾à¬‡à¬ à¬®à¬¾à¬ªà­ à¬¬à­à­Ÿà¬¬à¬¹à¬¾à¬° à¬•à¬°à¬¨à­à¬¤à­ à¬•à¬¿à¬®à­à¬¬à¬¾ Google Maps à¬°à­‡ à¬ à¬¿à¬•à­ à¬•à­à¬²à¬¿à¬¨à¬¿à¬• à¬…à¬žà­à¬šà¬³ à¬–à­‹à¬²à¬¨à­à¬¤à­à¥¤",
    openMaps: "Google Maps à¬°à­‡ à¬–à­‹à¬²à¬¨à­à¬¤à­",
    findUs: "à¬†à¬®à¬•à­ à¬–à­‹à¬œà¬¨à­à¬¤à­",
    mapTitle: "à¬²à¬¾à¬‡à¬­à­ à¬®à¬¾à¬ªà­ à¬¦à¬¿à¬—à¬¨à¬¿à¬°à­à¬¦à­à¬¦à­‡à¬¶ à¬¸à¬¹à¬¿à¬¤ à¬•à­à¬²à¬¿à¬¨à¬¿à¬•à¬•à­ à¬†à¬¸à¬¨à­à¬¤à­",
    iframeTitle: "à¬“à¬®à­â€Œà¬«à¬¿à¬œà¬¿à¬“ à­±à¬¾à¬°à­à¬²à­à¬¡ à¬²à­‹à¬•à­‡à¬¸à¬¨ à¬®à¬¾à¬ªà­",
  },
};

export default function ContactPage() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: "", message: "" });
  const cards = [
    { ...t.cards[0], icon: MapPin },
    { ...t.cards[1], icon: Phone },
    { ...t.cards[2], icon: Mail },
    { ...t.cards[3], icon: Clock3 },
  ];

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setFormStatus({ type: "", message: "" });

    const validationError = firstValidationError([
      !form.name.trim() ? "Please enter your name." : "",
      form.email.trim() ? validateEmailField(form.email, false) : "",
      form.phone.trim() ? validatePhoneField(form.phone, false) : "",
      !form.message.trim() ? "Please enter your message." : "",
    ]);

    if (validationError) {
      setFormStatus({
        type: "error",
        message: validationError,
      });
      return;
    }

    setSubmitting(true);

    try {
      const response = await API.post("/contact", {
        name: form.name.trim(),
        email: cleanEmail(form.email),
        phone: cleanPhone(form.phone),
        subject: form.subject.trim() || "Website Contact Message",
        message: form.message.trim(),
      });

      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
      setFormStatus({
        type: "success",
        message:
          response.data?.message ||
          "Your message has been sent to the clinic team.",
      });
    } catch (error) {
      setFormStatus({
        type: "error",
        message:
          error.response?.data?.message ||
          "Unable to send your message right now. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <Seo
        title="Contact Omm Physio World in Baripada"
        description="Contact Omm Physio World physiotherapy clinic in Baripada for appointments, directions, clinic timings, and therapy guidance."
        path="/contact"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Contact details, map, and clinic timings for the Omm Physio World physiotherapy clinic in Baripada.",
            path: "/contact",
            pageName: "Contact",
          }),
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ]}
      />
      <section className="page-section mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-8">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                {t.eyebrow}
              </p>
              <h1 className="mt-3 text-5xl font-semibold tracking-tight text-slate-950">
                {t.title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {t.text}
              </p>
            </div>

            <div className="stagger-grid grid gap-4">
              {cards.map(({ title, detail, icon: Icon }) => (
                <div
                  key={title}
                  className="motion-card rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-sky-50 p-3 text-sky-700">
                    <Icon size={20} />
                  </div>
                  <p className="text-lg font-semibold text-slate-950">{title}</p>
                  <p className="mt-2 leading-7 text-slate-600">{detail}</p>
                </div>
              ))}
            </div>

            <div className="motion-panel rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 p-6 text-white shadow-lg">
              <div className="mb-4 inline-flex rounded-2xl bg-white/10 p-3 text-white">
                <Mail size={20} />
              </div>
              <p className="text-2xl font-semibold">{t.directionsTitle}</p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                {t.directionsText}
              </p>
              <a
                href="https://maps.app.goo.gl/Ph78XSeNRtXFNKpE9"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-950 hover:bg-slate-100"
              >
                {t.openMaps}
              </a>
            </div>

            <div className="motion-card rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Social Media
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Connect with us quickly
              </h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.map(({ label, href, badge, tone }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${tone}`}
                  >
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/80 px-1.5 text-[10px] font-black tracking-wide">
                      {badge}
                    </span>
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="motion-card rounded-[36px] border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-6 inline-flex rounded-2xl bg-sky-50 p-3 text-sky-700">
                <Mail size={22} />
              </div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Send Message
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Write to Omm Physio World
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Share your query, concern, or visit requirement. This message will
                reach the OPW team directly.
              </p>

              <form onSubmit={handleContactSubmit} className="mt-7 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Full name"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="Phone number"
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Email address"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <input
                  name="subject"
                  value={form.subject}
                  onChange={handleFormChange}
                  placeholder="Subject"
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleFormChange}
                  rows={5}
                  placeholder="Write your message"
                  className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />

                {formStatus.message ? (
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      formStatus.type === "success"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-rose-200 bg-rose-50 text-rose-700"
                    }`}
                  >
                    {formStatus.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} />
                  {submitting ? "Sending..." : "Send to Clinic"}
                </button>
              </form>
            </div>

            <div className="motion-card motion-image overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-7 py-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                  {t.findUs}
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                  {t.mapTitle}
                </h2>
              </div>

              <iframe
                title={t.iframeTitle}
                src="https://www.google.com/maps?q=City%20clinic%20road%2C%20near%20davaindia%2C%20Baripada&z=16&output=embed"
                className="h-[420px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

