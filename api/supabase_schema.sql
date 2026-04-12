-- ============================================================
-- Amanda Cards � Supabase SQL Schema
-- Only the existing table alterations and affiliate referrals.
-- ============================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS promo_code TEXT,
    ADD COLUMN IF NOT EXISTS commission_balance INT DEFAULT 0;

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS promo_code TEXT,
    ADD COLUMN IF NOT EXISTS discount_amount INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS commission_amount INT DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    promo_code TEXT,
    plan TEXT CHECK (plan IN ('starter', 'premium')) NOT NULL,
    price INT NOT NULL,
    discount_amount INT DEFAULT 0,
    commission_amount INT DEFAULT 0,
    status TEXT CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
