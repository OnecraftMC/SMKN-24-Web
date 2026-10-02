import Navbar from "@/components/layout/Navbar";
import { Footer } from "@/components/ui/footer-section";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import LoadingScreenProvider from "@/components/ui/LoadingScreenProvider";

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
    <LoadingScreenProvider>
      <Navbar />
      <main className="pt-[112px] md:pt-[120px] lg:pt-[132px] min-h-screen">{children}</main>
      <Footer />
      <ChatbotWidget />
    </LoadingScreenProvider>
  );
}