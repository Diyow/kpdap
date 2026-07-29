-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create an RPC specifically to clean up stuck pending orders
CREATE OR REPLACE FUNCTION public.cleanup_stuck_pending_orders()
RETURNS VOID AS $$
DECLARE
  v_order_record RECORD;
  v_items JSONB;
BEGIN
  -- Find orders that have been pending for more than 2 hours
  FOR v_order_record IN 
    SELECT id 
    FROM public.orders 
    WHERE status = 'pending' 
      AND created_at < NOW() - INTERVAL '2 hours'
  LOOP
    -- Get items for this order
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', product_id,
        'qty', quantity,
        'variation', variation_name
      )
    ) INTO v_items
    FROM public.order_items
    WHERE order_id = v_order_record.id;
    
    -- Restore stock using existing RPC if there are items
    IF v_items IS NOT NULL THEN
      PERFORM public.restore_stock_batch_v2(v_items);
    END IF;
    
    -- Update order status to cancelled
    UPDATE public.orders 
    SET status = 'cancelled' 
    WHERE id = v_order_record.id;
    
    -- Note: This happens in a loop, so each loop iteration could be a transaction block 
    -- if called correctly, but by default it's one big transaction.
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule the cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-stuck-pending-orders',
  '0 * * * *', -- Every hour at minute 0
  $$SELECT public.cleanup_stuck_pending_orders()$$
);
