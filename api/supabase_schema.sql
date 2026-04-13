-- ============================================================
-- Amanda Cards – Supabase SQL Schema
-- Affiliate system schema
-- ============================================================

-- Affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    commission_starter INT DEFAULT 0,
    commission_premium INT DEFAULT 0,
    discount_starter INT DEFAULT 0,
    discount_premium INT DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    total_earnings INT DEFAULT 0,
    pending_earnings INT DEFAULT 0,
    password_set BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id),
    ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Add affiliate_id to orders
ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES public.affiliates(id),
    ADD COLUMN IF NOT EXISTS affiliate_discount INT DEFAULT 0;

-- Enable RLS
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Policies for affiliates (admin only access)
CREATE POLICY "Affiliates are viewable by authenticated users" ON public.affiliates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Affiliates are insertable by authenticated users" ON public.affiliates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Affiliates are updatable by authenticated users" ON public.affiliates
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Note: In production, restrict to admin users only
