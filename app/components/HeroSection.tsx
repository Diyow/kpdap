import React from "react";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[500px] md:h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('hero.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-block bg-yellow-500 text-brand-brown text-xs font-bold px-3 py-1 rounded-full mb-6">
          Berdiri Sejak 2021 | Tabanan, Bali
        </div>

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Kopi Terbaik,<br />Dari Hati Petani Bali.
        </h2>

        <p className="text-gray-200 text-sm md:text-base max-w-2xl mx-auto mb-10">
          KPDAP menghadirkan Robusta Honey Process premium, pengalaman ekowisata autentik, dan solusi pertanian berkelanjutan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#products" className="bg-brand-green hover:bg-brand-darkgreen text-white px-8 py-3 rounded-md font-medium transition-colors">
            Lihat Produk
          </a>
          <a href="#about" className="bg-transparent border border-white text-white hover:bg-white/10 px-8 py-3 rounded-md font-medium transition-colors">
            Tentang Kami
          </a>
        </div>
      </div>
    </section>
  );
}
