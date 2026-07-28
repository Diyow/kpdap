"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";

type Variation = {
  name: string;
  price: number;
  stock: number;
  weight: number;
};

type ProductOptionsProps = {
  product: {
    id: number;
    title: string;
    image: string;
  };
  variations: any[];
  price: number;
  compare_at_price?: number | null;
  stock: number;
};

export default function ProductOptions({ product, variations, price, compare_at_price, stock }: ProductOptionsProps) {
  const normalizedVariations: Variation[] = (variations || []).map(v => 
    typeof v === 'string' ? { name: v, price: price, stock: stock, weight: 1000 } : v
  );

  const [selectedVariationName, setSelectedVariationName] = useState<string>(normalizedVariations?.[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const { addItem, updateQuantity, setIsCartOpen } = useCartStore();

  const activeVariation = normalizedVariations.find(v => v.name === selectedVariationName);
  const displayPrice = activeVariation?.price ?? price;
  const displayStock = activeVariation?.stock ?? stock;
  const isUnlimited = displayStock === -1;
  const isOutOfStock = !isUnlimited && displayStock <= 0;

  const increment = () => {
    if (isUnlimited || quantity < displayStock) setQuantity(quantity + 1);
  };

  const decrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const formatRupiah = (p: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(p);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        {compare_at_price && compare_at_price > displayPrice && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 line-through text-lg">{formatRupiah(compare_at_price)}</span>
            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">
              {Math.round(((compare_at_price - displayPrice) / compare_at_price) * 100)}% OFF
            </span>
          </div>
        )}
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-brand-green">{formatRupiah(displayPrice)}</p>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${isOutOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {isOutOfStock ? "Habis Terjual" : isUnlimited ? "Tersedia" : `Sisa ${displayStock} barang`}
          </span>
        </div>
      </div>

      {normalizedVariations && normalizedVariations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Pilih Variasi:</h3>
          <div className="flex flex-wrap gap-2">
            {normalizedVariations.map((v, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariationName(v.name)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedVariationName === v.name
                    ? "bg-brand-green text-white shadow-md border border-brand-green"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-brand-green hover:text-brand-green"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Kuantitas:</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
            <button onClick={decrement} disabled={isOutOfStock} className="p-3 text-gray-500 hover:bg-gray-50 hover:text-brand-green transition-colors disabled:opacity-50">
              <Minus size={18} />
            </button>
            <span className="w-12 text-center font-medium">{isOutOfStock ? 0 : quantity}</span>
            <button onClick={increment} disabled={isOutOfStock || (!isUnlimited && quantity >= displayStock)} className="p-3 text-gray-500 hover:bg-gray-50 hover:text-brand-green transition-colors disabled:opacity-50">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <button 
        disabled={isOutOfStock} 
        onClick={() => {
          addItem(
            {
              id: product.id,
              title: product.title,
              price: price,
              image: product.image,
              weight: activeVariation?.weight || 1000,
              availableVariations: normalizedVariations.length > 0 ? normalizedVariations : undefined,
            },
            selectedVariationName,
            displayPrice,
            quantity
          );
          
          const toastTitle = selectedVariationName ? `${product.title} (${selectedVariationName})` : product.title;
          toast.success(`${toastTitle} ditambahkan ke keranjang!`);
          setIsCartOpen(true);
        }}
        className="w-full bg-brand-green text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-darkgreen transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-8"
      >
        <ShoppingCart size={20} />
        {isOutOfStock ? "Stok Habis" : "Beli Sekarang"}
      </button>
    </div>
  );
}
