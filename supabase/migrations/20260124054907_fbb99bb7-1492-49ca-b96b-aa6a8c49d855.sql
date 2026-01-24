
-- =====================================================
-- CDC (Change Data Capture) Infrastructure
-- Pseudo-CDC using pg_net webhooks for real-time sync
-- =====================================================

-- CDC configuration table to manage monitored tables
CREATE TABLE IF NOT EXISTS public.cdc_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL UNIQUE,
    webhook_url TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    include_old_data BOOLEAN DEFAULT true,
    operations TEXT[] DEFAULT ARRAY['INSERT', 'UPDATE', 'DELETE'],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CDC event log for debugging and replay
CREATE TABLE IF NOT EXISTS public.cdc_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    webhook_status TEXT DEFAULT 'pending',
    webhook_response TEXT,
    request_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on CDC tables
ALTER TABLE public.cdc_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cdc_events ENABLE ROW LEVEL SECURITY;

-- Only governors can manage CDC config
CREATE POLICY "Governors can manage CDC config"
ON public.cdc_config FOR ALL
USING (has_role(auth.uid(), 'governor'::app_role));

-- Only governors can view CDC events
CREATE POLICY "Governors can view CDC events"
ON public.cdc_events FOR SELECT
USING (has_role(auth.uid(), 'governor'::app_role));

-- System can insert CDC events (no auth context during trigger)
CREATE POLICY "System can insert CDC events"
ON public.cdc_events FOR INSERT
WITH CHECK (true);

-- Index for efficient event queries
CREATE INDEX IF NOT EXISTS idx_cdc_events_created_at ON public.cdc_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdc_events_table_name ON public.cdc_events(table_name);
CREATE INDEX IF NOT EXISTS idx_cdc_events_status ON public.cdc_events(webhook_status);

-- =====================================================
-- Generic CDC Trigger Function
-- Captures changes and sends to configured webhook
-- =====================================================
CREATE OR REPLACE FUNCTION public.cdc_trigger_function()
RETURNS TRIGGER
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
    -- Get CDC config for this table
    SELECT * INTO v_config
    FROM cdc_config
    WHERE table_name = TG_TABLE_NAME
      AND enabled = true;
    
    -- If no config or disabled, skip
    IF NOT FOUND THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Check if this operation should be captured
    IF NOT (TG_OP = ANY(v_config.operations)) THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END IF;
    
    -- Capture data based on operation
    IF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := COALESCE(NEW.id::TEXT, 'unknown');
    ELSIF TG_OP = 'UPDATE' THEN
        v_new_data := to_jsonb(NEW);
        IF v_config.include_old_data THEN
            v_old_data := to_jsonb(OLD);
        END IF;
        v_record_id := COALESCE(NEW.id::TEXT, 'unknown');
    ELSIF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := COALESCE(OLD.id::TEXT, 'unknown');
    END IF;
    
    -- Build payload
    v_payload := jsonb_build_object(
        'event_type', 'cdc',
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'operation', TG_OP,
        'record_id', v_record_id,
        'old_data', v_old_data,
        'new_data', v_new_data,
        'timestamp', NOW(),
        'trigger_name', TG_NAME
    );
    
    -- Log event first
    INSERT INTO cdc_events (table_name, operation, record_id, old_data, new_data, webhook_status)
    VALUES (TG_TABLE_NAME, TG_OP, v_record_id, v_old_data, v_new_data, 'sending')
    RETURNING id INTO v_event_id;
    
    -- Send webhook via pg_net (async HTTP POST)
    BEGIN
        SELECT net.http_post(
            url := v_config.webhook_url,
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'X-CDC-Event-ID', v_event_id::TEXT,
                'X-CDC-Table', TG_TABLE_NAME,
                'X-CDC-Operation', TG_OP
            ),
            body := v_payload
        ) INTO v_request_id;
        
        -- Update event with request ID
        UPDATE cdc_events
        SET request_id = v_request_id, webhook_status = 'sent'
        WHERE id = v_event_id;
        
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the transaction
        UPDATE cdc_events
        SET webhook_status = 'error', webhook_response = SQLERRM
        WHERE id = v_event_id;
    END;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- =====================================================
-- Helper function to enable CDC on a table
-- =====================================================
CREATE OR REPLACE FUNCTION public.enable_cdc_on_table(
    p_table_name TEXT,
    p_webhook_url TEXT,
    p_operations TEXT[] DEFAULT ARRAY['INSERT', 'UPDATE', 'DELETE'],
    p_include_old_data BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trigger_name TEXT;
BEGIN
    -- Only governors can enable CDC
    IF NOT has_role(auth.uid(), 'governor'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Governor role required';
    END IF;
    
    -- Upsert config
    INSERT INTO cdc_config (table_name, webhook_url, operations, include_old_data, enabled)
    VALUES (p_table_name, p_webhook_url, p_operations, p_include_old_data, true)
    ON CONFLICT (table_name) DO UPDATE SET
        webhook_url = EXCLUDED.webhook_url,
        operations = EXCLUDED.operations,
        include_old_data = EXCLUDED.include_old_data,
        enabled = true,
        updated_at = NOW();
    
    -- Create trigger name
    v_trigger_name := 'cdc_trigger_' || p_table_name;
    
    -- Drop existing trigger if exists
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger_name, p_table_name);
    
    -- Create new trigger
    EXECUTE format(
        'CREATE TRIGGER %I
         AFTER INSERT OR UPDATE OR DELETE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION cdc_trigger_function()',
        v_trigger_name, p_table_name
    );
    
    -- Log the action
    INSERT INTO admin_audit_log (admin_id, action, details)
    VALUES (auth.uid(), 'CDC_ENABLED', jsonb_build_object(
        'table_name', p_table_name,
        'webhook_url', p_webhook_url,
        'operations', p_operations
    ));
    
    RETURN jsonb_build_object(
        'success', true,
        'table', p_table_name,
        'trigger_name', v_trigger_name,
        'webhook_url', p_webhook_url
    );
END;
$$;

-- =====================================================
-- Helper function to disable CDC on a table
-- =====================================================
CREATE OR REPLACE FUNCTION public.disable_cdc_on_table(p_table_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trigger_name TEXT;
BEGIN
    -- Only governors can disable CDC
    IF NOT has_role(auth.uid(), 'governor'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Governor role required';
    END IF;
    
    -- Disable in config
    UPDATE cdc_config SET enabled = false, updated_at = NOW()
    WHERE table_name = p_table_name;
    
    -- Create trigger name
    v_trigger_name := 'cdc_trigger_' || p_table_name;
    
    -- Drop trigger
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', v_trigger_name, p_table_name);
    
    -- Log the action
    INSERT INTO admin_audit_log (admin_id, action, details)
    VALUES (auth.uid(), 'CDC_DISABLED', jsonb_build_object('table_name', p_table_name));
    
    RETURN jsonb_build_object(
        'success', true,
        'table', p_table_name,
        'message', 'CDC disabled for table'
    );
END;
$$;

-- =====================================================
-- Function to get CDC event stats
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_cdc_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT has_role(auth.uid(), 'governor'::app_role) THEN
        RAISE EXCEPTION 'Unauthorized: Governor role required';
    END IF;
    
    SELECT jsonb_build_object(
        'total_events', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE webhook_status = 'pending'),
        'sent', COUNT(*) FILTER (WHERE webhook_status = 'sent'),
        'error', COUNT(*) FILTER (WHERE webhook_status = 'error'),
        'last_24h', COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours'),
        'by_table', (
            SELECT jsonb_object_agg(table_name, cnt)
            FROM (SELECT table_name, COUNT(*) as cnt FROM cdc_events GROUP BY table_name) t
        )
    ) INTO v_result
    FROM cdc_events;
    
    RETURN v_result;
END;
$$;

-- Add comments
COMMENT ON TABLE public.cdc_config IS 'Configuration for CDC (Change Data Capture) webhooks per table';
COMMENT ON TABLE public.cdc_events IS 'Log of all CDC events with webhook delivery status';
COMMENT ON FUNCTION public.cdc_trigger_function IS 'Generic trigger function that captures changes and sends to configured webhook via pg_net';
COMMENT ON FUNCTION public.enable_cdc_on_table IS 'Enable CDC tracking on a table with specified webhook URL';
COMMENT ON FUNCTION public.disable_cdc_on_table IS 'Disable CDC tracking on a table';
