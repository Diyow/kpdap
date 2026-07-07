import React from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { products } from "../data";

// Extrapolating the data to simulate a full store page
const allProducts = [
  ...products,
];

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 w-full flex flex-col bg-brand-lightbg">
        {/* Page Header */}
        <section className="bg-brand-brown py-16 px-4 md:px-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img
              src="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&q=80&w=2000"
              alt="Coffee beans background"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Katalog Produk Kami</h1>
            <p className="text-[#d0c9c3] text-lg max-w-2xl mx-auto">
              Jelajahi berbagai pilihan kopi premium, paket wisata, dan produk pertanian organik kami yang ditanam dengan penuh cinta oleh para petani Bali.
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 px-4 md:px-8 flex-1">
          <div className="max-w-7xl mx-auto">
            {/* Filter Section (Visual only for now) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                {["Semua", "Kopi", "Wisata", "Pertanian", "Merchandise"].map((category, idx) => (
                  <button
                    key={idx}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${idx === 0
                      ? "bg-brand-green text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-sm text-gray-500 whitespace-nowrap">Urutkan:</span>
                <select className="border border-gray-300 rounded-md text-sm px-3 py-2 bg-white text-gray-700 outline-none focus:border-brand-green w-full sm:w-auto">
                  <option>Terbaru</option>
                  <option>Terlaris</option>
                  <option>Harga: Rendah ke Tinggi</option>
                  <option>Harga: Tinggi ke Rendah</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allProducts.map((product) => (
                <Link
                  href={`/products/${product.id}`}
                  key={product.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col group block"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.badge && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-brand-text text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                        {product.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-brand-text mb-2 text-lg group-hover:text-brand-green transition-colors">{product.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 flex-1">
                      Produk berkualitas tinggi dari petani lokal Bali.
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="font-bold text-brand-green text-lg">{product.price}</span>
                      <div className="text-sm bg-brand-green text-white px-4 py-2 rounded-lg hover:bg-brand-darkgreen transition-colors shadow-sm">
                        Beli
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
