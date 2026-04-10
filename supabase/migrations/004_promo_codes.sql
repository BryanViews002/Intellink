-- 004_promo_codes.sql: Promo system for BRYAN (20 uses, free month)

-- Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 20,
  current_uses INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed BRYAN promo
INSERT INTO public.promo_codes (code, max_uses) 
VALUES ('BRYAN', 20)
ON CONFLICT (code) DO NOTHING;

-- User redemptions table
CREATE TABLE IF NOT EXISTS public.user_promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_code_id INTEGER REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- User free month fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_free_month BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_expires_at TIMESTAMPTZ;

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_promo_redemptions_user_id ON public.user_promo_redemptions (user_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (code);

-- Function for atomic redeem (prevent race conditions)
CREATE OR REPLACE FUNCTION redeem_promo(user_uuid UUID, promo TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  promo_id INTEGER,
  new_uses INTEGER
) LANGUAGE plpgsql AS $$
DECLARE
  promo_id_int INTEGER;
  current_uses_int INTEGER;
  max_uses_int INTEGER;
BEGIN
  -- Lock promo row
  SELECT id, current_uses, max_uses INTO promo_id_int, current_uses_int, max_uses_int
  FROM public.promo_codes 
  WHERE code = promo FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid promo code', NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check already redeemed by user
  IF EXISTS (SELECT 1 FROM public.user_promo_redemptions WHERE user_id = user_uuid) THEN
    RETURN QUERY SELECT false, 'Promo already redeemed by this account', NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check uses
  IF current_uses_int >= max_uses_int THEN
    RETURN QUERY SELECT false, 'Promo code exhausted', NULL::INTEGER, NULL::INTEGER;
    RETURN;
  END IF;

  -- Atomic increment + redeem
  UPDATE public.promo_codes SET current_uses = current_uses + 1 WHERE id = promo_id_int;
  
  INSERT INTO public.user_promo_redemptions (user_id, promo_code_id) 
  VALUES (user_uuid, promo_id_int);

  RETURN QUERY SELECT true, 'Promo redeemed successfully', promo_id_int, current_uses_int + 1;
END;
$$;

