"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Trash2, Plus, UploadCloud, Info } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import type { Product } from "./ProductsManager";
import { logAdminActivity } from "../actions/logger";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/Select";
import { Switch } from "@/app/components/ui/Switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/Tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/app/components/ui/Accordion";

type Category = {
  id: string;
  name: string;
};

type ProductFormProps = {
  initialData?: Product | null;
  onSave: () => void;
  onCancel: () => void;
};

type NewFilePreview = { file: File; url: string; name: string; size: number };

export default function ProductForm({ initialData, onSave, onCancel }: ProductFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialData?.category_id || "");
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [newPreviews, setNewPreviews] = useState<NewFilePreview[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    initialData ? Array.from(new Set([initialData.image, ...(initialData.images || [])].filter(Boolean))) : []
  );
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(initialData?.image || null);
  
  // Backward compatibility for variations
  const [variations, setVariations] = useState<{name: string, price: number, stock: number, weight: number}[]>(
    (initialData?.variations || []).map(v => 
      typeof v === 'string' 
        ? { name: v, price: initialData?.price || 0, stock: initialData?.stock || 0, weight: initialData?.weight || 1000 } 
        : { ...v, stock: v.stock ?? (initialData?.stock || 0), weight: v.weight ?? (initialData?.weight || 1000) }
    )
  );

  const [isUnlimitedStock, setIsUnlimitedStock] = useState(initialData?.stock === -1);

  const [specifications, setSpecifications] = useState<{name: string, value: string}[]>(() => {
    if (!initialData?.specifications) return [];
    return Object.entries(initialData.specifications).map(([k, v]) => ({
      name: k,
      value: v as string
    }));
  });
  
  const [activeTab, setActiveTab] = useState("general");
  
  const supabase = createClient();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error && data) {
      setCategories(data);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    
    const existing = categories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
    if (existing) {
      setSelectedCategory(existing.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
      setIsSavingCategory(false);
      return;
    }

    const slug = newCategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name: newCategoryName.trim(), slug }])
      .select();
      
    if (!error && data && data.length > 0) {
      setCategories([...categories, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCategory(data[0].id);
      setIsAddingCategory(false);
      setNewCategoryName("");
      await logAdminActivity("CREATE_CATEGORY", `Menambahkan kategori: ${data[0].name}`);
    } else {
      toast.error("Gagal menambahkan kategori: " + (error?.message || "Unknown error"));
    }
    
    setIsSavingCategory(false);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeletingCategory(true);

    // Detach this category from any products that might be using it to avoid foreign key constraint errors
    await supabase.from("products").update({ category_id: null }).eq("category_id", categoryToDelete.id);

    const { error } = await supabase.from("categories").delete().eq("id", categoryToDelete.id);
    if (error) {
      toast.error("Gagal menghapus kategori: " + error.message);
    } else {
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      if (selectedCategory === categoryToDelete.id) {
        setSelectedCategory("");
      }
      await logAdminActivity("DELETE_CATEGORY", `Menghapus kategori: ${categoryToDelete.name}`);
      setCategoryToDelete(null);
    }
    setIsDeletingCategory(false);
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
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      const validFiles: File[] = [];
      for (const file of files) {
        if (!allowedMimeTypes.includes(file.type)) {
          toast.error(`File "${file.name}" ditolak: Format harus berupa JPG, PNG, WebP, atau GIF.`);
          continue;
        }
        if (file.size > maxSizeBytes) {
          toast.error(`File "${file.name}" ditolak: Ukuran maksimal 5MB (ukuran file: ${formatSize(file.size)}).`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        const previews = validFiles.map(file => ({
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
    }
    // Reset file input value so selecting the same file again triggers change
    if (e.target) e.target.value = '';
  };

  const removeNewFile = (index: number) => {
    setNewPreviews(prev => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (selectedThumbnail === removed.url) {
        setSelectedThumbnail(next[0]?.url || (initialData?.image) || null);
      }
      return next;
    });
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const titleStr = formData.get("title") as string;
    
    // Manual Validation for better UX across tabs
    if (!titleStr || !titleStr.trim()) {
      setActiveTab("general");
      toast.error("Silakan isi Judul Produk.");
      return;
    }
    
    if (!selectedCategory) {
      setActiveTab("general");
      toast.error("Silakan pilih Kategori Produk.");
      return;
    }
    
    const priceStr = formData.get("price") as string;
    if (!priceStr || parseInt(priceStr) <= 0) {
      setActiveTab("price_stock");
      toast.error("Silakan isi Harga Produk dengan valid.");
      return;
    }
    
    setIsSaving(true);
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
        toast.error("Gagal mengunggah gambar: " + uploadError.message);
        setIsSaving(false);
        return;
      }
    }

    if (selectedThumbnail && existingImages.includes(selectedThumbnail)) {
      newThumbnailUrl = selectedThumbnail;
    }

    if (!newThumbnailUrl && uploadedUrls.length > 0) {
      newThumbnailUrl = uploadedUrls[0];
    } else if (!newThumbnailUrl && existingImages.length > 0) {
      newThumbnailUrl = existingImages[0];
    }

    if (!newThumbnailUrl) {
      setIsSaving(false);
      setActiveTab("media_vars");
      toast.error("Silakan unggah minimal 1 gambar untuk thumbnail.");
      return;
    }

    const allUrls = [...existingImages, ...uploadedUrls];
    const finalGallery = Array.from(new Set(allUrls.filter(url => url !== newThumbnailUrl)));

    const specsObj = specifications.reduce((acc, spec) => {
      if (spec.name.trim() && spec.value.trim()) {
        acc[spec.name.trim()] = spec.value.trim();
      }
      return acc;
    }, {} as Record<string, string>);

    const slugStr = titleStr.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

    const productData = {
      title: titleStr,
      slug: slugStr,
      description: (formData.get("description") as string) || null,
      price: parseInt(formData.get("price") as string) || 0,
      compare_at_price: formData.get("compare_at_price") ? parseInt(formData.get("compare_at_price") as string) : null,
      stock: isUnlimitedStock ? -1 : (parseInt(formData.get("stock") as string) || 0),
      weight: parseInt(formData.get("weight") as string) || 1000,
      badge: (formData.get("badge") as string) || null,
      image: newThumbnailUrl,
      images: finalGallery,
      variations: variations,
      category_id: selectedCategory || null,
      is_active: formData.get("is_active") === "on",
      specifications: specsObj,
    };

    if (initialData) {
      await supabase.from("products").update(productData).eq("id", initialData.id);
      // Fire-and-forget: don't block save on the logging Server Action cold-start
      logAdminActivity("UPDATE_PRODUCT", `Memperbarui produk: ${productData.title}`).catch(console.error);
      
      // Cleanup deleted images from storage
      const initialImages = [initialData.image, ...(initialData.images || [])].filter(Boolean);
      const newImages = [newThumbnailUrl, ...finalGallery].filter(Boolean);
      const deletedImages = initialImages.filter(url => !newImages.includes(url));
      
      if (deletedImages.length > 0) {
        const { deleteStorageFiles } = await import('@/app/actions/storage');
        await deleteStorageFiles(deletedImages, 'product-images');
      }
    } else {
      await supabase.from("products").insert([productData]);
      // Fire-and-forget: don't block save on the logging Server Action cold-start
      logAdminActivity("CREATE_PRODUCT", `Menambahkan produk baru: ${productData.title}`).catch(console.error);
    }
    
    toast.success("Produk berhasil disimpan!");
    setIsSaving(false);
    onSave();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-brand-text mb-6">
        {initialData ? "Edit Produk" : "Tambah Produk Baru"}
      </h2>
      <form onSubmit={handleSave} noValidate className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 w-full flex overflow-x-auto sm:grid sm:grid-cols-3 bg-gray-100/50 p-1.5 rounded-xl justify-start">
            <TabsTrigger value="general" className="py-2.5 text-sm flex-shrink-0">Informasi Dasar</TabsTrigger>
            <TabsTrigger value="price_stock" className="py-2.5 text-sm flex-shrink-0">Harga & Stok</TabsTrigger>
            <TabsTrigger value="media_vars" className="py-2.5 text-sm flex-shrink-0">Media & Variasi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Judul Produk <span className="text-red-500">*</span></label>
            <input name="title" defaultValue={initialData?.title} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-brand-text">Kategori <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                {!isAddingCategory && selectedCategory && (
                  <button 
                    type="button"
                    onClick={() => {
                      const cat = categories.find(c => c.id === selectedCategory);
                      if (cat) setCategoryToDelete({ id: cat.id, name: cat.name });
                    }}
                    className="text-xs font-medium text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
                {!isAddingCategory && (
                  <button 
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-xs font-medium text-brand-green hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Kategori Baru
                  </button>
                )}
              </div>
            </div>
            
            {isAddingCategory ? (
              <div className="flex gap-2">
                <input 
                  autoFocus
                  placeholder="Nama Kategori Baru"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none text-sm" 
                />
                <button 
                  type="button" 
                  onClick={handleAddCategory}
                  disabled={isSavingCategory || !newCategoryName.trim()}
                  className="bg-brand-green text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-brand-darkgreen transition-colors disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                >
                  {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : "Simpan"}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName("");
                  }}
                  className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
              </div>
            ) : (
              <Select 
                name="category_id" 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
                required
              >
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Pilih Kategori</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-brand-text mb-1">Deskripsi Produk (Opsional)</label>
          <textarea name="description" defaultValue={initialData?.description || ""} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50">
          <div>
            <label htmlFor="is_active" className="text-sm font-semibold text-brand-text block">Produk Aktif</label>
            <span className="text-xs text-gray-500">Tampilkan produk ini di katalog publik</span>
          </div>
          <Switch id="is_active" name="is_active" defaultChecked={initialData?.is_active ?? true} />
        </div>
      </TabsContent>

      <TabsContent value="price_stock" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Harga (Rp) <span className="text-red-500">*</span></label>
            <input type="number" name="price" defaultValue={initialData?.price || ""} required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" placeholder="75000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Coret Harga (Opsional)</label>
            <input type="number" name="compare_at_price" defaultValue={initialData?.compare_at_price || ""} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" placeholder="150000" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-brand-text">Stok <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-500 font-medium">Tanpa Batas</span>
                <Switch 
                  checked={isUnlimitedStock} 
                  onCheckedChange={setIsUnlimitedStock} 
                  className="scale-[0.8]"
                />
              </div>
            </div>
            <input type="number" name="stock" defaultValue={initialData?.stock === -1 ? 0 : (initialData?.stock || 0)} min="0" required={!isUnlimitedStock} disabled={isUnlimitedStock} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none disabled:bg-gray-100 disabled:text-gray-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Berat Utama (Gram) <span className="text-red-500">*</span></label>
            <input type="number" name="weight" defaultValue={initialData?.weight || 1000} min="1" required className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" placeholder="1000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Label (Opsional)</label>
            <input name="badge" defaultValue={initialData?.badge || ""} placeholder="Cth., Best Seller" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="media_vars" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        <Accordion type="multiple" className="w-full space-y-4">
          <AccordionItem value="variations" className="border border-gray-200 rounded-xl bg-gray-50/30 px-5 border-b-gray-200">
            <AccordionTrigger className="hover:no-underline">
              <h3 className="font-semibold text-brand-text text-sm">Variasi & Harga Khusus (Opsional)</h3>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-4">
                <div className="flex justify-end mb-3">

            <button 
              type="button" 
              onClick={() => setVariations([...variations, { 
                name: "", 
                price: parseInt((document.querySelector('input[name="price"]') as HTMLInputElement)?.value || "0", 10),
                stock: parseInt((document.querySelector('input[name="stock"]') as HTMLInputElement)?.value || "0", 10),
                weight: parseInt((document.querySelector('input[name="weight"]') as HTMLInputElement)?.value || "1000", 10)
              }])}
              className="text-xs font-medium text-brand-green hover:underline flex items-center gap-1 transition-all duration-200 active:scale-[0.95] ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <Plus size={14} /> Tambah Variasi
            </button>
          </div>
          
          {variations.length > 0 ? (
            <div className="space-y-3">
              {variations.map((v, idx) => (
                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-start p-3 border border-gray-200 rounded-lg bg-white relative">
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Variasi</label>
                    <input 
                      required
                      placeholder="Cth: Size L"
                      value={v.name} 
                      onChange={(e) => {
                        const newVars = [...variations];
                        newVars[idx].name = e.target.value;
                        setVariations(newVars);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-shadow" 
                    />
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Harga</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rp</span>
                      <input 
                        required
                        type="number"
                        placeholder="75000"
                        value={v.price} 
                        onChange={(e) => {
                          const newVars = [...variations];
                          newVars[idx].price = parseInt(e.target.value || "0", 10);
                          setVariations(newVars);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-shadow" 
                      />
                    </div>
                  </div>
                  <div className="w-1/2 md:w-1/5">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stok</label>
                    <input 
                      required
                      type="number"
                      min="0"
                      placeholder="0"
                      value={v.stock} 
                      onChange={(e) => {
                        const newVars = [...variations];
                        newVars[idx].stock = parseInt(e.target.value || "0", 10);
                        setVariations(newVars);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-shadow" 
                    />
                  </div>
                  <div className="w-1/2 md:w-1/5">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Berat (g)</label>
                    <input 
                      required
                      type="number"
                      min="1"
                      placeholder="1000"
                      value={v.weight} 
                      onChange={(e) => {
                        const newVars = [...variations];
                        newVars[idx].weight = parseInt(e.target.value || "0", 10);
                        setVariations(newVars);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-shadow" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setVariations(variations.filter((_, i) => i !== idx))}
                    className="absolute -right-2 -top-2 p-1.5 bg-white text-red-500 shadow-sm border border-gray-200 rounded-full hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg bg-white">
              <p className="text-xs text-gray-500 mb-2">Belum ada variasi produk</p>
              <button 
                type="button" 
                onClick={() => setVariations([{ 
                  name: "", 
                  price: parseInt((document.querySelector('input[name="price"]') as HTMLInputElement)?.value || "0", 10),
                  stock: isUnlimitedStock ? 999 : parseInt((document.querySelector('input[name="stock"]') as HTMLInputElement)?.value || "0", 10),
                  weight: parseInt((document.querySelector('input[name="weight"]') as HTMLInputElement)?.value || "1000", 10)
                }])}
                className="text-xs font-medium text-brand-green hover:underline"
              >
                + Tambah Variasi
              </button>
            </div>
          )}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="specifications" className="border border-gray-200 rounded-xl bg-gray-50/30 px-5 border-b-gray-200">
            <AccordionTrigger className="hover:no-underline">
              <h3 className="font-semibold text-brand-text text-sm">Spesifikasi Tambahan (Opsional)</h3>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-2 pb-4">
                <div className="flex justify-end mb-3">

            <button 
              type="button" 
              onClick={() => setSpecifications([...specifications, { name: "", value: "" }])}
              className="text-xs font-medium text-brand-green hover:underline flex items-center gap-1 transition-all duration-200 active:scale-[0.95] ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <Plus size={14} /> Tambah Spesifikasi
            </button>
          </div>
          
          {specifications.length > 0 ? (
            <div className="space-y-3">
              {specifications.map((s, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <div className="w-1/3">
                    <input 
                      required
                      placeholder="Cth: Bahan"
                      value={s.name} 
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[idx].name = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-shadow" 
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      required
                      placeholder="Cth: Kopi Arabica"
                      value={s.value} 
                      onChange={(e) => {
                        const newSpecs = [...specifications];
                        newSpecs[idx].value = e.target.value;
                        setSpecifications(newSpecs);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:border-brand-green focus:ring-1 focus:ring-brand-green outline-none transition-shadow" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSpecifications(specifications.filter((_, i) => i !== idx))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg bg-white">
              <p className="text-xs text-gray-500 mb-2">Belum ada spesifikasi tambahan</p>
              <button 
                type="button" 
                onClick={() => setSpecifications([{ name: "", value: "" }])}
                className="text-xs font-medium text-brand-green hover:underline"
              >
                + Tambah Spesifikasi
              </button>
            </div>
          )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex flex-col gap-4 p-5 border border-gray-200 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-2">Gambar Produk <span className="text-red-500">*</span></label>
            
            <div className="mb-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-sm">
              <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Aturan Unggah Gambar:</span>
                <span className="ml-1">Format yang diizinkan adalah <strong>JPG, PNG, WebP, GIF</strong> dengan ukuran maksimal <strong>5MB</strong> per file.</span>
              </div>
            </div>

            <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-brand-green/5 hover:border-brand-green/50 transition-colors duration-300 group">
              <input 
                type="file" 
                accept="image/jpeg,image/png,image/webp,image/gif" 
                multiple 
                onChange={handleFilesChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              />
              <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-brand-green transition-colors">
                <UploadCloud size={32} />
                <div className="font-medium">Klik atau Drag & Drop gambar ke sini</div>
                <div className="text-xs text-gray-400">JPG, PNG, WebP, GIF (Maks. 5MB)</div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-brand-green inline-block"></span>
              Klik pada gambar di bawah untuk menjadikannya <strong>Thumbnail (Gambar Utama)</strong>
            </p>
          </div>
          
          {(existingImages.length > 0 || newPreviews.length > 0) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div 
                  key={`existing-${idx}`} 
                  onClick={() => setSelectedThumbnail(url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-300 ease-out group ${
                    selectedThumbnail === url ? 'border-brand-green shadow-md scale-105' : 'border-gray-200 hover:border-brand-green/50 hover:scale-[1.02]'
                  }`}
                >
                  <Image src={url} alt={`Existing ${idx}`} fill className="object-cover" />
                  {selectedThumbnail === url && (
                    <div className="absolute top-2 left-2 bg-brand-green text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                      Thumbnail
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setExistingImages(prev => prev.filter(img => img !== url));
                      if (selectedThumbnail === url) setSelectedThumbnail(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* New Previews */}
              {newPreviews.map((preview, idx) => (
                <div 
                  key={`new-${idx}`} 
                  onClick={() => setSelectedThumbnail(preview.url)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-300 ease-out group ${
                    selectedThumbnail === preview.url ? 'border-brand-green shadow-md scale-105' : 'border-brand-green/30 hover:border-brand-green/50 hover:scale-[1.02]'
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
      </TabsContent>
      </Tabs>

        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
          <button type="submit" disabled={isSaving} className="bg-brand-green text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-darkgreen transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center gap-2 disabled:opacity-50 shadow-sm hover:shadow-md">
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : null}
            {isSaving ? "Menyimpan..." : "Simpan Produk"}
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-100 text-brand-text px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)]">
            Batal
          </button>
        </div>
      </form>

      {/* Category Deletion Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Kategori</h3>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin menghapus kategori <span className="font-semibold text-gray-900">"{categoryToDelete.name}"</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeletingCategory}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                type="button" 
                onClick={confirmDeleteCategory}
                disabled={isDeletingCategory}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingCategory ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {isDeletingCategory ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
