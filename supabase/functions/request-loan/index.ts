import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 5 loan requests per day per user
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 86400; // 24 hours

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  const safeErrors: Record<string, string> = {
    'Insufficient': 'Insufficient collateral for this loan amount',
    'not found': 'Profile not found. Please complete your registration.',
    'unavailable': 'Loan service is temporarily unavailable',
    'collateral': 'You need more vault balance to secure this loan',
    'aging': 'Your account must be at least 6 days old to request a loan',
    'minimum': 'Loan amount does not meet the minimum requirement',
    'maximum': 'Loan amount exceeds the maximum limit',
  };

  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  return 'An error occurred processing your loan request. Please try again.';
}

// Request Loan Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Enforces: 50% collateral rule, 6-day aging requirement, 28-day capital lock, rate limiting

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth for JWT verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT using getClaims (works with ES256 signing keys)
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from claims
    const user = { id: claimsData.claims.sub };

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const rateLimitKey = `loan_request:${user.id}`;
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
        JSON.stringify({ success: false, error: 'Too many loan requests. Please try again tomorrow.' }),
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

    const { amount } = body;

    // Validate amount (Integer Rule: whole pesos only)
    const loanAmount = Math.floor(Number(amount));
    if (isNaN(loanAmount) || loanAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid loan amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call atomic loan request function with FOR UPDATE locking
    // This prevents race conditions and collateral double-locking
    const { data: result, error: rpcError } = await supabase.rpc('request_loan_atomic', {
      p_user_id: user.id,
      p_amount: loanAmount
    });

    if (rpcError) {
      // Log full error details server-side only
      console.error('Request loan RPC error:', rpcError);
      
      // Return sanitized error message to client
      const sanitizedMessage = sanitizeErrorMessage(rpcError.message || '');
      const statusCode = rpcError.message?.includes('not found') ? 404 :
                         rpcError.message?.includes('unavailable') ? 503 : 400;
      
      return new Response(
        JSON.stringify({ success: false, error: sanitizedMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan request submitted for review',
        data: {
          loan_id: result.loan_id,
          reference_number: result.reference_number,
          principal_amount: result.principal_amount,
          collateral_amount: result.collateral_amount,
          interest_rate: result.interest_rate,
          status: 'pending_review',
          duration_days: 30,
          capital_lock_days: 28,
          message: 'Your loan request is pending Governor verification before appearing in the marketplace.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log full error details server-side only
    console.error('Error in request-loan:', error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your loan request. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
