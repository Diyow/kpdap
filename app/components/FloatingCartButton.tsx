"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag } from "lucide-react";

export default function FloatingCartButton() {
  const pathname = usePathname();
  const { items, setIsCartOpen } = useCartStore();

  // Don't show floating cart on admin pages or checkout
  if (pathname?.startsWith("/admin") || pathname === "/checkout") {
    return null;
  }

  return (
    <button
      onClick={() => setIsCartOpen(true)}
      className="fixed bottom-6 right-6 z-40 bg-brand-green text-white p-3 md:p-4 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:bg-brand-darkgreen hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      aria-label="Buka Keranjang"
    >
      <div className="relative flex items-center justify-center">
        <ShoppingBag size={28} />
        {items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-5 min-w-[20px] flex items-center justify-center rounded-full px-1 shadow-sm border-2 border-brand-green group-hover:border-brand-darkgreen transition-colors">
            {items.length}
          </span>
        )}
      </div>
    </button>
  );
}
