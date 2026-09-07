import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';

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
    <html lang="id">
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body className="bg-surface text-on-surface">
        <Navbar />
        <main className="pt-[112px] md:pt-[120px] lg:pt-[132px] min-h-screen">{children}</main>
        <Footer />
        <ChatbotWidget />
      </body>
    </html>
  );
}
