import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 10 repayments per hour per user
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 3600; // 1 hour

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  const safeErrors: Record<string, string> = {
    'Insufficient': 'Insufficient funds to repay this loan',
    'not found': 'Loan not found or already repaid',
    'Only the borrower': 'You can only repay your own loans',
    'already repaid': 'This loan has already been repaid',
  };

  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  return 'An error occurred processing your repayment. Please try again.';
}

// Process Repayment Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Handles loan repayment with collateral release, rate limiting

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
    const rateLimitKey = `repayment:${user.id}`;
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
        JSON.stringify({ success: false, error: 'Too many repayment requests. Please try again later.' }),
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
        JSON.stringify({ success: false, error: 'Please select a loan to repay' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call atomic repayment function with FOR UPDATE locking
    // This prevents race conditions with multi-balance updates
    const { data: result, error: rpcError } = await supabase.rpc('process_repayment_atomic', {
      p_borrower_id: user.id,
      p_loan_id: loan_id
    });

    if (rpcError) {
      // Log full error details server-side only
      console.error('Repayment RPC error:', rpcError);
      
      // Return sanitized error message to client
      const sanitizedMessage = sanitizeErrorMessage(rpcError.message || '');
      const statusCode = rpcError.message?.includes('not found') ? 404 :
                         rpcError.message?.includes('Insufficient') ? 400 :
                         rpcError.message?.includes('Only the borrower') ? 403 : 400;
      
      return new Response(
        JSON.stringify({ success: false, error: sanitizedMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan repaid successfully',
        data: {
          loan_id: result.loan_id,
          reference_number: result.reference_number,
          principal_amount: result.principal_amount,
          interest_amount: result.interest_amount,
          total_repayment: result.total_repayment,
          collateral_released: result.collateral_released,
          borrower_new_vault_balance: result.borrower_new_vault_balance,
          repaid_at: result.repaid_at
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log full error details server-side only
    console.error('Error in process-repayment:', error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your repayment. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
