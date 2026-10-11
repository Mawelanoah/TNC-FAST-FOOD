-- ============================================================
-- TNC Fast Food – Complete Schema + Secure RLS
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- 1. admins
-- ------------------------------------------------------------
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. menu_items
-- ------------------------------------------------------------
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL,                    -- e.g. 'magwinya', 'kotas', 'chips', 'weekend', 'drinks'
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 3. add_ons
-- ------------------------------------------------------------
CREATE TABLE public.add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 4. customers
-- ------------------------------------------------------------
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (phone)
);

-- ------------------------------------------------------------
-- 5. orders
-- ------------------------------------------------------------
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,          -- e.g. TNC-20261011-0001
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,                -- denormalised for quick display
  customer_phone TEXT NOT NULL,
  collection_time TEXT,                       -- "As soon as ready", "In 30 minutes", etc.
  special_instructions TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);

-- ------------------------------------------------------------
-- 6. order_items
-- ------------------------------------------------------------
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,                    -- snapshot of name at time of order
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(10,2) NOT NULL,
  selected_addons JSONB DEFAULT '[]'::jsonb,  -- array of {id, name, price}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- ------------------------------------------------------------
-- 7. payments
-- ------------------------------------------------------------
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash_on_collection'
    CHECK (payment_method IN ('cash_on_collection', 'card', 'eft', 'other')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8. business_settings
-- ------------------------------------------------------------
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,                   -- e.g. 'opening_hours', 'phone', 'address'
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed some default settings
INSERT INTO public.business_settings (key, value) VALUES
  ('opening_hours', '{"open": "07:30", "close": "18:00", "days": "Monday – Sunday"}'),
  ('contact_phone', '"084 017 1408"'),
  ('whatsapp_number', '"27840171408"'),
  ('address', '{"street": "Tshwene Street, Soshanguve-U", "city": "Soshanguve", "code": "0164"}'),
  ('collection_only', 'true'),
  ('business_name', '"TNC Fast Food"');

-- ------------------------------------------------------------
-- 9. reviews
-- ------------------------------------------------------------
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES public.admins(id)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Generate sequential order numbers: TNC-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today TEXT := to_char(now() AT TIME ZONE 'Africa/Johannesburg', 'YYYYMMDD');
  seq INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM public.orders
  WHERE created_at::date = (now() AT TIME ZONE 'Africa/Johannesburg')::date;
  RETURN 'TNC-' || today || '-' || lpad(seq::text, 4, '0');
END;
$$;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_admins_updated BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_add_ons_updated BEFORE UPDATE ON public.add_ons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_business_settings_updated BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an active admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  );
$$;

-- ---------- PUBLIC / ANON POLICIES ----------

-- Menu: anyone can read available items
CREATE POLICY "Public can read available menu items"
  ON public.menu_items FOR SELECT
  USING (is_available = true);

-- Add-ons: anyone can read available ones
CREATE POLICY "Public can read available add-ons"
  ON public.add_ons FOR SELECT
  USING (is_available = true);

-- Business settings: public read
CREATE POLICY "Public can read business settings"
  ON public.business_settings FOR SELECT
  USING (true);

-- Reviews: public can read only approved reviews
CREATE POLICY "Public can read approved reviews"
  ON public.reviews FOR SELECT
  USING (status = 'approved');

-- Reviews: anyone can insert a new review (pending)
CREATE POLICY "Anyone can submit a review"
  ON public.reviews FOR INSERT
  WITH CHECK (status = 'pending');

-- Orders: customers can insert their own order (no auth required for collection orders)
CREATE POLICY "Anyone can create an order"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Order items: anyone can insert items for an order they just created
CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- Customers: anyone can create a customer record
CREATE POLICY "Anyone can create a customer"
  ON public.customers FOR INSERT
  WITH CHECK (true);

-- ---------- ADMIN-ONLY POLICIES ----------

-- Admins table: only admins can read/update
CREATE POLICY "Admins can manage admins"
  ON public.admins FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Menu items: admins full access
CREATE POLICY "Admins full access to menu_items"
  ON public.menu_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Add-ons: admins full access
CREATE POLICY "Admins full access to add_ons"
  ON public.add_ons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers: admins can read/update
CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Orders: admins full access
CREATE POLICY "Admins full access to orders"
  ON public.orders FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Order items: admins full access
CREATE POLICY "Admins full access to order_items"
  ON public.order_items FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payments: admins full access
CREATE POLICY "Admins full access to payments"
  ON public.payments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Business settings: admins can update
CREATE POLICY "Admins can update business settings"
  ON public.business_settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Reviews: admins can moderate
CREATE POLICY "Admins can manage reviews"
  ON public.reviews FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================
-- 1. Never put the service_role key in frontend code.
-- 2. The anon/public key is safe for the browser (RLS protects data).
-- 3. Order totals should be re-validated on the server (Edge Function)
--    before marking an order as paid or accepted.
-- 4. Payment status should only be set to 'paid' after verification
--    by a trusted payment provider or by an admin.
-- ============================================================
