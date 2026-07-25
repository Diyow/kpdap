"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Search, Loader2, Package } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !contact.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch('/api/order/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId.trim(), contact: contact.trim() })
      });

      const data = await res.json();

      if (!res.ok || !data.order) {
        setError(data.error || "Pesanan tidak ditemukan. Pastikan ID Pesanan dan Nomor WA/Email sudah benar.");
      } else {
        // Success! Redirect to the status page
        router.push(`/checkout/success?order_id=${data.order.id}`);
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memproses permintaan Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-brand-lightbg py-20 px-4 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
          <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="text-brand-green w-10 h-10" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-brand-text mb-3">Cek Pesanan</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Masukkan ID Pesanan dan Nomor WA (atau Email) Anda untuk melihat status pesanan terkini.
          </p>

          <form onSubmit={handleSearch} className="space-y-5 text-left">
            <div>
              <label className="block text-sm font-bold text-brand-text mb-1">ID Pesanan</label>
              <input
                type="text"
                placeholder="Contoh: b906703d-..."
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-brand-text mb-1">Nomor WhatsApp / Email</label>
              <input
                type="text"
                placeholder="Nomor WA atau Email saat checkout"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green focus:bg-white transition-all"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-darkgreen transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Mencari...
                </>
              ) : (
                <>
                  <Search size={24} />
                  Lacak Pesanan
                </>
              )}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
