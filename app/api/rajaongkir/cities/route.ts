import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (Best effort for serverless)
const rateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_MAX = 5; // max 5 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // per 1 minute

export async function GET(request: Request) {
  try {
    // --- Rate Limiting Logic ---
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();
    
    if (rateLimit.has(ip)) {
      const rateData = rateLimit.get(ip)!;
      if (now - rateData.timestamp < RATE_LIMIT_WINDOW) {
        if (rateData.count >= RATE_LIMIT_MAX) {
          return NextResponse.json({ error: 'Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit.' }, { status: 429 });
        }
        rateData.count++;
      } else {
        rateLimit.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateLimit.set(ip, { count: 1, timestamp: now });
    }
    // --- End Rate Limiting ---

    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('province');

    if (!provinceId) {
      return NextResponse.json({ error: 'Province ID is required' }, { status: 400 });
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RajaOngkir API Key is not configured.' }, { status: 500 });
    }

    const response = await fetch(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
      headers: {
        'key': apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.rajaongkir?.status?.description || 'Failed to fetch cities');
    }

    return NextResponse.json(data.rajaongkir.results);
  } catch (error: any) {
    console.error('RajaOngkir City Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
