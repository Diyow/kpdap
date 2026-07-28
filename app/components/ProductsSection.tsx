import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import ProductCard from "./ProductCard";

export default async function ProductsSection() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: products } = await supabase.from("products").select("*").eq("is_active", true).order("id");

  return (
    <section id="products" className="py-20 px-4 md:px-8 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-brand-text mb-2">Produk Pilihan</h2>
            <p className="text-gray-500">Favorit pelanggan dan anggota kami bulan ini.</p>
          </div>
          <Link href="/products" className="text-brand-green font-medium hover:underline flex items-center gap-1 text-sm hidden sm:flex">
            Lihat Semua &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
        
        <div className="mt-8 text-center sm:hidden">
          <Link href="/products" className="text-brand-green font-medium hover:underline inline-flex items-center gap-1 text-sm">
            Lihat Semua &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
