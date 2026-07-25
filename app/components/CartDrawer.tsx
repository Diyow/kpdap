"use client";

import { useCartStore } from "@/store/useCartStore";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, getCartTotal, updateItemVariation } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid hydration errors with persist

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
      {/* Backdrop */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-40"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* Drawer / Floating Overlay */}
      <div 
        className={`fixed top-4 right-4 sm:top-6 sm:right-6 bottom-4 sm:bottom-6 w-[calc(100vw-32px)] sm:w-[400px] bg-white z-50 shadow-2xl rounded-3xl overflow-hidden border border-gray-100 transform transition-all duration-300 ease-in-out flex flex-col ${
          isCartOpen 
            ? "translate-x-0 translate-y-0 opacity-100 scale-100" 
            : "translate-x-8 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-green" />
            Keranjang Belanja
            {items.length > 0 && (
              <span className="bg-brand-green text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                {items.length}
              </span>
            )}
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                <ShoppingBag size={36} className="text-gray-300" />
              </div>
              <p className="font-semibold text-brand-text text-lg">Keranjang masih kosong</p>
              <p className="text-sm text-gray-400 max-w-[250px] mb-2">Sepertinya Anda belum menambahkan produk apapun.</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-2 px-6 py-2.5 bg-brand-lightbg text-brand-green hover:bg-brand-green hover:text-white font-semibold rounded-full transition-all duration-300 shadow-sm"
              >
                Mulai Belanja
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">No Img</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-brand-text text-sm line-clamp-2">{item.title}</h3>
                      {item.availableVariations && item.availableVariations.length > 0 ? (
                        <div className="mt-1">
                          <select 
                            value={item.variation || ""}
                            onChange={(e) => {
                              const selectedVarName = e.target.value;
                              const selectedVar = item.availableVariations!.find(v => v.name === selectedVarName);
                              if (selectedVar) {
                                updateItemVariation(item.cartItemId, selectedVar.name, selectedVar.price);
                              }
                            }}
                            className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded px-1.5 py-1 focus:outline-none focus:border-brand-green outline-none w-fit max-w-[120px]"
                          >
                            {item.availableVariations.map(v => (
                              <option key={v.name} value={v.name}>{v.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : item.variation ? (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <span className="font-medium text-gray-700">{item.variation}</span>
                        </p>
                      ) : null}
                    </div>
                    <button 
                      onClick={() => removeItem(item.cartItemId)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-brand-green text-sm">{formatRupiah(item.price)}</span>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="p-1 hover:bg-white rounded text-gray-600 transition-colors disabled:opacity-50"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-xs font-semibold w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="p-1 hover:bg-white rounded text-gray-600 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-end mb-1">
              <span className="font-semibold text-gray-600">Subtotal</span>
              <span className="font-bold text-xl text-brand-green">{formatRupiah(getCartTotal())}</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">Pengiriman dan pajak dihitung saat checkout.</p>
            <Link 
              href="/checkout"
              onClick={() => setIsCartOpen(false)}
              className="w-full py-3.5 bg-brand-green text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
            >
              Lanjut ke Pembayaran
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
