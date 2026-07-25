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
  TrendingUp
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
        .eq("status", "paid");

      const revenue = paidOrdersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const paidCount = paidOrdersData?.length || 0;

      // Calculate chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          dateObj: d,
          dateString: d.toISOString().split('T')[0],
          display: d.toLocaleDateString('id-ID', { weekday: 'short' }),
          total: 0
        };
      });

      paidOrdersData?.forEach(order => {
        const orderDate = new Date(order.created_at).toISOString().split('T')[0];
        const dayMatch = last7Days.find(d => d.dateString === orderDate);
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
      case 'paid': return <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full text-xs font-medium">Lunas</span>;
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-medium">Menunggu</span>;
      case 'failed': case 'expired': return <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-xs font-medium">Gagal</span>;
      default: return <span className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-0.5 rounded-full text-xs font-medium">{status}</span>;
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Banknote size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-medium leading-tight">Total Pendapatan</h3>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{formatRupiah(stats.totalRevenue)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-orange-50 text-orange-600 rounded-lg">
              <Clock size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-medium leading-tight">Pesanan Menunggu</h3>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.pendingOrders}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-brand-green/10 text-brand-green rounded-lg">
              <CheckCircle size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-medium leading-tight">Pesanan Selesai</h3>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.paidOrders}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-gray-100 text-gray-600 rounded-lg">
              <Package size={18} className="sm:w-5 sm:h-5" />
            </div>
            <h3 className="text-gray-500 text-xs sm:text-sm font-medium leading-tight">Total Produk</h3>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.totalProducts}</p>
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
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar
                dataKey="total"
                fill="#2E7D32"
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
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
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Pelanggan</th>
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {recentOrders.length > 0 ? recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{order.customer_name}</td>
                    <td className="p-4 text-gray-500">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 font-medium text-brand-green">{formatRupiah(order.total_amount)}</td>
                    <td className="p-4">{getStatusBadge(order.status)}</td>
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
          <h2 className="text-lg font-bold text-brand-text mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('products')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-brand-green/10 border border-gray-100 hover:border-brand-green/30 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:text-brand-green transition-colors shadow-sm">
                  <Plus size={18} />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-brand-green transition-colors">Tambah Produk Baru</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-brand-green transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('orders')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-brand-green/10 border border-gray-100 hover:border-brand-green/30 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:text-brand-green transition-colors shadow-sm">
                  <ShoppingCart size={18} />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-brand-green transition-colors">Kelola Pesanan</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-brand-green transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('admins')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-brand-green/10 border border-gray-100 hover:border-brand-green/30 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:text-brand-green transition-colors shadow-sm">
                  <Users size={18} />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-brand-green transition-colors">Manajemen Admin</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-brand-green transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('logs')}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-brand-green/10 border border-gray-100 hover:border-brand-green/30 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg group-hover:text-brand-green transition-colors shadow-sm">
                  <Activity size={18} />
                </div>
                <span className="font-medium text-gray-700 group-hover:text-brand-green transition-colors">Log Aktivitas</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-brand-green transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
