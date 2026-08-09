-- ==============================================================================
-- 05_order_id_text_search.sql
-- Description: Add stored generated column 'id_text' on 'orders' table
-- to enable fast partial/prefix ILIKE searches on Order UUIDs from the admin dashboard.
-- ==============================================================================

-- 1. Add generated text column for UUID searching
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS id_text text GENERATED ALWAYS AS (id::text) STORED;

-- 2. Create index for fast text searches on order ID
CREATE INDEX IF NOT EXISTS idx_orders_id_text ON public.orders(id_text);
