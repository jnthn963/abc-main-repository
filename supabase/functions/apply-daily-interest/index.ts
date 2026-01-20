import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The Midnight Interest Cron Job
// Distributes 0.5% daily vault dividends to all members
// Uses floor() to enforce the Integer Rule (no centavos)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current interest rate from global settings
    const { data: settings, error: settingsError } = await supabase
      .from('global_settings')
      .select('vault_interest_rate, system_kill_switch, maintenance_mode')
      .single();

    if (settingsError) {
      throw new Error(`Failed to get settings: ${settingsError.message}`);
    }

    // Check if system is operational
    if (settings.system_kill_switch || settings.maintenance_mode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'System is in maintenance or kill switch is active' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const interestRate = settings.vault_interest_rate / 100; // Convert percentage to decimal

    // Get all profiles with positive vault balance
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, vault_balance, member_id')
      .gt('vault_balance', 0);

    if (profilesError) {
      throw new Error(`Failed to get profiles: ${profilesError.message}`);
    }

    let totalInterestDistributed = 0;
    let membersProcessed = 0;
    const errors: string[] = [];

    // Process each profile
    for (const profile of profiles || []) {
      try {
        // Calculate interest using floor() for Integer Rule
        const interestAmount = Math.floor(profile.vault_balance * interestRate);
        
        if (interestAmount <= 0) continue;

        const newBalance = profile.vault_balance + interestAmount;
        const referenceNumber = `INT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${profile.member_id.slice(-4)}`;

        // Update vault balance
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ vault_balance: newBalance })
          .eq('id', profile.id);

        if (updateError) {
          errors.push(`Profile ${profile.member_id}: ${updateError.message}`);
          continue;
        }

        // Record in ledger
        const { error: ledgerError } = await supabase
          .from('ledger')
          .insert({
            user_id: profile.id,
            type: 'vault_interest',
            amount: interestAmount,
            status: 'completed',
            reference_number: referenceNumber,
            description: `Daily vault interest at ${settings.vault_interest_rate}%`,
            metadata: {
              previous_balance: profile.vault_balance,
              interest_rate: settings.vault_interest_rate,
              new_balance: newBalance
            }
          });

        if (ledgerError) {
          errors.push(`Ledger for ${profile.member_id}: ${ledgerError.message}`);
          continue;
        }

        // Record in interest history
        await supabase
          .from('interest_history')
          .insert({
            user_id: profile.id,
            previous_balance: profile.vault_balance,
            interest_rate: settings.vault_interest_rate,
            interest_amount: interestAmount,
            new_balance: newBalance,
            reference_number: referenceNumber
          });

        totalInterestDistributed += interestAmount;
        membersProcessed++;

      } catch (err) {
        errors.push(`Profile ${profile.member_id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily interest calculation completed',
        stats: {
          members_processed: membersProcessed,
          total_interest_distributed: totalInterestDistributed,
          interest_rate: settings.vault_interest_rate,
          errors_count: errors.length,
          timestamp: new Date().toISOString()
        },
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in apply-daily-interest:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
