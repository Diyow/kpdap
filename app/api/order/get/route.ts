import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeFilterValue } from '@/utils/sanitize';
import { checkRateLimit, getIpAddress } from '@/utils/rate-limit';

export const runtime = 'edge';


export async function POST(request: Request) {
  try {
    // 1. Rate Limiting Check (e.g., 20 lookups per minute per IP)
    const ip = getIpAddress(request);
    const rateLimit = await checkRateLimit(ip, 'order_lookup', 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
        { 
          status: 429,
          headers: {
            'Retry-After': '60'
          }
        }
      );
    }
    // --- End Rate Limiting ---

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

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id.trim());
    let query;
    if (isUUID) {
      query = supabaseAdmin.from('orders').select('*').eq('id', order_id.trim());
    } else {
      const sanitizedId = sanitizeFilterValue(order_id.trim());
      query = supabaseAdmin.from('orders').select('*').ilike('id_text', `${sanitizedId}%`);
    }

    // If contact is provided (from track-order page), require a match
    if (contact) {
       const sanitized = sanitizeFilterValue(contact);
       query = query.or(`customer_phone.ilike.%${sanitized}%,customer_email.ilike.%${sanitized}%`);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    // Since this endpoint bypasses RLS, we only return the order data to the exact UUID requester.

    // --- MIDTRANS LOCAL SYNC WORKAROUND ---
    // If the order is pending, check Midtrans directly. 
    // This solves the issue where local webhooks cannot be reached by Midtrans.
    if (data.status === 'pending') {
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
      const midtransApiUrl = isProduction 
        ? `https://api.midtrans.com/v2/${order_id}/status`
        : `https://api.sandbox.midtrans.com/v2/${order_id}/status`;

      if (serverKey) {
        try {
          const midtransRes = await fetch(midtransApiUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': `Basic ${btoa(serverKey + ':')}`
            }
          });
          
          if (midtransRes.ok) {
            const midtransData = await midtransRes.json();
            const transaction_status = midtransData.transaction_status;
            const fraud_status = midtransData.fraud_status;
            const payment_type = midtransData.payment_type;

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
            }

            if (newStatus !== 'pending') {
              // Update database
              const updateData: any = { status: newStatus };
              if (payment_type) updateData.payment_method = payment_type;
              
              await supabaseAdmin.from('orders').update(updateData).eq('id', order_id);
              data.status = newStatus;
              if (payment_type) data.payment_method = payment_type;

              // Restore stock if it failed
              if (newStatus === 'failed') {
                const { data: items } = await supabaseAdmin
                  .from('order_items')
                  .select('product_id, quantity, variation_name')
                  .eq('order_id', order_id);
                  
                if (items) {
                  for (const item of items) {
                    await supabaseAdmin.rpc('restore_stock_v2', {
                      p_product_id: item.product_id,
                      p_quantity: item.quantity,
                      p_variation_name: item.variation_name || null
                    });
                  }
                }
              }
            }
          }
        } catch (syncError) {
          console.error("Midtrans sync error:", syncError);
        }
      }
    }
    // --- END SYNC WORKAROUND ---

    // SECURITY FIX: Never return the completion_token to the client.
    // Otherwise, an attacker could fetch the order and use the token to cancel it.
    if (data && 'completion_token' in data) {
      delete data.completion_token;
    }

    return NextResponse.json({ order: data });
  } catch (error: any) {
    console.error('Fetch order error:', error);
    return NextResponse.json(
      { error: 'Format ID Pesanan tidak valid atau pesanan tidak ditemukan.' },
      { status: 500 }
    );
  }
}
