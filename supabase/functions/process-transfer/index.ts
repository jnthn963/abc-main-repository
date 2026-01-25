import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 20 transfers per hour per user
const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 3600; // 1 hour

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  // Map known safe error patterns to user-friendly messages
  const safeErrors: Record<string, string> = {
    'Insufficient': 'Insufficient funds for this transaction',
    'not found': 'The requested resource was not found',
    'frozen': 'This operation is temporarily unavailable',
    'maintenance': 'System is under maintenance. Please try again later',
    'minimum': 'Amount does not meet the minimum requirement',
    'maximum': 'Amount exceeds the maximum limit',
    'limit': 'Transaction limit exceeded',
  };

  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  return 'An error occurred processing your request. Please try again.';
}

// Move service-role client to module scope
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Process Transfer Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Enforces: balance checks, limits, 24-hour clearing, rate limiting

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth
    const supabaseUser = createClient(SUPABASE_URL, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use module-scope service client for privileged DB operations
    const supabase = supabaseService;

    // Check rate limit
    const rateLimitKey = `transfer:${user.id}`;
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (allowed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many transfer requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ... rest of the function uses `supabase` (the module-scope client) for DB RPCs and inserts ...

  } catch (error) {
    console.error('Process transfer error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
