-- Create storage bucket for deposit proof of payment receipts (private - admin/governor access only)
INSERT INTO storage.buckets (id, name, public)
VALUES ('deposit-receipts', 'deposit-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own receipts
CREATE POLICY "Users can upload own receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'deposit-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deposit-receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Governors and admins can view all receipts
CREATE POLICY "Admins can view all receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'deposit-receipts' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor'))
);

-- Add proof_of_payment_url column to ledger table for deposit receipts
ALTER TABLE public.ledger 
ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN public.ledger.proof_of_payment_url IS 'URL to proof of payment image for deposit verification';