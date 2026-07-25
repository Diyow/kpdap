"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, Search, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import Image from "next/image";
import ProductForm from "./ProductForm";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { logAdminActivity } from "../actions/logger";

export type Product = {
  id: number;
  image: string;
  title: string;
  description: string | null;
  price: number;
  badge: string | null;
  stock: number;
  images: string[];
  specifications: Record<string, string>;
  variations: {name: string, price: number}[];
  category_id?: string | null;
  is_active?: boolean;
  weight: number;
};

const ITEMS_PER_PAGE = 10;

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const supabase = createClient();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*", { count: "exact" });

    if (searchQuery) {
      query = query.ilike("title", `%${searchQuery}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query.order("id", { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    
    if (!error && data) {
      setProducts(data);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [supabase, searchQuery, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    
    await supabase.from("products").delete().eq("id", productToDelete.id);
    await logAdminActivity("DELETE_PRODUCT", `Menghapus produk: ${productToDelete.title}`);
    
    fetchProducts();
    setDeleteModalOpen(false);
    setProductToDelete(null);
    setIsDeleting(false);
  };

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
    fetchProducts();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (isEditing || isCreating) {
    return (
      <ProductForm 
        initialData={isEditing} 
        onSave={() => {
          setIsEditing(null);
          setIsCreating(false);
          fetchProducts();
        }}
        onCancel={() => {
          setIsEditing(null);
          setIsCreating(false);
        }}
      />
    );
  }

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
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 hidden sm:table-header-group">
              <tr>
                <th className="px-5 py-4"><Skeleton className="h-4 w-12" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-32" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-16" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-12" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-24" /></th>
                <th className="px-5 py-4"><Skeleton className="h-4 w-16 ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {[1, 2, 3, 4, 5].map(i => (
                <tr key={i} className="flex flex-col sm:table-row">
                  <td className="px-5 py-4"><Skeleton className="h-14 w-14 rounded-lg" /></td>
                  <td className="px-5 py-4">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-6 w-12 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-5 w-24" /></td>
                  <td className="px-5 py-4">
                    <div className="flex sm:justify-end gap-2">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <Skeleton className="h-9 w-9 rounded-lg" />
                    </div>
                  </td>
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
          <h2 className="text-2xl font-bold text-brand-text mb-1">Produk</h2>
          <p className="text-gray-500 text-sm">Kelola katalog produk Anda</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 sm:w-64">
            <input 
              type="text" 
              placeholder="Cari produk..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none text-sm"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </form>
          
          <button onClick={() => setIsCreating(true)} className="flex items-center justify-center gap-2 bg-brand-green text-white px-5 py-2 rounded-lg font-medium hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md text-sm whitespace-nowrap">
            <Plus size={18} />
            Tambah Produk
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-5 py-3.5 font-medium">Gambar</th>
              <th className="px-5 py-3.5 font-medium">Judul</th>
              <th className="px-5 py-3.5 font-medium">Status</th>
              <th className="px-5 py-3.5 font-medium">Stok</th>
              <th className="px-5 py-3.5 font-medium">Harga</th>
              <th className="px-5 py-3.5 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-4 px-5">
                  <div className="w-14 h-14 bg-brand-lightbg rounded-lg overflow-hidden relative flex justify-center items-center border border-gray-100">
                    {product.image ? (
                      <Image src={product.image} alt={product.title} fill className="object-cover" />
                    ) : (
                      <ImageIcon className="text-gray-400" />
                    )}
                  </div>
                </td>
                <td className="py-4 px-5">
                  <div className="font-bold text-brand-text">{product.title}</div>
                  <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">{product.description || "-"}</div>
                </td>
                <td className="py-4 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.is_active ?? true ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                    {(product.is_active ?? true) ? 'Aktif' : 'Draft'}
                  </span>
                </td>
                <td className="py-4 px-5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock && product.stock > 0 ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                    {product.stock || 0}
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-brand-green">{formatRupiah(product.price)}</td>
                <td className="py-4 px-5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsEditing(product)} className="p-2 text-gray-400 hover:text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => confirmDelete(product)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Produk">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Tidak ada produk yang ditemukan.
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
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} dari {totalCount} produk
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle size={24} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Produk</h3>
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-700">{productToDelete?.title}</span>? 
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
                  onClick={handleDeleteProduct}
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
    </div>
  );
}
