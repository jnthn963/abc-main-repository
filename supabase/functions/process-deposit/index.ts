import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 10 deposits per hour per user
const RATE_LIMIT = 10;
const RATE_WINDOW_SECONDS = 3600; // 1 hour

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  const safeErrors: Record<string, string> = {
    'minimum': 'Deposit amount does not meet the minimum requirement of ₱100',
    'maximum': 'Deposit amount exceeds the maximum limit of ₱10,000,000',
    'not found': 'Profile not found. Please complete your registration.',
    'maintenance': 'Deposit service is temporarily unavailable',
  };

  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  return 'An error occurred processing your deposit. Please try again.';
}

// Process Deposit Edge Function
// Records deposits with pending_review status for Governor approval
// Enforces: Integer Rule, min/max limits, 24-hour clearing, rate limiting

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
        JSON.stringify({ success: false, error: 'Authentication required' }),
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
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const rateLimitKey = `deposit:${user.id}`;
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (allowed === false) {
      return new Response(
        JSON.stringify({ success: false, error: 'Too many deposit requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid request format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, reference_number } = body;

    // Validate amount (Integer Rule: whole pesos only)
    const depositAmount = Math.floor(Number(amount));
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid deposit amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enforce deposit limits (₱100 - ₱10,000,000)
    if (depositAmount < 100) {
      return new Response(
        JSON.stringify({ success: false, error: 'Minimum deposit amount is ₱100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (depositAmount > 10000000) {
      return new Response(
        JSON.stringify({ success: false, error: 'Maximum deposit amount is ₱10,000,000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reference number if not provided
    const { data: refData } = await supabase.rpc('generate_reference_number');
    const finalReference = reference_number || refData || `DEP-${Date.now()}`;

    // Calculate clearing time (24 hours from now)
    const clearingEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // CRITICAL: Convert to centavos for database storage (Whole Peso Mandate)
    const depositAmountCentavos = depositAmount * 100;

    // Create deposit ledger entry with pending_review status
    const { data: ledgerEntry, error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: 'deposit',
        amount: depositAmountCentavos, // Store in centavos
        status: 'clearing',
        approval_status: 'pending_review',
        reference_number: finalReference,
        description: 'Deposit via QR PH Gateway',
        clearing_ends_at: clearingEndsAt,
        metadata: {
          source: 'qr_ph_gateway',
          amount_pesos: depositAmount, // Store original peso amount for reference
          submitted_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (ledgerError) {
      console.error('Deposit ledger error:', ledgerError);
      return new Response(
        JSON.stringify({ success: false, error: sanitizeErrorMessage(ledgerError.message || '') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's member_id for notification
    const { data: profile } = await supabase
      .from('profiles')
      .select('member_id')
      .eq('id', user.id)
      .single();

    // Notify governors of new pending action (non-blocking)
    try {
      await fetch(`${supabaseUrl}/functions/v1/notify-governor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action_type: 'deposit',
          member_id: profile?.member_id || 'Unknown',
          amount: depositAmount,
          reference_number: finalReference,
        }),
      });
    } catch (notifyErr) {
      // Non-blocking - don't fail the deposit if notification fails
      console.error('Governor notification failed (non-blocking):', notifyErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deposit submitted for review',
        data: {
          transaction_id: ledgerEntry.id,
          reference_number: finalReference,
          amount: depositAmount,
          status: 'pending_review',
          clearing_ends_at: clearingEndsAt,
          message: 'Your deposit is pending Governor verification. Funds will be credited after approval.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-deposit:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your deposit. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
