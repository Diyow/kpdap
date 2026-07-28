"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "../components/ProductCard";
import type { Product } from "../components/ProductCard";

type Category = {
  id: string;
  name: string;
  slug: string;
};

interface ProductsListClientProps {
  initialProducts: Product[];
  initialCategories: Category[];
}

export default function ProductsListClient({ 
  initialProducts, 
  initialCategories 
}: ProductsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Read active category slug from the URL, defaulting to "all"
  const activeSlug = searchParams.get("category") || "all";

  const handleCategoryChange = (slug: string) => {
    // If 'all' is selected, keep the URL clean by removing the parameter
    if (slug === "all") {
      router.push("/products", { scroll: false });
    } else {
      router.push(`/products?category=${slug}`, { scroll: false });
    }
  };

  // Find the corresponding category object to get its ID for filtering
  const activeCategoryObj = initialCategories.find(c => c.slug === activeSlug);
  const activeCategoryId = activeCategoryObj?.id;

  const filteredProducts = activeSlug === "all" || !activeCategoryId
    ? initialProducts
    : initialProducts.filter(p => p.category_id === activeCategoryId);

  return (
    <section className="py-16 px-4 md:px-8 flex-1">
      <div className="max-w-7xl mx-auto">
        {/* Filter Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto scrollbar-hide">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSlug === "all" ? "bg-brand-green text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
            >
              Semua
            </button>
            {initialCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeSlug === category.slug ? "bg-brand-green text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
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
  );
}
