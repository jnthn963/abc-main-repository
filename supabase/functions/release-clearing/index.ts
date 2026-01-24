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
    
    // CRITICAL: Verify service role authorization for cron job security
    // Prevents unauthorized triggering of clearing releases
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.includes(supabaseServiceKey)) {
      console.error('Unauthorized cron job attempt - missing or invalid service role key');
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized - service role required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call atomic clearing release function with FOR UPDATE locking
    // This prevents race conditions during concurrent balance operations
    const { data: result, error: rpcError } = await supabase.rpc('release_clearing_atomic');

    if (rpcError) {
      // Log full error details server-side only
      console.error('Release clearing RPC error:', rpcError);
      
      // Return generic error - internal cron job doesn't need detailed client messages
      return new Response(
        JSON.stringify({ success: false, error: 'Clearing release failed. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    // Log full error details server-side only
    console.error('Error in release-clearing:', error);
    
    // Return generic error message
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during clearing release.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
