-- Create rate limits table for tracking request counts
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key TEXT PRIMARY KEY,
  count INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table
CREATE POLICY "Service role only" ON public.rate_limits
  FOR ALL USING (false);

-- Create rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key TEXT,
  p_limit INT,
  p_window_seconds INT
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Try to get existing record with lock
  SELECT count, window_start INTO v_count, v_window_start
  FROM public.rate_limits WHERE key = p_key FOR UPDATE;
  
  -- If not found or window expired, reset counter
  IF NOT FOUND OR NOW() - v_window_start > (p_window_seconds || ' seconds')::INTERVAL THEN
    INSERT INTO public.rate_limits (key, count, window_start)
    VALUES (p_key, 1, NOW())
    ON CONFLICT (key) DO UPDATE SET count = 1, window_start = NOW();
    RETURN TRUE;
  END IF;
  
  -- Check if limit exceeded
  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits SET count = count + 1 WHERE key = p_key;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create cleanup function to remove old rate limit entries
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE NOW() - window_start > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.check_rate_limit TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits TO service_role;