"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { sanitizeFilterValue } from "@/utils/sanitize";
import toast from "react-hot-toast";
import { Loader2, Search, Filter, Send, MessageCircle, FileText, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Copy, Check, ChevronLeft, ChevronRight, Package, Truck, Ban, Save, ShoppingCart } from "lucide-react";
import { Skeleton } from "@/app/components/ui/Skeleton";
import ConfirmModal from "@/app/components/ConfirmModal";
import { Tooltip } from "@/app/components/ui/Tooltip";
import { Switch } from "@/app/components/ui/Switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/Select";

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  notes: string;
  total_amount: number;
  status: string;
  payment_method: string;
  invoice_sent: boolean;
  tracking_number?: string | null;
  courier?: string | null;
  created_at: string;
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: number;
  quantity: number;
  price_at_time: number;
  product?: {
    title: string;
  };
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;
  
  // To store fetched order items mapped by order id
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  
  // Status and Tracking Update
  const [editingTrackingFor, setEditingTrackingFor] = useState<string | null>(null);
  const [tempTracking, setTempTracking] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "",
    isDestructive: false,
    orderIdToUpdate: "",
    newStatus: "",
  });

  const supabase = createClient();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Refetch when page, debouncedSearch, or filter changes
  useEffect(() => {
    fetchOrders();
  }, [currentPage, debouncedSearch, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string, newTracking?: string) => {
    setIsUpdatingStatus(prev => ({ ...prev, [orderId]: true }));
    
    // If the admin is cancelling the order, we need to restore the stock
    if (newStatus === 'cancelled') {
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id, quantity, variation_name')
          .eq('order_id', orderId);
          
        if (items) {
          for (const item of items) {
            await supabase.rpc('restore_stock_v2', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
              p_variation_name: item.variation_name || null
            });
          }
        }
      } catch (err) {
        console.error("Error restoring stock:", err);
      }
    }

    const updateData: any = { status: newStatus, invoice_sent: false };
    if (newTracking !== undefined) {
      updateData.tracking_number = newTracking;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);
      
    if (error) {
      toast.error("Gagal mengupdate status: " + error.message);
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { 
        ...o, 
        status: newStatus, 
        tracking_number: newTracking ?? o.tracking_number,
        invoice_sent: false 
      } : o));
      if (newTracking !== undefined) {
        setEditingTrackingFor(null);
      }
      
      const orderShortId = orderId.split('-')[0];
      const logMessage = newTracking !== undefined
        ? `Update resi pesanan ${orderShortId}: ${newTracking}`
        : `Ubah status pesanan ${orderShortId} ke ${newStatus}`;
      await import("../actions/logger").then(({ logAdminActivity }) => 
        logAdminActivity("UPDATE_ORDER", logMessage)
      );
    }
    setIsUpdatingStatus(prev => ({ ...prev, [orderId]: false }));
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const openModal = (orderId: string, newStatus: string, title: string, description: string, confirmText: string, isDestructive: boolean = false) => {
    setModalConfig({
      isOpen: true,
      title,
      description,
      confirmText,
      isDestructive,
      orderIdToUpdate: orderId,
      newStatus,
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    
    let query = supabase.from("orders").select("*", { count: 'exact' }).order("created_at", { ascending: false });
    
    // Apply server-side filters
    if (statusFilter !== "all") {
      query = query.eq('status', statusFilter);
    }
    
    if (debouncedSearch) {
      // Search by Order ID (id_text), customer name, phone, email, tracking number, or full UUID
      const sanitized = sanitizeFilterValue(debouncedSearch);
      const trimmed = debouncedSearch.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      
      if (isUUID) {
        query = query.or(`id.eq.${trimmed},id_text.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,tracking_number.ilike.%${sanitized}%`);
      } else {
        query = query.or(`id_text.ilike.%${sanitized}%,customer_name.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,tracking_number.ilike.%${sanitized}%`);
      }
    }
    
    // Apply pagination
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    let { data, count, error } = await query;
    
    // Graceful fallback if id_text column hasn't been migrated yet in Supabase
    if (error && (error.message?.includes('id_text') || error.code === '42703')) {
      let fallbackQuery = supabase.from("orders").select("*", { count: 'exact' }).order("created_at", { ascending: false });
      if (statusFilter !== "all") {
        fallbackQuery = fallbackQuery.eq('status', statusFilter);
      }
      const sanitized = sanitizeFilterValue(debouncedSearch);
      const trimmed = debouncedSearch.trim();
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      if (isUUID) {
        fallbackQuery = fallbackQuery.or(`id.eq.${trimmed},customer_name.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,tracking_number.ilike.%${sanitized}%`);
      } else {
        fallbackQuery = fallbackQuery.or(`customer_name.ilike.%${sanitized}%,customer_phone.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%,tracking_number.ilike.%${sanitized}%`);
      }
      const res = await fallbackQuery.range(from, to);
      data = res.data;
      count = res.count;
      error = res.error;
    }
    
    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const toggleOrderExpand = async (orderId: string) => {
    const isExpanded = expandedOrders.includes(orderId);
    
    if (isExpanded) {
      setExpandedOrders(prev => prev.filter(id => id !== orderId));
      return;
    }

    setExpandedOrders(prev => [...prev, orderId]);
    
    // Fetch items if not already fetched
    if (!orderItemsMap[orderId]) {
      setLoadingItems(prev => ({ ...prev, [orderId]: true }));
      const { data, error } = await supabase
        .from('order_items')
        .select('*, product:products(title)')
        .eq('order_id', orderId);
        
      if (!error && data) {
        setOrderItemsMap(prev => ({ ...prev, [orderId]: data as OrderItem[] }));
      }
      setLoadingItems(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'paid': return 'bg-green-50 text-green-700 border-green-200';
      case 'processing': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'shipped': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed': case 'expired': case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle size={14} className="mr-1" />;
      case 'paid': return <CheckCircle size={14} className="mr-1" />;
      case 'processing': return <Package size={14} className="mr-1" />;
      case 'shipped': return <Truck size={14} className="mr-1" />;
      case 'pending': return <Clock size={14} className="mr-1" />;
      case 'failed': case 'expired': case 'cancelled': return <Ban size={14} className="mr-1" />;
      default: return null;
    }
  };

  const getInvoiceMessage = (order: Order) => {
    const items = orderItemsMap[order.id] || [];
    
    let itemsText = "Sedang memuat detail pesanan...";
    if (items.length > 0) {
      itemsText = items.map(item => 
        `- ${item.product?.title || 'Produk'} (${item.quantity}x) = ${formatRupiah(item.price_at_time * item.quantity)}`
      ).join('\n');
    }

    const trackUrl = `${window.location.origin}/checkout/success?order_id=${order.id}`;
    const orderIdShort = order.id.split('-')[0];

    const baseHeader = `Halo *${order.customer_name}*, ini KPDAP.\n\n*Detail Pesanan (ID: ${orderIdShort}):*\n${itemsText}\n\n*Total: ${formatRupiah(order.total_amount)}*\n\n`;

    switch (order.status) {
      case 'pending':
        return `*PENGINGAT PEMBAYARAN - KPDAP*\n\n` + baseHeader +
          `Kami mengingatkan bahwa pesanan Anda belum dibayar. Mohon segera selesaikan pembayaran sebelum batas waktu berakhir agar pesanan tidak dibatalkan otomatis oleh sistem.\n\n` +
          `Gunakan ID Pesanan *${orderIdShort}* atau klik link berikut untuk melanjutkan pembayaran:\n${trackUrl}\n\nTerima kasih!`;
      
      case 'shipped':
        return `*INFO PENGIRIMAN - KPDAP*\n\n` + baseHeader +
          `Pesanan Anda sedang dalam perjalanan!\n\n` +
          `*Kurir:* ${order.courier || '-'}\n` +
          `*Nomor Resi:* ${order.tracking_number || '-'}\n\n` +
          `Pantau status pesanan Anda secara live menggunakan ID Pesanan *${orderIdShort}* atau klik link berikut:\n${trackUrl}\n\nTerima kasih telah berbelanja!`;

      case 'completed':
        return `*PESANAN SELESAI - KPDAP*\n\n` + baseHeader +
          `Pesanan Anda telah selesai dan diterima. Terima kasih banyak telah berbelanja di KPDAP!\n\n` +
          `Kami berharap Anda puas dengan produk kami. Jangan ragu untuk berbelanja kembali. Semoga harimu menyenangkan!`;

      case 'cancelled':
      case 'failed':
      case 'expired':
        return `*PESANAN DIBATALKAN - KPDAP*\n\n` + baseHeader +
          `Mohon maaf, pesanan Anda telah dibatalkan karena belum ada pembayaran yang diterima atau dibatalkan oleh sistem.\n\n` +
          `Jika Anda masih ingin membeli produk ini, silakan buat pesanan baru di website kami.\n\nTerima kasih!`;

      case 'paid':
      case 'processing':
      default:
        return `*INVOICE PESANAN - KPDAP*\n\n` +
          `Halo *${order.customer_name}*, terima kasih telah berbelanja di KPDAP!\n\n` +
          `*Detail Pesanan (ID: ${orderIdShort}):*\n${itemsText}\n\n` +
          `*Status Pembayaran:* ${order.status.toUpperCase()}\n` +
          `*Metode Pembayaran:* ${order.payment_method || '-'}\n` +
          `*Total: ${formatRupiah(order.total_amount)}*\n\n` +
          `*Alamat Pengiriman:*\n${order.shipping_address}\n\n` +
          `Pesanan Anda sedang kami proses. Pantau status pesanan Anda secara live menggunakan ID Pesanan *${orderIdShort}* atau klik link berikut:\n${trackUrl}\n\nTerima kasih!`;
    }
  };

  const sendWhatsAppInvoice = (order: Order) => {
    const message = getInvoiceMessage(order);
    const encodedMessage = encodeURIComponent(message);
    
    // Format phone number for WhatsApp (e.g. 0812... -> 62812...)
    let formattedPhone = order.customer_phone.replace(/\D/g, ''); // Remove all non-digits
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    }
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Auto-check the invoice_sent
    if (!order.invoice_sent) {
      toggleInvoiceSent(order.id, true);
    }
  };

  const copyToClipboard = async (order: Order) => {
    try {
      const message = getInvoiceMessage(order);
      await navigator.clipboard.writeText(message);
      setCopiedOrderId(order.id);
      setTimeout(() => setCopiedOrderId(null), 2000);
      
      // Auto-check the invoice_sent if they copy it
      if (!order.invoice_sent) {
        toggleInvoiceSent(order.id, true);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const toggleInvoiceSent = async (orderId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoice_sent: !currentStatus } : o));
    
    const { error } = await supabase
      .from('orders')
      .update({ invoice_sent: !currentStatus })
      .eq('id', orderId);
      
    if (error) {
      // Revert if error
      console.error('Error updating invoice_sent status:', error);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, invoice_sent: currentStatus } : o));
    }
  };

  // UI helpers
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-lightbg rounded-xl flex items-center justify-center text-brand-green shrink-0 shadow-sm border border-brand-green/10">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-brand-text mb-2 tracking-tight">Manajemen Pesanan</h2>
            <p className="text-gray-500">Kelola pesanan masuk dan kirim invoice WhatsApp ke pelanggan.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nama, email, no. telepon, resi, atau ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <div className="relative w-full md:w-56 shrink-0 z-10">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            <Filter size={18} />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="pl-10 h-[42px]">
              <SelectValue placeholder="Pilih Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu Pembayaran</SelectItem>
              <SelectItem value="paid">Sudah Dibayar</SelectItem>
              <SelectItem value="processing">Sedang Diproses</SelectItem>
              <SelectItem value="shipped">Sedang Dikirim</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="failed">Gagal / Kadaluarsa</SelectItem>
              <SelectItem value="cancelled">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border border-gray-100 rounded-xl p-5 bg-white shadow-sm flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1 space-y-3 w-full">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-24 rounded-md" />
                  <Skeleton className="h-6 w-16 rounded-md" />
                </div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 mt-4 md:mt-0">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-20 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <FileText className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-bold text-gray-600 mb-2">Tidak Ada Pesanan</h3>
          <p className="text-gray-500">Belum ada pesanan yang sesuai dengan filter pencarian.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
              {/* Order Header Summary */}
              <div 
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrderExpand(order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">ID: {order.id.split('-')[0]}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg truncate">{order.customer_name}</h3>
                  <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <span>{order.customer_phone}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 self-end md:self-auto">
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Total Belanja</div>
                      <div className="font-bold text-brand-green text-lg">{formatRupiah(order.total_amount)}</div>
                    </div>
                    {/* Invoice Sent Status Badge */}
                    <Tooltip content="Klik untuk mengubah status pengiriman invoice">
                      <div 
                        className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer ${order.invoice_sent ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-gray-100 text-gray-500 border-gray-200'} flex items-center gap-1 hover:bg-gray-200 transition-colors`}
                        onClick={(e) => { e.stopPropagation(); toggleInvoiceSent(order.id, order.invoice_sent); }}
                      >
                        {order.invoice_sent ? (
                          <><Check size={10} /> WA Terkirim</>
                        ) : (
                          <><XCircle size={10} /> WA Belum Terkirim</>
                        )}
                      </div>
                    </Tooltip>
                  </div>
                  <button className="text-gray-400 hover:text-brand-green transition-colors">
                    {expandedOrders.includes(order.id) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrders.includes(order.id) && (
                <div className="p-5 border-t border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3 text-sm border-b border-gray-200 pb-2">Informasi Pengiriman</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><span className="font-semibold text-gray-700">Nama:</span> {order.customer_name}</p>
                        <p><span className="font-semibold text-gray-700">No. WA:</span> {order.customer_phone}</p>
                        <p><span className="font-semibold text-gray-700">Email:</span> {order.customer_email || '-'}</p>
                        <p><span className="font-semibold text-gray-700">Alamat:</span> {order.shipping_address}</p>
                        <p><span className="font-semibold text-gray-700">Catatan:</span> {order.notes || '-'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-gray-700 mb-3 text-sm border-b border-gray-200 pb-2">Detail Pembayaran & Produk</h4>
                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p><span className="font-semibold text-gray-700">Metode:</span> <span className="capitalize">{order.payment_method || '-'}</span></p>
                      </div>
                      
                      {loadingItems[order.id] ? (
                        <div className="flex items-center gap-2 text-sm text-brand-green">
                          <Loader2 size={16} className="animate-spin" /> Memuat produk...
                        </div>
                      ) : (
                        <ul className="space-y-2 text-sm border border-gray-200 rounded-lg p-3 bg-white">
                          {(orderItemsMap[order.id] || []).map((item, idx) => (
                            <li key={idx} className="flex justify-between items-start border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                              <span className="text-gray-700">{item.product?.title || 'Produk Terhapus'} <span className="text-gray-400">x{item.quantity}</span></span>
                              <span className="font-medium">{formatRupiah(item.price_at_time * item.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 mt-6 mb-2">
                    <h4 className="font-bold text-gray-700 text-sm mb-3">Tindakan Pesanan</h4>
                    
                    {order.status === 'paid' && (
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          disabled={isUpdatingStatus[order.id]}
                          className="bg-brand-green text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-darkgreen flex items-center gap-2 transition-all shadow-sm"
                        >
                          {isUpdatingStatus[order.id] ? <Loader2 size={16} className="animate-spin" /> : <Package size={16} />}
                          Proses Pesanan
                        </button>
                        <button 
                          onClick={() => openModal(order.id, 'cancelled', 'Batalkan Pesanan', 'Yakin ingin membatalkan pesanan ini? Stok akan dikembalikan.', 'Ya, Batalkan', true)}
                          disabled={isUpdatingStatus[order.id]}
                          className="bg-white text-red-600 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm flex items-center gap-2"
                        >
                          Batalkan
                        </button>
                      </div>
                    )}
                    
                    {order.status === 'processing' && (
                      <div className="bg-brand-green/5 border border-brand-green/20 p-4 rounded-xl">
                        <label className="block text-sm font-bold text-brand-green mb-2">Input Resi & Kirim</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="text" 
                            value={tempTracking}
                            onChange={(e) => setTempTracking(e.target.value)}
                            placeholder="Masukkan nomor resi ekspedisi..."
                            className="flex-1 px-3 py-2 border border-brand-green/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
                            onFocus={() => { if(editingTrackingFor !== order.id) setEditingTrackingFor(order.id); }}
                          />
                          <button 
                            onClick={() => {
                              if (!tempTracking.trim()) { toast.error('Masukkan nomor resi terlebih dahulu!'); return; }
                              updateOrderStatus(order.id, 'shipped', tempTracking);
                            }}
                            disabled={isUpdatingStatus[order.id] || !tempTracking.trim()}
                            className="bg-brand-green text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-brand-darkgreen flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-sm"
                          >
                            {isUpdatingStatus[order.id] ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                            Kirim Pesanan
                          </button>
                          <button 
                            onClick={() => openModal(order.id, 'cancelled', 'Batalkan Pesanan', 'Yakin ingin membatalkan pesanan ini?', 'Ya, Batalkan', true)}
                            disabled={isUpdatingStatus[order.id]}
                            className="bg-white text-red-600 border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            Batalkan
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {(order.status === 'shipped' || order.status === 'completed') && (
                      <div className="w-full sm:w-2/3">
                        <label className="block text-xs text-gray-500 mb-1">Nomor Resi / Pelacakan</label>
                        {editingTrackingFor === order.id ? (
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={tempTracking}
                              onChange={(e) => setTempTracking(e.target.value)}
                              placeholder="Masukkan nomor resi..."
                              className="flex-1 px-3 py-2 border border-brand-green rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green text-sm"
                              autoFocus
                            />
                            <button 
                              onClick={() => updateOrderStatus(order.id, order.status, tempTracking)}
                              disabled={isUpdatingStatus[order.id]}
                              className="bg-brand-green text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center min-w-[40px] hover:bg-brand-darkgreen"
                            >
                              {isUpdatingStatus[order.id] ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            </button>
                            <button 
                              onClick={() => setEditingTrackingFor(null)}
                              className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              readOnly
                              value={order.tracking_number || ""}
                              placeholder="Belum ada resi"
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 font-mono"
                            />
                            <button 
                              onClick={() => {
                                setTempTracking(order.tracking_number || "");
                                setEditingTrackingFor(order.id);
                              }}
                              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 whitespace-nowrap"
                            >
                              Edit Resi
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {order.status === 'pending' && (
                      <div className="flex flex-wrap gap-3">
                        <button 
                          onClick={() => openModal(order.id, 'cancelled', 'Batalkan Paksa', 'Yakin ingin membatalkan pesanan ini secara paksa? Stok akan otomatis dikembalikan ke inventaris.', 'Batalkan Pesanan', true)}
                          disabled={isUpdatingStatus[order.id]}
                          className="bg-white text-red-600 border border-gray-300 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          <Ban size={18} />
                          Batalkan Paksa
                        </button>
                        <p className="text-xs text-gray-500 flex items-center mt-2 w-full">
                          *Gunakan jika pelanggan meminta pembatalan sebelum waktu expired Midtrans (24 jam).
                        </p>
                      </div>
                    )}

                    {order.status === 'shipped' && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button 
                          onClick={() => openModal(order.id, 'completed', 'Tandai Selesai', 'Apakah pelanggan sudah mengkonfirmasi bahwa mereka telah menerima pesanan ini dengan baik?', 'Tandai Selesai')}
                          disabled={isUpdatingStatus[order.id]}
                          className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-200 flex items-center gap-2 transition-all shadow-sm"
                        >
                          <CheckCircle size={16} />
                          Tandai Selesai
                        </button>
                      </div>
                    )}
                    
                    {['failed', 'expired', 'cancelled'].includes(order.status) && (
                      <div className="text-sm text-gray-500 italic flex items-center gap-2">
                        <XCircle size={16} className="text-red-400" />
                        Pesanan ini telah dibatalkan dan stok telah dikembalikan.
                      </div>
                    )}
                    
                    {order.status === 'completed' && (
                      <div className="text-sm text-gray-500 italic flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-500" />
                        Pesanan ini telah selesai.
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-700 text-sm">Pesan Invoice WhatsApp</h4>
                      <div className="flex items-center gap-3">
                        <span className={`text-sm ${order.invoice_sent ? "text-brand-green font-semibold" : "text-gray-500"}`}>
                          {order.invoice_sent ? "Invoice Sudah Dikirim" : "Tandai Sudah Dikirim"}
                        </span>
                        <Switch 
                          checked={order.invoice_sent}
                          onCheckedChange={() => toggleInvoiceSent(order.id, order.invoice_sent)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Pesan ini sudah memuat link tracking otomatis untuk pembeli.</p>
                    <textarea 
                      readOnly 
                      value={getInvoiceMessage(order)} 
                      className="w-full h-32 p-3 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg focus:outline-none resize-none mb-4"
                    />
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(order); }}
                        className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        {copiedOrderId === order.id ? (
                          <><Check size={18} className="text-green-500" /> Disalin</>
                        ) : (
                          <><Copy size={18} /> Salin Teks</>
                        )}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); sendWhatsAppInvoice(order); }}
                        className="bg-brand-green text-white px-5 py-2.5 rounded-lg font-bold hover:bg-brand-darkgreen transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <MessageCircle size={18} />
                        Kirim via WA
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t border-gray-100 gap-4">
              <span className="text-sm text-gray-500">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} pesanan
              </span>
              <div className="flex gap-2">
                <Tooltip content="Halaman Sebelumnya">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronLeft size={20} />
                  </button>
                </Tooltip>
                <div className="flex items-center px-4 font-medium text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                  {currentPage} / {totalPages}
                </div>
                <Tooltip content="Halaman Selanjutnya">
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <ChevronRight size={20} />
                  </button>
                </Tooltip>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => updateOrderStatus(modalConfig.orderIdToUpdate, modalConfig.newStatus)}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        isDestructive={modalConfig.isDestructive}
        isLoading={modalConfig.orderIdToUpdate ? isUpdatingStatus[modalConfig.orderIdToUpdate] : false}
      />
    </div>
  );
}
