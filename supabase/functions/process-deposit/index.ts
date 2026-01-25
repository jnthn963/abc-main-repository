import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 10 deposits per hour per user
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 3600; // 1 hour

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  const safeErrors: Record<string, string> = {
    'minimum': 'Deposit amount does not meet the minimum requirement of ₱100',
    'maximum': 'Deposit amount exceeds the maximum limit of ₱10,000,000',
    'not found': 'Profile not found. Please complete your registration.',
    'maintenance': 'Deposit service is temporarily unavailable',
  };

  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  return 'An error occurred processing your deposit. Please try again.';
}

// Move service-role client to module scope so it can be reused between invocations
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Process Deposit Edge Function
// Records deposits with pending_review status for Governor approval
// Enforces: Integer Rule, min/max limits, 24-hour clearing, rate limiting

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

    // Create client with user's auth (per-request because of Authorization header)
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

    // Use supabaseService (module-scope) for privileged DB operations
    const supabase = supabaseService;

    // Check rate limit
    const rateLimitKey = `deposit:${user.id}`;
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
        JSON.stringify({ success: false, error: 'Too many deposit requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, reference_number } = body;

    // Validate amount (Integer Rule: whole pesos only)
    const depositAmount = Math.floor(Number(amount));
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid deposit amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce deposit limits (₱100 - ₱10,000,000)
    if (depositAmount < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum deposit amount is ₱100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (depositAmount > 10000000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Maximum deposit amount is ₱10,000,000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ... rest of the function uses `supabase` (the module-scope client) for DB RPCs and inserts ...

  } catch (error) {
    console.error('Process deposit error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An internal error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
