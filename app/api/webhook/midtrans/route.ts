import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export const runtime = 'edge';


export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Webhook payload from Midtrans
    const {
      order_id,
      transaction_status,
      fraud_status,
      gross_amount,
      status_code,
      signature_key,
      payment_type
    } = body;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY_HERE';
    const payloadStr = order_id + status_code + gross_amount + serverKey;
    const generatedSignature = crypto.createHash('sha512').update(payloadStr).digest('hex');

    if (generatedSignature !== signature_key) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Determine new status
    let newStatus = 'pending';
    
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'pending';
      } else if (fraud_status === 'accept') {
        newStatus = 'paid';
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'paid';
    } else if (
      transaction_status === 'cancel' ||
      transaction_status === 'deny' ||
      transaction_status === 'expire'
    ) {
      newStatus = 'failed';
    } else if (transaction_status === 'pending') {
      newStatus = 'pending';
    }

    // Fetch existing order to check current status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('status')
      .eq('id', order_id)
      .single();

    if (fetchError || !currentOrder) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Monotonicity check: Prevent delayed pending webhooks from overwriting final states
    const finalStates = ['paid', 'failed', 'expired', 'completed', 'cancelled', 'shipped'];
    if (finalStates.includes(currentOrder.status) && newStatus === 'pending') {
      console.log(`Ignoring delayed pending webhook for order ${order_id} in state ${currentOrder.status}`);
      return NextResponse.json({ success: true, message: 'Ignored delayed pending status' });
    }

    // Restore stock if transitioning to a failed state
    if (newStatus === 'failed' && !['failed', 'expired', 'cancelled'].includes(currentOrder.status)) {
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
    }

    // Update order in Supabase
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: newStatus,
        payment_method: payment_type
      })
      .eq('id', order_id);

    if (error) {
      console.error('Error updating order:', error);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: newStatus });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
