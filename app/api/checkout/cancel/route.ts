import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { order_id } = await request.json();

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', order_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
      
      // 412 status code usually means the transaction is not cancellable in Midtrans 
      // (e.g. it's already expired or already paid). 
      // We log it but proceed to cancel locally just in case it's a ghost transaction.
      if (!cancelRes.ok && cancelData.status_code !== '412') {
        console.error('Midtrans cancel error:', cancelData);
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
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', order_id);
      
    if (items) {
      for (const item of items) {
        await supabase.rpc('restore_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Cancel Order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
