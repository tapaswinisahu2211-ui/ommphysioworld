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
import { useLanguage } from "../context/LanguageContext";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";

const featuredServices = [
  {
    icon: Activity,
    image:
      "https://images.unsplash.com/photo-1516549655669-df83a0774514?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Dumbbell,
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: PersonStanding,
    image:
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Waves,
    image:
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Brain,
    image:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
  },
  {
    icon: Move,
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
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

const heroImage =
  "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80";

const copy = {
  en: {
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
  },
  hi: {
    eyebrow: "सेवाएं",
    title: "पूर्ण फिजियोथेरेपी सेवाएं, जिन्हें अधिक व्यावहारिक और मरीज-मित्र तरीके से प्रस्तुत किया गया है।",
    text: "हमारी देखभाल में दर्द से राहत, पुनर्वास, पोश्चर सुधार, ताकत की वापसी, गतिशीलता सुधार और जीवन के अलग-अलग चरणों के लिए विशेष फिजियोथेरेपी सहायता शामिल है।",
    bookAppointment: "अपॉइंटमेंट बुक करें",
    talkToClinic: "क्लिनिक से बात करें",
    heroAlt: "आधुनिक फिजियोथेरेपी कंसल्टेशन",
    featuredServices: [
      { title: "ऑर्थोपेडिक फिजियोथेरेपी", text: "जोड़ों के दर्द, फ्रैक्चर, जकड़न, लिगामेंट समस्याओं और मस्कुलोस्केलेटल रिकवरी के लिए देखभाल।" },
      { title: "स्पोर्ट्स रिहैबिलिटेशन", text: "चोट से उबरने, स्ट्रेंथ, मोबिलिटी और खेल में वापसी के लिए प्रदर्शन-केंद्रित थेरेपी।" },
      { title: "पोश्चर और स्पाइन केयर", text: "गर्दन दर्द, पीठ दर्द, पोश्चर सुधार और वर्कस्टेशन से जुड़ी परेशानी के लिए सहायता।" },
      { title: "दर्द राहत थेरेपी", text: "दर्द कम करने और रोजमर्रा की गतिविधि बेहतर करने के लिए हैंड्स-ऑन और एक्सरसाइज आधारित थेरेपी।" },
      { title: "न्यूरोलॉजिकल फिजियोथेरेपी", text: "न्यूरोलॉजिकल रिकवरी के लिए संतुलन, कोऑर्डिनेशन, चाल और कार्यात्मक सहायता।" },
      { title: "मैनुअल थेरेपी", text: "जोड़ों और सॉफ्ट टिशू की हैंड्स-ऑन तकनीकें, जो जकड़न कम करें, रेंज सुधारें और तनाव घटाएं।" },
    ],
    completeCare: "समग्र देखभाल",
    completeCareTitle: "दर्द, रीहैब, मूवमेंट और दीर्घकालिक कार्यक्षमता के लिए व्यापक फिजियोथेरेपी सहायता",
    completeCareText: "हमारा क्लिनिक ऑर्थोपेडिक, न्यूरोलॉजिकल, स्पोर्ट्स, पीडियाट्रिक, जेरियाट्रिक, पोस्ट-सर्जिकल, स्पाइनल, पोश्चर, संतुलन, दर्द-राहत और कार्यात्मक पुनर्वास जैसी जरूरतों में सहायता दे सकता है। हर प्लान मरीज की स्थिति, आराम और रिकवरी लक्ष्य के अनुसार समायोजित किया जाता है।",
    groups: ["रीहैबिलिटेशन और रिकवरी", "विशेष फिजियोथेरेपी", "सहायक उपचार विकल्प"],
  },
  or: {
    eyebrow: "ସେବା",
    title: "ସମ୍ପୂର୍ଣ୍ଣ ଫିଜିଓଥେରାପି ସେବା, ଯାହାକୁ ଅଧିକ ବ୍ୟବହାରିକ ଏବଂ ରୋଗୀ-ମିତ୍ର ଭାବରେ ପ୍ରଦର୍ଶିତ କରାଯାଇଛି।",
    text: "ଆମ ସେବାରେ ବେଦନାରୁ ରାହାତ, ରିହାବ୍, ପୋଷ୍ଚର ସୁଧାର, ଶକ୍ତି ପୁନରୁଦ୍ଧାର, ଗତିଶୀଳତା ସୁଧାର ଏବଂ ଜୀବନର ବିଭିନ୍ନ ପର୍ଯ୍ୟାୟ ପାଇଁ ବିଶେଷ ଫିଜିଓଥେରାପି ସହାୟତା ରହିଛି।",
    bookAppointment: "ଅପଏନ୍ଟମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ",
    talkToClinic: "କ୍ଲିନିକ ସହ କଥାହୁଅନ୍ତୁ",
    heroAlt: "ଆଧୁନିକ ଫିଜିଓଥେରାପି କନସଲ୍ଟେସନ",
    featuredServices: [
      { title: "ଅର୍ଥୋପେଡିକ୍ ଫିଜିଓଥେରାପି", text: "ଯୋଡ଼ ବେଦନା, ଫ୍ରାକ୍ଚର, ଜଡା, ଲିଗାମେଣ୍ଟ ସମସ୍ୟା ଏବଂ ମସ୍କୁଲୋସ୍କେଲେଟାଲ ସୁସ୍ଥତା ପାଇଁ ସେବା।" },
      { title: "ସ୍ପୋର୍ଟସ୍ ରିହାବିଲିଟେସନ୍", text: "ଆଘାତ ପରେ ସୁସ୍ଥତା, ଶକ୍ତି, ଗତିଶୀଳତା ଓ ଖେଳକୁ ଫେରିବା ପାଇଁ ପରଫର୍ମାନ୍ସ-କେନ୍ଦ୍ରିକ ଥେରାପି।" },
      { title: "ପୋଷ୍ଚର ଓ ସ୍ପାଇନ୍ ସେବା", text: "ଗର୍ଦ୍ଧନ ବେଦନା, ପିଠି ବେଦନା, ପୋଷ୍ଚର ସୁଧାର ଏବଂ ୱର୍କଷ୍ଟେସନ ସମ୍ବନ୍ଧିତ ଚାପ ପାଇଁ ସହାୟତା।" },
      { title: "ବେଦନାରୁ ରାହାତ ଥେରାପି", text: "ବେଦନା କମେଇବା ଏବଂ ଦୈନନ୍ଦିନ ଚଳନ ଗୁଣତ୍ୱ ସୁଧାର ପାଇଁ ହ୍ୟାଣ୍ଡସ୍-ଅନ୍ ଏବଂ ଅଭ୍ୟାସ ଆଧାରିତ ଥେରାପି।" },
      { title: "ନ୍ୟୁରୋଲଜିକାଲ ଫିଜିଓଥେରାପି", text: "ନ୍ୟୁରୋଲଜିକାଲ ସୁସ୍ଥତା ପାଇଁ ସନ୍ତୁଳନ, ସମନ୍ୱୟ, ଚାଲଚଲନ ଏବଂ କାର୍ଯ୍ୟକାରୀ ସହାୟତା।" },
      { title: "ମାନୁଆଲ ଥେରାପି", text: "ଯୋଡ଼ ଓ ସଫ୍ଟ ଟିଶୁ ପାଇଁ ହ୍ୟାଣ୍ଡସ୍-ଅନ୍ ପ୍ରଯୁକ୍ତି, ଯାହା ଜଡା କମାଏ, ରେଞ୍ଜ ସୁଧାରେ ଏବଂ ଟେନସନ କମାଏ।" },
    ],
    completeCare: "ସମ୍ପୂର୍ଣ୍ଣ ସେବା",
    completeCareTitle: "ବେଦନା, ରିହାବ୍, ଚଳନ ଏବଂ ଦୀର୍ଘକାଳୀନ କାର୍ଯ୍ୟକୁଶଳତା ପାଇଁ ବିସ୍ତୃତ ଫିଜିଓଥେରାପି ସହାୟତା",
    completeCareText: "ଆମ କ୍ଲିନିକ ଅର୍ଥୋପେଡିକ୍, ନ୍ୟୁରୋଲଜିକାଲ, ସ୍ପୋର୍ଟସ୍, ପିଡିଆଟ୍ରିକ୍, ଜେରିଆଟ୍ରିକ୍, ପୋଷ୍ଟ-ସର୍ଜିକାଲ, ସ୍ପାଇନାଲ, ପୋଷ୍ଚର, ସନ୍ତୁଳନ, ବେଦନାରୁ ରାହାତ ଏବଂ କାର୍ଯ୍ୟକାରୀ ରିହାବିଲିଟେସନ ଆବଶ୍ୟକତାରେ ସହାୟତା କରିପାରେ। ପ୍ରତ୍ୟେକ ପ୍ଲାନ୍ ରୋଗୀଙ୍କ ଅବସ୍ଥା, ସୁବିଧା ଏବଂ ସୁସ୍ଥତା ଲକ୍ଷ୍ୟ ଅନୁଯାୟୀ ସମଯୋଜନ କରାଯାଏ।",
    groups: ["ରିହାବିଲିଟେସନ ଓ ସୁସ୍ଥତା", "ବିଶେଷ ଫିଜିଓଥେରାପି", "ସହାୟକ ଚିକିତ୍ସା ବିକଳ୍ପ"],
  },
};

export default function PublicServicesPage() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;
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
        description="Explore physiotherapy services at OmmPhysio World including pain management, sports rehabilitation, posture correction, manual therapy, and mobility care."
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
