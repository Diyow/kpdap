import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';


export async function POST(request: Request) {
  try {
    const { order_id } = await request.json();
    
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Initialize Supabase with Service Role Key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or Service Role Key");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Update the order status to completed
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order_id)
      .eq('status', 'shipped') // Only allow completing if it's currently shipped
      .select('id');

    if (error) {
      console.error('Error completing order:', error);
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Order not found or not in shipped status' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Complete order error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
