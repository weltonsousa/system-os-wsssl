import type { Metadata } from "next";
import { Inter } from "next/font/google";
// import "@/styles/globals.css";
import './globals.css';
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { AlertProvider } from "@/components/ui/AlertContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WS Service Solutions",
  description: "Sistema de Gerenciamento de Serviços de Informática",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter} flex flex-col min-h-screen`}>
        <SessionProviderWrapper>
          <AlertProvider>
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </AlertProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

