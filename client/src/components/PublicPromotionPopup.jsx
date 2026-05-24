import { useEffect, useState } from "react";
import { ExternalLink, Gift, X } from "lucide-react";
import API from "../services/api";

const DISMISSED_PROMOTION_KEY = "opwDismissedPromotionBannerId";

export default function PublicPromotionPopup() {
  const [promotion, setPromotion] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadPromotion = async () => {
      try {
        const response = await API.get("/public-promotion");
        const nextPromotion = response.data?.data;

        if (!mounted || !nextPromotion?.id) {
          return;
        }

        const dismissedId = localStorage.getItem(DISMISSED_PROMOTION_KEY);
        if (dismissedId !== nextPromotion.id) {
          setPromotion(nextPromotion);
          setVisible(true);
        }
      } catch (_) {
        // Public pages should never fail because a marketing banner could not load.
      }
    };

    loadPromotion();

    return () => {
      mounted = false;
    };
  }, []);

  const closePromotion = () => {
    if (promotion?.id) {
      localStorage.setItem(DISMISSED_PROMOTION_KEY, promotion.id);
    }
    setVisible(false);
  };

  if (!visible || !promotion) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 px-4 py-5 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-white p-5 shadow-2xl sm:p-6">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-emerald-200/55" />
        <div className="pointer-events-none absolute -right-20 top-8 h-48 w-48 rounded-full bg-lime-100/80" />
        <div className="pointer-events-none absolute bottom-0 right-10 h-28 w-28 rounded-full bg-sky-100/80" />

        <button
          type="button"
          onClick={closePromotion}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Close offer"
        >
          <X size={18} />
        </button>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            <Gift size={14} />
            {promotion.badge || "OPW Update"}
          </div>
          <h2 className="mt-4 max-w-md text-3xl font-black tracking-tight text-slate-950">
            {promotion.title}
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {promotion.message}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {promotion.actionLabel && promotion.actionUrl ? (
              <a
                href={promotion.actionUrl}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
              >
                {promotion.actionLabel}
                <ExternalLink size={16} />
              </a>
            ) : null}
            <button
              type="button"
              onClick={closePromotion}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
