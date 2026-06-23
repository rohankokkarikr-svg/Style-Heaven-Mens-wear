-- Migration: Add payment columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(100);
