import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process Transfer Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Enforces: balance checks, limits, 24-hour clearing

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
    const { amount, destination, destination_type, recipient_member_id } = body;

    // Validate amount (Integer Rule: whole pesos only)
    const transferAmount = Math.floor(Number(amount));
    if (isNaN(transferAmount)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call atomic transfer function with FOR UPDATE locking
    // This prevents race conditions and double-spending
    const { data: result, error: rpcError } = await supabase.rpc('process_transfer_atomic', {
      p_user_id: user.id,
      p_amount: transferAmount,
      p_destination: destination || '',
      p_destination_type: destination_type || 'external',
      p_recipient_member_id: recipient_member_id || null
    });

    if (rpcError) {
      // Extract error message from PostgreSQL exception
      const errorMessage = rpcError.message || 'Transfer failed';
      const statusCode = errorMessage.includes('Insufficient') ? 400 :
                         errorMessage.includes('not found') ? 404 :
                         errorMessage.includes('frozen') || errorMessage.includes('maintenance') ? 503 : 400;
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transfer initiated successfully',
        data: {
          reference_number: result.reference_number,
          amount: result.amount,
          destination: destination,
          status: 'clearing',
          clearing_ends_at: result.clearing_ends_at,
          new_vault_balance: result.new_vault_balance,
          new_frozen_balance: result.new_frozen_balance
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-transfer:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
