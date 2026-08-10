import React from "react";
import { footerLinks } from "../data";
import { MapPin, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from '@supabase/supabase-js';
import { contactInfo as fallbackContact } from "../data";

export default async function Footer() {
  let contactInfo = fallbackContact;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
    const { data: contactData } = await supabase.from("contact_info").select("*").eq("id", 1).single();

    if (contactData) {
      contactInfo = contactData;
    }
  } catch (err) {
    console.error("Failed to fetch contact info for footer:", err);
  }

  return (
    <footer className="bg-brand-brown text-[#d0c9c3] pt-16 pb-8 px-4 md:px-8 border-t-[8px] border-brand-green">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
        {/* Brand Info */}
        <div className="md:col-span-3 lg:col-span-3">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-12 h-12 relative bg-white rounded-full p-1 flex items-center justify-center shrink-0">
              <Image
                src="/logo.webp"
                alt="KPDAP Logo"
                fill
                sizes="48px"
                className="object-contain p-1.5"
              />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white leading-tight">KPDAP</h2>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-6 text-[#a89f96]">
            Memberdayakan petani kopi Robusta di Tabanan, Bali melalui praktik Honey Process yang berkelanjutan, pertanian organik, dan agrowisata komunitas.
          </p>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2 lg:col-span-2">
          <h3 className="text-white font-bold mb-6">Tautan Cepat</h3>
          <ul className="space-y-3 text-sm">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-4 lg:col-span-4">
          <h3 className="text-white font-bold mb-6">Hubungi Kami</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-brand-green shrink-0 mt-0.5" />
              <span>Desa Pajahan, Kec. Pupuan, Kabupaten Tabanan, Bali 82163</span>
            </li>
            <li className="flex items-start gap-3">
              <Phone size={18} className="text-brand-green shrink-0 mt-0.5" />
              <span>{contactInfo.phone}</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={18} className="text-brand-green shrink-0 mt-0.5" />
              <span>{contactInfo.email}</span>
            </li>
          </ul>
        </div>

        {/* Supported By */}
        <div className="md:col-span-3 lg:col-span-3">
          <h3 className="text-white font-bold mb-6">Didukung Oleh</h3>
          <div className="flex flex-wrap gap-8 mt-1">
            {[
              {
                name: "Institut Teknologi dan Bisnis STIKOM Bali",
                image: "/stikom.png",
              },
              // Tambahkan logo pendukung lainnya di sini
              // { name: "Nama Pendukung", image: "/logo-lain.png" }
            ].map((supporter, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3">
                <div className="bg-white p-5 rounded-2xl flex items-center justify-center shadow-sm w-fit">
                  <div className="relative w-56 h-24">
                    <Image
                      src={supporter.image}
                      alt={supporter.name}
                      fill
                      className="object-contain"
                      sizes="224px"
                    />
                  </div>
                </div>
                <span className="text-[#d0c9c3] text-sm text-center font-medium leading-relaxed max-w-[260px]">
                  {supporter.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#655546] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>&copy; 2026 Koperasi Produsen Dharma Asastha Partiwi. Hak cipta dilindungi.</p>
        <div className="flex gap-4">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
          <Link href="/terms-of-service" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
        </div>
      </div>
    </footer>
  );
}
