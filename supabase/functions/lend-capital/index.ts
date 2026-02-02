import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: 5 lend operations per hour per user
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 3600;

// ABC LEND CAPITAL Edge Function
// Moves funds from E-Wallet (vault_balance) to Lend Capital (lending_balance)
// Enforces: 50% vault limit, whole peso amounts, rate limiting
// Premium Yield: +0.7% daily (applied via cron job)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authenticated user
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit check
    const rateLimitKey = `lend_capital:${user.id}`;
    const { data: allowed } = await supabase.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    if (allowed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many lend requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount } = body;

    // Validate amount (whole pesos, stored as centavos internally)
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum lend amount is ₱100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whole Peso Mandate: floor the amount
    const amountCentavos = Math.floor(amount) * 100;

    // Call atomic lend capital function
    const { data: result, error: rpcError } = await supabase.rpc('lend_capital_atomic', {
      p_user_id: user.id,
      p_amount: amountCentavos
    });

    if (rpcError) {
      console.error('Lend capital RPC error:', rpcError);
      
      // Sanitize error messages
      let errorMessage = 'An error occurred. Please try again.';
      if (rpcError.message?.includes('Insufficient')) {
        errorMessage = 'Insufficient E-Wallet balance';
      } else if (rpcError.message?.includes('exceeds 50%')) {
        errorMessage = 'Amount exceeds 50% vault limit';
      } else if (rpcError.message?.includes('minimum')) {
        errorMessage = 'Minimum lend amount is ₱100';
      }
      
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Funds moved to Lend Capital successfully',
        data: {
          amount_lended: result.amount_lended,
          new_vault_balance: result.new_vault_balance,
          new_lending_balance: result.new_lending_balance,
          reference_number: result.reference_number,
          daily_yield_rate: 0.7,
          message: 'Your capital is now earning +0.7% daily premium yield!'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lend-capital:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
