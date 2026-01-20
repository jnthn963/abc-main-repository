-- ============================================
-- ALPHA BANKING COOPERATIVE (ABC) SCHEMA
-- The Integer Rule: All balances use BIGINT (whole pesos only)
-- ============================================

-- Create app_role enum for role-based access control
CREATE TYPE public.app_role AS ENUM ('member', 'admin', 'governor');

-- Create membership_tier enum
CREATE TYPE public.membership_tier AS ENUM ('bronze', 'silver', 'gold', 'founding');

-- Create kyc_status enum
CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');

-- Create transaction_type enum
CREATE TYPE public.transaction_type AS ENUM (
  'deposit', 'withdrawal', 'transfer_out', 'transfer_in',
  'lending_profit', 'vault_interest', 'loan_funding', 
  'loan_repayment', 'collateral_lock', 'collateral_release',
  'referral_commission'
);

-- Create transaction_status enum
CREATE TYPE public.transaction_status AS ENUM ('clearing', 'completed', 'reversed');

-- Create loan_status enum
CREATE TYPE public.loan_status AS ENUM ('open', 'funded', 'repaid', 'defaulted');

-- ============================================
-- TABLE: profiles (Member Registry)
-- The Integer Rule: vault_balance, frozen_balance use BIGINT
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  
  -- Financial balances (Integer Rule: whole pesos only)
  vault_balance BIGINT NOT NULL DEFAULT 0,
  frozen_balance BIGINT NOT NULL DEFAULT 0,
  lending_balance BIGINT NOT NULL DEFAULT 0,
  
  -- Membership info
  membership_tier membership_tier NOT NULL DEFAULT 'bronze',
  kyc_status kyc_status NOT NULL DEFAULT 'pending',
  
  -- Address fields for bank-grade registration
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  
  -- Security questions
  security_question_1 TEXT,
  security_answer_1 TEXT,
  security_question_2 TEXT,
  security_answer_2 TEXT,
  
  -- Referral system
  referrer_id UUID REFERENCES public.profiles(id),
  referral_code TEXT UNIQUE,
  total_referral_earnings BIGINT NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ============================================
-- TABLE: user_roles (Separate from profiles for security)
-- Critical: Roles MUST be in separate table to prevent privilege escalation
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- ============================================
-- TABLE: ledger (Central Bank Record)
-- All financial transactions with audit trail
-- ============================================
CREATE TABLE public.ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction details
  type transaction_type NOT NULL,
  amount BIGINT NOT NULL,
  status transaction_status NOT NULL DEFAULT 'clearing',
  reference_number TEXT NOT NULL UNIQUE,
  
  -- Related entities
  related_loan_id UUID,
  related_user_id UUID REFERENCES auth.users(id),
  destination TEXT,
  
  -- Clearing period
  clearing_ends_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: p2p_loans (Marketplace Order Book)
-- ============================================
CREATE TABLE public.p2p_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  borrower_id UUID NOT NULL REFERENCES auth.users(id),
  lender_id UUID REFERENCES auth.users(id),
  
  -- Loan terms (Integer Rule)
  principal_amount BIGINT NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  collateral_amount BIGINT NOT NULL,
  
  -- Duration: Fixed 30 days (or 28 days for capital lock)
  duration_days INTEGER NOT NULL DEFAULT 30,
  capital_lock_days INTEGER NOT NULL DEFAULT 28,
  
  -- Status tracking
  status loan_status NOT NULL DEFAULT 'open',
  auto_repay_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  funded_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  capital_unlock_date TIMESTAMPTZ,
  repaid_at TIMESTAMPTZ,
  
  -- Reference
  reference_number TEXT NOT NULL UNIQUE,
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: global_settings (Governor's Levers)
-- Single-row table controlling the economy
-- ============================================
CREATE TABLE public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Interest rates (stored as percentage * 100 for precision)
  vault_interest_rate NUMERIC(5,2) NOT NULL DEFAULT 0.50,
  lending_yield_rate NUMERIC(5,2) NOT NULL DEFAULT 0.50,
  borrower_cost_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  
  -- Referral commission rates
  referral_level1_rate NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  
  -- System controls
  system_kill_switch BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- QR Gateway
  qr_gateway_url TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  
  -- Founding Alpha countdown
  founding_alpha_end_date TIMESTAMPTZ DEFAULT '2026-03-31 23:59:59+00',
  
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- TABLE: reserve_fund (The Guarantee Bucket)
-- ============================================
CREATE TABLE public.reserve_fund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_reserve_balance BIGINT NOT NULL DEFAULT 0,
  total_payouts_made BIGINT NOT NULL DEFAULT 0,
  fee_accumulation BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: cms_posts (Social Feed)
-- ============================================
CREATE TABLE public.cms_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  media_type TEXT DEFAULT 'text',
  content_url TEXT,
  
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_announcement BOOLEAN NOT NULL DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: admin_audit_log (Admin action tracking)
-- ============================================
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: interest_history (Interest payment records)
-- ============================================
CREATE TABLE public.interest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  previous_balance BIGINT NOT NULL,
  interest_rate NUMERIC(5,2) NOT NULL,
  interest_amount BIGINT NOT NULL,
  new_balance BIGINT NOT NULL,
  reference_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SECURITY DEFINER FUNCTION: has_role
-- Prevents RLS recursion by checking roles securely
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- ============================================
-- FUNCTION: Generate member ID (ABC-2026-XXXX format)
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS TEXT
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

-- ============================================
-- FUNCTION: Generate reference number
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_reference_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'REF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
         UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8));
END;
$$;

-- ============================================
-- FUNCTION: Generate referral code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN 'ALPHA-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
END;
$$;

-- ============================================
-- TRIGGER FUNCTION: Create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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
  
  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER FUNCTION: Update timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create update triggers for all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ledger_updated_at
  BEFORE UPDATE ON public.ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_p2p_loans_updated_at
  BEFORE UPDATE ON public.p2p_loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_global_settings_updated_at
  BEFORE UPDATE ON public.global_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cms_posts_updated_at
  BEFORE UPDATE ON public.cms_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.p2p_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserve_fund ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_history ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

-- USER_ROLES: Users can only view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Governors can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'governor'));

-- LEDGER: Users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.ledger FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON public.ledger FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
  ON public.ledger FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

-- P2P_LOANS: Open loans visible to all authenticated, own loans fully accessible
CREATE POLICY "Users can view open loans"
  ON public.p2p_loans FOR SELECT
  TO authenticated
  USING (status = 'open' OR borrower_id = auth.uid() OR lender_id = auth.uid());

CREATE POLICY "Users can create loan requests"
  ON public.p2p_loans FOR INSERT
  TO authenticated
  WITH CHECK (borrower_id = auth.uid());

CREATE POLICY "Users can update own loans"
  ON public.p2p_loans FOR UPDATE
  TO authenticated
  USING (borrower_id = auth.uid() OR lender_id = auth.uid());

-- GLOBAL_SETTINGS: Read-only for members, writable for admins/governors
CREATE POLICY "All users can view settings"
  ON public.global_settings FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Admins can update settings"
  ON public.global_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

-- RESERVE_FUND: Read-only for admins
CREATE POLICY "Admins can view reserve fund"
  ON public.reserve_fund FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

CREATE POLICY "System can update reserve fund"
  ON public.reserve_fund FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'governor'));

-- CMS_POSTS: Public read, admin write
CREATE POLICY "Anyone can view active posts"
  ON public.cms_posts FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage posts"
  ON public.cms_posts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

-- ADMIN_AUDIT_LOG: Only admins can view
CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

CREATE POLICY "Admins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'governor'));

-- INTEREST_HISTORY: Users can view their own interest history
CREATE POLICY "Users can view own interest history"
  ON public.interest_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default global settings
INSERT INTO public.global_settings (
  vault_interest_rate,
  lending_yield_rate,
  borrower_cost_rate,
  referral_level1_rate,
  founding_alpha_end_date
) VALUES (
  0.50,
  0.50,
  15.00,
  3.00,
  '2026-03-31 23:59:59+00'
);

-- Insert initial reserve fund
INSERT INTO public.reserve_fund (
  total_reserve_balance,
  total_payouts_made,
  fee_accumulation
) VALUES (0, 0, 0);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_profiles_member_id ON public.profiles(member_id);
CREATE INDEX idx_profiles_referrer_id ON public.profiles(referrer_id);
CREATE INDEX idx_ledger_user_id ON public.ledger(user_id);
CREATE INDEX idx_ledger_status ON public.ledger(status);
CREATE INDEX idx_ledger_clearing_ends ON public.ledger(clearing_ends_at) WHERE status = 'clearing';
CREATE INDEX idx_p2p_loans_borrower ON public.p2p_loans(borrower_id);
CREATE INDEX idx_p2p_loans_lender ON public.p2p_loans(lender_id);
CREATE INDEX idx_p2p_loans_status ON public.p2p_loans(status);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_interest_history_user ON public.interest_history(user_id);