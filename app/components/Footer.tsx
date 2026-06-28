import React from "react";
import { footerLinks, contactInfo } from "../data";
import { MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brand-brown text-[#d0c9c3] pt-16 pb-8 px-4 md:px-8 border-t-[8px] border-brand-green">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Brand Info */}
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-green font-bold text-xl">
              K
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
        <div>
          <h3 className="text-white font-bold mb-6">Tautan Cepat</h3>
          <ul className="space-y-3 text-sm">
            {footerLinks.quickLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="hover:text-white transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-bold mb-6">Hubungi Kami</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-brand-green shrink-0 mt-0.5" />
              <span>Desa Pajahan, Kec. Pupuan, Kabupaten Tabanan, Bali 82163</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-brand-green shrink-0" />
              <span>{contactInfo.phone}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-brand-green shrink-0" />
              <span>{contactInfo.email}</span>
            </li>
          </ul>
        </div>

        {/* Supported By */}
        <div>
          <h3 className="text-white font-bold mb-6">Didukung Oleh</h3>
          {/* <div className="flex flex-wrap gap-3">
            <div className="bg-white px-4 py-2 rounded flex items-center justify-center">
              <span className="text-brand-green font-bold text-xs uppercase">Bank<br/>Indonesia</span>
            </div>
            <div className="bg-white px-4 py-2 rounded flex items-center justify-center">
              <span className="text-blue-800 font-bold text-xs uppercase">OJK</span>
            </div>
            <div className="bg-white px-4 py-2 rounded flex items-center justify-center">
              <span className="text-gray-800 font-bold text-xs uppercase">Pemkab<br/>Tabanan</span>
            </div>
          </div> */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#655546] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
        <p>&copy; 2026 Koperasi Produsen Dharma Asastha Partiwi. Hak cipta dilindungi.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
          <a href="#" className="hover:text-white transition-colors">Syarat & Ketentuan</a>
        </div>
      </div>
    </footer>
  );
}
