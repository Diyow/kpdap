import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, contact } = body;
    
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Use Service Role Key to bypass RLS for this specific operation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabaseAdmin.from('orders').select('*').eq('id', order_id);

    // If contact is provided (from track-order page), require a match
    if (contact) {
       query = query.or(`customer_phone.ilike.%${contact.trim()}%,customer_email.ilike.%${contact.trim()}%`);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Since this endpoint bypasses RLS, we only return the order data to the exact UUID requester.
    return NextResponse.json({ order: data });

  } catch (error: any) {
    console.error('Fetch order error:', error);
    return NextResponse.json(
      { error: 'Format ID Pesanan tidak valid atau pesanan tidak ditemukan.' },
      { status: 500 }
    );
  }
}
