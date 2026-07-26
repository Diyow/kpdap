import { createClient } from "@supabase/supabase-js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, User } from "lucide-react";
import BusinessUnitsSection from "../components/BusinessUnitsSection";

export default async function BlogPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex flex-col">
        {/* Hero Section */}
        <div className="bg-brand-darkgreen text-white py-16 px-4 md:px-8 relative overflow-hidden text-center">
          <div className="absolute inset-0 opacity-20">
            <Image
              src="/sp.webp"
              alt="Nature background"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-brand-lightbg leading-tight">
              Kabar KPDAP
            </h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
              Dapatkan informasi terbaru seputar pertanian, inovasi produk, dan kegiatan KPDAP dalam memajukan pertanian Indonesia.
            </p>
          </div>
        </div>

        <div className="flex-1 w-full max-w-6xl mx-auto py-16 px-4">
          {!articles || articles.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="text-gray-400 w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Belum Ada Artikel</h3>
              <p className="text-gray-500">Artikel dan berita terbaru akan segera hadir di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article) => (
                <Link href={`/blog/${article.slug}`} key={article.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:-translate-y-1">
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={article.cover_image_url || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=800"}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-brand-darkgreen text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {new Date(article.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-brand-green transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed flex-1">
                      {article.excerpt || article.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...'}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <User size={14} className="text-gray-400" />
                        Admin KPDAP
                      </div>
                      <span className="text-brand-green text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                        Baca <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <BusinessUnitsSection />
      </main>
      <Footer />
    </>
  );
}
