import React from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import BusinessUnitsSection from "./components/BusinessUnitsSection";
import AboutSection from "./components/AboutSection";
import AdvantagesSection from "./components/AdvantagesSection";
import ProductsSection from "./components/ProductsSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Header />
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
      <Footer />
    </>
  );
}
