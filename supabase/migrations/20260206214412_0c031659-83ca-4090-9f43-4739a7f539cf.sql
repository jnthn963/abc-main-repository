-- Update referral commission rate from 3% to 5% for Alpha Founding Members
-- This implements the 2026 Institutional Protocol update

UPDATE public.global_settings 
SET referral_level1_rate = 5.00,
    updated_at = now()
WHERE id IS NOT NULL;