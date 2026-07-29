"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { sanitizeFilterValue } from "@/utils/sanitize";
import { Loader2, Search, ChevronLeft, ChevronRight, Activity, Clock, ShieldAlert, CheckCircle, Package, User, PenTool } from "lucide-react";
import { Skeleton } from "@/app/components/ui/Skeleton";

type AdminLog = {
  id: string;
  admin_id: string;
  admin_email: string;
  action_type: string;
  description: string;
  created_at: string;
};

const ITEMS_PER_PAGE = 20;

export default function AdminLogsManager() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("admin_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (debouncedSearch) {
      const sanitized = sanitizeFilterValue(debouncedSearch);
      query = query.or(`admin_email.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query.range(from, to);

    const { data, count, error } = await query;
    if (!error && data) {
      setLogs(data);
      if (count !== null) setTotalCount(count);
    } else {
      console.error("Error fetching logs", error);
    }
    setLoading(false);
  }, [supabase, debouncedSearch, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getActionIcon = (type: string) => {
    if (type.includes("PRODUCT")) return <Package size={16} />;
    if (type.includes("ADMIN") || type.includes("PASSWORD")) return <User size={16} />;
    if (type.includes("ORDER")) return <CheckCircle size={16} />;
    if (type.includes("CATEGORY")) return <PenTool size={16} />;
    return <Activity size={16} />;
  };

  const getActionColor = (type: string) => {
    if (type.includes("DELETE")) return "bg-red-50 text-red-700 border-red-200";
    if (type.includes("CREATE")) return "bg-green-50 text-green-700 border-green-200";
    if (type.includes("UPDATE")) return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-lightbg rounded-xl flex items-center justify-center text-brand-green shrink-0 shadow-sm border border-brand-green/10">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Log Aktivitas Admin</h2>
            <p className="text-sm text-gray-500 mt-1">Pantau semua perubahan dan aktivitas yang dilakukan oleh admin</p>
          </div>
        </div>

        <div className="w-full md:w-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari email atau deskripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Waktu</th>
                <th className="px-5 py-3.5 font-semibold">Admin</th>
                <th className="px-5 py-3.5 font-semibold">Tipe Aksi</th>
                <th className="px-5 py-3.5 font-semibold">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <tr key={i}>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-48" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-md" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-64" /></td>
                    </tr>
                  ))}
                </>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Activity size={32} className="text-gray-300" />
                      <p className="text-gray-500 font-medium">Tidak ada log yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <Clock size={14} />
                        {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">{log.admin_email}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-md border tracking-wide ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{log.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <span className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} log
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center px-4 font-medium text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
