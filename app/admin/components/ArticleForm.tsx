"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Loader2, Upload, Trash2, Image as ImageIcon, Globe, Lock, Eye, Code, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import type { Article } from "./ArticlesManager";
import { logAdminActivity } from "../actions/logger";

type ArticleFormProps = {
  article?: Article;
  onClose: () => void;
  onSuccess: () => void;
};

export default function ArticleForm({ article, onClose, onSuccess }: ArticleFormProps) {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [content, setContent] = useState(article?.content || "");
  const [coverImageUrl, setCoverImageUrl] = useState(article?.cover_image_url || "");
  const [isPublished, setIsPublished] = useState(article?.is_published || false);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMarkdownGuide, setShowMarkdownGuide] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!article && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""));
    }
  }, [title, article]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('File harus berupa gambar');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Ukuran gambar maksimal 2MB');
        return;
      }

      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('articles')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('articles')
        .getPublicUrl(filePath);

      setCoverImageUrl(publicUrl);
      toast.success('Gambar berhasil diunggah');
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar: ' + error.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    setCoverImageUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Judul, Slug, dan Konten wajib diisi");
      return;
    }

    setSaving(true);
    try {
      const articleData = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim() || null,
        content: content,
        cover_image_url: coverImageUrl || null,
        is_published: isPublished,
        updated_at: new Date().toISOString()
      };

      if (article) {
        const { error } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", article.id);

        if (error) throw error;
        await logAdminActivity("UPDATE_ARTICLE", `Mengubah artikel: ${title}`);
        toast.success("Artikel berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("articles")
          .insert(articleData);

        if (error) {
          if (error.code === '23505') throw new Error("Slug sudah digunakan, gunakan slug lain");
          throw error;
        }
        await logAdminActivity("CREATE_ARTICLE", `Menulis artikel baru: ${title}`);
        toast.success("Artikel berhasil dibuat");
      }

      onSuccess();
    } catch (error: any) {
      toast.error("Gagal menyimpan artikel: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {article ? "Edit Artikel" : "Tulis Artikel Baru"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="article-form" onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Judul Artikel *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Manfaat Pupuk Organik"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none"
                  />
                </div>

                <div className="flex flex-col h-[500px]">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Konten (Markdown) *</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowMarkdownGuide(true)}
                        className="text-xs text-brand-green hover:underline flex items-center gap-1 font-medium"
                      >
                        <HelpCircle size={14} /> Panduan Markdown
                      </button>
                      <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setShowPreview(false)}
                          className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${!showPreview ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Code size={14} /> Tulis
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className={`px-3 py-1 text-xs font-medium rounded-md flex items-center gap-1 transition-colors ${showPreview ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <Eye size={14} /> Pratinjau
                        </button>
                      </div>
                    </div>
                  </div>

                  {showPreview ? (
                    <div className="w-full h-full p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                      <div className="prose prose-brand max-w-none bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-full">
                        {content ? (
                          <ReactMarkdown>{content}</ReactMarkdown>
                        ) : (
                          <p className="text-gray-400 italic">Belum ada konten...</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <textarea
                      required
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Gunakan Markdown untuk format konten. Contoh: **Tebal**, *Miring*, # Judul..."
                      className="w-full h-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none resize-none font-mono text-sm leading-relaxed"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Ringkasan (Excerpt)</label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Tuliskan ringkasan singkat artikel ini..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ditampilkan di daftar artikel publik (opsional)</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status Publikasi</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPublished(false)}
                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors border ${!isPublished ? 'bg-white border-brand-green text-brand-green shadow-sm' : 'bg-transparent border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                      >
                        <Lock size={16} /> Draf
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPublished(true)}
                        className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors border ${isPublished ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-transparent border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                      >
                        <Globe size={16} /> Publik
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">URL Slug *</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="contoh-judul-artikel"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-colors outline-none text-sm font-mono text-gray-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Gambar Sampul</label>

                  {coverImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
                      <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 bg-white text-gray-700 hover:text-brand-green rounded-lg transition-colors shadow-sm"
                          title="Ganti Gambar"
                        >
                          <Upload size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="p-2 bg-white text-gray-700 hover:text-red-600 rounded-lg transition-colors shadow-sm"
                          title="Hapus Gambar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                      className={`border-2 border-dashed border-gray-200 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-brand-green/50 transition-colors group ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 size={24} className="text-brand-green animate-spin" />
                          <span className="text-sm font-medium text-brand-green">Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <div className="p-3 bg-gray-100 rounded-full group-hover:bg-brand-green/10 group-hover:text-brand-green text-gray-400 transition-colors">
                            <ImageIcon size={24} />
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-medium text-brand-green block">Pilih Gambar</span>
                            <span className="text-xs text-gray-400">PNG, JPG max 2MB</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="article-form"
            disabled={saving || uploadingImage}
            className="px-6 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-brand-darkgreen transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {saving && <Loader2 size={18} className="animate-spin" />}
            {saving ? "Menyimpan..." : (article ? "Simpan Perubahan" : "Terbitkan Artikel")}
          </button>
        </div>

      </div>

      {/* Markdown Guide Modal */}
      {showMarkdownGuide && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm transition-opacity" onClick={() => setShowMarkdownGuide(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">Panduan Penulisan Markdown</h3>
              <button onClick={() => setShowMarkdownGuide(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh] bg-gray-50 text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Format Teks</h4>
                  <p><code className="bg-gray-100 px-1 rounded">**Teks Tebal**</code> &rarr; <strong>Teks Tebal</strong></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">*Teks Miring*</code> &rarr; <em>Teks Miring</em></p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Judul (Heading)</h4>
                  <p><code className="bg-gray-100 px-1 rounded"># Judul Besar</code></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">## Judul Sedang</code></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">### Judul Kecil</code></p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Daftar (List)</h4>
                  <p><code className="bg-gray-100 px-1 rounded">- Poin satu</code><br /><code className="bg-gray-100 px-1 rounded">- Poin dua</code></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">1. Langkah satu</code><br /><code className="bg-gray-100 px-1 rounded">2. Langkah dua</code></p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Link & Kutipan</h4>
                  <p><code className="bg-gray-100 px-1 rounded">[Teks Link](https://web.com)</code></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">&gt; Kutipan Blok</code></p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Gambar & Garis</h4>
                  <p><code className="bg-gray-100 px-1 rounded">![Teks Alternatif](URL Gambar)</code></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">---</code> &rarr; Garis Pembatas</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">Kode (Code)</h4>
                  <p><code className="bg-gray-100 px-1 rounded">`Kode Inline`</code> &rarr; <code>Kode</code></p>
                  <p className="mt-2"><code className="bg-gray-100 px-1 rounded">```</code><br /><code className="bg-gray-100 px-1 text-gray-500">Blok Kode Panjang</code><br /><code className="bg-gray-100 px-1 rounded">```</code></p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button onClick={() => setShowMarkdownGuide(false)} className="px-6 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-darkgreen transition-colors">Tutup Panduan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
