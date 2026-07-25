"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { createClient } from "@/utils/supabase/client";
import { useCartStore } from "@/store/useCartStore";
import { Loader2 } from "lucide-react";
import ProductCard from "../components/ProductCard";
import type { Product } from "../components/ProductCard";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const { addItem, setIsCartOpen } = useCartStore();
  const supabase = createClient();

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, title, price, image, description, badge, category_id, variations")
      .eq("is_active", true)
      .order("id", { ascending: false });

    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter(p => p.category_id === activeCategory);

  return (
    <>
      <Header />
      <main className="flex-1 w-full flex flex-col bg-brand-lightbg">
        {/* Page Header */}
        <section className="bg-brand-brown py-16 px-4 md:px-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Image
              src="/pd.webp"
              alt="Coffee beans background"
              fill
              className="object-cover"
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
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === "all" ? "bg-brand-green text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                  Semua
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === category.id ? "bg-brand-green text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                      }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-brand-green" size={48} />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-500">Belum ada produk di kategori ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
