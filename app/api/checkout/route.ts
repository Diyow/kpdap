import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';


// Simple in-memory rate limiter (Best effort for serverless)
const rateLimit = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_MAX = 5; // max 5 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // per 1 minute

export async function POST(request: Request) {
  try {
    // --- Rate Limiting Logic ---
    // In App Router, we can try to get IP from headers (x-forwarded-for). Fallback to a default if not found.
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
    const { items, customer, total_amount, shipping_cost, courier } = body;

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // Fetch authoritative product prices from DB
    const itemIds = items.map((item: any) => item.id);
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, title, price, variations')
      .in('id', itemIds);

    if (dbError || !dbProducts || dbProducts.length === 0) {
      return NextResponse.json({ error: 'Gagal memvalidasi produk.' }, { status: 400 });
    }

    // Calculate actual prices and true total amount on the server
    const verifiedItems = items.map((item: any) => {
      const dbProduct = dbProducts.find((p) => p.id === item.id);
      if (!dbProduct) {
        throw new Error(`Produk tidak ditemukan: ${item.title}`);
      }

      let actualPrice = dbProduct.price;
      
      // If a variation was selected, verify its price
      if (item.variation && dbProduct.variations) {
        const variationMatch = dbProduct.variations.find(
          (v: any) => v.name === item.variation
        );
        if (variationMatch) {
          actualPrice = variationMatch.price;
        }
      }

      return {
        ...item,
        title: dbProduct.title, // use authoritative title
        price: actualPrice
      };
    });

    const calculatedSubtotal = verifiedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // TODO: RajaOngkir API seems unreliable at the moment.
    // For now, we trust the client's shipping cost, but this should be moved to the server soon.
    const trustedShippingCost = Number(shipping_cost) || 0;
    const trueTotalAmount = calculatedSubtotal + trustedShippingCost;

    // 0. Deduct stock for each item (Atomic using RPC)
    const successfullyDeducted: { id: number, qty: number }[] = [];
    
    try {
      for (const item of items) {
        const { data: success, error: rpcError } = await supabase.rpc('deduct_stock', {
          p_product_id: item.id,
          p_quantity: item.quantity
        });
        
        if (rpcError) throw new Error(rpcError.message);
        if (!success) {
          throw new Error(`Stok tidak mencukupi untuk produk: ${item.title}`);
        }
        
        successfullyDeducted.push({ id: item.id, qty: item.quantity });
      }
    } catch (err: any) {
      // Rollback successfully deducted stocks
      for (const item of successfullyDeducted) {
        await supabase.rpc('restore_stock', {
          p_product_id: item.id,
          p_quantity: item.qty
        });
      }
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // 1. Generate Completion Token and Insert order into Supabase
    const completionToken = crypto.randomUUID();
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_address: customer.address + (customer.city ? `, ${customer.city}, ${customer.province}` : ''),
        notes: customer.notes,
        total_amount: trueTotalAmount, // Secure server calculated amount
        shipping_cost: trustedShippingCost,
        courier: courier || null,
        status: 'pending',
        completion_token: completionToken
      })
      .select('id')
      .single();

    if (orderError) throw new Error(orderError.message);

    const orderId = orderData.id;

    // 2. Insert order items
    const orderItemsToInsert = verifiedItems.map((item: any) => ({
      order_id: orderId,
      product_id: item.id,
      quantity: item.quantity,
      price_at_time: item.price
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) throw new Error(itemsError.message);

    // 3. Initialize Midtrans Snap API via native fetch (Edge Compatible)
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-YOUR_SERVER_KEY_HERE';
    const snapUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1/transactions' 
      : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
      
    const authString = btoa(`${serverKey}:`);
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: trueTotalAmount
      },
      customer_details: {
        first_name: customer.name,
        email: customer.email || 'guest@example.com',
        phone: customer.phone
      },
      item_details: [
        ...verifiedItems.map((item: any) => ({
          id: item.id.toString(),
          price: item.price,
          quantity: item.quantity,
          name: (item.title + (item.variation ? ` - ${item.variation}` : '')).substring(0, 50)
        })),
        ...(trustedShippingCost > 0 ? [{
          id: 'SHIPPING',
          price: trustedShippingCost,
          quantity: 1,
          name: `Ongkos Kirim ${courier ? '(' + courier + ')' : ''}`.substring(0, 50)
        }] : [])
      ]
    };

    // 5. Get Snap Token using fetch
    const response = await fetch(snapUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(parameter)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Midtrans API Error: ${response.status} ${errorText}`);
    }

    const transaction = await response.json();
    
    // Update order with payment token
    await supabase.from('orders').update({ payment_token: transaction.token }).eq('id', orderId);

    return NextResponse.json({ 
      token: transaction.token,
      order_id: orderId 
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
