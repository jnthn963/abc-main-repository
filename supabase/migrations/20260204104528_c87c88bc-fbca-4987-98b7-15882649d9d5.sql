-- Fix the sync_public_config trigger to use proper UUID generation
-- The trigger was trying to insert 'default' as a string UUID

-- First, drop the problematic trigger temporarily
DROP TRIGGER IF EXISTS sync_global_to_public ON public.global_settings;

-- Drop and recreate the function with proper UUID handling
CREATE OR REPLACE FUNCTION public.sync_public_config()
RETURNS TRIGGER AS $$
DECLARE
  v_config_id UUID;
BEGIN
  -- Get the existing public_config ID or use a fixed UUID
  SELECT id INTO v_config_id FROM public.public_config LIMIT 1;
  
  IF v_config_id IS NULL THEN
    v_config_id := gen_random_uuid();
  END IF;
  
  INSERT INTO public.public_config (id, vault_interest_rate, lending_yield_rate, qr_gateway_url, receiver_name, receiver_phone, hero_video_url, hero_video_type, updated_at)
  VALUES (v_config_id, NEW.vault_interest_rate, NEW.lending_yield_rate, NEW.qr_gateway_url, NEW.receiver_name, NEW.receiver_phone, NEW.hero_video_url, NEW.hero_video_type, NEW.updated_at)
  ON CONFLICT (id) DO UPDATE SET
    vault_interest_rate = EXCLUDED.vault_interest_rate,
    lending_yield_rate = EXCLUDED.lending_yield_rate,
    qr_gateway_url = EXCLUDED.qr_gateway_url,
    receiver_name = EXCLUDED.receiver_name,
    receiver_phone = EXCLUDED.receiver_phone,
    hero_video_url = EXCLUDED.hero_video_url,
    hero_video_type = EXCLUDED.hero_video_type,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER sync_global_to_public
  AFTER INSERT OR UPDATE ON public.global_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_config();

-- Now add the missing supreme_governor_emails column
ALTER TABLE public.global_settings 
ADD COLUMN IF NOT EXISTS supreme_governor_emails TEXT[] DEFAULT ARRAY['nangkiljonathan@gmail.com']::TEXT[];

-- Update the existing row with the hardcoded supreme governor email
UPDATE public.global_settings 
SET supreme_governor_emails = ARRAY['nangkiljonathan@gmail.com']::TEXT[]
WHERE id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.global_settings.supreme_governor_emails IS 'Array of emails that should automatically receive the governor role upon registration';