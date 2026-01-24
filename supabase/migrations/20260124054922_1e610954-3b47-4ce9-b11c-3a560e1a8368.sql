
-- Fix the permissive RLS policy on cdc_events
-- Instead of WITH CHECK (true), we'll check for no auth context (trigger) OR governor role
DROP POLICY IF EXISTS "System can insert CDC events" ON public.cdc_events;

-- Allow inserts from triggers (no auth context) or governors
CREATE POLICY "Triggers and governors can insert CDC events"
ON public.cdc_events FOR INSERT
WITH CHECK (auth.uid() IS NULL OR has_role(auth.uid(), 'governor'::app_role));

-- Also allow governors to update (for marking as processed)
CREATE POLICY "Governors can update CDC events"
ON public.cdc_events FOR UPDATE
USING (has_role(auth.uid(), 'governor'::app_role));

-- Add cleanup function for old events
CREATE OR REPLACE FUNCTION public.cleanup_cdc_events(p_days_old INTEGER DEFAULT 7)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    IF NOT has_role(auth.uid(), 'governor'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Governor role required';
    END IF;
    
    DELETE FROM cdc_events
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
      AND webhook_status != 'error';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    INSERT INTO admin_audit_log (admin_id, action, details)
    VALUES (auth.uid(), 'CDC_CLEANUP', jsonb_build_object(
        'deleted_count', v_deleted,
        'days_old', p_days_old
    ));
    
    RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION public.cleanup_cdc_events IS 'Clean up old CDC events, keeping failed ones for debugging';
