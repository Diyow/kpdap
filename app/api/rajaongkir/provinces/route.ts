import { NextResponse } from 'next/server';

import { checkRateLimit, getIpAddress } from '@/utils/rate-limit';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // 1. Rate Limiting Check (e.g., 30 lookups per minute)
    const ip = getIpAddress(request);
    const rateLimit = await checkRateLimit(ip, 'rajaongkir_provinces', 30, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Silakan coba lagi nanti.` },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RajaOngkir API Key is not configured.' }, { status: 500 });
    }

    const response = await fetch('https://rajaongkir.komerce.id/api/v1/destination/province', {
      headers: {
        'key': apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.meta?.message || 'Failed to fetch provinces');
    }

    // Map Komerce format { id, name } to old format { province_id, province }
    const mappedResults = (data.data || []).map((p: any) => ({
      province_id: String(p.id),
      province: p.name
    }));

    return NextResponse.json(mappedResults, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('RajaOngkir Province Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
