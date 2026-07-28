"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { createClient } from "@/utils/supabase/client";
import { contactInfo as fallbackContact } from "@/app/data";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingBag, CreditCard, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/app/components/ConfirmModal";
import BackLink from "@/app/components/BackLink";
import EmptyState from "@/app/components/EmptyState";

declare global {
  interface Window {
    snap: any;
  }
}

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart, pendingOrderId, pendingOrderToken, setPendingOrderId } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: ""
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [shippingServices, setShippingServices] = useState<any[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isFetchingShipping, setIsFetchingShipping] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Fetch provinces on mount
    fetch('/api/rajaongkir/provinces')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setProvinces(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      setCities([]);
      setSelectedCity("");
      setShippingServices([]);
      setSelectedService(null);
      fetch(`/api/rajaongkir/cities?province=${selectedProvince}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setCities(data);
        })
        .catch(console.error);
    }
  }, [selectedProvince]);

  const getTotalWeight = () => {
    return items.reduce((total, item) => total + ((item.weight || 1000) * item.quantity), 0);
  };

  useEffect(() => {
    if (selectedCity && selectedCourier) {
      setIsFetchingShipping(true);
      setShippingServices([]);
      setSelectedService(null);

      fetch('/api/rajaongkir/cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: selectedCity,
          weight: getTotalWeight(),
          courier: selectedCourier
        })
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setShippingServices(data[0].costs);
        }
      })
      .catch(console.error)
      .finally(() => setIsFetchingShipping(false));
    }
  }, [selectedCity, selectedCourier, items]);

  // Verify if pending order is actually still pending
  useEffect(() => {
    if (pendingOrderId && mounted) {
      fetch('/api/order/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: pendingOrderId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.order && data.order.status !== 'pending') {
          // Order is no longer pending (paid, expired, cancelled), clear it
          setPendingOrderId(null);
        }
      })
      .catch(console.error);
    }
  }, [pendingOrderId, mounted, setPendingOrderId]);

  if (!mounted) return null;

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          customer: {
            ...formData,
            province: provinces.find(p => p.province_id === selectedProvince)?.province || "",
            city: cities.find(c => c.city_id === selectedCity)?.city_name || ""
          },
          shipping_details: {
            destination: selectedCity,
            weight: getTotalWeight(),
            courier: selectedCourier,
            service: selectedService?.service || "",
          },
          total_amount: getCartTotal() + (selectedService ? selectedService.cost[0].value : 0),
          shipping_cost: selectedService ? selectedService.cost[0].value : 0,
          courier: selectedCourier ? `${selectedCourier.toUpperCase()} - ${selectedService.service}` : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      setPendingOrderId(data.order_id, data.completion_token);

      // Show Midtrans Snap Popup
      window.snap.pay(data.token, {
        onSuccess: function (result: any) {
          clearCart();
          router.push('/checkout/success?order_id=' + data.order_id + '&token=' + data.completion_token);
        },
        onPending: function (result: any) {
          clearCart();
          router.push('/checkout/success?order_id=' + data.order_id + '&token=' + data.completion_token);
        },
        onError: function (result: any) {
          toast.error("Pembayaran gagal!");
          setIsLoading(false);
        },
        onClose: function () {
          setIsLoading(false);
        }
      });
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!pendingOrderId) return;
    setIsCancelling(true);
    try {
      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: pendingOrderId, completion_token: pendingOrderToken })
      });
      if (res.ok) {
        toast.success("Pesanan sebelumnya berhasil dibatalkan. Stok telah dikembalikan.");
        setShowCancelModal(false);
        setPendingOrderId(null);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Gagal membatalkan pesanan");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsCancelling(false);
    }
  };

  if (items.length === 0) {
    return (
      <>
                <EmptyState
          icon={ShoppingBag}
          title="Keranjang Belanja Kosong"
          description="Anda belum menambahkan produk apapun ke keranjang."
          actionText="Mulai Belanja"
          actionHref="/products"
        />
              </>
    );
  }

  return (
    <>
            <main className="flex-1 w-full bg-brand-lightbg py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <BackLink href="/products" text="Kembali Belanja" className="mb-8" />

          {pendingOrderId && (
            <div className="bg-yellow-50 text-yellow-800 p-5 rounded-2xl border border-yellow-200 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 mt-0.5 shrink-0" size={20} />
                <div>
                  <p className="font-bold text-yellow-900 text-base">Menunggu Pembayaran</p>
                  <p className="text-sm mt-1 opacity-90">Anda memiliki pesanan yang belum dibayar. Batalkan pesanan tersebut jika Anda ingin mengubah metode pembayaran atau membuat pesanan baru.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="bg-white text-red-600 border border-red-200 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-50 disabled:opacity-50 whitespace-nowrap shadow-sm transition-colors"
              >
                {isCancelling ? "Membatalkan..." : "Batalkan Pesanan"}
              </button>
            </div>
          )}
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Section */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-brand-text mb-6">Informasi Pengiriman (Checkout)</h2>
                
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                      <input 
                        required
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" 
                        placeholder="Budi Santoso"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nomor WhatsApp *</label>
                      <input 
                        required
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" 
                        placeholder="081234567890"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Email (Opsional)</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green" 
                      placeholder="budi@email.com"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi *</label>
                      <select 
                        required
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => (
                          <option key={p.province_id} value={p.province_id}>{p.province}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kota/Kabupaten *</label>
                      <select 
                        required
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        disabled={!selectedProvince || cities.length === 0}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white disabled:bg-gray-50"
                      >
                        <option value="">Pilih Kota/Kab</option>
                        {cities.map(c => (
                          <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kurir *</label>
                      <select 
                        required
                        value={selectedCourier}
                        onChange={(e) => setSelectedCourier(e.target.value)}
                        disabled={!selectedCity}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white disabled:bg-gray-50 uppercase"
                      >
                        <option value="">Pilih Kurir</option>
                        <option value="jne">JNE</option>
                        <option value="pos">POS Indonesia</option>
                        <option value="tiki">TIKI</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Layanan Pengiriman *</label>
                      <select 
                        required
                        value={selectedService?.service || ""}
                        onChange={(e) => {
                          const srv = shippingServices.find(s => s.service === e.target.value);
                          setSelectedService(srv || null);
                        }}
                        disabled={!selectedCourier || shippingServices.length === 0 || isFetchingShipping}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green bg-white disabled:bg-gray-50"
                      >
                        <option value="">{isFetchingShipping ? "Menghitung Ongkir..." : "Pilih Layanan"}</option>
                        {shippingServices.map((srv, idx) => (
                          <option key={idx} value={srv.service}>
                            {srv.service} ({srv.cost[0].etd} hari) - Rp {srv.cost[0].value.toLocaleString('id-ID')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap Pengiriman *</label>
                    <textarea 
                      required
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" 
                      placeholder="Jl. Raya Kopi No. 123, Desa Pajahan, Kec. Pupuan..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
                    <textarea 
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green resize-none" 
                      placeholder="Misal: Titip di pos satpam jika tidak ada orang."
                    />
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isLoading || !!pendingOrderId}
                      className="w-full bg-brand-green text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-darkgreen transition-all shadow-md flex items-center justify-center gap-2 mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} />
                          Lanjut Pembayaran
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                      Anda akan diarahkan ke halaman pembayaran aman.
                    </p>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Order Summary Section */}
            <div className="w-full lg:w-[400px]">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
                <h2 className="text-xl font-bold text-brand-text mb-6">Ringkasan Pesanan</h2>
                
                <div className="flex flex-col gap-4 mb-6 max-h-[350px] overflow-y-auto pr-2">
                  {items.map(item => (
                    <div key={item.cartItemId} className="flex gap-4 border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0 border border-gray-100">
                        {item.image ? (
                          <Image src={item.image} alt={item.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">No Img</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-brand-text text-sm line-clamp-2">{item.title}</h4>
                          <p className="text-xs text-gray-500">{item.quantity} x {formatRupiah(item.price)}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-brand-green text-sm">{formatRupiah(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatRupiah(getCartTotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Ongkos Kirim {selectedService ? `(${selectedCourier.toUpperCase()} ${selectedService.service})` : ''}</span>
                    <span className={selectedService ? "font-medium" : "italic text-gray-400"}>
                      {selectedService ? formatRupiah(selectedService.cost[0].value) : "Pilih kurir"}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-brand-text pt-2 border-t border-gray-100">
                    <span>Total Estimasi</span>
                    <span className="text-brand-green">
                      {formatRupiah(getCartTotal() + (selectedService ? selectedService.cost[0].value : 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
            <Script 
        src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' ? "https://app.midtrans.com/snap/snap.js" : "https://app.sandbox.midtrans.com/snap/snap.js"}
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-YOUR_CLIENT_KEY_HERE'}
      />
      
      <ConfirmModal 
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelOrder}
        title="Batalkan Pesanan?"
        description="Apakah Anda yakin ingin membatalkan pesanan sebelumnya? Stok produk akan dikembalikan sehingga Anda dapat memesan kembali."
        confirmText="Ya, Batalkan"
        cancelText="Kembali"
        isDestructive={true}
        isLoading={isCancelling}
      />
    </>
  );
}
