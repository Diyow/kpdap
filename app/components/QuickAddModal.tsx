"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, ShoppingCart, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";

type Variation = {
  name: string;
  price: number;
};

type Product = {
  id: number;
  title: string;
  price: number;
  image: string;
  variations?: any;
};

type QuickAddModalProps = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
};

export default function QuickAddModal({ product, isOpen, onClose }: QuickAddModalProps) {
  const { addItem, setIsCartOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Normalize variations
  const variations: Variation[] = Array.isArray(product.variations)
    ? product.variations.map(v => typeof v === 'string' ? { name: v, price: product.price } : v)
    : [];

  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(variations.length > 0 ? variations[0] : null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset state when product changes
  useEffect(() => {
    if (variations.length > 0) {
      setSelectedVariation(variations[0]);
    } else {
      setSelectedVariation(null);
    }
    setQuantity(1);
  }, [product.id, product.variations]);

  if (!isOpen || !mounted) return null;

  const displayPrice = selectedVariation ? selectedVariation.price : product.price;

  const formatRupiah = (p: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(p);
  };

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        availableVariations: variations.length > 0 ? variations : undefined,
      },
      selectedVariation?.name,
      displayPrice,
      quantity
    );
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
              {product.image ? (
                <Image src={product.image} alt={product.title} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="font-bold text-lg text-brand-text line-clamp-2 leading-tight mb-1">{product.title}</h3>
              <p className="text-brand-green font-bold text-xl">{formatRupiah(displayPrice)}</p>
            </div>
          </div>

          {variations.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Pilih Variasi</h4>
              <div className="flex flex-wrap gap-2">
                {variations.map((v) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedVariation(v)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      selectedVariation?.name === v.name
                        ? "border-brand-green bg-brand-green/10 text-brand-darkgreen"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Jumlah</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 h-10 w-32">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex-1 flex items-center justify-center text-gray-500 hover:text-brand-green transition-colors h-full"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold text-gray-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex-1 flex items-center justify-center text-gray-500 hover:text-brand-green transition-colors h-full"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-brand-green hover:bg-brand-darkgreen text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <ShoppingCart size={18} />
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
