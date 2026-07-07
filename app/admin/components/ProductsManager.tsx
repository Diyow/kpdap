"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

type Product = {
  id: number;
  image: string;
  title: string;
  description: string | null;
  price: string;
  badge: string | null;
  stock: number;
  images: string[];
  specifications: Record<string, string>;
  variations: string[];
};

export default function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  type NewFilePreview = { file: File, url: string, name: string, size: number };
  const [newPreviews, setNewPreviews] = useState<NewFilePreview[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (isEditing) {
      setSelectedThumbnail(isEditing.image);
    } else {
      setSelectedThumbnail(null);
    }
    setNewPreviews([]);
  }, [isEditing, isCreating]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("products").select("*").order("id");
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const resetPreviews = () => {
    setNewPreviews([]);
    setSelectedThumbnail(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const previews = files.map(file => ({
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size
      }));
      setNewPreviews(prev => {
        const next = [...prev, ...previews];
        if (!selectedThumbnail) setSelectedThumbnail(next[0].url);
        return next;
      });
    }
  };

  const removeNewFile = (index: number) => {
    setNewPreviews(prev => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (selectedThumbnail === removed.url) {
        setSelectedThumbnail(next[0]?.url || (isEditing?.image) || null);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData(e.currentTarget);
    const uploadedUrls: string[] = [];
    let newThumbnailUrl = "";

    for (const preview of newPreviews) {
      const fileExt = preview.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, preview.file);
        
      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrlData.publicUrl);
        if (selectedThumbnail === preview.url) {
          newThumbnailUrl = publicUrlData.publicUrl;
        }
      } else {
        alert("Gagal mengunggah gambar: " + uploadError.message);
        setIsSaving(false);
        return;
      }
    }

    const existingImages = isEditing ? [isEditing.image, ...(isEditing.images || [])].filter(Boolean) : [];
    
    if (selectedThumbnail && existingImages.includes(selectedThumbnail)) {
      newThumbnailUrl = selectedThumbnail;
    }

    if (!newThumbnailUrl && uploadedUrls.length > 0) {
      newThumbnailUrl = uploadedUrls[0];
    } else if (!newThumbnailUrl && existingImages.length > 0) {
      newThumbnailUrl = existingImages[0];
    }

    if (!newThumbnailUrl) {
      alert("Silakan unggah minimal 1 gambar untuk thumbnail.");
      setIsSaving(false);
      return;
    }

    const allUrls = [...existingImages, ...uploadedUrls];
    const finalGallery = Array.from(new Set(allUrls.filter(url => url !== newThumbnailUrl)));

    const variationsStr = formData.get("variations") as string;
    const variationsArray = variationsStr ? variationsStr.split(',').map(v => v.trim()).filter(Boolean) : [];

    const productData = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      price: formData.get("price") as string,
      image: newThumbnailUrl,
      images: finalGallery,
      badge: (formData.get("badge") as string) || null,
      stock: parseInt((formData.get("stock") as string) || "0", 10),
      variations: variationsArray,
      specifications: {
        origin: formData.get("spec_origin") as string || "",
        process: formData.get("spec_process") as string || "",
        taste_notes: formData.get("spec_notes") as string || "",
      },
    };

    if (isEditing) {
      await supabase.from("products").update(productData).eq("id", isEditing.id);
    } else {
      await supabase.from("products").insert([productData]);
    }
    
    setIsEditing(null);
    setIsCreating(false);
    setIsSaving(false);
    resetPreviews();
    fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-brand-green" size={32} />
      </div>
    );
  }

  if (isEditing || isCreating) {
    const product = isEditing || { 
      title: "", description: "", price: "", image: "", badge: "", 
      stock: 0, images: [], variations: [], 
      specifications: { origin: "", process: "", taste_notes: "" } 
    };
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-brand-text mb-6">
          {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
        </h2>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Judul Produk</label>
            <input name="title" defaultValue={product.title} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Deskripsi Produk (Opsional)</label>
            <textarea name="description" defaultValue={product.description || ""} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Harga (Cth., Rp 75.000)</label>
            <input name="price" defaultValue={product.price} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Stok Tersedia</label>
              <input type="number" name="stock" defaultValue={product.stock || 0} min="0" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Label/Badge (Opsional)</label>
              <input name="badge" defaultValue={product.badge || ""} placeholder="Cth., Best Seller" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Variasi (Pisahkan dengan koma)</label>
            <input name="variations" defaultValue={(product.variations || []).join(", ")} placeholder="Cth., 250g, 500g, 1kg" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg space-y-4">
            <h3 className="font-semibold text-brand-text text-sm mb-2">Spesifikasi Detail (Opsional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Origin (Asal)</label>
                <input name="spec_origin" defaultValue={product.specifications?.origin || ""} placeholder="Cth., Tabanan, Bali" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Process (Proses)</label>
                <input name="spec_process" defaultValue={product.specifications?.process || ""} placeholder="Cth., Honey Process" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-brand-green" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Taste Notes</label>
                <input name="spec_notes" defaultValue={product.specifications?.taste_notes || ""} placeholder="Cth., Caramel, Chocolate" className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:border-brand-green" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text mb-1">Upload Gambar (Pilih beberapa sekaligus)</label>
              <input type="file" accept="image/*" multiple onChange={handleFilesChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green file:text-white hover:file:bg-brand-darkgreen" />
              <p className="text-xs text-gray-500 mt-2">Klik pada gambar di bawah untuk menjadikannya <strong>Thumbnail (Gambar Utama)</strong>.</p>
            </div>
            
            {(isEditing || newPreviews.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                {/* Existing Images */}
                {isEditing && [isEditing.image, ...(isEditing.images || [])].filter(Boolean).map((url, idx) => (
                  <div 
                    key={`existing-${idx}`} 
                    onClick={() => setSelectedThumbnail(url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedThumbnail === url ? 'border-brand-green shadow-md scale-105' : 'border-gray-200 hover:border-brand-green/50'
                    }`}
                  >
                    <Image src={url} alt={`Existing ${idx}`} fill className="object-cover" />
                    {selectedThumbnail === url && (
                      <div className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        Thumbnail
                      </div>
                    )}
                  </div>
                ))}

                {/* New Previews */}
                {newPreviews.map((preview, idx) => (
                  <div 
                    key={`new-${idx}`} 
                    onClick={() => setSelectedThumbnail(preview.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all group ${
                      selectedThumbnail === preview.url ? 'border-brand-green shadow-md scale-105' : 'border-brand-green/30 hover:border-brand-green/50'
                    }`}
                  >
                    <Image src={preview.url} alt={preview.name} fill className="object-cover" />
                    {selectedThumbnail === preview.url && (
                      <div className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        Thumbnail
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeNewFile(idx); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] p-1 truncate text-center">
                      {formatSize(preview.size)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-brand-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md disabled:opacity-70 disabled:cursor-not-allowed">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSaving ? "Menyimpan..." : "Simpan Produk"}
            </button>
            <button type="button" onClick={() => { setIsEditing(null); setIsCreating(false); resetPreviews(); }} className="bg-gray-100 text-brand-text px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Batal
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-brand-text mb-1">Produk</h2>
          <p className="text-gray-500 text-sm">Kelola katalog produk Anda</p>
        </div>
        <button onClick={() => { setIsCreating(true); resetPreviews(); }} className="flex items-center gap-2 bg-brand-green text-white px-5 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all shadow-sm hover:shadow-md text-sm">
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-brand-lightbg border-b border-gray-100">
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Gambar</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Judul</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Stok</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Harga</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm">Label</th>
              <th className="py-4 px-5 font-semibold text-brand-text text-sm text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
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
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock && product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {product.stock || 0}
                  </span>
                </td>
                <td className="py-4 px-5 font-medium text-brand-green">{product.price}</td>
                <td className="py-4 px-5">
                  {product.badge && (
                    <span className="bg-yellow-400/20 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">
                      {product.badge}
                    </span>
                  )}
                </td>
                <td className="py-4 px-5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setIsEditing(product); resetPreviews(); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  Tidak ada produk yang ditemukan. Tambahkan produk untuk memulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
