-- ============================================================
-- KALASTYLE AI — V2 Order System Extension (Idempotent Migration)
-- Run this in your Supabase project's SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. EXTEND orders TABLE ──────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_pincode VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(500);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Unique constraint on order_number (safe to add)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_key'
  ) THEN
    ALTER TABLE orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
  END IF;
END $$;

-- ─── 2. EXTEND order_items TABLE ─────────────────────────────────────────────

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_snapshot VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image_snapshot TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price_snapshot DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS item_status VARCHAR(50) DEFAULT 'pending';

-- ─── 3. CREATE artisan_orders TABLE ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artisan_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE SET NULL,
  subtotal DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artisan_orders_order_id ON artisan_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_artisan_orders_artisan_id ON artisan_orders(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_orders_status ON artisan_orders(status);

-- ─── 4. CREATE payments TABLE ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  method VARCHAR(50),
  provider VARCHAR(50) DEFAULT 'razorpay',
  provider_order_id VARCHAR(255),
  provider_payment_id VARCHAR(255),
  amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_id VARCHAR(255),
  refund_amount DECIMAL(10,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint on order_id (one payment record per order)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_key'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);
  END IF;
END $$;

-- Unique constraint on provider_order_id (idempotency)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_provider_order_id_key'
  ) THEN
    ALTER TABLE payments ADD CONSTRAINT payments_provider_order_id_key UNIQUE (provider_order_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON payments(provider_payment_id);

-- ─── 5. CREATE artisan_earnings TABLE ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS artisan_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  artisan_order_id UUID REFERENCES artisan_orders(id) ON DELETE CASCADE,
  gross_amount DECIMAL(10,2) DEFAULT 0,
  platform_commission DECIMAL(10,2) DEFAULT 0,
  delivery_amount DECIMAL(10,2) DEFAULT 0,
  net_earning DECIMAL(10,2) DEFAULT 0,
  settlement_status VARCHAR(50) DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_artisan_earnings_artisan_id ON artisan_earnings(artisan_id);
CREATE INDEX IF NOT EXISTS idx_artisan_earnings_order_id ON artisan_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_artisan_earnings_settlement ON artisan_earnings(settlement_status);

-- ─── 6. EXTEND platform_settings TABLE ───────────────────────────────────────

ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 50.00;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS free_delivery_above DECIMAL(10,2) DEFAULT 500.00;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS cod_max_order_value DECIMAL(10,2) DEFAULT 5000.00;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS cod_min_order_value DECIMAL(10,2) DEFAULT 100.00;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS cancellation_window_hours INTEGER DEFAULT 12;
ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS reward_eligible_count INTEGER DEFAULT 8;

-- ─── 7. UPDATE existing platform_settings row with defaults ──────────────────

UPDATE platform_settings SET
  delivery_fee = COALESCE(delivery_fee, 50.00),
  free_delivery_above = COALESCE(free_delivery_above, 500.00),
  cod_enabled = COALESCE(cod_enabled, TRUE),
  cod_max_order_value = COALESCE(cod_max_order_value, 5000.00),
  cod_min_order_value = COALESCE(cod_min_order_value, 100.00),
  cancellation_window_hours = COALESCE(cancellation_window_hours, 12),
  reward_eligible_count = COALESCE(reward_eligible_count, 8)
WHERE id = 'main';

-- ─── 8. INDEX additions for existing tables ──────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_order_items_artisan_id ON order_items(artisan_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ============================================================
-- END OF V2 MIGRATION
-- ============================================================
