-- Add Hero Video and SMTP configuration fields to global_settings

ALTER TABLE public.global_settings 
ADD COLUMN IF NOT EXISTS hero_video_url TEXT,
ADD COLUMN IF NOT EXISTS hero_video_type TEXT DEFAULT 'none' CHECK (hero_video_type IN ('none', 'upload', 'youtube', 'vimeo')),
ADD COLUMN IF NOT EXISTS smtp_host TEXT,
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_user TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_email TEXT,
ADD COLUMN IF NOT EXISTS smtp_from_name TEXT DEFAULT 'Alpha Business Cooperative';

-- Add hero video to public_config for frontend access
ALTER TABLE public.public_config
ADD COLUMN IF NOT EXISTS hero_video_url TEXT,
ADD COLUMN IF NOT EXISTS hero_video_type TEXT DEFAULT 'none';

-- Create storage bucket for hero videos (admin-only access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-videos', 'hero-videos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for hero-videos bucket (admin/governor only for uploads)
CREATE POLICY "Hero videos are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero-videos');

CREATE POLICY "Only admins can upload hero videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'hero-videos'
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'governor')
  )
);

CREATE POLICY "Only admins can update hero videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'hero-videos'
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'governor')
  )
);

CREATE POLICY "Only admins can delete hero videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'hero-videos'
  AND (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_role(auth.uid(), 'governor')
  )
);

-- Update the public_config sync trigger to include hero video
CREATE OR REPLACE FUNCTION public.sync_public_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.public_config (id, vault_interest_rate, lending_yield_rate, qr_gateway_url, receiver_name, receiver_phone, hero_video_url, hero_video_type, updated_at)
  VALUES ('default', NEW.vault_interest_rate, NEW.lending_yield_rate, NEW.qr_gateway_url, NEW.receiver_name, NEW.receiver_phone, NEW.hero_video_url, NEW.hero_video_type, NEW.updated_at)
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_global_settings_update_sync_public ON public.global_settings;
CREATE TRIGGER on_global_settings_update_sync_public
  AFTER INSERT OR UPDATE ON public.global_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_config();

-- Add comment for SMTP password note
COMMENT ON COLUMN public.global_settings.smtp_host IS 'SMTP server hostname. Password stored in Supabase secrets, not database.';
COMMENT ON COLUMN public.global_settings.smtp_port IS 'SMTP port (587 for TLS, 465 for SSL)';
COMMENT ON COLUMN public.global_settings.smtp_user IS 'SMTP authentication username';
COMMENT ON COLUMN public.global_settings.smtp_from_email IS 'Email address for From header';
COMMENT ON COLUMN public.global_settings.smtp_from_name IS 'Display name for From header';