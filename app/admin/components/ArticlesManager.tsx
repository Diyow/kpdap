"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, ChevronLeft, ChevronRight, Plus, FileText, Trash2, Edit, Globe, Lock, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import ArticleForm from "./ArticleForm";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { logAdminActivity } from "../actions/logger";

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

const ITEMS_PER_PAGE = 10;

export default function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | undefined>(undefined);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("articles").select("*", { count: "exact" });

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) {
      toast.error("Gagal memuat artikel: " + error.message);
    } else if (data) {
      setArticles(data);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [supabase, searchQuery, currentPage]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchArticles();
  };

  const confirmDelete = (id: string, title: string) => {
    setArticleToDelete({ id, title });
    setDeleteModalOpen(true);
  };

  const handleDeleteArticle = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.from("articles").delete().eq("id", articleToDelete.id);

    if (error) {
      toast.error("Gagal menghapus artikel: " + error.message);
    } else {
      toast.success("Artikel berhasil dihapus");
      await logAdminActivity("DELETE_ARTICLE", `Menghapus artikel: ${articleToDelete.title}`);
      fetchArticles();
    }

    setDeleteModalOpen(false);
    setArticleToDelete(null);
    setIsDeleting(false);
  };

  const handleCreate = () => {
    setSelectedArticle(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchArticles();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (loading && articles.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 hidden sm:table-header-group">
              <tr>
                <th className="px-5 py-4"><Skeleton className="h-4 w-64" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-24" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-32" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-24" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-full max-w-md" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-8 w-20 rounded-lg" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-text mb-1">Artikel & Berita</h2>
            <p className="text-gray-500 text-sm">Kelola konten blog, berita, dan artikel website</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Cari judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none text-sm"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </form>
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-darkgreen transition-colors font-medium text-sm shrink-0"
            >
              <Plus size={18} />
              Tambah Artikel
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-5 py-3.5 font-medium">Judul</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Tanggal Dibuat</th>
                <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {article.cover_image_url ? (
                        <img
                          src={article.cover_image_url}
                          alt={article.title}
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-brand-lightbg flex items-center justify-center text-brand-green shrink-0">
                          <FileText size={20} />
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-brand-text line-clamp-1">{article.title}</span>
                        <span className="text-xs text-gray-400 mt-1 block">/{article.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {article.is_published ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <Globe size={12} /> Publik
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                        <Lock size={12} /> Draf
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-500 text-sm">
                    {new Date(article.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Lihat Artikel"
                      >
                        <ExternalLink size={18} />
                      </a>
                      <button
                        onClick={() => handleEdit(article)}
                        className="p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors"
                        title="Edit Artikel"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(article.id, article.title)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Artikel"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && articles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText size={32} className="text-gray-300" />
                      <p>Tidak ada artikel yang ditemukan.</p>
                    </div>
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
              Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} artikel
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Artikel</h3>
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-700">{articleToDelete?.title}</span>?
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex w-full gap-3 mt-4">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteArticle}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Ya, Hapus"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ArticleForm
          article={selectedArticle}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}
