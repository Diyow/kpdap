import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://kpdap.com'; // Update this when you have a real domain

  let productUrls: MetadataRoute.Sitemap = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      );

      // Fetch all products to dynamically add them to the sitemap
      const { data: products } = await supabase
        .from('products')
        .select('id, updated_at');

      if (products) {
        productUrls = products.map((product) => ({
          url: `${baseUrl}/products/${product.id}`,
          lastModified: new Date(product.updated_at || new Date()),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch products for sitemap:", err);
    }
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...productUrls,
  ];
}
