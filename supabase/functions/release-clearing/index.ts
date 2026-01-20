import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hourly Clearing Release Cron Job
// Moves funds from frozen_balance to vault_balance after 24-hour clearing period

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all clearing transactions that have passed their clearing period
    const { data: clearingTransactions, error: txError } = await supabase
      .from('ledger')
      .select('*')
      .eq('status', 'clearing')
      .lt('clearing_ends_at', new Date().toISOString());

    if (txError) {
      throw new Error(`Failed to get clearing transactions: ${txError.message}`);
    }

    let transactionsCleared = 0;
    const errors: string[] = [];

    for (const tx of clearingTransactions || []) {
      try {
        // Update transaction status to completed
        const { error: updateTxError } = await supabase
          .from('ledger')
          .update({ 
            status: 'completed',
            cleared_at: new Date().toISOString()
          })
          .eq('id', tx.id);

        if (updateTxError) {
          errors.push(`Transaction ${tx.reference_number}: ${updateTxError.message}`);
          continue;
        }

        // Handle different transaction types
        if (tx.type === 'deposit') {
          // For deposits, move from frozen to vault
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('vault_balance, frozen_balance')
            .eq('id', tx.user_id)
            .single();

          if (profileError) {
            errors.push(`Profile for ${tx.reference_number}: ${profileError.message}`);
            continue;
          }

          // Move amount from frozen to vault
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({
              vault_balance: profile.vault_balance + tx.amount,
              frozen_balance: Math.max(0, profile.frozen_balance - tx.amount)
            })
            .eq('id', tx.user_id);

          if (balanceError) {
            errors.push(`Balance update for ${tx.reference_number}: ${balanceError.message}`);
            continue;
          }
        }

        transactionsCleared++;

      } catch (err) {
        errors.push(`Transaction ${tx.reference_number}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Clearing release completed',
        stats: {
          transactions_cleared: transactionsCleared,
          total_found: clearingTransactions?.length || 0,
          errors_count: errors.length,
          timestamp: new Date().toISOString()
        },
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in release-clearing:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
