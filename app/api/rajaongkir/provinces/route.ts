import { NextResponse } from 'next/server';

export const runtime = 'edge';


export async function GET(request: Request) {
  try {

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

    return NextResponse.json(mappedResults);
  } catch (error: any) {
    console.error('RajaOngkir Province Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
