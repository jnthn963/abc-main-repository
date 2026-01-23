import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request Loan Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Enforces: 50% collateral rule, 6-day aging requirement, 28-day capital lock

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
        JSON.stringify({ success: false, error: 'Unauthorized' }),
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
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { amount } = body;

    // Validate amount (Integer Rule: whole pesos only)
    const loanAmount = Math.floor(Number(amount));
    if (isNaN(loanAmount)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call atomic loan request function with FOR UPDATE locking
    // This prevents race conditions and collateral double-locking
    const { data: result, error: rpcError } = await supabase.rpc('request_loan_atomic', {
      p_user_id: user.id,
      p_amount: loanAmount
    });

    if (rpcError) {
      // Extract error message from PostgreSQL exception
      const errorMessage = rpcError.message || 'Loan request failed';
      const statusCode = errorMessage.includes('not found') ? 404 :
                         errorMessage.includes('unavailable') ? 503 : 400;
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan request created successfully',
        data: {
          loan_id: result.loan_id,
          reference_number: result.reference_number,
          principal_amount: result.principal_amount,
          collateral_amount: result.collateral_amount,
          interest_rate: result.interest_rate,
          status: 'open',
          duration_days: 30,
          capital_lock_days: 28
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in request-loan:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
