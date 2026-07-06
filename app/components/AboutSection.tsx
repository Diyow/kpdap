import { CheckCircle2, Users } from "lucide-react";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 md:px-8 bg-brand-lightbg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        {/* Image Side */}
        <div className="w-full md:w-1/2 relative rounded-2xl overflow-hidden shadow-lg">
          <img
            src="about.webp"
            alt="Petani Kopi"
            className="w-full h-[400px] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 text-white px-4 py-2 font-medium text-lg">
            "Dedikasi dari Jantung Pupuan"
          </div>
        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2">
          <div className="inline-flex items-center gap-2 bg-green-100 text-brand-green px-3 py-1 rounded-full text-xs font-semibold mb-6">
            <Users size={14} />
            <span>Tentang Kami</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-6 leading-tight">
            Dedikasi dari Jantung Pupuan untuk Kopi Robusta Terbaik
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Perjalanan kami dimulai pada tahun 2021 di tengah tantangan pandemi COVID-19, berawal dari sebuah kelompok tani yang terdiri dari 20 petani kopi robusta di Desa Pajahan.
          </p>

          <ul className="space-y-4 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-brand-green mt-1 shrink-0" size={20} />
              <span className="text-gray-700">Meningkatkan kesejahteraan anggota petani</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="text-brand-green mt-1 shrink-0" size={20} />
              <span className="text-gray-700">Praktik pertanian sehat dan berkelanjutan</span>
            </li>
          </ul>

          <Link href="/about" className="inline-block bg-brand-brown hover:bg-[#3a2e26] text-white px-6 py-3 rounded-md font-medium transition-colors shadow-sm hover:shadow-md">
            Baca Cerita Lengkap &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
