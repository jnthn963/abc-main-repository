-- Create liquidity_index_history table for candlestick data
CREATE TABLE public.liquidity_index_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    open_value BIGINT NOT NULL DEFAULT 0,
    high_value BIGINT NOT NULL DEFAULT 0,
    low_value BIGINT NOT NULL DEFAULT 0,
    close_value BIGINT NOT NULL DEFAULT 0,
    total_deposits BIGINT NOT NULL DEFAULT 0,
    total_withdrawals BIGINT NOT NULL DEFAULT 0,
    total_loans BIGINT NOT NULL DEFAULT 0,
    net_flow BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.liquidity_index_history ENABLE ROW LEVEL SECURITY;

-- Governors can read liquidity history
CREATE POLICY "Governors can view liquidity history"
ON public.liquidity_index_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'governor') OR public.has_role(auth.uid(), 'admin'));

-- Governors can insert liquidity history
CREATE POLICY "Governors can insert liquidity history"
ON public.liquidity_index_history
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'governor') OR public.has_role(auth.uid(), 'admin'));

-- Governors can update liquidity history
CREATE POLICY "Governors can update liquidity history"
ON public.liquidity_index_history
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'governor') OR public.has_role(auth.uid(), 'admin'));

-- Governors can delete liquidity history
CREATE POLICY "Governors can delete liquidity history"
ON public.liquidity_index_history
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'governor') OR public.has_role(auth.uid(), 'admin'));

-- Add liquidity index settings to global_settings
ALTER TABLE public.global_settings
ADD COLUMN IF NOT EXISTS liquidity_index_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS liquidity_index_target BIGINT DEFAULT 10000000,
ADD COLUMN IF NOT EXISTS liquidity_index_warning_threshold INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS liquidity_index_critical_threshold INTEGER DEFAULT 15;

-- Create index for efficient time-series queries
CREATE INDEX idx_liquidity_index_period ON public.liquidity_index_history (period_start DESC);

-- Function to calculate current liquidity index
CREATE OR REPLACE FUNCTION public.calculate_liquidity_index()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_vault BIGINT;
    v_total_frozen BIGINT;
    v_total_lending BIGINT;
    v_reserve_fund BIGINT;
    v_pending_withdrawals BIGINT;
    v_liquidity_ratio NUMERIC;
    v_index_value BIGINT;
BEGIN
    -- Get total vault balances
    SELECT COALESCE(SUM(vault_balance), 0) INTO v_total_vault FROM profiles;
    
    -- Get total frozen balances
    SELECT COALESCE(SUM(frozen_balance), 0) INTO v_total_frozen FROM profiles;
    
    -- Get total lending balances
    SELECT COALESCE(SUM(lending_balance), 0) INTO v_total_lending FROM profiles;
    
    -- Get reserve fund
    SELECT COALESCE(total_reserve_balance, 0) INTO v_reserve_fund FROM reserve_fund LIMIT 1;
    
    -- Get pending withdrawals
    SELECT COALESCE(SUM(amount), 0) INTO v_pending_withdrawals 
    FROM ledger 
    WHERE type = 'withdrawal' AND status = 'clearing';
    
    -- Calculate liquidity index (available funds vs obligations)
    v_index_value := v_total_vault + v_reserve_fund - v_pending_withdrawals;
    
    -- Calculate ratio
    IF (v_total_frozen + v_pending_withdrawals) > 0 THEN
        v_liquidity_ratio := (v_total_vault + v_reserve_fund)::NUMERIC / (v_total_frozen + v_pending_withdrawals)::NUMERIC * 100;
    ELSE
        v_liquidity_ratio := 100;
    END IF;
    
    RETURN json_build_object(
        'index_value', v_index_value,
        'total_vault', v_total_vault,
        'total_frozen', v_total_frozen,
        'total_lending', v_total_lending,
        'reserve_fund', v_reserve_fund,
        'pending_withdrawals', v_pending_withdrawals,
        'liquidity_ratio', ROUND(v_liquidity_ratio, 2)
    );
END;
$$;

-- Function to record liquidity snapshot (for candlestick data)
CREATE OR REPLACE FUNCTION public.record_liquidity_snapshot()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_hour TIMESTAMP WITH TIME ZONE;
    v_liquidity JSON;
    v_index_value BIGINT;
    v_existing_record UUID;
    v_deposits BIGINT;
    v_withdrawals BIGINT;
    v_loans BIGINT;
BEGIN
    -- Get current hour
    v_current_hour := date_trunc('hour', now());
    
    -- Calculate current liquidity
    v_liquidity := calculate_liquidity_index();
    v_index_value := (v_liquidity->>'index_value')::BIGINT;
    
    -- Get hourly transaction totals
    SELECT COALESCE(SUM(amount), 0) INTO v_deposits
    FROM ledger
    WHERE type = 'deposit' AND created_at >= v_current_hour;
    
    SELECT COALESCE(SUM(amount), 0) INTO v_withdrawals
    FROM ledger
    WHERE type = 'withdrawal' AND created_at >= v_current_hour;
    
    SELECT COALESCE(SUM(principal_amount), 0) INTO v_loans
    FROM p2p_loans
    WHERE created_at >= v_current_hour;
    
    -- Check for existing record this hour
    SELECT id INTO v_existing_record
    FROM liquidity_index_history
    WHERE period_start = v_current_hour;
    
    IF v_existing_record IS NOT NULL THEN
        -- Update existing record
        UPDATE liquidity_index_history
        SET 
            high_value = GREATEST(high_value, v_index_value),
            low_value = LEAST(low_value, v_index_value),
            close_value = v_index_value,
            total_deposits = v_deposits,
            total_withdrawals = v_withdrawals,
            total_loans = v_loans,
            net_flow = v_deposits - v_withdrawals
        WHERE id = v_existing_record;
    ELSE
        -- Insert new record
        INSERT INTO liquidity_index_history (
            period_start, period_end, 
            open_value, high_value, low_value, close_value,
            total_deposits, total_withdrawals, total_loans, net_flow
        ) VALUES (
            v_current_hour, v_current_hour + interval '1 hour',
            v_index_value, v_index_value, v_index_value, v_index_value,
            v_deposits, v_withdrawals, v_loans, v_deposits - v_withdrawals
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'period', v_current_hour,
        'index_value', v_index_value
    );
END;
$$;