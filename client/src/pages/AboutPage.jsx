import { Award, HeartHandshake, ShieldCheck, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import PublicLayout from "../layout/PublicLayout";
import { useLanguage } from "../context/LanguageContext";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";

const copy = {
  en: {
    eyebrow: "About OmmPhysio World",
    title: "Recovery care that feels calm, modern, and deeply personal.",
    text: "We support patients with physiotherapy care that blends expert treatment, honest guidance, and a reassuring environment. From pain relief to rehabilitation and posture support, our goal is to help every patient move with more confidence.",
    doctor: "Doctor",
    doctorText: "Dedicated to thoughtful physiotherapy support, guided recovery, and long-term patient wellbeing.",
    cta: "Book Your Visit",
    whyChoose: "Why Patients Choose Us",
    patientCentered: "Patient-centered",
    patientCenteredText: "We explain clearly, treat thoughtfully, and keep care plans realistic.",
    metrics: [
      { label: "Years of care", value: "12+" },
      { label: "Guided plans", value: "500+" },
      { label: "Patient trust", value: "High" },
    ],
    values: [
      { title: "Compassionate Care", text: "We focus on listening carefully and creating treatment journeys that feel human, clear, and encouraging." },
      { title: "Clinical Precision", text: "Every therapy plan is shaped around patient condition, movement goals, and practical day-to-day improvement." },
      { title: "Trusted Guidance", text: "We aim to be a long-term recovery partner, not just a quick appointment provider." },
    ],
    clinicAlt: "Modern therapy clinic interior",
    supportAlt: "Patient receiving physiotherapy support",
  },
  hi: {
    eyebrow: "ओमफिजियो वर्ल्ड के बारे में",
    title: "रिकवरी केयर जो शांत, आधुनिक और व्यक्तिगत महसूस होती है।",
    text: "हम मरीजों को ऐसी फिजियोथेरेपी देखभाल देते हैं जिसमें विशेषज्ञ उपचार, ईमानदार मार्गदर्शन और भरोसेमंद वातावरण शामिल है। दर्द से राहत, पुनर्वास और पोश्चर सपोर्ट तक, हमारा लक्ष्य हर मरीज को अधिक आत्मविश्वास के साथ चलने में मदद करना है।",
    doctor: "डॉक्टर",
    doctorText: "सोच-समझकर फिजियोथेरेपी सहायता, मार्गदर्शित रिकवरी और दीर्घकालिक मरीज कल्याण के लिए समर्पित।",
    cta: "अपनी विजिट बुक करें",
    whyChoose: "मरीज हमें क्यों चुनते हैं",
    patientCentered: "मरीज-केंद्रित",
    patientCenteredText: "हम स्पष्ट समझाते हैं, सोच-समझकर उपचार करते हैं और केयर प्लान को व्यावहारिक रखते हैं।",
    metrics: [
      { label: "देखभाल के वर्ष", value: "12+" },
      { label: "मार्गदर्शित प्लान", value: "500+" },
      { label: "मरीजों का भरोसा", value: "उच्च" },
    ],
    values: [
      { title: "सहानुभूतिपूर्ण देखभाल", text: "हम ध्यान से सुनने और ऐसे उपचार मार्ग बनाने पर ध्यान देते हैं जो मानवीय, स्पष्ट और उत्साहवर्धक लगें।" },
      { title: "क्लिनिकल सटीकता", text: "हर थेरेपी प्लान मरीज की स्थिति, मूवमेंट लक्ष्य और रोजमर्रा के व्यावहारिक सुधार के अनुसार बनाया जाता है।" },
      { title: "विश्वसनीय मार्गदर्शन", text: "हम केवल एक जल्दी अपॉइंटमेंट देने वाले नहीं, बल्कि दीर्घकालिक रिकवरी साथी बनना चाहते हैं।" },
    ],
    clinicAlt: "आधुनिक थेरेपी क्लिनिक का अंदरूनी दृश्य",
    supportAlt: "फिजियोथेरेपी सहायता प्राप्त करता मरीज",
  },
  or: {
    eyebrow: "ଓମ୍‌ଫିଜିଓ ୱାର୍ଲ୍ଡ ବିଷୟରେ",
    title: "ସୁସ୍ଥତା ସେବା ଯାହା ଶାନ୍ତ, ଆଧୁନିକ ଏବଂ ନିଜସ୍ୱ ଲାଗେ।",
    text: "ଆମେ ରୋଗୀମାନଙ୍କୁ ଏମିତି ଫିଜିଓଥେରାପି ସେବା ଦେଉଛୁ ଯେଉଁଥିରେ ଦକ୍ଷ ଚିକିତ୍ସା, ସତ୍ୟନିଷ୍ଠ ମାର୍ଗଦର୍ଶନ ଓ ଭରସାଯୋଗ୍ୟ ପରିବେଶ ରହିଛି। ବେଦନାରୁ ରାହାତରୁ ଆରମ୍ଭ କରି ରିହାବ୍ ଓ ପୋଷ୍ଚର ସହାୟତା ପର୍ଯ୍ୟନ୍ତ, ଆମ ଲକ୍ଷ୍ୟ ପ୍ରତ୍ୟେକ ରୋଗୀଙ୍କୁ ଅଧିକ ଆତ୍ମବିଶ୍ୱାସ ସହ ଚଳନ କରିବାରେ ସାହାଯ୍ୟ କରିବା।",
    doctor: "ଡାକ୍ତର",
    doctorText: "ଚିନ୍ତାଶୀଳ ଫିଜିଓଥେରାପି ସହାୟତା, ମାର୍ଗଦର୍ଶିତ ସୁସ୍ଥତା ଏବଂ ଦୀର୍ଘକାଳୀନ ରୋଗୀ ସୁସ୍ଥତା ପାଇଁ ସମର୍ପିତ।",
    cta: "ଆପଣଙ୍କ ଭିଜିଟ୍ ବୁକ୍ କରନ୍ତୁ",
    whyChoose: "ରୋଗୀମାନେ ଆମକୁ କାହିଁକି ବାଛନ୍ତି",
    patientCentered: "ରୋଗୀ-କେନ୍ଦ୍ରିକ",
    patientCenteredText: "ଆମେ ସ୍ପଷ୍ଟଭାବେ ବୁଝାଉଛୁ, ଭାବିଚିନ୍ତିତ ଭାବରେ ଚିକିତ୍ସା କରୁଛୁ ଏବଂ କେର୍ ପ୍ଲାନକୁ ବ୍ୟବହାରିକ ରଖୁଛୁ।",
    metrics: [
      { label: "ସେବାର ବର୍ଷ", value: "12+" },
      { label: "ମାର୍ଗଦର୍ଶିତ ପ୍ଲାନ", value: "500+" },
      { label: "ରୋଗୀ ବିଶ୍ୱାସ", value: "ଉଚ୍ଚ" },
    ],
    values: [
      { title: "ସହାନୁଭୂତିମୂଳକ ସେବା", text: "ଆମେ ଧ୍ୟାନଦେଇ ଶୁଣିବା ଏବଂ ଏମିତି ଟ୍ରିଟମେଣ୍ଟ ଯାତ୍ରା ସୃଷ୍ଟି କରିବାରେ ଧ୍ୟାନ ଦେଉଛୁ ଯାହା ମାନବିକ, ସ୍ପଷ୍ଟ ଏବଂ ଉତ୍ସାହଦାୟକ ଲାଗେ।" },
      { title: "କ୍ଲିନିକାଲ ସଠିକତା", text: "ପ୍ରତ୍ୟେକ ଥେରାପି ପ୍ଲାନ ରୋଗୀର ଅବସ୍ଥା, ଚଳନ ଲକ୍ଷ୍ୟ ଏବଂ ଦୈନନ୍ଦିନ ବ୍ୟବହାରିକ ସୁଧାରକୁ ଧ୍ୟାନରେ ରଖି ତିଆରି ହୁଏ।" },
      { title: "ଭରସାଯୋଗ୍ୟ ମାର୍ଗଦର୍ଶନ", text: "ଆମେ କେବଳ ଦ୍ରୁତ ଅପଏନ୍ଟମେଣ୍ଟ ଦେବାକୁ ନୁହେଁ, ବରଂ ଦୀର୍ଘକାଳୀନ ସୁସ୍ଥତା ସହଭାଗୀ ହେବାକୁ ଚାହୁଁଛୁ।" },
    ],
    clinicAlt: "ଆଧୁନିକ ଥେରାପି କ୍ଲିନିକର ଭିତର ଦୃଶ୍ୟ",
    supportAlt: "ଫିଜିଓଥେରାପି ସହାୟତା ପାଉଥିବା ରୋଗୀ",
  },
};

const aboutImages = {
  clinic:
    "https://images.unsplash.com/photo-1666214280391-8ff5bd3c0bf0?auto=format&fit=crop&w=1200&q=80",
  support:
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
};

export default function AboutPage() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;
  const values = [
    { ...t.values[0], icon: HeartHandshake },
    { ...t.values[1], icon: Stethoscope },
    { ...t.values[2], icon: Award },
  ];

  return (
    <PublicLayout>
      <Seo
        title="About OmmPhysio World Physiotherapy Clinic"
        description="Learn about OmmPhysio World, a Baripada physiotherapy clinic focused on recovery care, posture support, rehabilitation, and patient-first treatment."
        path="/about"
        schema={[
          createMedicalBusinessSchema({
            description:
              "About the OmmPhysio World physiotherapy clinic, its patient-first approach, and recovery-focused care in Baripada.",
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
            <div className="motion-card rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-sm">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                {t.doctor}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                Dr. Tapaswini Sahu
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {t.doctorText}
              </p>
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
