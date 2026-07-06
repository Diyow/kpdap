import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle2, Target, Award, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 w-full flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[50vh] min-h-[400px] flex items-center justify-center">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1524350876685-274059332603?auto=format&fit=crop&q=80&w=2000" 
              alt="Perkebunan Kopi" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-brown/70 mix-blend-multiply"></div>
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm border border-white/20">
              <Users size={16} />
              <span>Kisah Kami</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Dedikasi dari Jantung Pupuan</h1>
            <p className="text-lg text-white/90 leading-relaxed max-w-2xl mx-auto font-medium">
              Perjalanan Koperasi Produsen Dharma Asastha Partiwi (KPDAP) dalam memberdayakan petani kopi lokal menuju masa depan yang berkelanjutan.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-24 px-4 md:px-8 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 lg:gap-24">
            <div className="w-full md:w-1/2 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <img 
                  src="/ab.jpg" 
                  alt="Petani Kopi" 
                  className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-brand-green text-white p-8 rounded-2xl shadow-xl hidden md:block z-20 border-4 border-white">
                <p className="text-5xl font-black mb-1 tracking-tighter">2021</p>
                <p className="text-sm font-bold uppercase tracking-widest opacity-90">Tahun Berdiri</p>
              </div>
              <div className="absolute top-1/2 -left-10 w-32 h-32 bg-brand-lightbg rounded-full -z-10 blur-3xl opacity-70"></div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="w-12 h-1 bg-brand-green mb-8 rounded-full"></div>
              <h2 className="text-3xl md:text-5xl font-bold text-brand-text mb-8 leading-tight">Awal Mula Perjalanan Kami</h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                <p>
                  Cerita kami berawal dari sebuah tantangan besar. Pada tahun 2021, di tengah pandemi COVID-19 yang melanda dunia, sekelompok petani di Desa Pajahan, Kecamatan Pupuan, berkumpul untuk mencari jalan keluar bersama.
                </p>
                <p>
                  Dengan hanya <strong className="text-brand-text font-bold">20 orang anggota pendiri</strong>, kami memiliki satu kesamaan visi: menyelamatkan kualitas kopi robusta lokal dan meningkatkan kesejahteraan keluarga kami melalui praktik pertanian yang lebih baik.
                </p>
                <p>
                  Dari inisiatif kecil itulah, lahir <strong className="text-brand-green font-bold">Koperasi Produsen Dharma Asastha Partiwi (KPDAP)</strong>. Kami mengubah tantangan menjadi peluang melalui inovasi pengolahan seperti metode <em>Honey Process</em>, yang kini menjadi produk unggulan kebanggaan kami.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Banner */}
        <section className="bg-brand-green text-white py-16 px-4 md:px-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 C20,0 50,0 100,100 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/20 relative z-10">
            <div className="px-4 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-5xl font-black mb-3">20+</p>
              <p className="text-sm font-bold uppercase tracking-wider opacity-90">Anggota Petani</p>
            </div>
            <div className="px-4 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-5xl font-black mb-3">100%</p>
              <p className="text-sm font-bold uppercase tracking-wider opacity-90">Robusta Pupuan</p>
            </div>
            <div className="px-4 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-5xl font-black mb-3">15</p>
              <p className="text-sm font-bold uppercase tracking-wider opacity-90">Hektar Kebun</p>
            </div>
            <div className="px-4 hover:-translate-y-1 transition-transform duration-300">
              <p className="text-5xl font-black mb-3">4</p>
              <p className="text-sm font-bold uppercase tracking-wider opacity-90">Unit Bisnis</p>
            </div>
          </div>
        </section>

        {/* Vision & Mission */}
        <section className="py-24 px-4 md:px-8 bg-brand-lightbg">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-brand-text mb-6">Visi & Misi Kami</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg leading-relaxed">
                Kompas yang mengarahkan setiap langkah kami dalam memberdayakan komunitas dan melestarikan alam yang telah memberikan kami kehidupan.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-10">
              {/* Vision Card */}
              <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:border-brand-green/30 transition-all duration-300">
                <div className="absolute -right-8 -top-8 text-brand-green/5 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700">
                  <Target size={240} />
                </div>
                <div className="w-16 h-16 bg-brand-lightbg rounded-2xl flex items-center justify-center text-brand-green mb-8 relative z-10 shadow-sm border border-brand-green/10">
                  <Target size={32} />
                </div>
                <h3 className="text-3xl font-bold text-brand-text mb-6 relative z-10 group-hover:text-brand-green transition-colors">Visi</h3>
                <p className="text-gray-600 leading-relaxed text-lg relative z-10">
                  Menjadi koperasi produsen unggulan yang menyejahterakan anggota petani dan memajukan potensi agrowisata berbasis kopi robusta yang berkelanjutan di Bali.
                </p>
              </div>

              {/* Mission Card */}
              <div className="bg-white p-10 md:p-12 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl hover:border-brand-green/30 transition-all duration-300">
                <div className="absolute -right-8 -top-8 text-brand-green/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                  <Award size={240} />
                </div>
                <div className="w-16 h-16 bg-brand-lightbg rounded-2xl flex items-center justify-center text-brand-green mb-8 relative z-10 shadow-sm border border-brand-green/10">
                  <Award size={32} />
                </div>
                <h3 className="text-3xl font-bold text-brand-text mb-6 relative z-10 group-hover:text-brand-green transition-colors">Misi</h3>
                <ul className="space-y-5 relative z-10">
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="text-brand-green mt-1 shrink-0 bg-brand-lightbg rounded-full" size={24} />
                    <span className="text-gray-700 text-lg leading-relaxed">Meningkatkan kesejahteraan sosial dan ekonomi anggota petani.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="text-brand-green mt-1 shrink-0 bg-brand-lightbg rounded-full" size={24} />
                    <span className="text-gray-700 text-lg leading-relaxed">Menerapkan praktik pertanian organik yang ramah lingkungan.</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <CheckCircle2 className="text-brand-green mt-1 shrink-0 bg-brand-lightbg rounded-full" size={24} />
                    <span className="text-gray-700 text-lg leading-relaxed">Mengembangkan pengolahan pascapanen kopi berkualitas tinggi.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
