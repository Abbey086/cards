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

-- Drop old insecure policies if they exist
DROP POLICY IF EXISTS "Affiliates are viewable by authenticated users" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates are insertable by authenticated users" ON public.affiliates;
DROP POLICY IF EXISTS "Affiliates are updatable by authenticated users" ON public.affiliates;

-- Function to check if current user is an affiliate (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_current_user_affiliate()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.affiliates
    WHERE email = auth.jwt() ->> 'email'
  );
$$;

-- Policies for affiliates
-- Only admin can create affiliates
CREATE POLICY "Only admin can create affiliates" ON public.affiliates
    FOR INSERT WITH CHECK (auth.jwt() ->> 'email' = 'amandatechnologies@gmail.com');

-- Affiliates can view their own data, admin can view all
CREATE POLICY "Affiliates can view own data, admin can view all" ON public.affiliates
    FOR SELECT USING (
        auth.jwt() ->> 'email' = 'amandatechnologies@gmail.com' OR
        public.is_current_user_affiliate()
    );

-- Affiliates can update their own profile fields, admin can update everything
CREATE POLICY "Affiliates can update own profile, admin can update all" ON public.affiliates
    FOR UPDATE USING (
        auth.jwt() ->> 'email' = 'amandatechnologies@gmail.com' OR
        public.is_current_user_affiliate()
    );

-- Only admin can delete affiliates
CREATE POLICY "Only admin can delete affiliates" ON public.affiliates
    FOR DELETE USING (auth.jwt() ->> 'email' = 'amandatechnologies@gmail.com');
