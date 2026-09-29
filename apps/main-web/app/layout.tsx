import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { Footer } from '@/components/ui/footer-section';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';
import LoadingScreenProvider from '@/components/ui/LoadingScreenProvider';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SMK Negeri 24 Jakarta',
  description: 'Menumbuhkan kecendekiaan generasi bangsa berwawasan global, berakar budi pekerti luhur, dan berdaya saing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={jakartaSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-surface text-on-surface">
        <LoadingScreenProvider>
          <Navbar />
          <main className="pt-[112px] md:pt-[120px] lg:pt-[132px] min-h-screen">{children}</main>
          <Footer />
          <ChatbotWidget />
        </LoadingScreenProvider>
      </body>
    </html>
  );
}
