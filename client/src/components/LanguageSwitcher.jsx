import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const labels = {
  en: "Language",
  hi: "भाषा",
  or: "ଭାଷା",
};

export default function LanguageSwitcher({ className = "" }) {
  const { language, setLanguage, languages } = useLanguage();

  return (
    <label
      className={`flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-[0_14px_38px_rgba(15,23,42,0.14)] backdrop-blur ${className}`}
    >
      <Languages size={16} className="text-slate-500" />
      <span>{labels[language] || labels.en}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="min-w-[88px] bg-transparent text-sm font-medium text-slate-800 outline-none"
        aria-label={labels[language] || labels.en}
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
