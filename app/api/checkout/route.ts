import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';


export async function POST(request: Request) {
  try {

    const body = await request.json();
    const { items, customer, shipping_details, total_amount, shipping_cost, courier } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      const selectedCourierData = komerceData.filter((c: any) => c.code === shipping_details.courier);
      // Find the specific service
      const selectedService = selectedCourierData.find((s: any) => s.service === shipping_details.service);
      
      if (!selectedService) {
         throw new Error(`Layanan kurir ${shipping_details.courier.toUpperCase()} - ${shipping_details.service} tidak tersedia untuk tujuan ini.`);
      }
      
      verifiedShippingCost = selectedService.cost;
    } else if (shipping_cost > 0) {
      // If client sent shipping cost but no details to verify, reject it
      throw new Error('Data pengiriman tidak lengkap untuk verifikasi.');
    }

    const trueTotalAmount = calculatedSubtotal + verifiedShippingCost;

    // 0. Deduct stock for each item (Atomic using RPC)
    const successfullyDeducted: { id: number, qty: number, variation: string | null }[] = [];
    
    try {
      for (const item of items) {
        const { data: success, error: rpcError } = await supabase.rpc('deduct_stock_v2', {
          p_product_id: item.id,
          p_quantity: item.quantity,
          p_variation_name: item.variation || null
        });
        
        if (rpcError) throw new Error(rpcError.message);
        if (!success) {
          throw new Error(`Stok tidak mencukupi untuk produk: ${item.title}`);
        }
        
        successfullyDeducted.push({ id: item.id, qty: item.quantity, variation: item.variation || null });
      }
    } catch (err: any) {
      // Rollback successfully deducted stocks
      for (const item of successfullyDeducted) {
        await supabase.rpc('restore_stock_v2', {
          p_product_id: item.id,
          p_quantity: item.qty,
          p_variation_name: item.variation
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
        shipping_cost: verifiedShippingCost,
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
      price_at_time: item.price,
      variation_name: item.variation || null
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
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
