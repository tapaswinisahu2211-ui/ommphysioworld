const siteName = "Omm Physio World";
const clinicAddress =
  "City clinic road, near davaindia, Baripada";
const clinicPhone = "+91 88955 55519";
const clinicEmail = "contact@ommphysioworld.com";
const siteLogoPath = "/logo512.png";

export const createMedicalBusinessSchema = ({
  name = siteName,
  description,
  path = "/",
  pageName,
}) => ({
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  "@id": path,
  name,
  description,
  medicalSpecialty: "Physiotherapy",
  telephone: clinicPhone,
  email: clinicEmail,
  image: siteLogoPath,
  logo: siteLogoPath,
  address: {
    "@type": "PostalAddress",
    streetAddress: clinicAddress,
    addressLocality: "Baripada",
    addressRegion: "Odisha",
    postalCode: "757001",
    addressCountry: "IN",
  },
  areaServed: "Baripada, Odisha",
  openingHours: "Mo-Sa 09:00-19:00",
  department: pageName || siteName,
  url: path,
});

export const createBreadcrumbSchema = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.path,
  })),
});

export const createFaqSchema = (items = []) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
});

