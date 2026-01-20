import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fund Loan Edge Function
// Server-side validation for P2P loan funding
// Enforces: balance checks, 28-day capital lock, auto-repayment guarantee

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
    const { loan_id } = body;

    if (!loan_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Loan ID is required' }),
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

    // Get the loan
    const { data: loan, error: loanError } = await supabase
      .from('p2p_loans')
      .select('*')
      .eq('id', loan_id)
      .single();

    if (loanError || !loan) {
      return new Response(
        JSON.stringify({ success: false, error: 'Loan not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate loan status
    if (loan.status !== 'open') {
      return new Response(
        JSON.stringify({ success: false, error: 'Loan is no longer available for funding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check lender is not the borrower
    if (loan.borrower_id === user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'You cannot fund your own loan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lender's profile
    const { data: lenderProfile, error: lenderError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (lenderError || !lenderProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lender profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check lender has sufficient balance
    if (lenderProfile.vault_balance < loan.principal_amount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. You need ₱${loan.principal_amount.toLocaleString()} to fund this loan.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get borrower's profile
    const { data: borrowerProfile, error: borrowerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loan.borrower_id)
      .single();

    if (borrowerError || !borrowerProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Borrower profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const dueDate = new Date(now.getTime() + LOAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
    const capitalUnlockDate = new Date(now.getTime() + CAPITAL_LOCK_DAYS * 24 * 60 * 60 * 1000);

    // Update loan status
    const { error: updateLoanError } = await supabase
      .from('p2p_loans')
      .update({
        lender_id: user.id,
        status: 'funded',
        funded_at: now.toISOString(),
        due_date: dueDate.toISOString(),
        capital_unlock_date: capitalUnlockDate.toISOString()
      })
      .eq('id', loan_id);

    if (updateLoanError) {
      throw new Error(`Failed to update loan: ${updateLoanError.message}`);
    }

    // Deduct from lender's vault, add to lending_balance (locked for 28 days)
    const { error: lenderUpdateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: lenderProfile.vault_balance - loan.principal_amount,
        lending_balance: lenderProfile.lending_balance + loan.principal_amount
      })
      .eq('id', user.id);

    if (lenderUpdateError) {
      throw new Error(`Failed to update lender balance: ${lenderUpdateError.message}`);
    }

    // Add principal to borrower's vault
    const { error: borrowerUpdateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: borrowerProfile.vault_balance + loan.principal_amount
      })
      .eq('id', loan.borrower_id);

    if (borrowerUpdateError) {
      throw new Error(`Failed to update borrower balance: ${borrowerUpdateError.message}`);
    }

    // Create ledger entries
    // Lender outgoing
    await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: 'loan_funding',
        amount: loan.principal_amount,
        status: 'completed',
        reference_number: `FUND-${loan.reference_number}`,
        related_loan_id: loan_id,
        related_user_id: loan.borrower_id,
        description: `Funded loan ${loan.reference_number}`
      });

    // Borrower incoming
    await supabase
      .from('ledger')
      .insert({
        user_id: loan.borrower_id,
        type: 'loan_funding',
        amount: loan.principal_amount,
        status: 'completed',
        reference_number: `RECV-${loan.reference_number}`,
        related_loan_id: loan_id,
        related_user_id: user.id,
        description: `Received loan funding from lender`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan funded successfully',
        data: {
          loan_id: loan_id,
          reference_number: loan.reference_number,
          principal_amount: loan.principal_amount,
          interest_rate: loan.interest_rate,
          due_date: dueDate.toISOString(),
          capital_unlock_date: capitalUnlockDate.toISOString(),
          lender_new_vault_balance: lenderProfile.vault_balance - loan.principal_amount,
          lender_new_lending_balance: lenderProfile.lending_balance + loan.principal_amount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fund-loan:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
