import { NextResponse } from 'next/server';

export const runtime = 'edge';


export async function POST(request: Request) {
  try {

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

    const response = await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'key': apiKey
      },
      body: new URLSearchParams({
        origin: origin,
        destination: destination.toString(),
        weight: weight.toString(),
        courier: courier.toLowerCase(),
        price: 'lowest'
      }).toString()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.meta?.message || 'Failed to fetch shipping cost');
    }

    // Map Komerce format to old RajaOngkir structure
    const komerceData = data.data || [];
    const couriers = new Map();
    
    komerceData.forEach((item: any) => {
      if (!couriers.has(item.code)) {
        couriers.set(item.code, {
          code: item.code,
          name: item.name,
          costs: []
        });
      }
      
      couriers.get(item.code).costs.push({
        service: item.service,
        description: item.description,
        cost: [
          {
            value: item.cost,
            etd: item.etd,
            note: ""
          }
        ]
      });
    });

    const mappedResults = Array.from(couriers.values());

    return NextResponse.json(mappedResults);
  } catch (error: any) {
    console.error('RajaOngkir Cost Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
