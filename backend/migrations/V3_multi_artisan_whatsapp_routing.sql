-- ============================================================
-- KALASTYLE AI — V3 Multi-Artisan WhatsApp Routing & Notifications
-- Run this in your Supabase project's SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. EXTEND artisan_profiles TABLE ─────────────────────────
-- Adds WhatsApp contact details and notification preference toggle

ALTER TABLE artisan_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE artisan_profiles ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(30);
ALTER TABLE artisan_profiles ADD COLUMN IF NOT EXISTS whatsapp_notifications_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_artisan_profiles_whatsapp ON artisan_profiles(whatsapp_number);

-- ─── 2. CREATE whatsapp_notifications TABLE ───────────────────
-- Authoritative audit log, delivery tracking, and idempotency store

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  artisan_id UUID REFERENCES artisan_profiles(id) ON DELETE CASCADE,
  phone_number VARCHAR(30) NOT NULL,
  message_type VARCHAR(50) NOT NULL, -- 'NEW_ORDER', 'PAYMENT_CONFIRMED', 'ORDER_CANCELLED', 'ORDER_RETURNED', 'ORDER_STATUS_CHANGED'
  idempotency_key VARCHAR(255) UNIQUE NOT NULL, -- e.g. <order_id>_<artisan_id>_<message_type>
  template_sid VARCHAR(100),
  twilio_message_sid VARCHAR(100),
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'sent', 'delivered', 'failed', 'undelivered', 'skipped'
  error_code VARCHAR(50),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  payload_snapshot JSONB,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Essential indexes for querying, deduping, and delivery lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_notif_order_id ON whatsapp_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notif_artisan_id ON whatsapp_notifications(artisan_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notif_idempotency ON whatsapp_notifications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notif_status ON whatsapp_notifications(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notif_created_at ON whatsapp_notifications(created_at DESC);

-- Enable RLS for security
ALTER TABLE whatsapp_notifications ENABLE ROW LEVEL SECURITY;

-- Service role and Admins have full access
CREATE POLICY "Admins have full access to whatsapp_notifications"
  ON whatsapp_notifications
  FOR ALL
  USING (
    auth.role() = 'service_role' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Artisans can view their own WhatsApp notification logs
CREATE POLICY "Artisans can view their own whatsapp_notifications"
  ON whatsapp_notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM artisan_profiles 
      WHERE artisan_profiles.id = whatsapp_notifications.artisan_id 
        AND artisan_profiles.user_id = auth.uid()
    )
  );
