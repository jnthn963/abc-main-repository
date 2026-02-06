import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 10 loan fundings per hour per user
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 3600; // 1 hour

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  const safeErrors: Record<string, string> = {
    'Insufficient': 'Insufficient funds to fund this loan',
    'not found': 'Loan request not found or no longer available',
    'unavailable': 'This loan is no longer available for funding',
    'already funded': 'This loan has already been funded',
    'own loan': 'You cannot fund your own loan request',
  };

  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  return 'An error occurred processing your request. Please try again.';
}

// Fund Loan Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Enforces: balance checks, 28-day capital lock, auto-repayment guarantee, rate limiting

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

    // Use service role for all operations since:
    // 1. User is already authenticated via getClaims() above
    // 2. RPC function has defense-in-depth auth check (verifies p_lender_id)
    // 3. Profile balance trigger requires null auth.uid() OR admin/governor role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const rateLimitKey = `fund_loan:${user.id}`;
    const { data: allowed, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (allowed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many loan funding requests. Please try again later.' }),
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

    const { loan_id } = body;

    if (!loan_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please select a loan to fund' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call atomic fund loan function with service role
    // The RPC function validates p_lender_id matches the authenticated user
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('fund_loan_atomic', {
      p_lender_id: user.id,
      p_loan_id: loan_id
    });

    if (rpcError) {
      // Log full error details server-side only
      console.error('Fund loan RPC error:', rpcError);
      
      // Return sanitized error message to client
      const sanitizedMessage = sanitizeErrorMessage(rpcError.message || '');
      const statusCode = rpcError.message?.includes('not found') ? 404 :
                         rpcError.message?.includes('unavailable') ? 503 :
                         rpcError.message?.includes('Insufficient') ? 400 : 400;
      
      return new Response(
        JSON.stringify({ success: false, error: sanitizedMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan funding submitted for review',
        data: {
          loan_id: result.loan_id,
          reference_number: result.reference_number,
          principal_amount: result.principal_amount,
          interest_rate: result.interest_rate,
          due_date: result.due_date,
          capital_unlock_date: result.capital_unlock_date,
          lender_new_vault_balance: result.lender_new_vault_balance,
          lender_new_lending_balance: result.lender_new_lending_balance,
          status: 'pending_review',
          message: 'Your loan funding is pending Governor verification of 200% collateral.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log full error details server-side only
    console.error('Error in fund-loan:', error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your loan funding. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
