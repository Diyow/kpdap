"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Script from "next/script";
import { CheckCircle, Home, FileText, Clock, XCircle, RefreshCw, Truck, Package, Ban, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Skeleton } from "@/app/components/ui/Skeleton";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useCartStore } from "@/store/useCartStore";

declare global {
  interface Window {
    snap: any;
  }
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const tokenUrl = searchParams.get("token");
  const { setPendingOrderId, pendingOrderToken } = useCartStore();
  
  // Use token from URL if available, otherwise from store
  const activeToken = tokenUrl || pendingOrderToken;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async (isManualRefresh = false) => {
    if (isManualRefresh) setLoading(true);
    try {
      const res = await fetch('/api/order/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    }
    setLoading(false);
  };

  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCompleteOrder = async () => {
    setIsCompleting(true);
    try {
      const res = await fetch('/api/order/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId,
          completion_token: activeToken 
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Terima kasih! Pesanan telah diselesaikan.');
      setShowCompleteModal(false);
      fetchOrder(true);
    } catch (err: any) {
      toast.error('Gagal menyelesaikan pesanan: ' + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch('/api/checkout/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId,
          completion_token: activeToken
        })
      });
      if (res.ok) {
        toast.success("Pesanan berhasil dibatalkan. Stok telah dikembalikan.");
        setShowCancelModal(false);
        setPendingOrderId(null);
        fetchOrder(true);
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

  const handlePayNow = () => {
    if (order && order.payment_token && window.snap) {
      window.snap.pay(order.payment_token, {
        onSuccess: function () {
          setPendingOrderId(null);
          fetchOrder(true);
        },
        onPending: function () {
          fetchOrder(true);
        },
        onError: function () {
          toast.error("Pembayaran gagal!");
          fetchOrder(true);
        },
        onClose: function () {
          fetchOrder(true);
        }
      });
    } else {
      toast.error("Sistem pembayaran belum siap atau token tidak valid.");
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const getStatusDisplay = (status?: string) => {
    switch(status) {
      case 'completed':
        return {
          icon: <CheckCircle className="text-emerald-500 w-12 h-12" />,
          bg: "bg-emerald-100",
          title: "Pesanan Selesai",
          desc: "Pesanan Anda telah selesai. Terima kasih telah berbelanja di KPDAP!"
        };
      case 'shipped':
        return {
          icon: <Truck className="text-indigo-500 w-12 h-12" />,
          bg: "bg-indigo-100",
          title: "Pesanan Sedang Dikirim",
          desc: "Pesanan Anda sedang dalam perjalanan ke alamat tujuan. Silakan cek nomor resi pengiriman."
        };
      case 'processing':
        return {
          icon: <Package className="text-blue-500 w-12 h-12" />,
          bg: "bg-blue-100",
          title: "Pesanan Sedang Diproses",
          desc: "Pesanan Anda sedang kami siapkan dan akan segera dikirim."
        };
      case 'paid':
        return {
          icon: <CheckCircle className="text-green-500 w-12 h-12" />,
          bg: "bg-green-100",
          title: "Pembayaran Berhasil!",
          desc: "Terima kasih telah berbelanja di KPDAP. Pembayaran Anda telah kami terima dan pesanan sedang diproses. Anda akan menerima invoice dan informasi pengiriman segera."
        };
      case 'cancelled':
      case 'failed':
      case 'expired':
        return {
          icon: <Ban className="text-red-500 w-12 h-12" />,
          bg: "bg-red-100",
          title: "Pesanan Gagal/Dibatalkan",
          desc: "Maaf, pesanan Anda gagal, dibatalkan, atau telah kadaluarsa."
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="text-yellow-500 w-12 h-12" />,
          bg: "bg-yellow-100",
          title: "Menunggu Pembayaran",
          desc: "Pesanan Anda telah kami terima. Silakan selesaikan pembayaran sesuai dengan metode yang Anda pilih. Hubungi kami jika Anda membutuhkan bantuan."
        };
    }
  };

  const statusDisplay = getStatusDisplay(order?.status);

  return (
    <>
            <main className="flex-1 w-full bg-brand-lightbg flex items-center justify-center py-20 px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100 max-w-xl w-full text-center">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center mb-8">
              <Skeleton className="w-20 h-20 rounded-full mb-6" />
              <Skeleton className="h-10 w-64 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <>
              <div className={`w-20 h-20 ${statusDisplay.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                {statusDisplay.icon}
              </div>
              <h1 className="text-3xl font-extrabold text-brand-text mb-4">{statusDisplay.title}</h1>
              <p className="text-gray-500 mb-8 leading-relaxed">
                {statusDisplay.desc}
              </p>
            </>
          )}

          {loading ? (
            <div className="flex flex-col gap-3 max-w-xs mx-auto mb-8">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          ) : order ? (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FileText size={18} /> Detail Pesanan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-400 mb-1">ID Pesanan</span>
                  <span className="font-medium text-gray-800 break-all">{order.id}</span>
                </div>
                <div>
                  <span className="block text-gray-400 mb-1">Total Pembayaran</span>
                  <span className="font-bold text-brand-green">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(order.total_amount)}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-400 mb-1">Status Pesanan</span>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' : 
                      order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' : 
                      ['failed', 'expired', 'cancelled'].includes(order.status) ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => fetchOrder(true)}
                        disabled={loading}
                        className="text-brand-green hover:text-brand-darkgreen text-sm flex items-center gap-1.5 font-bold disabled:opacity-50 transition-colors"
                        title="Perbarui Status"
                      >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        <span className="hidden sm:inline">Perbarui</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="block text-gray-400 mb-1">Metode Pembayaran</span>
                  <span className="font-medium text-gray-800 capitalize">{order.payment_method || '-'}</span>
                </div>
                {order.tracking_number && (
                  <div className="col-span-1 md:col-span-2 mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <span className="block text-indigo-800 font-bold mb-2">Nomor Resi / Pelacakan</span>
                    <span className="font-mono text-lg text-indigo-900 tracking-wider bg-white px-4 py-2 rounded-lg inline-block border border-indigo-200">
                      {order.tracking_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {order?.status === 'shipped' && (
            <div className="mb-8 flex justify-center">
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={isCompleting}
                className="bg-brand-green text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-brand-darkgreen transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
              >
                {isCompleting ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Pesanan Diterima
              </button>
            </div>
          )}

          {order?.status === 'pending' && order?.payment_token && (
            <div className="mb-8 flex flex-col items-center gap-3">
              <button
                onClick={handlePayNow}
                className="w-full sm:w-auto bg-brand-green text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:bg-brand-darkgreen transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Lanjutkan Pembayaran
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isCancelling}
                className="w-full sm:w-auto text-red-500 hover:text-red-700 font-medium px-6 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm disabled:opacity-50"
              >
                <Ban size={16} />
                {isCancelling ? "Membatalkan..." : "Batalkan pesanan ini"}
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products"
              className="px-6 py-3 border-2 border-brand-green text-brand-green font-bold rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              Belanja Lagi
            </Link>
            <Link 
              href="/"
              className="px-6 py-3 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-darkgreen transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} />
              Kembali ke Beranda
            </Link>
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
        description="Apakah Anda yakin ingin membatalkan pesanan ini? Stok produk akan dikembalikan dan Anda harus membuat pesanan baru jika ingin mengubah metode pembayaran."
        confirmText="Ya, Batalkan"
        cancelText="Kembali"
        isDestructive={true}
        isLoading={isCancelling}
      />

      <ConfirmModal 
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleCompleteOrder}
        title="Pesanan Diterima?"
        description="Apakah Anda yakin pesanan sudah Anda terima dengan baik? Aksi ini tidak dapat dibatalkan."
        confirmText="Ya, Selesai"
        cancelText="Batal"
        isLoading={isCompleting}
      />
    </>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div></div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
