"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

type ProductOptionsProps = {
  variations: string[];
  price: string;
  stock: number;
};

export default function ProductOptions({ variations, price, stock }: ProductOptionsProps) {
  const [selectedVariation, setSelectedVariation] = useState<string>(variations?.[0] || "");
  const [quantity, setQuantity] = useState(1);

  const increment = () => {
    if (quantity < stock) setQuantity(quantity + 1);
  };

  const decrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const isOutOfStock = stock <= 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <p className="text-3xl font-bold text-brand-green">{price}</p>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${isOutOfStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {isOutOfStock ? "Habis Terjual" : `Sisa ${stock} barang`}
        </span>
      </div>

      {variations && variations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Pilih Variasi:</h3>
          <div className="flex flex-wrap gap-2">
            {variations.map((v, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariation(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedVariation === v
                    ? "bg-brand-green text-white shadow-md border border-brand-green"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-brand-green hover:text-brand-green"
                }`}
              >
                {v}
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
            <button onClick={increment} disabled={isOutOfStock || quantity >= stock} className="p-3 text-gray-500 hover:bg-gray-50 hover:text-brand-green transition-colors disabled:opacity-50">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      <button disabled={isOutOfStock} className="w-full bg-brand-green text-white font-bold text-lg py-4 rounded-xl hover:bg-brand-darkgreen transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-8">
        <ShoppingCart size={20} />
        {isOutOfStock ? "Stok Habis" : "Beli Sekarang"}
      </button>
    </div>
  );
}
