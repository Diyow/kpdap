import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { checkRateLimit, getIpAddress } from '@/utils/rate-limit';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check (e.g., 10 cancellations per minute)
    const ip = getIpAddress(request);
    const rateLimit = await checkRateLimit(ip, 'checkout_cancel', 10, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan. Silakan coba lagi nanti.` },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const { order_id, completion_token } = await request.json();

    if (!order_id || !completion_token) {
      return NextResponse.json({ error: 'Order ID and Completion Token are required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status, completion_token')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Auth Validation (IDOR fix)
    if (order.completion_token !== completion_token) {
      return NextResponse.json({ error: 'Unauthorized. Invalid completion token.' }, { status: 403 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
    }

    // 2. Call Midtrans Cancel API
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const baseUrl = isProduction 
      ? 'https://api.midtrans.com/v2' 
      : 'https://api.sandbox.midtrans.com/v2';
    
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const base64Key = btoa(serverKey + ':');

    try {
      const cancelRes = await fetch(`${baseUrl}/${order_id}/cancel`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${base64Key}`
        }
      });
      
      const cancelData = await cancelRes.json();
      
      if (!cancelRes.ok) {
        if (cancelData.status_code === '412') {
          return NextResponse.json(
            { error: 'Pesanan tidak dapat dibatalkan karena sudah diproses atau dibayar.' },
            { status: 400 }
          );
        }
        console.error('Midtrans cancel error (proceeding with local cleanup):', cancelData);
      }
    } catch (err) {
      console.error('Failed to call Midtrans cancel API:', err);
    }

    // 3. Update Order Status locally to 'cancelled'
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 4. Restore Stock
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity, variation_name')
      .eq('order_id', order_id);
      
    // 3. Restore stock (Atomic Batch using RPC)
    const itemsForBatch = orderItems!.map(item => ({
      id: item.product_id,
      qty: item.quantity,
      variation: item.variation_name
    }));

    if (itemsForBatch.length > 0) {
      await supabase.rpc('restore_stock_batch_v2', {
        p_items: itemsForBatch
      });
    }

    // 4. If Midtrans pending, attempt to cancel it
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Cancel Order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
