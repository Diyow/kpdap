import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { Calendar, User, Share2, Link2, ArrowLeft, FileQuestion } from "lucide-react";
import ReactMarkdown from "react-markdown";
import ShareButtons from "@/app/components/ShareButtons";
import BackLink from "@/app/components/BackLink";
import EmptyState from "@/app/components/EmptyState";
import type { Metadata } from 'next'

export const runtime = 'edge';

export const revalidate = 60; // Revalidate every minute

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, cover_image_url")
    .eq("slug", decodedSlug)
    .single();

  if (!article) return { title: 'Artikel Tidak Ditemukan - KPDAP' };

  return {
    title: `${article.title} - KPDAP`,
    description: article.excerpt || `Membaca artikel ${article.title} di KPDAP`,
    openGraph: {
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", decodedSlug)
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = !!user;

  if (!article || (!article.is_published && !isAdmin)) {
    return (
      <>
                <EmptyState
          icon={FileQuestion}
          title="Artikel Tidak Ditemukan"
          description="Artikel yang Anda cari mungkin telah dihapus atau tidak tersedia."
          actionText="Kembali ke Semua Artikel"
          actionHref="/blog"
        />
              </>
    );
  }

  const { data: otherArticles } = await supabase
    .from("articles")
    .select("title, slug, excerpt, cover_image_url, created_at")
    .eq("is_published", true)
    .neq("slug", slug)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <>
            <main className="min-h-screen bg-gray-50 flex flex-col pt-24 pb-16">
        <article className="flex-1 w-full max-w-4xl mx-auto px-4">
          
          <BackLink href="/blog" text="Kembali ke Semua Artikel" className="mb-8" />

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Cover Image */}
            {article.cover_image_url && (
              <div className="w-full aspect-[21/9] bg-gray-100 relative">
                <img 
                  src={article.cover_image_url} 
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8 md:p-12 lg:p-16">
              {/* Header Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium mb-6">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <Calendar size={14} className="text-brand-green" />
                  {new Date(article.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <User size={14} className="text-brand-green" />
                  Admin KPDAP
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-brand-text mb-8 leading-tight">
                {article.title}
              </h1>

              {/* Content */}
              <div className="prose prose-brand max-w-none">
                <ReactMarkdown>
                  {article.content}
                </ReactMarkdown>
              </div>

              {/* Footer Actions */}
              <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-500 font-medium">
                  Terakhir diperbarui: {new Date(article.updated_at).toLocaleDateString('id-ID')}
                </div>
                
                <ShareButtons title={article.title} />
              </div>
            </div>
          </div>
          
        </article>
      </main>

      {otherArticles && otherArticles.length > 0 && (
        <section className="py-16 bg-white border-t border-gray-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-text mb-8">
              Cek Artikel Lainnya
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {otherArticles.map((otherArticle) => (
                <Link key={otherArticle.slug} href={`/blog/${otherArticle.slug}`} className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={otherArticle.cover_image_url || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800"}
                      alt={otherArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-xs text-brand-green font-medium mb-3 flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(otherArticle.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h2 className="text-xl font-bold text-brand-text mb-3 group-hover:text-brand-green transition-colors line-clamp-2">
                      {otherArticle.title}
                    </h2>
                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">
                      {otherArticle.excerpt}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      
      {/* Scoped CSS for the article content generated by Quill */}
      <style dangerouslySetInnerHTML={{__html: `
        .article-content h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; line-height: 1.2; }
        .article-content h2 { font-size: 1.875rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; line-height: 1.3; }
        .article-content h3 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151; }
        .article-content p { margin-bottom: 1.25rem; color: #4b5563; }
        .article-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #4b5563; }
        .article-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1.25rem; color: #4b5563; }
        .article-content li { margin-bottom: 0.5rem; }
        .article-content a { color: #10B981; text-decoration: underline; font-weight: 500; }
        .article-content a:hover { color: #047857; }
        .article-content blockquote { border-left: 4px solid #10B981; padding-left: 1rem; font-style: italic; color: #6b7280; margin-bottom: 1.25rem; background: #f9fafb; padding: 1rem; border-radius: 0 0.5rem 0.5rem 0; }
        .article-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 2rem auto; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .article-content pre { background-color: #1f2937; color: #f3f4f6; padding: 1rem; border-radius: 0.75rem; overflow-x: auto; margin-bottom: 1.25rem; font-size: 0.875rem; }
        .article-content code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .article-content strong, .article-content b { font-weight: 700; color: #111827; }
      `}} />
    </>
  );
}
