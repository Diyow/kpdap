"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, ChevronLeft, ChevronRight, UserCircle, Phone, Mail } from "lucide-react";
import { Skeleton } from "@/app/components/ui/Skeleton";
import toast from "react-hot-toast";

export type Customer = {
  phone: string;
  name: string;
  email: string | null;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
};

const ITEMS_PER_PAGE = 10;

export default function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("customers_summary")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query.order("last_order_date", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    
    if (error) {
      console.error("Supabase Error:", error);
      toast.error("Gagal memuat data pelanggan: " + error.message);
    } else if (data) {
      setCustomers(data);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [supabase, searchQuery, currentPage]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchCustomers();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Skeleton className="h-10 w-full sm:w-64 rounded-lg" />
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 hidden sm:table-header-group">
              <tr>
                <th className="px-5 py-4"><Skeleton className="h-4 w-32" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-32" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-24" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-24" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-32" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="flex flex-col sm:table-row">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-text mb-1">Pelanggan</h2>
          <p className="text-gray-500 text-sm">Lihat daftar pelanggan yang pernah berbelanja</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Cari nama, email, atau telepon..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </form>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-5 py-3.5 font-medium">Pelanggan</th>
              <th className="px-5 py-3.5 font-medium">Kontak</th>
              <th className="px-5 py-3.5 font-medium">Total Pesanan</th>
              <th className="px-5 py-3.5 font-medium">Total Belanja</th>
              <th className="px-5 py-3.5 font-medium">Pesanan Terakhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {customers.map((customer) => (
              <tr key={customer.phone} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-lightbg flex items-center justify-center text-brand-green shrink-0">
                      <UserCircle size={20} />
                    </div>
                    <span className="font-bold text-brand-text">{customer.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1.5 text-gray-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-gray-400" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-gray-400" />
                        {customer.email}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center justify-center min-w-[2rem]">
                    {customer.total_orders}
                  </span>
                </td>
                <td className="px-5 py-4 font-bold text-brand-text">
                  {formatRupiah(customer.total_spent)}
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {new Date(customer.last_order_date).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-500">
                  Tidak ada pelanggan yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-2">
          <p className="text-sm text-gray-500">
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} pelanggan
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
