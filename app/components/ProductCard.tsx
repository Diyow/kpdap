"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import QuickAddModal from "./QuickAddModal";

export type Product = {
  id: number;
  title: string;
  price: number;
  image: string;
  description?: string;
  badge?: string | null;
  category_id?: string | null;
  variations?: any;
  compare_at_price?: number | null;
  slug?: string;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, setIsCartOpen } = useCartStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatRupiah = (p: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(p);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    const hasVariations = Array.isArray(product.variations) && product.variations.length > 0;
    
    if (hasVariations) {
      setIsModalOpen(true);
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
      });
      setIsCartOpen(true);
    }
  };

  return (
    <>
      <Link
        href={`/products/${product.slug || product.id}`}
        className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col group block h-full"
      >
        <div className="relative h-56 w-full overflow-hidden bg-gray-50">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
          )}
          
          {product.badge ? (
            <div className="absolute top-3 right-3 bg-yellow-400 text-brand-text text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
              {product.badge}
            </div>
          ) : product.compare_at_price && product.compare_at_price > product.price ? (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
              {Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)}% OFF
            </div>
          ) : null}
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-brand-text mb-2 text-lg group-hover:text-brand-green transition-colors line-clamp-2">{product.title}</h3>
          <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">
            {product.description || "Produk berkualitas tinggi dari petani lokal Bali."}
          </p>
          <div className="mt-auto flex justify-between items-end">
            <div>
              {product.compare_at_price && product.compare_at_price > product.price && (
                <div className="text-xs text-gray-400 line-through mb-0.5">{formatRupiah(product.compare_at_price)}</div>
              )}
              <div className="font-bold text-brand-green text-lg leading-tight">{formatRupiah(product.price)}</div>
            </div>
            <button 
              onClick={handleAddToCart}
              className="text-sm bg-brand-green text-white px-4 py-2.5 rounded-lg hover:bg-brand-darkgreen transition-colors shadow-sm font-medium"
            >
              Beli
            </button>
          </div>
        </div>
      </Link>
      
      {isModalOpen && (
        <QuickAddModal 
          product={product as any} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
