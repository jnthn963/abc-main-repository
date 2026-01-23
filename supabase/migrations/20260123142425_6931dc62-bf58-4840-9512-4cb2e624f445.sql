-- ================================================
-- FIX 1: Storage Policy Operator Precedence Issue
-- ================================================

-- Drop existing storage policies with incorrect precedence
DROP POLICY IF EXISTS "Admins can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete QR codes" ON storage.objects;

-- Recreate with proper parentheses for correct operator precedence
CREATE POLICY "Admins can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'qr-codes' 
  AND (has_role(auth.uid(), 'admin'::app_role) 
       OR has_role(auth.uid(), 'governor'::app_role))
);

CREATE POLICY "Admins can update QR codes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'qr-codes' 
  AND (has_role(auth.uid(), 'admin'::app_role) 
       OR has_role(auth.uid(), 'governor'::app_role))
);

CREATE POLICY "Admins can delete QR codes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'qr-codes' 
  AND (has_role(auth.uid(), 'admin'::app_role) 
       OR has_role(auth.uid(), 'governor'::app_role))
);

-- ================================================
-- FIX 2: Ledger RLS for Governor Workflow Updates
-- ================================================

-- Drop the blanket "no updates" policy
DROP POLICY IF EXISTS "Ledger is immutable - no updates" ON public.ledger;

-- Create Governor-only update policy
-- Note: Column-level restrictions are enforced via trigger below
CREATE POLICY "Governors can update workflow columns only"
ON public.ledger
FOR UPDATE
USING (
  has_role(auth.uid(), 'governor'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'governor'::app_role)
);

-- ================================================
-- FIX 3: Column-Level Protection Trigger
-- This ensures even Governors cannot modify financial data
-- ================================================

-- Create a trigger function that protects immutable columns
CREATE OR REPLACE FUNCTION public.protect_ledger_immutable_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block changes to financial/audit columns
  IF OLD.id IS DISTINCT FROM NEW.id THEN
    RAISE EXCEPTION 'Cannot modify ledger ID';
  END IF;
  
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Cannot modify ledger user_id - financial audit integrity';
  END IF;
  
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN
    RAISE EXCEPTION 'Cannot modify ledger amount - financial audit integrity';
  END IF;
  
  IF OLD.type IS DISTINCT FROM NEW.type THEN
    RAISE EXCEPTION 'Cannot modify ledger transaction type - financial audit integrity';
  END IF;
  
  IF OLD.reference_number IS DISTINCT FROM NEW.reference_number THEN
    RAISE EXCEPTION 'Cannot modify ledger reference_number - financial audit integrity';
  END IF;
  
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify ledger created_at - financial audit integrity';
  END IF;
  
  IF OLD.destination IS DISTINCT FROM NEW.destination THEN
    RAISE EXCEPTION 'Cannot modify ledger destination - financial audit integrity';
  END IF;
  
  IF OLD.related_user_id IS DISTINCT FROM NEW.related_user_id THEN
    RAISE EXCEPTION 'Cannot modify ledger related_user_id - financial audit integrity';
  END IF;
  
  IF OLD.related_loan_id IS DISTINCT FROM NEW.related_loan_id THEN
    RAISE EXCEPTION 'Cannot modify ledger related_loan_id - financial audit integrity';
  END IF;
  
  -- Allow only workflow columns to be updated:
  -- approval_status, approved_by, approved_at, cleared_at, clearing_ends_at,
  -- rejection_reason, status, updated_at, description, metadata
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_ledger_immutable_columns_trigger ON public.ledger;

CREATE TRIGGER protect_ledger_immutable_columns_trigger
BEFORE UPDATE ON public.ledger
FOR EACH ROW
EXECUTE FUNCTION public.protect_ledger_immutable_columns();

-- ================================================
-- FIX 4: Governor Approval RPC Function
-- Atomic function for approve/reject workflow
-- ================================================

CREATE OR REPLACE FUNCTION public.governor_approve_action(
  p_governor_id UUID,
  p_action_type TEXT,
  p_action_id UUID,
  p_approve BOOLEAN,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_new_status TEXT;
BEGIN
  -- Verify governor role
  IF NOT has_role(p_governor_id, 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Governor role required';
  END IF;
  
  -- Determine new approval status
  v_new_status := CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END;
  
  -- Handle ledger transactions (deposits, withdrawals, transfers)
  IF p_action_type IN ('deposit', 'withdrawal', 'transfer') THEN
    UPDATE public.ledger
    SET 
      approval_status = v_new_status,
      approved_by = p_governor_id,
      approved_at = NOW(),
      rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END,
      status = CASE 
        WHEN p_approve THEN 'clearing'::transaction_status 
        ELSE 'reversed'::transaction_status 
      END,
      updated_at = NOW()
    WHERE id = p_action_id
      AND approval_status = 'pending_review';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Transaction not found or already processed';
    END IF;
    
    v_result := jsonb_build_object(
      'success', true,
      'action_type', p_action_type,
      'action_id', p_action_id,
      'new_status', v_new_status
    );
    
  -- Handle loan requests
  ELSIF p_action_type = 'loan_request' THEN
    UPDATE public.p2p_loans
    SET 
      approval_status = v_new_status,
      approved_by = p_governor_id,
      approved_at = NOW(),
      rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END,
      updated_at = NOW()
    WHERE id = p_action_id
      AND approval_status = 'pending_review'
      AND status = 'open';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Loan request not found or already processed';
    END IF;
    
    v_result := jsonb_build_object(
      'success', true,
      'action_type', p_action_type,
      'action_id', p_action_id,
      'new_status', v_new_status
    );
    
  -- Handle loan funding approvals
  ELSIF p_action_type = 'loan_funding' THEN
    UPDATE public.p2p_loans
    SET 
      approval_status = v_new_status,
      approved_by = p_governor_id,
      approved_at = NOW(),
      rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END,
      status = CASE WHEN p_approve THEN 'funded'::loan_status ELSE 'open'::loan_status END,
      updated_at = NOW()
    WHERE id = p_action_id
      AND approval_status = 'pending_review';
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Loan funding not found or already processed';
    END IF;
    
    v_result := jsonb_build_object(
      'success', true,
      'action_type', p_action_type,
      'action_id', p_action_id,
      'new_status', v_new_status
    );
    
  ELSE
    RAISE EXCEPTION 'Unknown action type: %', p_action_type;
  END IF;
  
  -- Log to audit trail
  INSERT INTO public.admin_audit_log (admin_id, action, details)
  VALUES (
    p_governor_id,
    CASE WHEN p_approve THEN 'APPROVE_' ELSE 'REJECT_' END || UPPER(p_action_type),
    jsonb_build_object(
      'action_id', p_action_id,
      'action_type', p_action_type,
      'rejection_reason', p_rejection_reason
    )
  );
  
  RETURN v_result;
END;
$$;