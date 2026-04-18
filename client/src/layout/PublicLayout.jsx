import PublicFooter from "../components/PublicFooter";
import PublicChatWidget from "../components/PublicChatWidget";
import PublicNavbar from "../components/PublicNavbar";
import ScrollToTopButton from "../components/ScrollToTopButton";

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_30%,#f6f8fc_100%)] text-slate-900">
      <PublicNavbar />
      <main className="page-shell relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_15%_10%,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_85%_0%,rgba(14,165,233,0.08),transparent_24%)]" />
        {children}
      </main>
      <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
        <ScrollToTopButton />
      </div>
      <PublicChatWidget />
      <PublicFooter />
    </div>
  );
}
