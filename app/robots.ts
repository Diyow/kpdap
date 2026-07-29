import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout/'],
        // CrawlDelay is respected by Bing, Yandex, and many AI bots
        // This ensures they wait 2 seconds between requests, protecting your server
        crawlDelay: 2,
      },
      {
        // Explicitly block common aggressive AI scrapers
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'ClaudeBot', 'anthropic-ai', 'PerplexityBot'],
        disallow: ['/'],
      }
    ],
    sitemap: 'https://kpdap.com/sitemap.xml',
  };
}
