-- ============================================================
-- KALASTYLE AI — Admin Control Center Schema (Idempotent Migration)
-- Run this in your Supabase project's SQL Editor to enable all Admin features
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure User Roles & Status Columns Exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Ensure Product Status & Rejection Notes Exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'approved';
ALTER TABLE products ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon VARCHAR(50),
  subcategories TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default 7 Handicraft Categories if empty
INSERT INTO categories (name, slug, description, image_url, subcategories, is_active)
VALUES
  ('Handloom & Textiles', 'handloom-textiles', 'Authentic Banarasi, Kanjivaram, Chanderi sarees, shawls, and handwoven fabrics.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop', ARRAY['Sarees', 'Shawls', 'Dupattas', 'Handwoven Fabrics', 'Stoles'], true),
  ('Home Décor & Furnishings', 'home-decor-furnishings', 'Brass lamps, handcrafted wall hangings, cushion covers, and artistic home accents.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop', ARRAY['Wall Hangings', 'Lamps & Lanterns', 'Cushion Covers', 'Table Runners', 'Decorative Mirrors'], true),
  ('Handmade Jewelry & Accessories', 'handmade-jewelry-accessories', 'Meenakari, Dokra, Terracotta, Kundan, and silver filigree artisanal jewelry.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop', ARRAY['Necklaces', 'Earrings', 'Bangles & Bracelets', 'Pendants', 'Anklets'], true),
  ('Pottery & Terracotta', 'pottery-terracotta', 'Jaipur Blue Pottery, Clay cookware, terracotta planters, and traditional diyas.', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop', ARRAY['Clay Cookware', 'Blue Pottery Vases', 'Terracotta Diyas', 'Ceramic Tableware', 'Planters'], true),
  ('Wooden Handicrafts', 'wooden-handicrafts', 'Saharanpur carving, Channapatna toys, teakwood sculptures, and sandalwood artifacts.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop', ARRAY['Channapatna Toys', 'Wooden Sculptures', 'Jewelry Boxes', 'Wall Clocks', 'Serving Trays'], true),
  ('Traditional Paintings & Wall Art', 'traditional-paintings-wall-art', 'Madhubani, Warli, Pattachitra, Gond, and Tanjore gold leaf heritage paintings.', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop', ARRAY['Madhubani Art', 'Warli Paintings', 'Pattachitra Scrolls', 'Gond Art', 'Tanjore Art'], true),
  ('Eco-Friendly & Natural Products', 'eco-friendly-natural-products', 'Assam bamboo baskets, Sabai grass mats, coconut shell tableware, and jute crafts.', 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop', ARRAY['Bamboo Baskets', 'Jute Bags', 'Coconut Shell Craft', 'Sabai Grass Mats', 'Cane Furniture'], true)
ON CONFLICT (name) DO NOTHING;

-- 4. Reports & Complaints Table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL, -- 'product', 'artisan', 'customer', 'review'
  target_id UUID NOT NULL,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'rejected'
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  target_audience VARCHAR(50) NOT NULL, -- 'all', 'artisans', 'customers', 'specific'
  target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_name VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  feature VARCHAR(100) NOT NULL, -- 'catalog', 'image_analysis', 'price_suggestion', 'translation', 'story'
  model VARCHAR(100) DEFAULT 'gemini-3.6-flash',
  status VARCHAR(50) DEFAULT 'success', -- 'success', 'failed'
  prompt_length INTEGER,
  response_length INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
  platform_name VARCHAR(255) DEFAULT 'KalaStyle AI',
  contact_email VARCHAR(255) DEFAULT 'support@kalastyle.ai',
  contact_phone VARCHAR(50) DEFAULT '+91 7676558335',
  currency VARCHAR(10) DEFAULT 'INR',
  currency_symbol VARCHAR(10) DEFAULT '₹',
  tax_rate DECIMAL(5, 2) DEFAULT 5.00,
  platform_commission DECIMAL(5, 2) DEFAULT 10.00,
  ai_features_enabled BOOLEAN DEFAULT TRUE,
  daily_ai_limit_per_artisan INTEGER DEFAULT 50,
  auto_approve_products BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO platform_settings (id, platform_name)
VALUES ('main', 'KalaStyle AI')
ON CONFLICT (id) DO NOTHING;

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_logs(created_at);
