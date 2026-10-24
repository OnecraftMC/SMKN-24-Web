import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/ui/footer-section";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import PublicDataRefresh from "@/components/ui/PublicDataRefresh";
import { SiteLanguageProvider } from "@/lib/i18n/SiteLanguageProvider";

/**
 * Kerangka website publik: Navbar, konten, Footer, dan chatbot.
 * Route group `(public)` tidak mengubah URL — `/`, `/profil`, `/berita`, dst.
 * tetap sama seperti aplikasi sumber.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteLanguageProvider>
      <PublicDataRefresh />
      <Navbar />
      <main className="min-h-screen pt-[112px] md:pt-[120px] lg:pt-[132px]">{children}</main>
      <Footer />
      <ChatbotWidget />
    </SiteLanguageProvider>
  );
}
