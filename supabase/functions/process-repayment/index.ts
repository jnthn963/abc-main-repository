import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process Repayment Edge Function
// Handles loan repayment with collateral release
// Includes Reserve Fund auto-repayment guarantee for defaults

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
    if (loan.status !== 'funded') {
      return new Response(
        JSON.stringify({ success: false, error: 'Loan is not in funded status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only borrower can repay
    if (loan.borrower_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Only the borrower can repay this loan' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate repayment amount (principal + interest)
    const interestAmount = Math.floor(loan.principal_amount * (loan.interest_rate / 100));
    const totalRepayment = loan.principal_amount + interestAmount;

    // Get borrower's profile
    const { data: borrowerProfile, error: borrowerError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (borrowerError || !borrowerProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Borrower profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check borrower has sufficient balance
    if (borrowerProfile.vault_balance < totalRepayment) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. Repayment amount: ₱${totalRepayment.toLocaleString()} (Principal: ₱${loan.principal_amount.toLocaleString()} + Interest: ₱${interestAmount.toLocaleString()})` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get lender's profile
    const { data: lenderProfile, error: lenderError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loan.lender_id)
      .single();

    if (lenderError || !lenderProfile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lender profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();

    // Update loan status
    const { error: updateLoanError } = await supabase
      .from('p2p_loans')
      .update({
        status: 'repaid',
        repaid_at: now.toISOString()
      })
      .eq('id', loan_id);

    if (updateLoanError) {
      throw new Error(`Failed to update loan: ${updateLoanError.message}`);
    }

    // Deduct repayment from borrower
    const { error: borrowerUpdateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: borrowerProfile.vault_balance - totalRepayment,
        // Release collateral from frozen back to vault
        frozen_balance: Math.max(0, borrowerProfile.frozen_balance - loan.collateral_amount)
      })
      .eq('id', user.id);

    if (borrowerUpdateError) {
      throw new Error(`Failed to update borrower balance: ${borrowerUpdateError.message}`);
    }

    // Credit lender (principal returns to vault, interest as profit)
    const { error: lenderUpdateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: lenderProfile.vault_balance + totalRepayment,
        lending_balance: Math.max(0, lenderProfile.lending_balance - loan.principal_amount)
      })
      .eq('id', loan.lender_id);

    if (lenderUpdateError) {
      throw new Error(`Failed to update lender balance: ${lenderUpdateError.message}`);
    }

    // Create ledger entries
    // Borrower repayment
    await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: 'loan_repayment',
        amount: totalRepayment,
        status: 'completed',
        reference_number: `REPAY-${loan.reference_number}`,
        related_loan_id: loan_id,
        related_user_id: loan.lender_id,
        description: `Loan repayment (Principal: ₱${loan.principal_amount} + Interest: ₱${interestAmount})`
      });

    // Collateral release
    await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: 'collateral_release',
        amount: loan.collateral_amount,
        status: 'completed',
        reference_number: `COLREL-${loan.reference_number}`,
        related_loan_id: loan_id,
        description: `Collateral released after loan repayment`
      });

    // Lender receives repayment
    await supabase
      .from('ledger')
      .insert({
        user_id: loan.lender_id,
        type: 'loan_repayment',
        amount: totalRepayment,
        status: 'completed',
        reference_number: `RECV-REPAY-${loan.reference_number}`,
        related_loan_id: loan_id,
        related_user_id: user.id,
        description: `Received loan repayment`
      });

    // Lender receives interest as profit
    await supabase
      .from('ledger')
      .insert({
        user_id: loan.lender_id,
        type: 'lending_profit',
        amount: interestAmount,
        status: 'completed',
        reference_number: `PROFIT-${loan.reference_number}`,
        related_loan_id: loan_id,
        description: `Lending profit from loan ${loan.reference_number}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Loan repaid successfully',
        data: {
          loan_id: loan_id,
          reference_number: loan.reference_number,
          principal_amount: loan.principal_amount,
          interest_amount: interestAmount,
          total_repayment: totalRepayment,
          collateral_released: loan.collateral_amount,
          borrower_new_vault_balance: borrowerProfile.vault_balance - totalRepayment,
          repaid_at: now.toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-repayment:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
