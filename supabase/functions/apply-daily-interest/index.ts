import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The Midnight Interest Cron Job
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
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

    // Call atomic daily interest function with FOR UPDATE locking
    // This prevents race conditions during concurrent balance updates
    const { data: result, error: rpcError } = await supabase.rpc('apply_daily_interest_atomic');

    if (rpcError) {
      throw new Error(`Daily interest calculation failed: ${rpcError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        stats: {
          members_processed: result.members_processed,
          total_interest_distributed: result.total_interest_distributed,
          interest_rate: result.interest_rate,
          errors_count: result.errors_count,
          timestamp: result.timestamp
        }
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
