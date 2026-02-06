import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 20 transfers per hour per user
const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 3600; // 1 hour

// Sanitize error messages to prevent internal details from leaking to clients
function sanitizeErrorMessage(error: string): string {
  // Map known safe error patterns to user-friendly messages
  const safeErrors: Record<string, string> = {
    'Insufficient': 'Insufficient funds for this transaction',
    'not found': 'The requested resource was not found',
    'frozen': 'This operation is temporarily unavailable',
    'maintenance': 'System is under maintenance. Please try again later',
    'minimum': 'Amount does not meet the minimum requirement',
    'maximum': 'Amount exceeds the maximum limit',
    'limit': 'Transaction limit exceeded',
  };

  // Check if error matches any safe pattern
  for (const [pattern, message] of Object.entries(safeErrors)) {
    if (error.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Default generic message for unknown errors
  return 'An error occurred processing your request. Please try again.';
}

// Process Transfer Edge Function
// Uses atomic database function with FOR UPDATE locking to prevent race conditions
// Enforces: balance checks, limits, 24-hour clearing, rate limiting

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
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth for JWT verification
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify JWT using getClaims (works with ES256 signing keys)
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      console.error('JWT verification failed:', claimsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract user ID from claims
    const user = { id: claimsData.claims.sub };

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit
    const rateLimitKey = `transfer:${user.id}`;
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
        JSON.stringify({ success: false, error: 'Too many transfer requests. Please try again later.' }),
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

    const { amount, destination, destination_type, recipient_member_id } = body;

    // Validate amount (Integer Rule: whole pesos only)
    const transferAmount = Math.floor(Number(amount));
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Please enter a valid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      // Log full error details server-side only
      console.error('Transfer RPC error:', rpcError);
      
      // Return sanitized error message to client
      const sanitizedMessage = sanitizeErrorMessage(rpcError.message || '');
      const statusCode = rpcError.message?.includes('Insufficient') ? 400 :
                         rpcError.message?.includes('not found') ? 404 :
                         rpcError.message?.includes('frozen') || rpcError.message?.includes('maintenance') ? 503 : 400;
      
      return new Response(
        JSON.stringify({ success: false, error: sanitizedMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transfer submitted for review',
        data: {
          reference_number: result.reference_number,
          amount: result.amount,
          destination: destination,
          status: 'pending_review',
          clearing_ends_at: result.clearing_ends_at,
          new_vault_balance: result.new_vault_balance,
          new_frozen_balance: result.new_frozen_balance,
          message: 'Your transfer is pending Governor verification.'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log full error details server-side only
    console.error('Error in process-transfer:', error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing your transfer. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
