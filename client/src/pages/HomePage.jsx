import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  MapPin,
  MoveRight,
  Phone,
  ShieldPlus,
  Sparkles,
  Star,
  Stethoscope,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PublicLayout from "../layout/PublicLayout";
import Seo from "../components/Seo";
import { useLanguage } from "../context/LanguageContext";
import { createBreadcrumbSchema, createMedicalBusinessSchema } from "../utils/seo";
import API from "../services/api";

const slides = [
  {
    accent: "from-sky-500/25 via-cyan-400/10 to-transparent",
    metric: "98%",
  },
  {
    accent: "from-sky-500/25 via-cyan-400/10 to-transparent",
    metric: "500+",
  },
  {
    accent: "from-violet-500/20 via-blue-400/10 to-transparent",
    metric: "12+",
  },
];

const pageCopy = {
  en: {
    badge: "Modern physiotherapy care for everyday movement",
    quickFacts: ["Dr. Tapaswini Sahu", "Baripada, Odisha", "Same-week appointments"],
    slides: [
      {
        eyebrow: "Advanced Physiotherapy Care",
        title: "Relief that starts with the right movement plan.",
        text:
          "Personalized recovery programs for pain management, posture correction, and confident daily mobility.",
        metricLabel: "Patients report better comfort after guided sessions",
      },
      {
        eyebrow: "Recovery After Injury",
        title: "Structured rehab designed for strength, balance, and return to routine.",
        text:
          "From muscle strain to post-injury recovery, we create therapy journeys that feel steady and practical.",
        metricLabel: "Recovery plans guided with focused patient support",
      },
      {
        eyebrow: "Posture And Spine Support",
        title: "Modern care for back pain, neck stiffness, and work-from-desk strain.",
        text:
          "Hands-on treatment and movement correction to help you move better for longer.",
        metricLabel: "Years of clinic trust and physiotherapy guidance",
      },
    ],
    services: [
      {
        title: "Pain Management",
        text:
          "Targeted treatment plans for back pain, neck stiffness, joint issues, and recurring discomfort.",
      },
      {
        title: "Post Injury Rehab",
        text:
          "Structured recovery programs to restore mobility, strength, and confidence after injury.",
      },
      {
        title: "Posture Correction",
        text:
          "Modern physiotherapy support for office posture, muscle imbalance, and movement quality.",
      },
    ],
    highlights: ["Patient-first care", "Evidence-based plans", "Comfortable recovery journey"],
    exploreServices: "Explore Services",
    doctorOnDuty: "Doctor On Duty",
    doctorText:
      "Calm, patient-first physiotherapy care with a focus on recovery, posture, and everyday movement.",
    fastAccess: "Fast Access",
    sameWeekBooking: "Same-week booking",
    simpleRequests: "Simple consultation requests",
    trustSignal: "Trust Signal",
    patientFocusedClinic: "Patient-focused clinic",
    trustText: "Guided care plans with a modern recovery approach",
    featuredBanner: "Featured Banner",
    bannerTitle: "OmmPhysio World patient recovery experience",
    sameWeek: "Same Week",
    sameWeekText: "Appointment availability for new consultations",
    guidedCare: "Guided Care",
    guidedCareText: "Clear treatment plans for pain, mobility, and posture",
    bannerSlides: "Banner Slides",
    featuredCareHighlights: "Featured care highlights",
    clinicFocus: "Clinic Focus",
    clinicFocusText: "Pain relief, rehab, posture, and mobility",
    whyFeelsBetter: "Why It Feels Better",
    whyFeelsBetterText: "A clinic experience built around clarity, comfort, and guided recovery",
    reachUs: "Reach Us",
    servicesTitle: "What We Do",
    servicesHeading: "Care designed around movement and recovery",
    viewAllServices: "View all services",
    recoveryEnvironment: "Recovery Environment",
    recoveryEnvironmentTitle: "A more reassuring clinic experience from first visit to follow-up.",
    recoveryEnvironmentText:
      "Good physiotherapy care is not only about treatment. It is also about clear guidance, patient comfort, and a recovery plan that feels manageable in everyday life.",
    leadDoctor: "Lead Doctor",
    leadDoctorText:
      "Guiding patient-focused physiotherapy care with a calm and modern recovery approach.",
    quickBooking: "Quick Booking",
    quickBookingTitle: "Need an appointment this week?",
    quickBookingText:
      "Share your details and preferred visit time. We will help you find the right therapy session quickly.",
    startBooking: "Start booking",
    heroAlt: "Physiotherapy consultation",
    therapyAlt: "Patient receiving guided physiotherapy treatment",
  },
  hi: {
    badge: "हर रोज़ की सहज गतिविधि के लिए आधुनिक फिजियोथेरेपी देखभाल",
    quickFacts: ["डॉ. तपस्विनी साहू", "बारिपदा, ओडिशा", "उसी सप्ताह अपॉइंटमेंट"],
    slides: [
      {
        eyebrow: "उन्नत फिजियोथेरेपी केयर",
        title: "राहत सही मूवमेंट प्लान से शुरू होती है।",
        text:
          "दर्द प्रबंधन, पोश्चर सुधार और आत्मविश्वास से भरी दैनिक गतिविधि के लिए व्यक्तिगत रिकवरी प्रोग्राम।",
        metricLabel: "मार्गदर्शित सेशंस के बाद मरीजों ने बेहतर आराम महसूस किया",
      },
      {
        eyebrow: "चोट के बाद रिकवरी",
        title: "ताकत, संतुलन और दिनचर्या में वापसी के लिए सुव्यवस्थित रीहैब।",
        text:
          "मांसपेशियों में खिंचाव से लेकर पोस्ट-इंजरी रिकवरी तक, हम ऐसे थेरेपी प्लान बनाते हैं जो स्थिर और व्यावहारिक लगते हैं।",
        metricLabel: "केंद्रित रोगी सहयोग के साथ मार्गदर्शित रिकवरी प्लान",
      },
      {
        eyebrow: "पोश्चर और स्पाइन सपोर्ट",
        title: "पीठ दर्द, गर्दन जकड़न और डेस्क वर्क स्ट्रेन के लिए आधुनिक देखभाल।",
        text:
          "हैंड्स-ऑन ट्रीटमेंट और मूवमेंट करेक्शन ताकि आप लंबे समय तक बेहतर चल सकें।",
        metricLabel: "क्लिनिक विश्वास और फिजियोथेरेपी मार्गदर्शन के वर्ष",
      },
    ],
    services: [
      { title: "दर्द प्रबंधन", text: "पीठ दर्द, गर्दन जकड़न, जोड़ों की समस्या और बार-बार होने वाली असुविधा के लिए लक्षित ट्रीटमेंट प्लान।" },
      { title: "चोट के बाद रीहैब", text: "चोट के बाद गतिशीलता, ताकत और आत्मविश्वास लौटाने के लिए सुव्यवस्थित रिकवरी प्रोग्राम।" },
      { title: "पोश्चर सुधार", text: "ऑफिस पोश्चर, मसल इम्बैलेंस और मूवमेंट क्वालिटी के लिए आधुनिक फिजियोथेरेपी सहायता।" },
    ],
    highlights: ["मरीज-प्रथम देखभाल", "प्रमाण-आधारित प्लान", "सुविधाजनक रिकवरी यात्रा"],
    exploreServices: "सेवाएं देखें",
    doctorOnDuty: "उपस्थित डॉक्टर",
    doctorText: "शांत, मरीज-केंद्रित फिजियोथेरेपी देखभाल, जिसमें रिकवरी, पोश्चर और रोज़मर्रा की गतिविधि पर ध्यान है।",
    fastAccess: "तेज़ पहुंच",
    sameWeekBooking: "उसी सप्ताह बुकिंग",
    simpleRequests: "सरल कंसल्टेशन अनुरोध",
    trustSignal: "विश्वास संकेत",
    patientFocusedClinic: "मरीज-केंद्रित क्लिनिक",
    trustText: "आधुनिक रिकवरी दृष्टिकोण के साथ मार्गदर्शित केयर प्लान",
    featuredBanner: "मुख्य बैनर",
    bannerTitle: "ओमफिजियो वर्ल्ड मरीज रिकवरी अनुभव",
    sameWeek: "उसी सप्ताह",
    sameWeekText: "नई कंसल्टेशन के लिए अपॉइंटमेंट उपलब्धता",
    guidedCare: "मार्गदर्शित देखभाल",
    guidedCareText: "दर्द, गतिशीलता और पोश्चर के लिए स्पष्ट ट्रीटमेंट प्लान",
    bannerSlides: "बैनर स्लाइड्स",
    featuredCareHighlights: "मुख्य केयर हाइलाइट्स",
    clinicFocus: "क्लिनिक फोकस",
    clinicFocusText: "दर्द से राहत, रीहैब, पोश्चर और गतिशीलता",
    whyFeelsBetter: "यह बेहतर क्यों लगता है",
    whyFeelsBetterText: "स्पष्टता, आराम और मार्गदर्शित रिकवरी पर आधारित क्लिनिक अनुभव",
    reachUs: "हम तक पहुंचें",
    servicesTitle: "हम क्या करते हैं",
    servicesHeading: "गतिशीलता और रिकवरी के अनुसार बनाई गई देखभाल",
    viewAllServices: "सभी सेवाएं देखें",
    recoveryEnvironment: "रिकवरी वातावरण",
    recoveryEnvironmentTitle: "पहली विजिट से फॉलो-अप तक एक अधिक भरोसेमंद क्लिनिक अनुभव।",
    recoveryEnvironmentText: "अच्छी फिजियोथेरेपी केवल उपचार नहीं है। यह स्पष्ट मार्गदर्शन, मरीज का आराम और ऐसा रिकवरी प्लान भी है जो रोजमर्रा के जीवन में संभालने योग्य लगे।",
    leadDoctor: "मुख्य डॉक्टर",
    leadDoctorText: "शांत और आधुनिक रिकवरी दृष्टिकोण के साथ मरीज-केंद्रित फिजियोथेरेपी देखभाल का मार्गदर्शन।",
    quickBooking: "त्वरित बुकिंग",
    quickBookingTitle: "क्या इस सप्ताह अपॉइंटमेंट चाहिए?",
    quickBookingText: "अपनी जानकारी और पसंदीदा समय साझा करें। हम आपके लिए सही थेरेपी सेशन जल्दी तय करने में मदद करेंगे।",
    startBooking: "बुकिंग शुरू करें",
    heroAlt: "फिजियोथेरेपी कंसल्टेशन",
    therapyAlt: "मार्गदर्शित फिजियोथेरेपी उपचार लेता मरीज",
  },
  or: {
    badge: "ଦୈନନ୍ଦିନ ଚଳନ ପାଇଁ ଆଧୁନିକ ଫିଜିଓଥେରାପି ସେବା",
    quickFacts: ["ଡା. ତପସ୍ୱିନୀ ସାହୁ", "ବାରିପଦା, ଓଡିଶା", "ସେହି ସପ୍ତାହରେ ଅପଏନ୍ଟମେଣ୍ଟ"],
    slides: [
      {
        eyebrow: "ଉନ୍ନତ ଫିଜିଓଥେରାପି ସେବା",
        title: "ଠିକ୍ ମୁଭମେଣ୍ଟ ପ୍ଲାନ ସହିତ ରାହାତ ଆରମ୍ଭ ହୁଏ।",
        text:
          "ବେଦନା ପରିଚାଳନା, ପୋଷ୍ଚର ସୁଧାର ଏବଂ ଆତ୍ମବିଶ୍ୱାସୀ ଦୈନନ୍ଦିନ ଚଳନ ପାଇଁ ବ୍ୟକ୍ତିଗତ ରିକଭରି ପ୍ରୋଗ୍ରାମ।",
        metricLabel: "ମାର୍ଗଦର୍ଶିତ ସେସନ ପରେ ରୋଗୀମାନେ ଅଧିକ ସୁବିଧା ଅନୁଭବ କରିଛନ୍ତି",
      },
      {
        eyebrow: "ଆଘାତ ପରେ ସୁସ୍ଥତା",
        title: "ଶକ୍ତି, ସନ୍ତୁଳନ ଏବଂ ଦୈନନ୍ଦିନ ଚଳନକୁ ଫେରିବା ପାଇଁ ସୁଠାମ ରିହାବ୍।",
        text:
          "ମାଂସପେଶୀ ଟାଣ ଠାରୁ ଆଘାତ ପରବର୍ତ୍ତୀ ସୁସ୍ଥତା ପର୍ଯ୍ୟନ୍ତ, ଆମେ ଏମିତି ଥେରାପି ପ୍ଲାନ ତିଆରି କରୁ ଯାହା ସ୍ଥିର ଏବଂ ବ୍ୟବହାରିକ ଲାଗେ।",
        metricLabel: "ନିର୍ଦ୍ଦିଷ୍ଟ ରୋଗୀ ସହଯୋଗ ସହ ମାର୍ଗଦର୍ଶିତ ସୁସ୍ଥତା ପ୍ଲାନ",
      },
      {
        eyebrow: "ପୋଷ୍ଚର ଓ ମେରୁଦଣ୍ଡ ସହାୟତା",
        title: "ପିଠି ବେଦନା, ଗର୍ଦ୍ଧନ ଜଡା ଏବଂ ଡେସ୍କ କାମର ଚାପ ପାଇଁ ଆଧୁନିକ ସେବା।",
        text:
          "ହ୍ୟାଣ୍ଡସ୍-ଅନ୍ ଟ୍ରିଟମେଣ୍ଟ ଓ ମୁଭମେଣ୍ଟ ସୁଧାର, ଯାହା ଆପଣଙ୍କୁ ଦୀର୍ଘ ସମୟ ଭଲ ଚଳନରେ ସାହାଯ୍ୟ କରେ।",
        metricLabel: "କ୍ଲିନିକ ବିଶ୍ୱାସ ଓ ଫିଜିଓଥେରାପି ମାର୍ଗଦର୍ଶନର ବର୍ଷ",
      },
    ],
    services: [
      { title: "ବେଦନା ପରିଚାଳନା", text: "ପିଠି ବେଦନା, ଗର୍ଦ୍ଧନ ଜଡା, ଯୋଡ଼ ସମସ୍ୟା ଏବଂ ପୁନରାବୃତ୍ତ ଅସୁବିଧା ପାଇଁ ଲକ୍ଷ୍ୟଭିତ୍ତିକ ଟ୍ରିଟମେଣ୍ଟ ପ୍ଲାନ।" },
      { title: "ଆଘାତ ପରେ ରିହାବ୍", text: "ଆଘାତ ପରେ ଗତି, ଶକ୍ତି ଏବଂ ଆତ୍ମବିଶ୍ୱାସ ଫେରାଇବା ପାଇଁ ସୁଠାମ ରିକଭରି ପ୍ରୋଗ୍ରାମ।" },
      { title: "ପୋଷ୍ଚର ସୁଧାର", text: "ଅଫିସ ପୋଷ୍ଚର, ମାଂସପେଶୀ ଅସମନ୍ୱୟ ଓ ମୁଭମେଣ୍ଟ ଗୁଣତ୍ୱ ପାଇଁ ଆଧୁନିକ ଫିଜିଓଥେରାପି ସହାୟତା।" },
    ],
    highlights: ["ରୋଗୀ-ପ୍ରଥମ ସେବା", "ପ୍ରମାଣ-ଭିତ୍ତିକ ପ୍ଲାନ", "ସୁବିଧାଜନକ ସୁସ୍ଥତା ଯାତ୍ରା"],
    exploreServices: "ସେବା ଦେଖନ୍ତୁ",
    doctorOnDuty: "ଡ୍ୟୁଟିରେ ଡାକ୍ତର",
    doctorText: "ଶାନ୍ତ, ରୋଗୀ-କେନ୍ଦ୍ରିକ ଫିଜିଓଥେରାପି ସେବା, ଯେଉଁଥିରେ ସୁସ୍ଥତା, ପୋଷ୍ଚର ଓ ଦୈନନ୍ଦିନ ଚଳନକୁ ଗୁରୁତ୍ୱ ଦିଆଯାଇଛି।",
    fastAccess: "ତୁରନ୍ତ ପହଞ୍ଚ",
    sameWeekBooking: "ସେହି ସପ୍ତାହରେ ବୁକିଂ",
    simpleRequests: "ସହଜ କନସଲ୍ଟେସନ ଅନୁରୋଧ",
    trustSignal: "ବିଶ୍ୱାସ ସଙ୍କେତ",
    patientFocusedClinic: "ରୋଗୀ-କେନ୍ଦ୍ରିକ କ୍ଲିନିକ",
    trustText: "ଆଧୁନିକ ସୁସ୍ଥତା ଦୃଷ୍ଟିକୋଣ ସହିତ ମାର୍ଗଦର୍ଶିତ କେର୍ ପ୍ଲାନ",
    featuredBanner: "ଫିଚର୍ଡ ବ୍ୟାନର୍",
    bannerTitle: "ଓମ୍‌ଫିଜିଓ ୱାର୍ଲ୍ଡ ରୋଗୀ ସୁସ୍ଥତା ଅନୁଭବ",
    sameWeek: "ସେହି ସପ୍ତାହ",
    sameWeekText: "ନୂତନ କନସଲ୍ଟେସନ ପାଇଁ ଅପଏନ୍ଟମେଣ୍ଟ ଉପଲବ୍ଧତା",
    guidedCare: "ମାର୍ଗଦର୍ଶିତ ସେବା",
    guidedCareText: "ବେଦନା, ଗତିଶୀଳତା ଓ ପୋଷ୍ଚର ପାଇଁ ସ୍ପଷ୍ଟ ଟ୍ରିଟମେଣ୍ଟ ପ୍ଲାନ",
    bannerSlides: "ବ୍ୟାନର୍ ସ୍ଲାଇଡ୍",
    featuredCareHighlights: "ମୁଖ୍ୟ ସେବା ହାଇଲାଇଟ୍",
    clinicFocus: "କ୍ଲିନିକ ଫୋକସ୍",
    clinicFocusText: "ବେଦନାରୁ ରାହାତ, ରିହାବ୍, ପୋଷ୍ଚର ଓ ଗତିଶୀଳତା",
    whyFeelsBetter: "ଏହା କାହିଁକି ଭଲ ଲାଗେ",
    whyFeelsBetterText: "ସ୍ପଷ୍ଟତା, ସୁବିଧା ଓ ମାର୍ଗଦର୍ଶିତ ସୁସ୍ଥତାକୁ ଆଧାର କରିଥିବା କ୍ଲିନିକ ଅନୁଭବ",
    reachUs: "ଆମ ସହିତ ଯୋଗାଯୋଗ",
    servicesTitle: "ଆମେ କ'ଣ କରୁ",
    servicesHeading: "ଚଳନ ଓ ସୁସ୍ଥତାକୁ ଧ୍ୟାନରେ ରଖି ତିଆରି ସେବା",
    viewAllServices: "ସମସ୍ତ ସେବା ଦେଖନ୍ତୁ",
    recoveryEnvironment: "ସୁସ୍ଥତା ପରିବେଶ",
    recoveryEnvironmentTitle: "ପ୍ରଥମ ଭିଜିଟ୍ ଠାରୁ ଫଲୋ-ଅପ୍ ପର୍ଯ୍ୟନ୍ତ ଅଧିକ ଭରସାଯୋଗ୍ୟ କ୍ଲିନିକ ଅନୁଭବ।",
    recoveryEnvironmentText: "ଭଲ ଫିଜିଓଥେରାପି କେବଳ ଚିକିତ୍ସା ନୁହେଁ। ଏହା ସ୍ପଷ୍ଟ ମାର୍ଗଦର୍ଶନ, ରୋଗୀର ସୁବିଧା ଓ ଦୈନନ୍ଦିନ ଜୀବନରେ ସହଜରେ ଅନୁସରଣ କରିପାରିବା ଏକ ସୁସ୍ଥତା ପ୍ଲାନ ମଧ୍ୟ।",
    leadDoctor: "ମୁଖ୍ୟ ଡାକ୍ତର",
    leadDoctorText: "ଶାନ୍ତ ଏବଂ ଆଧୁନିକ ସୁସ୍ଥତା ଦୃଷ୍ଟିକୋଣ ସହ ରୋଗୀ-କେନ୍ଦ୍ରିକ ଫିଜିଓଥେରାପି ସେବାର ନେତୃତ୍ୱ।",
    quickBooking: "ତ୍ୱରିତ ବୁକିଂ",
    quickBookingTitle: "ଏହି ସପ୍ତାହରେ ଅପଏନ୍ଟମେଣ୍ଟ ଦରକାର କି?",
    quickBookingText: "ଆପଣଙ୍କ ବିବରଣୀ ଓ ପସନ୍ଦର ସମୟ ଶେୟାର କରନ୍ତୁ। ଆମେ ଶୀଘ୍ର ଠିକ୍ ଥେରାପି ସେସନ ବ୍ୟବସ୍ଥା କରିଦେବୁ।",
    startBooking: "ବୁକିଂ ଆରମ୍ଭ କରନ୍ତୁ",
    heroAlt: "ଫିଜିଓଥେରାପି କନସଲ୍ଟେସନ",
    therapyAlt: "ମାର୍ଗଦର୍ଶିତ ଫିଜିଓଥେରାପି ଚିକିତ୍ସା ନେଉଥିବା ରୋଗୀ",
  },
};

const siteImages = {
  hero:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  therapy:
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80",
};

const testimonials = [
  {
    name: "Priya S.",
    result: "Back pain relief",
    feedback:
      "The treatment plan felt clear from the first visit. My back pain reduced steadily and I felt much more confident moving again.",
  },
  {
    name: "Rahul K.",
    result: "Sports recovery",
    feedback:
      "I came in after an injury and got practical rehab guidance that actually fit my routine. The follow-up support was very reassuring.",
  },
  {
    name: "Anita D.",
    result: "Posture improvement",
    feedback:
      "I liked how calmly everything was explained. The exercises were simple to follow and my neck and posture discomfort improved a lot.",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    comment: "",
    stars: 5,
  });
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState({ type: "", message: "" });
  const { language } = useLanguage();
  const t = pageCopy[language] || pageCopy.en;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadFeedback = async () => {
      try {
        const response = await API.get("/public-feedback");
        setFeedbackList(response.data);
      } catch (error) {
        console.error("Failed to load feedback:", error);
      }
    };

    loadFeedback();
  }, []);

  const activeSlide = {
    ...slides[currentSlide],
    ...t.slides[currentSlide],
  };

  const highlights = [
    { label: t.highlights[0], icon: HeartPulse },
    { label: t.highlights[1], icon: ShieldPlus },
    { label: t.highlights[2], icon: BadgeCheck },
  ];
  const feedbackEyebrow =
    t.feedbackEyebrow || "Patient Feedback";
  const feedbackTitle =
    t.feedbackTitle || "What patients say after their recovery journey starts";
  const feedbackText =
    t.feedbackText ||
    "Kind words from patients who trusted OmmPhysio World for pain relief, posture support, and guided rehabilitation.";
  const visibleFeedback = feedbackList.slice(0, 3);
  const testimonialsToShow = visibleFeedback.length
    ? visibleFeedback.map((item) => ({
        name: item.name,
        result: `${item.stars} star rating`,
        feedback: item.comment,
      }))
    : testimonials;

  const submitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackStatus({ type: "", message: "" });

    try {
      const response = await API.post("/feedback", feedbackForm);
      setFeedbackStatus({
        type: "success",
        message: response.data.message || "Feedback submitted successfully.",
      });
      setFeedbackForm({
        name: "",
        email: "",
        comment: "",
        stars: 5,
      });
    } catch (error) {
      setFeedbackStatus({
        type: "error",
        message: error.response?.data?.message || "Failed to submit feedback.",
      });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <PublicLayout>
      <Seo
        title="Physiotherapy Clinic in Baripada for Pain Relief and Recovery"
        description="Visit OmmPhysio World in Baripada for physiotherapy care, pain relief, posture correction, rehabilitation, and guided recovery plans."
        path="/"
        schema={[
          createMedicalBusinessSchema({
            description:
              "Physiotherapy clinic in Baripada for pain relief, posture correction, rehabilitation, and recovery support.",
            path: "/",
            pageName: "Home",
          }),
          createBreadcrumbSchema([{ name: "Home", path: "/" }]),
        ]}
      />
      <section className="page-section relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.2),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.2),transparent_28%)]" />
        <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl animate-aurora drift-slow" />
        <div className="pointer-events-none absolute right-0 top-32 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl animate-aurora" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 xl:grid-cols-[1fr_1fr] xl:items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-sm text-blue-700 shadow-sm backdrop-blur">
                <Sparkles size={16} />
                {t.badge}
              </div>

              <div className="flex flex-wrap gap-3">
                {t.quickFacts.map((fact) => (
                  <div
                    key={fact}
                    className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur"
                  >
                    {fact}
                  </div>
                ))}
              </div>

              <div className="min-h-[265px] space-y-5">
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">
                  {activeSlide.eyebrow}
                </p>
                <h1
                  key={activeSlide.title}
                  className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 animate-fadeIn"
                >
                  {activeSlide.title}
                </h1>
                <p
                  key={activeSlide.text}
                  className="max-w-2xl text-lg leading-8 text-slate-600 animate-fadeIn"
                >
                  {activeSlide.text}
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/patient-login?redirect=/patient-dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3.5 font-medium text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
                >
                  {language === "en"
                    ? "Book Appointment"
                    : language === "hi"
                      ? "अपॉइंटमेंट बुक करें"
                      : "ଅପଏନ୍ଟମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ"}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  to="/care"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  {t.exploreServices}
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                <div className="motion-card rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                        {t.doctorOnDuty}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        Dr. Tapaswini Sahu
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {t.doctorText}
                      </p>
                    </div>
                    <div className="inline-flex rounded-2xl bg-sky-50 p-3 text-sky-700">
                      <Stethoscope size={20} />
                    </div>
                  </div>
                </div>

                <div className="motion-card rounded-[28px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                        <Phone size={16} />
                      </div>
                      +91 88955 55519
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-600">
                      <div className="inline-flex rounded-xl bg-slate-100 p-2 text-slate-700">
                        <MapPin size={16} />
                      </div>
                      <span>
                        City clinic road, near davaindia, Baripada
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="stagger-grid grid gap-4 sm:grid-cols-3">
                {highlights.map(({ label, icon: Icon }, index) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur animate-slide-up"
                    style={{ animationDelay: `${index * 120}ms` }}
                  >
                    <div className="mb-4 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <Icon size={20} />
                    </div>
                    <p className="font-medium text-slate-900">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-0 xl:px-4 animate-slide-up-delayed">
              <div className="mb-5 hidden grid-cols-2 gap-4 xl:grid">
                <div className="rounded-[24px] border border-white/60 bg-white/90 p-4 shadow-xl backdrop-blur animate-float-soft">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {t.fastAccess}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {t.sameWeekBooking}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t.simpleRequests}
                  </p>
                </div>

                <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-xl backdrop-blur animate-float-soft-delayed">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {t.trustSignal}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {t.patientFocusedClinic}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {t.trustText}
                  </p>
                </div>
              </div>

              <div className="motion-panel relative overflow-hidden rounded-[36px] border border-white/50 bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-900 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]">
                <div className={`absolute inset-0 bg-gradient-to-br ${activeSlide.accent}`} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%)]" />

                <div className="relative z-10">
                  <div className="mb-10 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                        {t.featuredBanner}
                      </p>
                      <p className="mt-3 max-w-xs text-3xl font-semibold leading-tight">
                        {t.bannerTitle}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="rounded-full border border-white/15 bg-white/10 p-2 text-white/85 backdrop-blur hover:bg-white/20"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="rounded-full border border-white/15 bg-white/10 p-2 text-white/85 backdrop-blur hover:bg-white/20"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="motion-image overflow-hidden rounded-[28px] border border-white/10 bg-white/10">
                      <img
                        src={siteImages.hero}
                        alt={t.heroAlt}
                        className="h-56 w-full object-cover"
                      />
                    </div>

                    <div className="rounded-[28px] bg-white/10 p-6 backdrop-blur-md animate-fadeIn">
                      <p className="text-5xl font-semibold">{activeSlide.metric}</p>
                      <p className="mt-3 max-w-sm text-sm leading-6 text-white/75">
                        {activeSlide.metricLabel}
                      </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-md animate-float-soft">
                        <p className="text-3xl font-semibold">{t.sameWeek}</p>
                        <p className="mt-2 text-sm text-white/75">
                          {t.sameWeekText}
                        </p>
                      </div>
                      <div className="rounded-3xl bg-white/10 p-5 backdrop-blur-md animate-float-soft-delayed">
                        <p className="text-3xl font-semibold">{t.guidedCare}</p>
                        <p className="mt-2 text-sm text-white/75">
                          {t.guidedCareText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="motion-card mt-5 flex items-center justify-between rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm text-slate-500">Banner Slides</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">
                    {t.featuredCareHighlights}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {t.slides.map((slide, index) => (
                    <button
                      key={slide.title}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2.5 rounded-full transition-all ${
                        currentSlide === index
                          ? "w-10 bg-slate-950"
                          : "w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="motion-card mt-10 grid gap-4 rounded-[32px] border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur lg:grid-cols-[0.95fr_1.1fr_0.95fr]">
            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                {t.clinicFocus}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {t.clinicFocusText}
              </p>
            </div>

            <div className="rounded-[24px] bg-gradient-to-r from-slate-950 via-blue-950 to-cyan-900 px-5 py-4 text-white">
              <p className="text-sm uppercase tracking-[0.18em] text-white/60">
                {t.whyFeelsBetter}
              </p>
              <p className="mt-2 text-lg font-semibold">
                {t.whyFeelsBetterText}
              </p>
            </div>

            <div className="rounded-[24px] bg-slate-50 px-5 py-4">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                {t.reachUs}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                Baripada, Odisha
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-section mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              {t.servicesTitle}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              {t.servicesHeading}
            </h2>
          </div>
          <Link to="/care" className="text-sm font-medium text-blue-700">
            {t.viewAllServices}
          </Link>
        </div>

        <div className="stagger-grid grid gap-5 lg:grid-cols-3">
          {t.services.map((service, index) => (
            <div
              key={service.title}
              className="motion-card group rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-5 h-1.5 w-16 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition group-hover:w-24" />
              <h3 className="text-xl font-semibold text-slate-950">
                {service.title}
              </h3>
              <p className="mt-4 leading-7 text-slate-600">{service.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="motion-card motion-image overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-xl">
            <img
              src={siteImages.therapy}
              alt={t.therapyAlt}
              className="h-[360px] w-full object-cover"
            />
          </div>

          <div className="motion-card rounded-[34px] border border-slate-200 bg-white/95 p-8 shadow-sm backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              {t.recoveryEnvironment}
            </p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950">
              {t.recoveryEnvironmentTitle}
            </h3>
            <p className="mt-4 text-base leading-8 text-slate-600">
              {t.recoveryEnvironmentText}
            </p>
            <div className="mt-6 rounded-[24px] bg-slate-50 p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                {t.leadDoctor}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                Dr. Tapaswini Sahu
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {t.leadDoctorText}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-[34px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 p-8 shadow-sm">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
              {feedbackEyebrow}
            </p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-950">
              {feedbackTitle}
            </h3>
            <p className="mt-3 text-base leading-8 text-slate-600">
              {feedbackText}
            </p>
          </div>

          <div className="stagger-grid grid gap-5 lg:grid-cols-3">
            {testimonialsToShow.map((item) => (
              <div
                key={item.name}
                className="motion-card rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="inline-flex rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <BadgeCheck size={20} />
                  </div>
                  <div className="flex gap-1 text-amber-500">
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                    <span>★</span>
                  </div>
                </div>

                <p className="text-base leading-7 text-slate-600">
                  "{item.feedback}"
                </p>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <p className="text-lg font-semibold text-slate-950">
                    {item.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{item.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[34px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
                Share Feedback
              </p>
              <h3 className="mt-2 text-3xl font-semibold text-slate-950">
                Rate your experience
              </h3>
              <p className="mt-3 text-base leading-8 text-slate-600">
                Submit your feedback with a star rating. Admin will approve it first, then it will be published on the website.
              </p>
            </div>

            <form onSubmit={submitFeedback} className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={feedbackForm.name}
                onChange={(e) => setFeedbackForm((current) => ({ ...current, name: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
              <input
                type="email"
                placeholder="Email (optional)"
                value={feedbackForm.email}
                onChange={(e) => setFeedbackForm((current) => ({ ...current, email: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Star Rating</p>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }, (_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFeedbackForm((current) => ({ ...current, stars: value }))}
                        className="rounded-xl p-1"
                      >
                        <Star
                          size={22}
                          className={
                            value <= feedbackForm.stars
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300"
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <textarea
                placeholder="Write your feedback"
                value={feedbackForm.comment}
                onChange={(e) => setFeedbackForm((current) => ({ ...current, comment: e.target.value }))}
                className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />

              {feedbackStatus.message ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedbackStatus.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {feedbackStatus.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={feedbackSubmitting}
                className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3.5 font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {feedbackSubmitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </form>
          </div>
        </div>

        <div className="motion-panel mt-10 rounded-[32px] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/60">
                {t.quickBooking}
              </p>
              <h3 className="mt-2 text-3xl font-semibold">
                {t.quickBookingTitle}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75">
                {t.quickBookingText}
              </p>
            </div>

            <Link
              to="/patient-login?redirect=/patient-dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-medium text-slate-950 hover:bg-slate-100"
            >
              <CalendarDays size={18} />
              {t.startBooking}
              <MoveRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
