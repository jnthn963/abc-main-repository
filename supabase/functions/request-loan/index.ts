import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Request Loan Edge Function
// Server-side validation for P2P loan requests
// Enforces: 50% collateral rule, 6-day aging requirement, 28-day capital lock

const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000; // 144 hours
const CAPITAL_LOCK_DAYS = 28;
const LOAN_DURATION_DAYS = 30;

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

    // Validate amount (Integer Rule: whole pesos only, min 100, max 5M)
    const loanAmount = Math.floor(Number(amount));
    if (isNaN(loanAmount) || loanAmount < 100 || loanAmount > 5000000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid amount. Must be between ₱100 and ₱5,000,000' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check system status
    const { data: settings } = await supabase
      .from('global_settings')
      .select('system_kill_switch, maintenance_mode, lending_yield_rate')
      .single();

    if (settings?.system_kill_switch || settings?.maintenance_mode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'System is currently unavailable' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check 6-day aging requirement
    const accountAge = Date.now() - new Date(profile.created_at).getTime();
    if (accountAge < SIX_DAYS_MS) {
      const remainingDays = Math.ceil((SIX_DAYS_MS - accountAge) / (24 * 60 * 60 * 1000));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Your account must be at least 6 days old to request a loan. ${remainingDays} days remaining.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check 50% collateral rule (loan cannot exceed 50% of vault balance)
    const maxLoan = Math.floor(profile.vault_balance * 0.5);
    if (loanAmount > maxLoan) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Loan amount exceeds maximum. Based on 50% collateral rule, your maximum loan is ₱${maxLoan.toLocaleString()}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate collateral (100% of loan amount for full coverage)
    const collateralAmount = loanAmount;

    // Check sufficient balance for collateral
    if (profile.vault_balance < collateralAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Insufficient vault balance for collateral' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reference number
    const referenceNumber = `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Lock collateral (move from vault to frozen)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: profile.vault_balance - collateralAmount,
        frozen_balance: profile.frozen_balance + collateralAmount
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to lock collateral: ${updateError.message}`);
    }

    // Create loan request
    const { data: loan, error: loanError } = await supabase
      .from('p2p_loans')
      .insert({
        borrower_id: user.id,
        principal_amount: loanAmount,
        interest_rate: settings?.lending_yield_rate || 15,
        collateral_amount: collateralAmount,
        duration_days: LOAN_DURATION_DAYS,
        capital_lock_days: CAPITAL_LOCK_DAYS,
        status: 'open',
        reference_number: referenceNumber
      })
      .select()
      .single();

    if (loanError) {
      // Rollback collateral lock
      await supabase
        .from('profiles')
        .update({
          vault_balance: profile.vault_balance,
          frozen_balance: profile.frozen_balance
        })
        .eq('id', user.id);

      throw new Error(`Failed to create loan: ${loanError.message}`);
    }

    // Create collateral lock ledger entry
    await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: 'collateral_lock',
        amount: collateralAmount,
        status: 'completed',
        reference_number: `COL-${referenceNumber}`,
        related_loan_id: loan.id,
        description: `Collateral locked for loan ${referenceNumber}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan request created successfully',
        data: {
          loan_id: loan.id,
          reference_number: referenceNumber,
          principal_amount: loanAmount,
          collateral_amount: collateralAmount,
          interest_rate: settings?.lending_yield_rate || 15,
          status: 'open',
          duration_days: LOAN_DURATION_DAYS,
          capital_lock_days: CAPITAL_LOCK_DAYS
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
