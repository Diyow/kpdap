import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import FloatingCartButton from "./components/FloatingCartButton";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KPDAP - Koperasi Produsen Dharma Agastya Pertiwi",
  description: "Kopi Terbaik, Dari Hati Petani Bali",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} scroll-smooth antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-screen flex flex-col font-sans">
        {children}
        <FloatingWhatsApp />
        <FloatingCartButton />
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
