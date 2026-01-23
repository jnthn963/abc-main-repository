-- Create a storage bucket for QR code images
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read QR codes (they're public)
CREATE POLICY "QR codes are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- Only admins/governors can upload QR codes
CREATE POLICY "Admins can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' 
  AND has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role)
);

-- Only admins/governors can update QR codes
CREATE POLICY "Admins can update QR codes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'qr-codes' 
  AND has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role)
);

-- Only admins/governors can delete QR codes
CREATE POLICY "Admins can delete QR codes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'qr-codes' 
  AND has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role)
);

-- Create a public_config table for non-sensitive settings accessible to all authenticated users
-- This separates public-facing config from sensitive global_settings
CREATE TABLE IF NOT EXISTS public.public_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_gateway_url text,
  receiver_name text DEFAULT 'Alpha Banking Cooperative',
  receiver_phone text DEFAULT '+63 917 XXX XXXX',
  vault_interest_rate numeric NOT NULL DEFAULT 0.50,
  lending_yield_rate numeric NOT NULL DEFAULT 15.00,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.public_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read public config
CREATE POLICY "Authenticated users can view public config"
ON public.public_config FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins/governors can update
CREATE POLICY "Admins can update public config"
ON public.public_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- Insert initial row with values from global_settings if it exists
INSERT INTO public.public_config (qr_gateway_url, receiver_name, receiver_phone, vault_interest_rate, lending_yield_rate)
SELECT 
  qr_gateway_url,
  COALESCE(receiver_name, 'Alpha Banking Cooperative'),
  COALESCE(receiver_phone, '+63 917 XXX XXXX'),
  vault_interest_rate,
  lending_yield_rate
FROM public.global_settings
LIMIT 1
ON CONFLICT DO NOTHING;

-- If no global_settings exist, insert defaults
INSERT INTO public.public_config (receiver_name, receiver_phone)
SELECT 'Alpha Banking Cooperative', '+63 917 XXX XXXX'
WHERE NOT EXISTS (SELECT 1 FROM public.public_config);

-- Enable realtime for public_config so changes sync instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.public_config;