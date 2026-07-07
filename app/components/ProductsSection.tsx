import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function ProductsSection() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: products } = await supabase.from("products").select("*").order("id");

  return (
    <section id="products" className="py-20 px-4 md:px-8 bg-brand-lightbg">
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
            <Link 
              href={`/products/${product.id}`}
              key={product.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col block"
            >
              <div className="relative h-48 w-full">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
                {product.badge && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-brand-text text-xs font-bold px-2 py-1 rounded">
                    {product.badge}
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-brand-text mb-4 text-lg">{product.title}</h3>
                <div className="mt-auto flex justify-between items-center">
                  <span className="font-bold text-brand-green">{product.price}</span>
                  <div className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors">
                    Detail
                  </div>
                </div>
              </div>
            </Link>
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
