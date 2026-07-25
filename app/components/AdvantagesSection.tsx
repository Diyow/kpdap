import React from "react";
import { advantages } from "../data";

export default function AdvantagesSection() {
  return (
    <section className="bg-[#298d53] py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Keunggulan Robusta Honey</h2>
          <p className="text-green-100 max-w-3xl mx-auto leading-relaxed">
            Kopi Sabean diolah menggunakan metode Honey Process—di mana lapisan lendir manis tetap dibiarkan saat penjemuran—menghasilkan profil rasa dengan keasaman tinggi, keasaman seimbang, dan body yang tebal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {advantages.map((adv, index) => (
            <div 
              key={index}
              className="bg-[#389a61] border border-[#48a970] p-8 rounded-xl shadow-sm text-white hover:bg-[#3f9d65] hover:border-yellow-400/50 transition-colors duration-300"
            >
              <div className="text-yellow-400 font-bold text-5xl mb-4">
                {adv.number}
              </div>
              <h3 className="text-xl font-bold mb-3">{adv.title}</h3>
              <p className="text-green-50 text-sm leading-relaxed">{adv.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
