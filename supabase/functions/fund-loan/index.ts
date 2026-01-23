import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
// Enforces: balance checks, 28-day capital lock, auto-repayment guarantee

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
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
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

    // Parse request body
    const body = await req.json();
    const { loan_id } = body;

    if (!loan_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please select a loan to fund' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call atomic fund loan function with FOR UPDATE locking
    // This prevents race conditions with multi-party balance updates
    const { data: result, error: rpcError } = await supabase.rpc('fund_loan_atomic', {
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
