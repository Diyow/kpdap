import React from "react";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ProductGallery from "../../components/ProductGallery";
import ProductOptions from "../../components/ProductOptions";
import { ArrowLeft } from "lucide-react";

export const runtime = 'edge';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Try fetching from supabase
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", decodedSlug)
    .single();

  if (!product || error) {
    return (
      <>
        <Header />
        <main className="flex-1 w-full flex flex-col items-center justify-center min-h-[60vh] bg-brand-lightbg">
          <h1 className="text-2xl font-bold text-brand-text mb-4">
            Produk Tidak Ditemukan
          </h1>
          <p className="text-gray-500 mb-6">Produk yang Anda cari mungkin telah dihapus atau tidak tersedia.</p>
          <Link href="/products" className="text-brand-green hover:underline font-medium">
            Kembali ke Katalog
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 w-full bg-brand-lightbg py-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <Link 
            href="/products" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-green font-medium mb-6 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            Kembali ke Katalog
          </Link>

          {/* Main Product Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 mb-8">
            <div className="flex flex-col md:flex-row gap-10 md:gap-16">
              
              {/* Product Gallery (Left Side) */}
              <div className="w-full md:w-1/2">
                <ProductGallery 
                  title={product.title}
                  thumbnail={product.image}
                  images={product.images || []}
                />
              </div>

              {/* Product Info & Options (Right Side) */}
              <div className="w-full md:w-1/2 flex flex-col">
                {product.badge && (
                  <span className="inline-block bg-brand-green/10 text-brand-darkgreen border border-brand-green/20 text-xs font-bold px-3 py-1 rounded-full shadow-sm mb-4 w-fit uppercase tracking-wider">
                    {product.badge}
                  </span>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-brand-text mb-4">
                  {product.title}
                </h1>
                
                {/* Static Rating Summary (Hidden for now as it's not real)
                <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
                  <div className="flex text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="font-medium text-gray-700">5.0</span>
                  <span>(12 Ulasan)</span>
                </div>
                */}

                <div className="mb-8">
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {product.description || "Produk premium dari KPDAP yang diproses dengan standar kualitas tinggi untuk memberikan pengalaman terbaik bagi Anda."}
                  </p>
                </div>

                {/* Options (Variations & Quantity) */}
                <ProductOptions 
                  product={{
                    id: product.id,
                    title: product.title,
                    image: product.image,
                  }}
                  variations={product.variations || []}
                  price={product.price}
                  compare_at_price={product.compare_at_price}
                  stock={product.stock || 0}
                />
              </div>
            </div>
          </div>

          {/* Details & Specs Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10 mb-8">
            <h2 className="text-2xl font-bold text-brand-text mb-6 pb-4 border-b border-gray-100">Spesifikasi Detail</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              {product.specifications?.origin && (
                <div className="flex flex-col py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500 font-medium mb-1">Origin (Asal)</span>
                  <span className="text-gray-800 font-medium">{product.specifications.origin}</span>
                </div>
              )}
              {product.specifications?.process && (
                <div className="flex flex-col py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500 font-medium mb-1">Process (Proses)</span>
                  <span className="text-gray-800 font-medium">{product.specifications.process}</span>
                </div>
              )}
              {product.specifications?.taste_notes && (
                <div className="flex flex-col py-3 border-b border-gray-50">
                  <span className="text-sm text-gray-500 font-medium mb-1">Taste Notes</span>
                  <span className="text-gray-800 font-medium">{product.specifications.taste_notes}</span>
                </div>
              )}
              {(!product.specifications || Object.keys(product.specifications).every(k => !product.specifications[k])) && (
                <p className="text-gray-500 italic">Informasi spesifikasi belum tersedia untuk produk ini.</p>
              )}
            </div>
          </div>

          {/* Static Reviews Section (Hidden for now) */}
          {/*
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
            <h2 className="text-2xl font-bold text-brand-text mb-8 pb-4 border-b border-gray-100">Ulasan Pelanggan</h2>
            
            <div className="flex flex-col md:flex-row gap-10">
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-8 border border-gray-100 h-fit">
                <span className="text-6xl font-extrabold text-brand-text mb-2">5.0</span>
                <div className="flex text-yellow-400 mb-2 gap-1">
                  <Star size={24} fill="currentColor" />
                  <Star size={24} fill="currentColor" />
                  <Star size={24} fill="currentColor" />
                  <Star size={24} fill="currentColor" />
                  <Star size={24} fill="currentColor" />
                </div>
                <span className="text-gray-500 font-medium">Berdasarkan 12 Ulasan</span>
              </div>

              <div className="w-full md:w-2/3 space-y-4">
                {[
                  { name: "Budi Santoso", date: "2 Hari yang lalu", comment: "Kopinya mantap! Proses honey-nya kerasa banget, manis dan legit." },
                  { name: "Agus Pratama", date: "1 Minggu yang lalu", comment: "Pengiriman cepat dan packaging aman. Produk lokal Bali yang kualitasnya bisa diadu." },
                  { name: "Siti Rahma", date: "2 Minggu yang lalu", comment: "Sangat direkomendasikan. Sudah dua kali beli di sini dan selalu puas." },
                ].map((review, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-brand-text">{review.name}</h4>
                        <div className="flex text-yellow-400 mt-1 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill="currentColor" />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">{review.date}</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          */}
        </div>
      </main>
      <Footer />
    </>
  );
}
