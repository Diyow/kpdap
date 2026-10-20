import React from "react";
import HeroSection from "@/app/components/HeroSection";
import BusinessUnitsSection from "@/app/components/BusinessUnitsSection";
import AboutSection from "@/app/components/AboutSection";
import AdvantagesSection from "@/app/components/AdvantagesSection";
import ProductsSection from "@/app/components/ProductsSection";
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
            <main className="flex-1 w-full flex flex-col items-center">
        <HeroSection />
        <BusinessUnitsSection />
        <div className="w-full">
          <AboutSection />
        </div>
        <div className="w-full">
          <AdvantagesSection />
        </div>
        <div className="w-full">
          <ProductsSection />
        </div>
      </main>
          </>
  );
}
