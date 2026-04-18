import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import logoImage from "../assets/opw.png";
import whatsappIcon from "../assets/social/whatsapp.png";
import youtubeIcon from "../assets/social/youtube.png";
import xIcon from "../assets/social/x.png";
import instagramIcon from "../assets/social/instagram.png";
import facebookIcon from "../assets/social/facebook.png";
import { getPatientUser } from "../utils/patientAuth";

const followLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/people/OMM-Physio-WORLD/61568267476454",
    icon: facebookIcon,
    tone: "border-white/10 bg-white/5 hover:bg-white/10",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/omm_physio_world?igsh=MTZ2YmdpcTZyN2w0cQ==",
    icon: instagramIcon,
    tone: "border-white/10 bg-white/5 hover:bg-white/10",
  },
  {
    label: "X",
    href: "https://x.com/ommphysioworld",
    icon: xIcon,
    tone: "border-white/10 bg-white/5 hover:bg-white/10",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@Ommphysioworld",
    icon: youtubeIcon,
    tone: "border-white/10 bg-white/5 hover:bg-white/10",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/918895555519",
    icon: whatsappIcon,
    tone: "border-white/10 bg-white/5 hover:bg-white/10",
  },
];

const copy = {
  ready: "OPW Care",
  title: "Plan your next step with our physiotherapy team.",
  text:
    "Get support for pain relief, posture correction, rehabilitation, and guided recovery in Baripada.",
  cta: "Request Appointment",
  downloadApp: "Download our app",
  clinicName: "Omm Physio World",
  clinicType: "Physiotherapy Clinic",
  description:
    "Physiotherapy care for pain relief, posture correction, rehabilitation, and long-term recovery support.",
  explore: "Explore",
  contact: "Contact",
  home: "Home",
  about: "About",
  services: "Services",
  faq: "FAQ",
  career: "Career",
  followUs: "Follow us",
};

export default function PublicFooter() {
  const t = copy;
  const patientUser = getPatientUser();

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-slate-950 text-white">
      <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute right-0 top-10 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-12 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/55">
                {t.ready}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                {t.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                {t.text}
              </p>
            </div>

            {!patientUser ? (
              <Link
                to="/patient-login?redirect=/patient-dashboard"
                className="rounded-full bg-white px-6 py-3.5 text-sm font-medium text-slate-950 hover:bg-slate-100"
              >
                {t.cta}
              </Link>
            ) : null}
            <a
              href="#download-app"
              onClick={(event) => event.preventDefault()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/15 px-6 py-3.5 text-sm font-semibold text-cyan-50 hover:bg-cyan-200 hover:text-cyan-950"
              title="Download app"
            >
              <Download size={17} />
              {t.downloadApp}
            </a>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.7fr_0.7fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                <img
                  src={logoImage}
                  alt="Omm Physio World logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-lg font-semibold">{t.clinicName}</p>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  {t.clinicType}
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              {t.description}
            </p>
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {t.followUs}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {followLinks.map(({ label, href, icon, tone }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border p-1.5 transition hover:-translate-y-0.5 ${tone}`}
                    aria-label={label}
                    title={label}
                  >
                    <img
                      src={icon}
                      alt={label}
                      className="h-full w-full rounded-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              {t.explore}
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              <Link to="/" className="hover:text-white">
                {t.home}
              </Link>
              <Link to="/about" className="hover:text-white">
                {t.about}
              </Link>
              <Link to="/care" className="hover:text-white">
                {t.services}
              </Link>
              <Link to="/faq" className="hover:text-white">
                {t.faq}
              </Link>
              <Link to="/career" className="hover:text-white">
                {t.career}
              </Link>
              <Link to="/contact" className="hover:text-white">
                {t.contact}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              {t.contact}
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>City clinic road, near davaindia, Baripada</p>
              <p>+91 88955 55519</p>
              <p>contact@ommphysioworld.com</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

