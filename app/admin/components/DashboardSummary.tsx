"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Banknote,
  Clock,
  CheckCircle,
  Package,
  ChevronRight,
  Plus,
  ShoppingCart,
  Loader2,
  Users,
  Activity,
  TrendingUp,
  Truck,
  Ban
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/app/components/ui/Skeleton";

type DashboardSummaryProps = {
  onNavigate: (tabId: string) => void;
};

type Order = {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

export default function DashboardSummary({ onNavigate }: DashboardSummaryProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<{ date: string, total: number }[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // 1. Fetch Paid Orders for Revenue & Count
      const { data: paidOrdersData } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .in("status", ["paid", "processing", "shipped", "completed"]);

      const revenue = paidOrdersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const paidCount = paidOrdersData?.length || 0;

      // Calculate chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          dateString: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
          display: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          total: 0
        };
      });

      paidOrdersData?.forEach(order => {
        const d = new Date(order.created_at);
        const orderDateString = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const dayMatch = last7Days.find(d => d.dateString === orderDateString);
        if (dayMatch) {
          dayMatch.total += order.total_amount;
        }
      });

      setChartData(last7Days.map(d => ({ date: d.display, total: d.total })));

      // 2. Fetch Pending Orders Count
      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: 'exact', head: true })
        .eq("status", "pending");

      // 3. Fetch Total Products Count
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: 'exact', head: true });

      // 4. Fetch 5 Recent Orders
      const { data: recentOrdersData } = await supabase
        .from("orders")
        .select("id, customer_name, total_amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalRevenue: revenue,
        pendingOrders: pendingCount || 0,
        paidOrders: paidCount,
        totalProducts: productsCount || 0
      });

      setRecentOrders(recentOrdersData || []);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatCompactRupiah = (value: number) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1).replace('.0', '')}jt`;
    if (value >= 1000) return `Rp ${(value / 1000).toFixed(1).replace('.0', '')}rb`;
    return `Rp ${value}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': 
        return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"><CheckCircle size={12} /> Selesai</span>;
      case 'paid': 
        return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"><CheckCircle size={12} /> Lunas</span>;
      case 'processing': 
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"><Package size={12} /> Diproses</span>;
      case 'shipped': 
        return <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"><Truck size={12} /> Dikirim</span>;
      case 'pending': 
        return <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"><Clock size={12} /> Menunggu</span>;
      case 'failed': case 'expired': case 'cancelled': 
        return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"><Ban size={12} /> {status === 'cancelled' ? 'Dibatalkan' : 'Gagal'}</span>;
      default: 
        return <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 flex flex-col gap-4">
              <Skeleton className="h-4 w-20 sm:w-32" />
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-24" />
            </div>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-lg hover:border-emerald-100 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300">
              <Banknote size={20} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold tracking-wide uppercase">Pendapatan</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{formatRupiah(stats.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-lg hover:border-orange-100 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-2.5 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 group-hover:bg-orange-100 transition-all duration-300">
              <Clock size={20} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold tracking-wide uppercase">Menunggu</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{stats.pendingOrders}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-lg hover:border-brand-green/20 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-2.5 bg-brand-green/10 text-brand-green rounded-xl group-hover:scale-110 group-hover:bg-brand-green/20 transition-all duration-300">
              <CheckCircle size={20} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold tracking-wide uppercase">Selesai</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{stats.paidOrders}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-lg hover:border-gray-200 group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 sm:p-2.5 bg-gray-100 text-gray-600 rounded-xl group-hover:scale-110 group-hover:bg-gray-200 transition-all duration-300">
              <Package size={20} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-semibold tracking-wide uppercase">Total Produk</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">{stats.totalProducts}</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-brand-lightbg text-brand-green rounded-lg">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-text">Tren Pendapatan</h2>
            <p className="text-sm text-gray-500">7 Hari Terakhir</p>
          </div>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                tickFormatter={formatCompactRupiah}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                width={80}
              />
              <Tooltip
                formatter={(value: any) => [formatRupiah(Number(value) || 0), "Pendapatan"]}
                cursor={{ fill: 'rgba(243, 244, 246, 0.4)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
              />
              <Bar
                dataKey="total"
                fill="#2E7D32"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-brand-text">Pesanan Terbaru</h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-brand-green text-sm font-medium hover:underline flex items-center"
            >
              Lihat Semua <ChevronRight size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-widest">
                  <th className="p-4 pl-6">Pelanggan</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Total</th>
                  <th className="p-4 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors duration-200 group cursor-pointer" onClick={() => onNavigate('orders')}>
                    <td className="p-4 pl-6 font-semibold text-gray-900 group-hover:text-brand-green transition-colors">{order.customer_name}</td>
                    <td className="p-4 text-gray-500 text-xs font-medium">{new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="p-4 font-bold text-gray-700">{formatRupiah(order.total_amount)}</td>
                    <td className="p-4 pr-6">{getStatusBadge(order.status)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Belum ada pesanan masuk.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-brand-text mb-6">Aksi Cepat</h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('products')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-brand-green/5 border border-gray-100 hover:border-brand-green/20 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-sm active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:text-brand-green transition-all duration-300 group-hover:shadow-sm group-hover:scale-110">
                  <Plus size={18} />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-brand-green transition-colors text-sm">Tambah Produk Baru</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-green group-hover:translate-x-1 transition-all duration-300" />
            </button>

            <button
              onClick={() => onNavigate('orders')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-brand-green/5 border border-gray-100 hover:border-brand-green/20 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-sm active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:text-brand-green transition-all duration-300 group-hover:shadow-sm group-hover:scale-110">
                  <ShoppingCart size={18} />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-brand-green transition-colors text-sm">Kelola Pesanan</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-green group-hover:translate-x-1 transition-all duration-300" />
            </button>

            <button
              onClick={() => onNavigate('admins')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-brand-green/5 border border-gray-100 hover:border-brand-green/20 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-sm active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:text-brand-green transition-all duration-300 group-hover:shadow-sm group-hover:scale-110">
                  <Users size={18} />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-brand-green transition-colors text-sm">Manajemen Admin</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-green group-hover:translate-x-1 transition-all duration-300" />
            </button>

            <button
              onClick={() => onNavigate('logs')}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-brand-green/5 border border-gray-100 hover:border-brand-green/20 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:shadow-sm active:scale-[0.98] group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white group-hover:text-brand-green transition-all duration-300 group-hover:shadow-sm group-hover:scale-110">
                  <Activity size={18} />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-brand-green transition-colors text-sm">Log Aktivitas</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-green group-hover:translate-x-1 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
