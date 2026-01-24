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
    
    // CRITICAL: Verify service role authorization for cron job security
    // Prevents unauthorized triggering of interest distribution
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.includes(supabaseServiceKey)) {
      console.error('Unauthorized cron job attempt - missing or invalid service role key');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - service role required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call atomic daily interest function with FOR UPDATE locking
    // This prevents race conditions during concurrent balance updates
    const { data: result, error: rpcError } = await supabase.rpc('apply_daily_interest_atomic');

    if (rpcError) {
      // Log full error details server-side only
      console.error('Daily interest RPC error:', rpcError);
      
      // Return generic error - internal cron job doesn't need detailed client messages
      return new Response(
        JSON.stringify({ success: false, error: 'Interest calculation failed. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    // Log full error details server-side only
    console.error('Error in apply-daily-interest:', error);
    
    // Return generic error message
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during interest calculation.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
