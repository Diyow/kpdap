import React from "react";
import { Coffee, MapPin, Sprout, Tractor } from "lucide-react";
import { businessUnits } from "../data";

const getIcon = (iconName: string) => {
  switch (iconName) {
    case "Coffee": return <Coffee className="text-brand-green" size={24} />;
    case "MapPin": return <MapPin className="text-brand-green" size={24} />;
    case "Sprout": return <Sprout className="text-brand-green" size={24} />;
    case "Tractor": return <Tractor className="text-brand-green" size={24} />;
    default: return <Coffee className="text-brand-green" size={24} />;
  }
};

export default function BusinessUnitsSection() {

  return (
    <section className="w-full bg-[#ffffff] py-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto text-center">
      <h2 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">Unit Usaha Kami</h2>
      <p className="text-gray-500 max-w-2xl mx-auto mb-8 md:mb-12 px-4">
        Lebih dari sekadar kopi, kami membangun ekosistem pertanian yang menyeluruh.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {businessUnits?.map((unit, index) => (
          <div 
            key={index} 
            className="bg-white border border-gray-100 p-6 md:p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
              {getIcon(unit.icon)}
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-3">{unit.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{unit.description}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
