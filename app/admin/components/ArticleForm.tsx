"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Loader2, Upload, Trash2, Image as ImageIcon, Globe, Lock, Eye, Code, HelpCircle, Info } from "lucide-react";
import toast from "react-hot-toast";
import { Tooltip } from "@/app/components/ui/Tooltip";
import { Switch } from "@/app/components/ui/Switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/Dialog";
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
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSizeBytes = 5 * 1024 * 1024; // 5MB

      if (!allowedMimeTypes.includes(file.type)) {
        toast.error('File harus berupa gambar (JPG, PNG, WebP, atau GIF)');
        return;
      }
      if (file.size > maxSizeBytes) {
        toast.error('Ukuran gambar maksimal 5MB');
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
        // Fire-and-forget: don't block save on the logging Server Action cold-start
        logAdminActivity("UPDATE_ARTICLE", `Mengubah artikel: ${title}`).catch(console.error);
        toast.success("Artikel berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("articles")
          .insert(articleData);

        if (error) {
          if (error.code === '23505') throw new Error("Slug sudah digunakan, gunakan slug lain");
          throw error;
        }
        // Fire-and-forget: don't block save on the logging Server Action cold-start
        logAdminActivity("CREATE_ARTICLE", `Menulis artikel baru: ${title}`).catch(console.error);
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
    <>
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brand-text">
          {article ? "Edit Artikel" : "Tulis Artikel Baru"}
        </h2>
      </div>

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
                      <div className="flex bg-gray-100/80 rounded-lg p-1 border border-gray-200/50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                        <button
                          type="button"
                          onClick={() => setShowPreview(false)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 ${!showPreview ? 'bg-white text-brand-green shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                          <Code size={14} /> Tulis
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 ${showPreview ? 'bg-white text-brand-green shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                        >
                          <Eye size={14} /> Pratinjau
                        </button>
                      </div>
                    </div>
                  </div>

                  {showPreview ? (
                    <div className="w-full h-full p-4 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto">
                      <div className="prose prose-brand max-w-none bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 min-h-full ring-1 ring-inset ring-gray-100/50">
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
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-700">Publikasi Artikel</span>
                        <span className="text-xs text-gray-500">{isPublished ? "Tampil di halaman utama" : "Disimpan sebagai draf"}</span>
                      </div>
                      <Switch 
                        checked={isPublished} 
                        onCheckedChange={setIsPublished} 
                      />
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
                        <Tooltip content="Ganti Gambar">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 bg-white text-gray-700 hover:text-brand-green rounded-lg transition-colors shadow-sm"
                          >
                            <Upload size={18} />
                          </button>
                        </Tooltip>
                        <Tooltip content="Hapus Gambar">
                          <button
                            type="button"
                            onClick={removeImage}
                            className="p-2 bg-white text-gray-700 hover:text-red-600 rounded-lg transition-colors shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !uploadingImage && fileInputRef.current?.click()}
                      className={`border-2 border-dashed border-gray-300 rounded-xl aspect-video flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-brand-green/5 hover:border-brand-green/50 transition-colors duration-300 group ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            <span className="text-xs text-gray-400">JPG, PNG, WebP, GIF (Maks. 5MB)</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2">
                    <Info size={15} className="shrink-0 text-amber-600 mt-0.5" />
                    <span><strong>Aturan:</strong> Maksimal 5MB. Format: JPG, PNG, WebP, GIF.</span>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3 mt-8">
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="px-6 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-brand-darkgreen transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                {saving && <Loader2 size={18} className="animate-spin" />}
                {saving ? "Menyimpan..." : (article ? "Simpan Perubahan" : "Terbitkan Artikel")}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-[0.97] ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-50"
              >
                Batal
              </button>
            </div>

          </form>
    </div>

      {/* Markdown Guide Modal */}
      <Dialog open={showMarkdownGuide} onOpenChange={setShowMarkdownGuide}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0 bg-gray-50">
          <DialogHeader className="p-5 border-b border-gray-100 bg-white">
            <DialogTitle>Panduan Penulisan Markdown</DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto max-h-[70vh] text-sm space-y-4">
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
            <button type="button" onClick={() => setShowMarkdownGuide(false)} className="px-6 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-darkgreen transition-colors">
              Tutup Panduan
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
