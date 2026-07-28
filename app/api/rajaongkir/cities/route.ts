import { NextResponse } from 'next/server';

export const runtime = 'edge';


export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('province');

    if (!provinceId) {
      return NextResponse.json({ error: 'Province ID is required' }, { status: 400 });
    }

    const apiKey = process.env.RAJAONGKIR_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'RajaOngkir API Key is not configured.' }, { status: 500 });
    }

    const response = await fetch(`https://rajaongkir.komerce.id/api/v1/destination/city/${provinceId}`, {
      headers: {
        'key': apiKey
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.meta?.message || 'Failed to fetch cities');
    }

    // Map Komerce format { id, name } to old format { city_id, city_name, type: "Kota/Kabupaten" }
    const mappedResults = (data.data || []).map((c: any) => ({
      city_id: String(c.id),
      city_name: c.name,
      type: "Kota/Kabupaten"
    }));

    return NextResponse.json(mappedResults);
  } catch (error: any) {
    console.error('RajaOngkir City Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
