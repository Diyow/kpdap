-- RPC to atomically deduct stock and create an order
-- This prevents "ghost" stock deductions by ensuring everything happens in one transaction.

CREATE OR REPLACE FUNCTION public.create_order_with_deduction(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address TEXT,
  p_notes TEXT,
  p_total_amount NUMERIC,
  p_shipping_cost NUMERIC,
  p_courier TEXT,
  p_completion_token UUID,
  p_items JSONB -- Array of { "id": int, "qty": int, "price": numeric, "variation": text | null }
)
RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_product_id INT;
  v_qty INT;
  v_variation TEXT;
  v_price NUMERIC;
  
  v_current_stock INT;
  v_new_stock INT;
  
  v_order_id UUID;
BEGIN
  -- 1. Loop through items and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::INT;
    v_qty := (v_item->>'qty')::INT;
    v_variation := v_item->>'variation';
    v_price := (v_item->>'price')::NUMERIC;
    
    IF v_variation IS NULL OR v_variation = '' OR v_variation = 'null' THEN
      -- Handle product without variation
      SELECT stock INTO v_current_stock
      FROM public.products
      WHERE id = v_product_id
      FOR UPDATE; -- Lock row
      
      IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
        RETURN jsonb_build_object('success', false, 'failed_item_id', v_product_id, 'reason', 'Insufficient stock');
      END IF;
      
      UPDATE public.products
      SET stock = stock - v_qty
      WHERE id = v_product_id;
    ELSE
      -- Handle product with variations
      -- Assume variations is a JSONB array: [{"name": "XL", "stock": 10, "price": 100}]
      
      -- First get the current stock for the specific variation
      SELECT (var->>'stock')::INT INTO v_current_stock
      FROM public.products p, jsonb_array_elements(p.variations) var
      WHERE p.id = v_product_id AND var->>'name' = v_variation
      FOR UPDATE OF p;
      
      IF v_current_stock IS NULL OR v_current_stock < v_qty THEN
         RETURN jsonb_build_object('success', false, 'failed_item_id', v_product_id, 'reason', 'Insufficient stock for variation');
      END IF;
      
      -- Update the variation stock inside the JSONB array
      WITH updated_vars AS (
        SELECT jsonb_agg(
          CASE
            WHEN var->>'name' = v_variation THEN
              var || jsonb_build_object('stock', (var->>'stock')::INT - v_qty)
            ELSE
              var
          END
        ) AS new_variations
        FROM public.products p, jsonb_array_elements(p.variations) var
        WHERE p.id = v_product_id
      )
      UPDATE public.products
      SET variations = (SELECT new_variations FROM updated_vars)
      WHERE id = v_product_id;
    END IF;
  END LOOP;

  -- 2. Create Order
  INSERT INTO public.orders (
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    notes,
    total_amount,
    shipping_cost,
    courier,
    status,
    completion_token
  ) VALUES (
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    p_shipping_address,
    p_notes,
    p_total_amount,
    p_shipping_cost,
    p_courier,
    'pending',
    p_completion_token
  ) RETURNING id INTO v_order_id;
  
  -- 3. Insert Order Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'id')::INT;
    v_qty := (v_item->>'qty')::INT;
    v_variation := v_item->>'variation';
    v_price := (v_item->>'price')::NUMERIC;
    
    INSERT INTO public.order_items (
      order_id,
      product_id,
      quantity,
      price_at_time,
      variation_name
    ) VALUES (
      v_order_id,
      v_product_id,
      v_qty,
      v_price,
      NULLIF(v_variation, 'null')
    );
  END LOOP;

  -- 4. Return success
  RETURN jsonb_build_object('success', true, 'order_id', v_order_id);
END;
$$ LANGUAGE plpgsql;
