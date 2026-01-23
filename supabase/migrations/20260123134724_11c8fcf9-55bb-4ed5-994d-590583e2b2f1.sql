-- Step 1: Add governor approval fields to ledger table
ALTER TABLE public.ledger 
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'auto_approved',
ADD COLUMN IF NOT EXISTS approved_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Step 2: Add governor approval fields to p2p_loans table
ALTER TABLE public.p2p_loans 
ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending_review',
ADD COLUMN IF NOT EXISTS approved_by UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- Step 3: Create indexes for faster pending queries
CREATE INDEX IF NOT EXISTS idx_ledger_approval_status ON public.ledger(approval_status);
CREATE INDEX IF NOT EXISTS idx_loans_approval_status ON public.p2p_loans(approval_status);