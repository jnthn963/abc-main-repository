-- =====================================================
-- ALPHA BUSINESS COOPERATIVE (ABC) - COMPLETE SCHEMA EXPORT
-- Generated: 2026-01-24
-- For migration to external Supabase project
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- =====================================================
-- STEP 2: CREATE CUSTOM ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('member', 'admin', 'governor');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.loan_status AS ENUM ('open', 'funded', 'repaid', 'defaulted');
CREATE TYPE public.membership_tier AS ENUM ('bronze', 'silver', 'gold', 'founding');
CREATE TYPE public.transaction_status AS ENUM ('clearing', 'completed', 'reversed');
CREATE TYPE public.transaction_type AS ENUM (
  'deposit', 'withdrawal', 'transfer_out', 'transfer_in',
  'lending_profit', 'vault_interest', 'loan_funding', 'loan_repayment',
  'collateral_lock', 'collateral_release', 'referral_commission'
);

-- =====================================================
-- STEP 3: CREATE TABLES
-- =====================================================

-- User Roles Table (for RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  vault_balance BIGINT NOT NULL DEFAULT 0,
  frozen_balance BIGINT NOT NULL DEFAULT 0,
  lending_balance BIGINT NOT NULL DEFAULT 0,
  membership_tier public.membership_tier NOT NULL DEFAULT 'bronze',
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  referrer_id UUID REFERENCES public.profiles(id),
  referral_code TEXT UNIQUE,
  total_referral_earnings BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false
);

-- Security Credentials Table (isolated for security)
CREATE TABLE public.security_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  security_question_1 TEXT,
  security_answer_1 TEXT,
  security_question_2 TEXT,
  security_answer_2 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Global Settings Table
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_interest_rate NUMERIC NOT NULL DEFAULT 0.50,
  lending_yield_rate NUMERIC NOT NULL DEFAULT 0.50,
  borrower_cost_rate NUMERIC NOT NULL DEFAULT 15.00,
  referral_level1_rate NUMERIC NOT NULL DEFAULT 3.00,
  system_kill_switch BOOLEAN NOT NULL DEFAULT false,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  founding_alpha_end_date TIMESTAMPTZ DEFAULT '2026-03-31 23:59:59+00',
  qr_gateway_url TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Public Config Table (publicly readable rates)
CREATE TABLE public.public_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_interest_rate NUMERIC NOT NULL DEFAULT 0.50,
  lending_yield_rate NUMERIC NOT NULL DEFAULT 15.00,
  qr_gateway_url TEXT,
  receiver_name TEXT DEFAULT 'Alpha Banking Cooperative',
  receiver_phone TEXT DEFAULT '+63 917 XXX XXXX',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ledger Table (financial transactions)
CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type public.transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'clearing',
  reference_number TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  related_loan_id UUID,
  related_user_id UUID,
  clearing_ends_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  approval_status TEXT NOT NULL DEFAULT 'auto_approved',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- P2P Loans Table
CREATE TABLE public.p2p_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borrower_id UUID NOT NULL REFERENCES auth.users(id),
  lender_id UUID REFERENCES auth.users(id),
  principal_amount BIGINT NOT NULL,
  collateral_amount BIGINT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  capital_lock_days INTEGER NOT NULL DEFAULT 28,
  status public.loan_status NOT NULL DEFAULT 'open',
  reference_number TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending_review',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  funded_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  capital_unlock_date TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  auto_repay_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Interest History Table
CREATE TABLE public.interest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  previous_balance BIGINT NOT NULL,
  interest_rate NUMERIC NOT NULL,
  interest_amount BIGINT NOT NULL,
  new_balance BIGINT NOT NULL,
  reference_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reserve Fund Table
CREATE TABLE public.reserve_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_reserve_balance BIGINT NOT NULL DEFAULT 0,
  total_payouts_made BIGINT NOT NULL DEFAULT 0,
  fee_accumulation BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CMS Posts Table
CREATE TABLE public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  media_type TEXT DEFAULT 'text',
  content_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_announcement BOOLEAN NOT NULL DEFAULT false,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin Audit Log Table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate Limits Table
CREATE TABLE public.rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CDC Config Table
CREATE TABLE public.cdc_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  webhook_url TEXT NOT NULL,
  operations TEXT[] DEFAULT ARRAY['INSERT', 'UPDATE', 'DELETE'],
  include_old_data BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- CDC Events Table
CREATE TABLE public.cdc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT,
  old_data JSONB,
  new_data JSONB,
  webhook_status TEXT DEFAULT 'pending',
  webhook_response TEXT,
  request_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================
CREATE INDEX idx_profiles_member_id ON public.profiles(member_id);
CREATE INDEX idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_ledger_user_id ON public.ledger(user_id);
CREATE INDEX idx_ledger_status ON public.ledger(status);
CREATE INDEX idx_ledger_type ON public.ledger(type);
CREATE INDEX idx_ledger_approval_status ON public.ledger(approval_status);
CREATE INDEX idx_ledger_clearing_ends_at ON public.ledger(clearing_ends_at) WHERE status = 'clearing';
CREATE INDEX idx_p2p_loans_borrower ON public.p2p_loans(borrower_id);
CREATE INDEX idx_p2p_loans_lender ON public.p2p_loans(lender_id);
CREATE INDEX idx_p2p_loans_status ON public.p2p_loans(status);
CREATE INDEX idx_p2p_loans_approval ON public.p2p_loans(approval_status);
CREATE INDEX idx_cdc_events_table ON public.cdc_events(table_name);
CREATE INDEX idx_cdc_events_status ON public.cdc_events(webhook_status);

-- =====================================================
-- STEP 5: CREATE VIEWS
-- =====================================================

-- Profiles User View (excludes sensitive data)
CREATE VIEW public.profiles_user_view
WITH (security_invoker = on) AS
SELECT 
  id, member_id, display_name, email, phone,
  address_line1, address_line2, city, province, postal_code,
  vault_balance, frozen_balance, lending_balance,
  membership_tier, kyc_status, referrer_id, referral_code,
  total_referral_earnings, created_at, updated_at,
  last_login_at, onboarding_completed
FROM public.profiles;

-- Profiles Admin View (includes security questions for admin use)
CREATE VIEW public.profiles_admin_view
WITH (security_invoker = on) AS
SELECT 
  p.id, p.member_id, p.display_name, p.email, p.phone,
  p.address_line1, p.address_line2, p.city, p.province, p.postal_code,
  p.vault_balance, p.frozen_balance, p.lending_balance,
  p.membership_tier, p.kyc_status, p.referrer_id, p.referral_code,
  p.total_referral_earnings, p.created_at, p.updated_at,
  p.last_login_at, p.onboarding_completed,
  sc.security_question_1, sc.security_question_2
FROM public.profiles p
LEFT JOIN public.security_credentials sc ON p.id = sc.user_id;

-- Pending Actions Queue View
CREATE VIEW public.pending_actions_queue
WITH (security_invoker = on) AS
SELECT 
  l.id, l.user_id, p.member_id, p.display_name as user_name,
  l.reference_number, l.amount, l.description, l.approval_status,
  l.created_at, l.type::text as action_type, 'ledger'::text as source_table,
  NULL::numeric as interest_rate, NULL::bigint as collateral_amount
FROM public.ledger l
JOIN public.profiles p ON p.id = l.user_id
WHERE l.approval_status = 'pending_review'
UNION ALL
SELECT 
  pl.id, pl.borrower_id, p.member_id, p.display_name,
  pl.reference_number, pl.principal_amount, 'Loan Request'::text,
  pl.approval_status, pl.created_at, 'loan_request'::text, 'p2p_loans'::text,
  pl.interest_rate, pl.collateral_amount
FROM public.p2p_loans pl
JOIN public.profiles p ON p.id = pl.borrower_id
WHERE pl.approval_status = 'pending_review';

-- =====================================================
-- STEP 5B: SECURE ADMIN VIEWS (CRITICAL)
-- =====================================================
-- Admin views must be locked down immediately after creation
-- Only accessible via SECURITY DEFINER functions or service_role

-- Lock down profiles_admin_view (contains PII + security questions)
REVOKE ALL ON public.profiles_admin_view FROM public;
REVOKE ALL ON public.profiles_admin_view FROM authenticated;
REVOKE ALL ON public.profiles_admin_view FROM anon;
GRANT SELECT ON public.profiles_admin_view TO service_role;

-- Lock down pending_actions_queue (contains financial data)
REVOKE ALL ON public.pending_actions_queue FROM public;
REVOKE ALL ON public.pending_actions_queue FROM authenticated;
REVOKE ALL ON public.pending_actions_queue FROM anon;
GRANT SELECT ON public.pending_actions_queue TO service_role;

-- User view: block anon, allow authenticated (via RLS)
REVOKE ALL ON public.profiles_user_view FROM anon;
GRANT SELECT ON public.profiles_user_view TO authenticated;

-- Document security requirements
COMMENT ON VIEW public.profiles_admin_view IS 
  'Administrative view with customer PII and security questions. Access restricted to service_role only. Use get_pending_actions() RPC for governor access.';
  
COMMENT ON VIEW public.pending_actions_queue IS 
  'Governor action queue with pending deposits/loans. Access restricted to service_role only. Use get_pending_actions() RPC for governor access.';

COMMENT ON VIEW public.profiles_user_view IS 
  'User-facing profile view excluding sensitive security credentials. Authenticated users only via RLS.';

-- =====================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =====================================================

-- Has Role Function (for RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Generate Member ID
CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id TEXT;
  year_part TEXT;
  random_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  random_part := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  new_id := 'ABC-' || year_part || '-' || random_part;
  RETURN new_id;
END;
$$;

-- Generate Reference Number
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'REF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
END;
$$;

-- Generate Referral Code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'ALPHA-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$;

-- Check Rate Limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  SELECT count, window_start INTO v_count, v_window_start
  FROM public.rate_limits WHERE key = p_key FOR UPDATE;
  
  IF NOT FOUND OR NOW() - v_window_start > (p_window_seconds || ' seconds')::INTERVAL THEN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (p_key, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;
  
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN TRUE;
END;
$$;

-- Cleanup Rate Limits
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$;

-- Update Updated At Column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 7: CREATE CORE BUSINESS FUNCTIONS
-- =====================================================

-- Handle New User (auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, member_id, email, referral_code)
  VALUES (
    NEW.id,
    generate_member_id(),
    NEW.email,
    generate_referral_code()
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Auto Assign Supreme Governor Roles
CREATE OR REPLACE FUNCTION public.auto_assign_supreme_governor_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF LOWER(NEW.email) = 'nangkiljonathan@gmail.com' OR LOWER(NEW.email) = 'governor@alphaecosystem.com' THEN
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'governor') ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Set Security Credentials
CREATE OR REPLACE FUNCTION public.set_security_credentials(
  p_user_id uuid, p_question_1 text, p_answer_1 text, p_question_2 text, p_answer_2 text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify credentials for other users';
  END IF;

  INSERT INTO security_credentials (
    user_id, security_question_1, security_answer_1, security_question_2, security_answer_2
  ) VALUES (
    p_user_id, p_question_1, crypt(p_answer_1, gen_salt('bf', 10)),
    p_question_2, crypt(p_answer_2, gen_salt('bf', 10))
  )
  ON CONFLICT (user_id) DO UPDATE SET
    security_question_1 = EXCLUDED.security_question_1,
    security_answer_1 = EXCLUDED.security_answer_1,
    security_question_2 = EXCLUDED.security_question_2,
    security_answer_2 = EXCLUDED.security_answer_2,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Get Security Questions
CREATE OR REPLACE FUNCTION public.get_security_questions(p_user_id uuid)
RETURNS TABLE(question_1 text, question_2 text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != p_user_id 
     AND NOT has_role(auth.uid(), 'admin'::app_role)
     AND NOT has_role(auth.uid(), 'governor'::app_role) 
  THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT sc.security_question_1, sc.security_question_2
  FROM public.security_credentials sc
  WHERE sc.user_id = p_user_id;
END;
$$;

-- Verify Security Answer
CREATE OR REPLACE FUNCTION public.verify_security_answer(p_user_id uuid, p_question_num integer, p_answer text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash TEXT;
BEGIN
  IF p_question_num = 1 THEN
    SELECT security_answer_1 INTO v_stored_hash FROM security_credentials WHERE user_id = p_user_id;
  ELSIF p_question_num = 2 THEN
    SELECT security_answer_2 INTO v_stored_hash FROM security_credentials WHERE user_id = p_user_id;
  ELSE
    RETURN FALSE;
  END IF;

  IF v_stored_hash IS NULL THEN RETURN FALSE; END IF;
  RETURN v_stored_hash = crypt(p_answer, v_stored_hash);
END;
$$;

-- Initiate Account Recovery
CREATE OR REPLACE FUNCTION public.initiate_account_recovery(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_member_id TEXT;
  v_questions JSON;
BEGIN
  IF NOT check_rate_limit('recovery:' || LOWER(p_email), 3, 3600) THEN
    RETURN json_build_object('success', false, 'error', 'Too many recovery attempts. Try again in 1 hour.');
  END IF;

  SELECT p.id, p.member_id INTO v_user_id, v_member_id
  FROM public.profiles p WHERE LOWER(p.email) = LOWER(p_email);

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', true, 'message', 'If an account exists, recovery options will be displayed.', 'has_security_questions', false);
  END IF;

  SELECT json_build_object('question_1', sc.security_question_1, 'question_2', sc.security_question_2) 
  INTO v_questions FROM public.security_credentials sc WHERE sc.user_id = v_user_id;

  IF v_questions IS NULL OR v_questions->>'question_1' IS NULL THEN
    RETURN json_build_object('success', true, 'message', 'Security questions not configured. Contact support.', 'has_security_questions', false);
  END IF;

  RETURN json_build_object(
    'success', true, 'has_security_questions', true, 'user_id', v_user_id,
    'masked_member_id', SUBSTRING(v_member_id, 1, 8) || '****', 'questions', v_questions
  );
END;
$$;

-- Verify Recovery Answers
CREATE OR REPLACE FUNCTION public.verify_recovery_answers(p_user_id uuid, p_answer_1 text, p_answer_2 text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stored_hash_1 TEXT;
  v_stored_hash_2 TEXT;
  v_answer_1_valid BOOLEAN;
  v_answer_2_valid BOOLEAN;
BEGIN
  IF NOT check_rate_limit('verify_recovery:' || p_user_id::TEXT, 5, 900) THEN
    RETURN json_build_object('success', false, 'error', 'Too many verification attempts. Try again in 15 minutes.');
  END IF;

  SELECT sc.security_answer_1, sc.security_answer_2 INTO v_stored_hash_1, v_stored_hash_2
  FROM public.security_credentials sc WHERE sc.user_id = p_user_id;

  IF v_stored_hash_1 IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Security credentials not found.');
  END IF;

  SELECT 
    v_stored_hash_1 = crypt(LOWER(TRIM(p_answer_1)), v_stored_hash_1),
    v_stored_hash_2 = crypt(LOWER(TRIM(p_answer_2)), v_stored_hash_2)
  INTO v_answer_1_valid, v_answer_2_valid;

  IF v_answer_1_valid AND v_answer_2_valid THEN
    RETURN json_build_object('success', true, 'verified', true, 'message', 'Security answers verified.');
  ELSE
    RETURN json_build_object('success', true, 'verified', false, 'message', 'Incorrect security answers.');
  END IF;
END;
$$;

-- Process Transfer Atomic
CREATE OR REPLACE FUNCTION public.process_transfer_atomic(
  p_user_id uuid, p_amount bigint, p_destination text, p_destination_type text, p_recipient_member_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_recipient profiles%ROWTYPE;
  v_reference_number TEXT;
  v_clearing_ends_at TIMESTAMPTZ;
  v_ledger_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF auth.uid() != p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;
  IF v_profile.vault_balance < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  SELECT generate_reference_number() INTO v_reference_number;
  v_clearing_ends_at := NOW() + INTERVAL '24 hours';

  IF p_destination_type = 'internal' AND p_recipient_member_id IS NOT NULL THEN
    SELECT * INTO v_recipient FROM profiles WHERE member_id = p_recipient_member_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Recipient not found'; END IF;
    IF v_recipient.id = p_user_id THEN RAISE EXCEPTION 'Cannot transfer to yourself'; END IF;
  END IF;

  UPDATE profiles SET vault_balance = vault_balance - p_amount, frozen_balance = frozen_balance + p_amount, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO ledger (user_id, type, amount, status, reference_number, clearing_ends_at, description, destination, related_user_id, approval_status)
  VALUES (p_user_id, 'transfer_out', p_amount, 'clearing', v_reference_number, v_clearing_ends_at, 'Transfer to ' || p_destination, p_destination,
    CASE WHEN p_destination_type = 'internal' THEN v_recipient.id ELSE NULL END, 'pending_review')
  RETURNING id INTO v_ledger_id;

  RETURN jsonb_build_object('success', true, 'transaction_id', v_ledger_id, 'reference_number', v_reference_number,
    'amount', p_amount, 'new_vault_balance', v_profile.vault_balance - p_amount, 'status', 'pending_review');
END;
$$;

-- Request Loan Atomic
CREATE OR REPLACE FUNCTION public.request_loan_atomic(p_user_id uuid, p_amount bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_settings global_settings%ROWTYPE;
  v_collateral_required BIGINT;
  v_reference_number TEXT;
  v_loan_id UUID;
  v_account_age_hours INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF auth.uid() != p_user_id AND NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User profile not found'; END IF;

  SELECT * INTO v_settings FROM global_settings LIMIT 1;

  v_account_age_hours := EXTRACT(EPOCH FROM (NOW() - v_profile.created_at)) / 3600;
  IF v_account_age_hours < 144 THEN
    RAISE EXCEPTION 'Account must be at least 6 days old. Wait % more hours.', 144 - v_account_age_hours;
  END IF;

  v_collateral_required := p_amount * 2;
  IF v_profile.vault_balance < v_collateral_required THEN
    RAISE EXCEPTION 'Insufficient collateral. Need ₱% for ₱% loan.', v_collateral_required, p_amount;
  END IF;

  SELECT generate_reference_number() INTO v_reference_number;

  UPDATE profiles SET vault_balance = vault_balance - v_collateral_required, frozen_balance = frozen_balance + v_collateral_required, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO p2p_loans (borrower_id, principal_amount, collateral_amount, interest_rate, duration_days, capital_lock_days, status, reference_number, approval_status)
  VALUES (p_user_id, p_amount, v_collateral_required, v_settings.borrower_cost_rate, 30, 28, 'open', v_reference_number, 'pending_review')
  RETURNING id INTO v_loan_id;

  INSERT INTO ledger (user_id, type, amount, status, reference_number, related_loan_id, description, approval_status)
  VALUES (p_user_id, 'collateral_lock', v_collateral_required, 'completed', v_reference_number || '-COL', v_loan_id, 'Collateral locked', 'auto_approved');

  RETURN jsonb_build_object('success', true, 'loan_id', v_loan_id, 'reference_number', v_reference_number,
    'principal_amount', p_amount, 'collateral_amount', v_collateral_required, 'status', 'pending_review');
END;
$$;

-- Fund Loan Atomic
CREATE OR REPLACE FUNCTION public.fund_loan_atomic(p_lender_id uuid, p_loan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan p2p_loans%ROWTYPE;
  v_lender profiles%ROWTYPE;
  v_borrower profiles%ROWTYPE;
  v_due_date TIMESTAMPTZ;
  v_capital_unlock_date TIMESTAMPTZ;
  v_reference_number TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF auth.uid() != p_lender_id AND NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_loan FROM p2p_loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.status != 'open' THEN RAISE EXCEPTION 'Loan not available'; END IF;
  IF v_loan.approval_status != 'approved' THEN RAISE EXCEPTION 'Loan pending approval'; END IF;
  IF v_loan.borrower_id = p_lender_id THEN RAISE EXCEPTION 'Cannot fund own loan'; END IF;

  SELECT * INTO v_lender FROM profiles WHERE id = p_lender_id FOR UPDATE;
  SELECT * INTO v_borrower FROM profiles WHERE id = v_loan.borrower_id FOR UPDATE;
  IF v_lender.vault_balance < v_loan.principal_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;

  v_due_date := NOW() + (v_loan.duration_days || ' days')::INTERVAL;
  v_capital_unlock_date := NOW() + (v_loan.capital_lock_days || ' days')::INTERVAL;
  SELECT generate_reference_number() INTO v_reference_number;

  UPDATE profiles SET vault_balance = vault_balance - v_loan.principal_amount, lending_balance = lending_balance + v_loan.principal_amount, updated_at = NOW()
  WHERE id = p_lender_id;
  UPDATE profiles SET vault_balance = vault_balance + v_loan.principal_amount, updated_at = NOW()
  WHERE id = v_loan.borrower_id;
  UPDATE p2p_loans SET status = 'funded', lender_id = p_lender_id, funded_at = NOW(), due_date = v_due_date, capital_unlock_date = v_capital_unlock_date, approval_status = 'pending_review', updated_at = NOW()
  WHERE id = p_loan_id;

  INSERT INTO ledger (user_id, type, amount, status, reference_number, related_loan_id, related_user_id, description, approval_status)
  VALUES (p_lender_id, 'loan_funding', v_loan.principal_amount, 'completed', v_reference_number, p_loan_id, v_loan.borrower_id, 'Loan funding', 'pending_review');

  RETURN jsonb_build_object('success', true, 'loan_id', p_loan_id, 'reference_number', v_reference_number, 'status', 'pending_review');
END;
$$;

-- Process Repayment Atomic
CREATE OR REPLACE FUNCTION public.process_repayment_atomic(p_borrower_id uuid, p_loan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_loan p2p_loans%ROWTYPE;
  v_borrower profiles%ROWTYPE;
  v_lender profiles%ROWTYPE;
  v_interest_amount BIGINT;
  v_total_repayment BIGINT;
  v_reference_number TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF auth.uid() != p_borrower_id AND NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_loan FROM p2p_loans WHERE id = p_loan_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan not found'; END IF;
  IF v_loan.borrower_id != p_borrower_id THEN RAISE EXCEPTION 'Only borrower can repay'; END IF;
  IF v_loan.status != 'funded' THEN RAISE EXCEPTION 'Loan cannot be repaid in current status'; END IF;

  SELECT * INTO v_borrower FROM profiles WHERE id = p_borrower_id FOR UPDATE;
  SELECT * INTO v_lender FROM profiles WHERE id = v_loan.lender_id FOR UPDATE;

  v_interest_amount := FLOOR(v_loan.principal_amount * (v_loan.interest_rate / 100));
  v_total_repayment := v_loan.principal_amount + v_interest_amount;
  IF v_borrower.vault_balance < v_total_repayment THEN
    RAISE EXCEPTION 'Insufficient funds. Need ₱%, have ₱%', v_total_repayment, v_borrower.vault_balance;
  END IF;

  SELECT generate_reference_number() INTO v_reference_number;

  UPDATE profiles SET vault_balance = vault_balance - v_total_repayment, updated_at = NOW() WHERE id = p_borrower_id;
  UPDATE profiles SET frozen_balance = frozen_balance - v_loan.collateral_amount, vault_balance = vault_balance + v_loan.collateral_amount, updated_at = NOW() WHERE id = p_borrower_id;
  UPDATE profiles SET lending_balance = lending_balance - v_loan.principal_amount, vault_balance = vault_balance + v_total_repayment, updated_at = NOW() WHERE id = v_loan.lender_id;
  UPDATE p2p_loans SET status = 'repaid', repaid_at = NOW(), updated_at = NOW() WHERE id = p_loan_id;

  INSERT INTO ledger (user_id, type, amount, status, reference_number, related_loan_id, related_user_id, description, approval_status) VALUES 
    (p_borrower_id, 'loan_repayment', v_total_repayment, 'completed', v_reference_number, p_loan_id, v_loan.lender_id, 'Loan repayment', 'auto_approved'),
    (p_borrower_id, 'collateral_release', v_loan.collateral_amount, 'completed', v_reference_number || '-REL', p_loan_id, NULL, 'Collateral released', 'auto_approved'),
    (v_loan.lender_id, 'lending_profit', v_interest_amount, 'completed', v_reference_number || '-INT', p_loan_id, p_borrower_id, 'Interest earned', 'auto_approved');

  RETURN jsonb_build_object('success', true, 'loan_id', p_loan_id, 'reference_number', v_reference_number, 'total_repayment', v_total_repayment);
END;
$$;

-- Apply Daily Interest Atomic
CREATE OR REPLACE FUNCTION public.apply_daily_interest_atomic()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_interest_rate NUMERIC;
  v_interest_amount BIGINT;
  v_new_balance BIGINT;
  v_ref_number TEXT;
  v_members_processed INT := 0;
  v_total_interest BIGINT := 0;
BEGIN
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'System in maintenance');
  END IF;

  SELECT vault_interest_rate / 100 INTO v_interest_rate FROM global_settings LIMIT 1;
  v_interest_rate := COALESCE(v_interest_rate, 0.005);

  FOR v_profile IN SELECT id, vault_balance, member_id FROM profiles WHERE vault_balance > 0 FOR UPDATE LOOP
    v_interest_amount := FLOOR(v_profile.vault_balance * v_interest_rate);
    IF v_interest_amount > 0 THEN
      v_new_balance := v_profile.vault_balance + v_interest_amount;
      v_ref_number := 'INT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || RIGHT(v_profile.member_id, 4);
      
      UPDATE profiles SET vault_balance = v_new_balance WHERE id = v_profile.id;
      INSERT INTO ledger (user_id, type, amount, status, reference_number, description, metadata)
      VALUES (v_profile.id, 'vault_interest', v_interest_amount, 'completed', v_ref_number, 'Daily vault interest',
        jsonb_build_object('previous_balance', v_profile.vault_balance, 'interest_rate', v_interest_rate * 100, 'new_balance', v_new_balance));
      INSERT INTO interest_history (user_id, previous_balance, interest_rate, interest_amount, new_balance, reference_number)
      VALUES (v_profile.id, v_profile.vault_balance, v_interest_rate * 100, v_interest_amount, v_new_balance, v_ref_number);
      
      v_total_interest := v_total_interest + v_interest_amount;
      v_members_processed := v_members_processed + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'members_processed', v_members_processed, 'total_interest', v_total_interest, 'timestamp', NOW());
END;
$$;

-- Release Clearing Atomic
CREATE OR REPLACE FUNCTION public.release_clearing_atomic()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
  v_transactions_cleared INT := 0;
BEGIN
  IF EXISTS(SELECT 1 FROM global_settings WHERE system_kill_switch = true OR maintenance_mode = true LIMIT 1) THEN
    RETURN jsonb_build_object('success', false, 'message', 'System in maintenance');
  END IF;

  FOR v_tx IN SELECT l.*, p.vault_balance, p.frozen_balance FROM ledger l JOIN profiles p ON p.id = l.user_id
    WHERE l.status = 'clearing' AND l.clearing_ends_at < NOW() FOR UPDATE OF l, p LOOP
    
    UPDATE ledger SET status = 'completed', cleared_at = NOW() WHERE id = v_tx.id;
    IF v_tx.type = 'deposit' THEN
      UPDATE profiles SET vault_balance = vault_balance + v_tx.amount, frozen_balance = GREATEST(0, frozen_balance - v_tx.amount) WHERE id = v_tx.user_id;
    END IF;
    v_transactions_cleared := v_transactions_cleared + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'transactions_cleared', v_transactions_cleared, 'timestamp', NOW());
END;
$$;

-- Governor Approve Action
CREATE OR REPLACE FUNCTION public.governor_approve_action(
  p_governor_id uuid, p_action_type text, p_action_id uuid, p_approve boolean, p_rejection_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_status TEXT;
BEGIN
  IF NOT has_role(p_governor_id, 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Governor role required';
  END IF;
  
  v_new_status := CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END;
  
  IF p_action_type IN ('deposit', 'withdrawal', 'transfer') THEN
    UPDATE public.ledger SET approval_status = v_new_status, approved_by = p_governor_id, approved_at = NOW(),
      rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END,
      status = CASE WHEN p_approve THEN 'clearing'::transaction_status ELSE 'reversed'::transaction_status END, updated_at = NOW()
    WHERE id = p_action_id AND approval_status = 'pending_review';
  ELSIF p_action_type = 'loan_request' THEN
    UPDATE public.p2p_loans SET approval_status = v_new_status, approved_by = p_governor_id, approved_at = NOW(),
      rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END, updated_at = NOW()
    WHERE id = p_action_id AND approval_status = 'pending_review' AND status = 'open';
  ELSIF p_action_type = 'loan_funding' THEN
    UPDATE public.p2p_loans SET approval_status = v_new_status, approved_by = p_governor_id, approved_at = NOW(),
      rejection_reason = CASE WHEN NOT p_approve THEN p_rejection_reason ELSE NULL END,
      status = CASE WHEN p_approve THEN 'funded'::loan_status ELSE 'open'::loan_status END, updated_at = NOW()
    WHERE id = p_action_id AND approval_status = 'pending_review';
  END IF;
  
  INSERT INTO public.admin_audit_log (admin_id, action, details)
  VALUES (p_governor_id, CASE WHEN p_approve THEN 'APPROVE_' ELSE 'REJECT_' END || UPPER(p_action_type),
    jsonb_build_object('action_id', p_action_id, 'action_type', p_action_type, 'rejection_reason', p_rejection_reason));
  
  RETURN jsonb_build_object('success', true, 'action_id', p_action_id, 'new_status', v_new_status);
END;
$$;

-- Get Pending Actions
CREATE OR REPLACE FUNCTION public.get_pending_actions()
RETURNS TABLE(id uuid, user_id uuid, member_id text, user_name text, reference_number text, amount bigint, description text,
  approval_status text, created_at timestamptz, action_type text, source_table text, interest_rate numeric, collateral_amount bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) AND NOT has_role(auth.uid(), 'governor'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  INSERT INTO admin_audit_log (admin_id, action, details) VALUES (auth.uid(), 'VIEW_PENDING_ACTIONS', '{}'::jsonb);
  
  RETURN QUERY
  SELECT l.id, l.user_id, p.member_id, p.display_name, l.reference_number, l.amount, l.description, l.approval_status,
    l.created_at, 'deposit'::text, 'ledger'::text, NULL::numeric, NULL::bigint
  FROM ledger l JOIN profiles p ON p.id = l.user_id WHERE l.type = 'deposit' AND l.approval_status = 'pending_review'
  UNION ALL
  SELECT pl.id, pl.borrower_id, p.member_id, p.display_name, pl.reference_number, pl.principal_amount, 'Loan Request'::text,
    pl.approval_status, pl.created_at, 'loan_request'::text, 'p2p_loans'::text, pl.interest_rate, pl.collateral_amount
  FROM p2p_loans pl JOIN profiles p ON p.id = pl.borrower_id WHERE pl.approval_status = 'pending_review'
  ORDER BY created_at ASC;
END;
$$;

-- Get Pending Action Counts
CREATE OR REPLACE FUNCTION public.get_pending_action_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposits BIGINT; v_withdrawals BIGINT; v_transfers BIGINT; v_loans BIGINT;
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor')) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_deposits FROM ledger WHERE approval_status = 'pending_review' AND type = 'deposit';
  SELECT COUNT(*) INTO v_withdrawals FROM ledger WHERE approval_status = 'pending_review' AND type = 'withdrawal';
  SELECT COUNT(*) INTO v_transfers FROM ledger WHERE approval_status = 'pending_review' AND type = 'transfer';
  SELECT COUNT(*) INTO v_loans FROM p2p_loans WHERE approval_status = 'pending_review';

  RETURN jsonb_build_object('deposits', v_deposits, 'withdrawals', v_withdrawals, 'transfers', v_transfers,
    'loans', v_loans, 'total', v_deposits + v_withdrawals + v_transfers + v_loans);
END;
$$;

-- Log Profile Access
CREATE OR REPLACE FUNCTION public.log_profile_access(p_accessed_profile_id uuid, p_access_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'governor')) THEN
    RAISE EXCEPTION 'Only administrators can log profile access';
  END IF;
  
  INSERT INTO admin_audit_log (admin_id, action, details)
  VALUES (auth.uid(), 'PROFILE_ACCESS', jsonb_build_object('accessed_profile_id', p_accessed_profile_id,
    'access_reason', COALESCE(p_access_reason, 'Administrative review'), 'timestamp', now()));
END;
$$;

-- =====================================================
-- STEP 8: CDC FUNCTIONS
-- =====================================================

-- CDC Trigger Function
CREATE OR REPLACE FUNCTION public.cdc_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config cdc_config%ROWTYPE;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id TEXT;
  v_request_id BIGINT;
  v_payload JSONB;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_config FROM cdc_config WHERE table_name = TG_TABLE_NAME AND enabled = true;
  IF NOT FOUND THEN RETURN COALESCE(NEW, OLD); END IF;
  IF NOT (TG_OP = ANY(v_config.operations)) THEN RETURN COALESCE(NEW, OLD); END IF;
  
  IF TG_OP = 'INSERT' THEN
    v_new_data := to_jsonb(NEW); v_record_id := COALESCE(NEW.id::TEXT, 'unknown');
  ELSIF TG_OP = 'UPDATE' THEN
    v_new_data := to_jsonb(NEW);
    IF v_config.include_old_data THEN v_old_data := to_jsonb(OLD); END IF;
    v_record_id := COALESCE(NEW.id::TEXT, 'unknown');
  ELSIF TG_OP = 'DELETE' THEN
    v_old_data := to_jsonb(OLD); v_record_id := COALESCE(OLD.id::TEXT, 'unknown');
  END IF;
  
  v_payload := jsonb_build_object('event_type', 'cdc', 'table', TG_TABLE_NAME, 'schema', TG_TABLE_SCHEMA,
    'operation', TG_OP, 'record_id', v_record_id, 'old_data', v_old_data, 'new_data', v_new_data, 'timestamp', NOW());
  
  INSERT INTO cdc_events (table_name, operation, record_id, old_data, new_data, webhook_status)
  VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_old_data, v_new_data, 'sending') RETURNING id INTO v_event_id;
  
  BEGIN
    SELECT net.http_post(url := v_config.webhook_url, headers := jsonb_build_object('Content-Type', 'application/json',
      'X-CDC-Event-ID', v_event_id::TEXT, 'X-CDC-Table', TG_TABLE_NAME, 'X-CDC-Operation', TG_OP), body := v_payload)
    INTO v_request_id;
    UPDATE cdc_events SET request_id = v_request_id, webhook_status = 'sent' WHERE id = v_event_id;
  EXCEPTION WHEN OTHERS THEN
    UPDATE cdc_events SET webhook_status = 'error', webhook_response = SQLERRM WHERE id = v_event_id;
  END;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Enable CDC On Table
CREATE OR REPLACE FUNCTION public.enable_cdc_on_table(p_table_name text, p_webhook_url text,
  p_operations text[] DEFAULT ARRAY['INSERT', 'UPDATE', 'DELETE'], p_include_old_data boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_trigger_name TEXT;
BEGIN
  IF NOT has_role(auth.uid(), 'governor'::app_role) THEN RAISE EXCEPTION 'Unauthorized: Governor role required'; END IF;
  
  INSERT INTO cdc_config (table_name, webhook_url, operations, include_old_data, enabled)
  VALUES (p_table_name, p_webhook_url, p_operations, p_include_old_data, true)
  ON CONFLICT (table_name) DO UPDATE SET webhook_url = EXCLUDED.webhook_url, operations = EXCLUDED.operations,
    include_old_data = EXCLUDED.include_old_data, enabled = true, updated_at = NOW();
  
  v_trigger_name := 'cdc_trigger_' || p_table_name;
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger_name, p_table_name);
  EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION cdc_trigger_function()', v_trigger_name, p_table_name);
  
  INSERT INTO admin_audit_log (admin_id, action, details)
  VALUES (auth.uid(), 'CDC_ENABLED', jsonb_build_object('table_name', p_table_name, 'webhook_url', p_webhook_url));
  
  RETURN jsonb_build_object('success', true, 'table', p_table_name, 'trigger_name', v_trigger_name);
END;
$$;

-- Disable CDC On Table
CREATE OR REPLACE FUNCTION public.disable_cdc_on_table(p_table_name text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_trigger_name TEXT;
BEGIN
  IF NOT has_role(auth.uid(), 'governor'::app_role) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  
  UPDATE cdc_config SET enabled = false, updated_at = NOW() WHERE table_name = p_table_name;
  v_trigger_name := 'cdc_trigger_' || p_table_name;
  EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger_name, p_table_name);
  
  INSERT INTO admin_audit_log (admin_id, action, details) VALUES (auth.uid(), 'CDC_DISABLED', jsonb_build_object('table_name', p_table_name));
  RETURN jsonb_build_object('success', true, 'table', p_table_name);
END;
$$;

-- Get CDC Stats
CREATE OR REPLACE FUNCTION public.get_cdc_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_result JSONB;
BEGIN
  IF NOT has_role(auth.uid(), 'governor'::app_role) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  
  SELECT jsonb_build_object('total_events', COUNT(*), 'pending', COUNT(*) FILTER (WHERE webhook_status = 'pending'),
    'sent', COUNT(*) FILTER (WHERE webhook_status = 'sent'), 'error', COUNT(*) FILTER (WHERE webhook_status = 'error'),
    'last_24h', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
    'by_table', (SELECT jsonb_object_agg(table_name, cnt) FROM (SELECT table_name, COUNT(*) as cnt FROM cdc_events GROUP BY table_name) t))
  INTO v_result FROM cdc_events;
  RETURN v_result;
END;
$$;

-- Cleanup CDC Events
CREATE OR REPLACE FUNCTION public.cleanup_cdc_events(p_days_old integer DEFAULT 7)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_deleted INTEGER;
BEGIN
  IF NOT has_role(auth.uid(), 'governor'::app_role) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM cdc_events WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL AND webhook_status != 'error';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  INSERT INTO admin_audit_log (admin_id, action, details) VALUES (auth.uid(), 'CDC_CLEANUP', jsonb_build_object('deleted_count', v_deleted));
  RETURN v_deleted;
END;
$$;

-- =====================================================
-- STEP 9: PROTECTION TRIGGERS
-- =====================================================

-- Protect Ledger Immutable Columns
CREATE OR REPLACE FUNCTION public.protect_ledger_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.id IS DISTINCT FROM NEW.id THEN RAISE EXCEPTION 'Cannot modify ledger ID'; END IF;
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN RAISE EXCEPTION 'Cannot modify user_id'; END IF;
  IF OLD.amount IS DISTINCT FROM NEW.amount THEN RAISE EXCEPTION 'Cannot modify amount'; END IF;
  IF OLD.type IS DISTINCT FROM NEW.type THEN RAISE EXCEPTION 'Cannot modify type'; END IF;
  IF OLD.reference_number IS DISTINCT FROM NEW.reference_number THEN RAISE EXCEPTION 'Cannot modify reference_number'; END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN RAISE EXCEPTION 'Cannot modify created_at'; END IF;
  RETURN NEW;
END;
$$;

-- Protect Loan Approval Fields
CREATE OR REPLACE FUNCTION public.protect_loan_approval_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF has_role(auth.uid(), 'governor'::app_role) OR has_role(auth.uid(), 'admin'::app_role) THEN RETURN NEW; END IF;
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status OR OLD.approved_by IS DISTINCT FROM NEW.approved_by OR
     OLD.approved_at IS DISTINCT FROM NEW.approved_at OR OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can modify approval fields';
  END IF;
  RETURN NEW;
END;
$$;

-- Log Loan Approval Action
CREATE OR REPLACE FUNCTION public.log_loan_approval_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) OR (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('funded', 'repaid', 'defaulted')) THEN
    INSERT INTO admin_audit_log (admin_id, action, details, ip_address)
    VALUES (COALESCE(NEW.approved_by, auth.uid()),
      CASE WHEN NEW.approval_status = 'approved' THEN 'LOAN_APPROVED' WHEN NEW.approval_status = 'rejected' THEN 'LOAN_REJECTED'
        WHEN NEW.status = 'funded' THEN 'LOAN_FUNDED' WHEN NEW.status = 'repaid' THEN 'LOAN_REPAID'
        WHEN NEW.status = 'defaulted' THEN 'LOAN_DEFAULTED' ELSE 'LOAN_STATUS_CHANGED' END,
      jsonb_build_object('loan_id', NEW.id, 'reference_number', NEW.reference_number, 'borrower_id', NEW.borrower_id,
        'principal_amount', NEW.principal_amount, 'previous_status', OLD.status, 'new_status', NEW.status), 'system');
  END IF;
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 10: CREATE TRIGGERS
-- =====================================================

-- Auth triggers (create after user signup)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER auto_assign_governor_roles
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_assign_supreme_governor_roles();

-- Updated At triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ledger_updated_at
  BEFORE UPDATE ON public.ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_p2p_loans_updated_at
  BEFORE UPDATE ON public.p2p_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Protection triggers
CREATE TRIGGER protect_ledger_columns
  BEFORE UPDATE ON public.ledger
  FOR EACH ROW EXECUTE FUNCTION public.protect_ledger_immutable_columns();

CREATE TRIGGER protect_loan_approval
  BEFORE UPDATE ON public.p2p_loans
  FOR EACH ROW EXECUTE FUNCTION public.protect_loan_approval_fields();

CREATE TRIGGER log_loan_approval
  AFTER UPDATE ON public.p2p_loans
  FOR EACH ROW EXECUTE FUNCTION public.log_loan_approval_action();

-- CDC Triggers (optional - enable via enable_cdc_on_table function)
CREATE TRIGGER cdc_trigger_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.cdc_trigger_function();

CREATE TRIGGER cdc_trigger_ledger
  AFTER INSERT OR UPDATE ON public.ledger
  FOR EACH ROW EXECUTE FUNCTION public.cdc_trigger_function();

CREATE TRIGGER cdc_trigger_p2p_loans
  AFTER INSERT OR UPDATE ON public.p2p_loans
  FOR EACH ROW EXECUTE FUNCTION public.cdc_trigger_function();

-- =====================================================
-- STEP 11: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdc_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdc_events ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 12: CREATE RLS POLICIES
-- =====================================================

-- User Roles Policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Governors can manage roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'governor'::app_role));

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Security Credentials Policies
CREATE POLICY "Block all direct access to security credentials" ON public.security_credentials FOR ALL USING (false);

-- Global Settings Policies
CREATE POLICY "Only admins can view global settings" ON public.global_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Admins can update settings" ON public.global_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- Public Config Policies
CREATE POLICY "Authenticated users can view public config" ON public.public_config FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update public config" ON public.public_config FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- Ledger Policies
CREATE POLICY "Users can view own transactions" ON public.ledger FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all transactions" ON public.ledger FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Users can insert own transactions" ON public.ledger FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Ledger is immutable - no deletes" ON public.ledger FOR DELETE USING (false);
CREATE POLICY "Governors can update workflow columns only" ON public.ledger FOR UPDATE USING (has_role(auth.uid(), 'governor'::app_role)) WITH CHECK (has_role(auth.uid(), 'governor'::app_role));

-- P2P Loans Policies
CREATE POLICY "Users can view open loans" ON public.p2p_loans FOR SELECT USING ((status = 'open'::loan_status) OR (borrower_id = auth.uid()) OR (lender_id = auth.uid()));
CREATE POLICY "Users can create loan requests" ON public.p2p_loans FOR INSERT WITH CHECK (borrower_id = auth.uid());
CREATE POLICY "Users can update own loans" ON public.p2p_loans FOR UPDATE USING ((borrower_id = auth.uid()) OR (lender_id = auth.uid()));
CREATE POLICY "Admins and governors can view all loans" ON public.p2p_loans FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- Interest History Policies
CREATE POLICY "Users can view own interest history" ON public.interest_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all interest history" ON public.interest_history FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Interest history is immutable - no updates" ON public.interest_history FOR UPDATE USING (false);
CREATE POLICY "Interest history is immutable - no deletes" ON public.interest_history FOR DELETE USING (false);

-- Reserve Fund Policies
CREATE POLICY "Admins can view reserve fund" ON public.reserve_fund FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "System can update reserve fund" ON public.reserve_fund FOR UPDATE USING (has_role(auth.uid(), 'governor'::app_role));

-- CMS Posts Policies
CREATE POLICY "Anyone can view active posts" ON public.cms_posts FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage posts" ON public.cms_posts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- Admin Audit Log Policies
CREATE POLICY "Admins can view audit log" ON public.admin_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Admins can insert audit log" ON public.admin_audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'governor'::app_role));

-- Rate Limits Policies
CREATE POLICY "Service role only" ON public.rate_limits FOR ALL USING (false);

-- CDC Config Policies
CREATE POLICY "Governors can manage CDC config" ON public.cdc_config FOR ALL USING (has_role(auth.uid(), 'governor'::app_role));

-- CDC Events Policies
CREATE POLICY "Governors can view CDC events" ON public.cdc_events FOR SELECT USING (has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Triggers and governors can insert CDC events" ON public.cdc_events FOR INSERT WITH CHECK ((auth.uid() IS NULL) OR has_role(auth.uid(), 'governor'::app_role));
CREATE POLICY "Governors can update CDC events" ON public.cdc_events FOR UPDATE USING (has_role(auth.uid(), 'governor'::app_role));

-- =====================================================
-- STEP 13: INSERT DEFAULT DATA
-- =====================================================

-- Insert default global settings
INSERT INTO public.global_settings (id, vault_interest_rate, lending_yield_rate, borrower_cost_rate, referral_level1_rate)
VALUES (gen_random_uuid(), 0.50, 0.50, 15.00, 3.00);

-- Insert default public config
INSERT INTO public.public_config (id, vault_interest_rate, lending_yield_rate, receiver_name, receiver_phone)
VALUES (gen_random_uuid(), 0.50, 15.00, 'Alpha Banking Cooperative', '+63 917 XXX XXXX');

-- Insert default reserve fund
INSERT INTO public.reserve_fund (id, total_reserve_balance, total_payouts_made, fee_accumulation)
VALUES (gen_random_uuid(), 0, 0, 0);

-- =====================================================
-- STEP 14: CONFIGURE CDC WEBHOOKS
-- =====================================================
-- CDC webhook endpoint for your external Supabase project:
-- https://onlacjgyixikndtrxcug.supabase.co/functions/v1/cdc-webhook

INSERT INTO public.cdc_config (table_name, webhook_url, operations, include_old_data, enabled)
VALUES 
  ('profiles', 'https://onlacjgyixikndtrxcug.supabase.co/functions/v1/cdc-webhook', ARRAY['INSERT', 'UPDATE', 'DELETE'], true, true),
  ('ledger', 'https://onlacjgyixikndtrxcug.supabase.co/functions/v1/cdc-webhook', ARRAY['INSERT', 'UPDATE'], true, true),
  ('p2p_loans', 'https://onlacjgyixikndtrxcug.supabase.co/functions/v1/cdc-webhook', ARRAY['INSERT', 'UPDATE'], true, true)
ON CONFLICT (table_name) DO UPDATE SET
  webhook_url = EXCLUDED.webhook_url,
  updated_at = NOW();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- After running this schema:
-- 1. Update Supabase Auth settings (enable email confirmations as needed)
-- 2. Deploy edge functions from supabase/functions/ directory
-- 3. Configure storage buckets if needed
-- =====================================================
