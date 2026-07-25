import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (Best effort for serverless)
const rateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_MAX = 5; // max 5 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // per 1 minute

export async function POST(request: Request) {
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

    const body = await request.json();
    const { destination, weight, courier } = body;
    
    // Origin City ID. Default to 447 (Tabanan) or read from env
    const origin = process.env.NEXT_PUBLIC_ORIGIN_CITY_ID || '447';

    if (!destination || !weight || !courier) {
      return NextResponse.json({ error: 'Missing required parameters (destination, weight, courier)' }, { status: 400 });
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RajaOngkir API Key is not configured.' }, { status: 500 });
    }

    const response = await fetch('https://api.rajaongkir.com/starter/cost', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'key': apiKey
      },
      body: new URLSearchParams({
        origin: origin,
        destination: destination.toString(),
        weight: weight.toString(),
        courier: courier.toLowerCase()
      }).toString()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.rajaongkir?.status?.description || 'Failed to fetch shipping cost');
    }

    return NextResponse.json(data.rajaongkir.results);
  } catch (error: any) {
    console.error('RajaOngkir Cost Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
