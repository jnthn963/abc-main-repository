import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hourly Clearing Release Cron Job
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Moves funds from frozen_balance to vault_balance after 24-hour clearing period

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call atomic clearing release function with FOR UPDATE locking
    // This prevents race conditions during concurrent balance operations
    const { data: result, error: rpcError } = await supabase.rpc('release_clearing_atomic');

    if (rpcError) {
      throw new Error(`Clearing release failed: ${rpcError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        message: result.message,
        stats: {
          transactions_cleared: result.transactions_cleared,
          total_found: result.total_found,
          errors_count: result.errors_count,
          timestamp: result.timestamp
        }
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
