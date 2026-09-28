import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getIpAddress } from '@/utils/rate-limit';

export const runtime = 'edge';


export async function POST(request: Request) {
  let successfullyDeducted = false;
  let itemsForBatch: any[] = [];
  let orderId: string | undefined;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // --- Rate Limiting ---
    const ip = getIpAddress(request);
    const rateLimit = await checkRateLimit(ip, 'api/checkout', 5, 60);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan coba lagi nanti.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset_time || ''
          }
        }
      );
    }
    // --- End Rate Limiting ---

    const body = await request.json();
    const { items, customer, shipping_details, total_amount, shipping_cost, courier } = body;

    // --- Input Validation ---
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja kosong.' }, { status: 400 });
    }

    const MAX_QUANTITY_PER_ITEM = 100;

    for (const item of items) {
      if (!item.id || typeof item.id !== 'number') {
        return NextResponse.json({ error: 'ID produk tidak valid.' }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY_PER_ITEM) {
        return NextResponse.json(
          { error: `Jumlah produk harus antara 1 dan ${MAX_QUANTITY_PER_ITEM}.` },
          { status: 400 }
        );
      }
    }

    if (!customer?.name?.trim() || !customer?.phone?.trim()) {
      return NextResponse.json({ error: 'Nama dan nomor telepon wajib diisi.' }, { status: 400 });
    }

    if (!shipping_details?.destination || !shipping_details?.courier || !shipping_details?.weight) {
      return NextResponse.json({ error: 'Detail pengiriman wajib diisi.' }, { status: 400 });
    }
    // --- End Validation ---

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
      if (item.variation) {
        if (!dbProduct.variations || dbProduct.variations.length === 0) {
          throw new Error(`Produk ${item.title} tidak memiliki variasi, tetapi variasi dipilih.`);
        }
        
        const variationMatch = dbProduct.variations.find(
          (v: any) => v.name === item.variation
        );
        
        if (variationMatch) {
          actualPrice = variationMatch.price;
        } else {
          throw new Error(`Variasi '${item.variation}' tidak valid untuk produk ${item.title}.`);
        }
      }

      return {
        ...item,
        title: dbProduct.title, // use authoritative title
        price: actualPrice
      };
    });

    const calculatedSubtotal = verifiedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    
    // Server-Side Shipping Verification
    let verifiedShippingCost = 0;
    
    if (shipping_details && shipping_details.destination && shipping_details.courier && shipping_details.weight) {
      const origin = process.env.NEXT_PUBLIC_ORIGIN_CITY_ID || '447';
      const apiKey = process.env.RAJAONGKIR_API_KEY;
      
      if (!apiKey) {
        throw new Error('Konfigurasi RajaOngkir API Key tidak ditemukan di server.');
      }

      const roResponse = await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost', {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'key': apiKey
        },
        body: new URLSearchParams({
          origin: origin,
          destination: shipping_details.destination.toString(),
          weight: shipping_details.weight.toString(),
          courier: shipping_details.courier.toLowerCase(),
          price: 'lowest'
        }).toString()
      });

      if (!roResponse.ok) {
        throw new Error('Gagal memverifikasi ongkos kirim ke server kurir.');
      }
      
      const roData = await roResponse.json();
      const komerceData = roData.data || [];
      
      // Find the selected courier
      const selectedCourierData = komerceData.filter((c: any) => c.code.toLowerCase() === shipping_details.courier.toLowerCase());
      // Find the specific service
      const selectedService = selectedCourierData.find((s: any) => s.service.toLowerCase().trim() === shipping_details.service.toLowerCase().trim());
      
      if (!selectedService) {
         throw new Error(`Layanan kurir ${shipping_details.courier.toUpperCase()} - ${shipping_details.service} tidak tersedia untuk tujuan ini.`);
      }
      
      verifiedShippingCost = selectedService.cost;
    } else if (shipping_cost > 0) {
      // If client sent shipping cost but no details to verify, reject it
      throw new Error('Data pengiriman tidak lengkap untuk verifikasi.');
    }

    const trueTotalAmount = calculatedSubtotal + verifiedShippingCost;

    // 0. Atomic Stock Deduction and Order Creation (RPC)
    itemsForBatch = verifiedItems.map((item: any) => ({
      id: item.id,
      qty: item.quantity,
      price: item.price,
      variation: item.variation || null
    }));
    
    const completionToken = crypto.randomUUID();
    
    const { data: batchResult, error: rpcError } = await supabase.rpc('create_order_with_deduction', {
      p_customer_name: customer.name,
      p_customer_email: customer.email,
      p_customer_phone: customer.phone,
      p_shipping_address: customer.address + (customer.city ? `, ${customer.city}, ${customer.province}` : ''),
      p_notes: customer.notes,
      p_total_amount: trueTotalAmount,
      p_shipping_cost: verifiedShippingCost,
      p_courier: courier || null,
      p_completion_token: completionToken,
      p_items: itemsForBatch
    });
    
    if (rpcError) throw new Error(rpcError.message);
    
    if (!batchResult.success) {
      // Find which item failed
      const failedItem = items.find((i: any) => i.id == batchResult.failed_item_id);
      throw new Error(`Stok tidak mencukupi untuk produk: ${failedItem?.title || 'Unknown'}`);
    }
    
    successfullyDeducted = true;
    orderId = batchResult.order_id;

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
        ...(verifiedShippingCost > 0 ? [{
          id: 'SHIPPING',
          price: verifiedShippingCost,
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
      order_id: orderId,
      completion_token: completionToken
    });

  } catch (error: any) {
    console.error('Checkout error:', error);
    
    // Rollback stock and cancel order if deduction succeeded but Midtrans token generation failed
    if (successfullyDeducted && itemsForBatch.length > 0) {
      try {
        await supabase.rpc('restore_stock_batch_v2', { p_items: itemsForBatch });
        // Need to update order status to cancelled if it was created
        if (typeof orderId !== 'undefined') {
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        }
        console.log('Successfully rolled back stock and cancelled order after failed checkout');
      } catch (rollbackError) {
        console.error('CRITICAL: Failed to rollback stock:', rollbackError);
      }
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
