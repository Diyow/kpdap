import React from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { Suspense } from "react";
import ProductsListClient from "./ProductsListClient";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Katalog Produk Kami | KPDAP',
  description: 'Jelajahi berbagai pilihan kopi premium, paket wisata, dan produk pertanian organik kami yang ditanam dengan penuh cinta oleh para petani Bali.'
};

export const revalidate = 60; // Revalidate every minute

export default async function ProductsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

  // Fetch categories and products server-side
  const { data: categories } = await supabase.from("categories").select("*").order("name");
  
  const { data: products } = await supabase
    .from("products")
    .select("id, title, price, compare_at_price, image, description, badge, category_id, variations, slug")
    .eq("is_active", true)
    .order("id", { ascending: false });

  return (
    <>
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

        {/* Products Grid - Using Client Component for interactions */}
        <Suspense fallback={<div className="py-20 text-center"><div className="w-8 h-8 mx-auto border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div></div>}>
          <ProductsListClient 
            initialProducts={products || []} 
            initialCategories={categories || []} 
          />
        </Suspense>
      </main>
          </>
  );
}
