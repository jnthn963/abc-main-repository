import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process Transfer Edge Function
// Server-side validation for all fund transfers
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

    // Validate amount (Integer Rule: whole pesos only, min 100, max 10M)
    const transferAmount = Math.floor(Number(amount));
    if (isNaN(transferAmount) || transferAmount < 100 || transferAmount > 10000000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid amount. Must be between ₱100 and ₱10,000,000' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check system status
    const { data: settings } = await supabase
      .from('global_settings')
      .select('system_kill_switch, maintenance_mode')
      .single();

    if (settings?.system_kill_switch) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'System is currently frozen. Withdrawals are disabled.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (settings?.maintenance_mode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'System is under maintenance. Please try again later.' 
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check sufficient balance
    if (profile.vault_balance < transferAmount) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient balance. Available: ₱${profile.vault_balance.toLocaleString()}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reference number
    const referenceNumber = `TRF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Calculate clearing end time (24 hours from now)
    const clearingEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // For internal ABC transfers
    let recipientId = null;
    if (destination_type === 'internal' && recipient_member_id) {
      const { data: recipient } = await supabase
        .from('profiles')
        .select('id, member_id')
        .eq('member_id', recipient_member_id)
        .single();

      if (!recipient) {
        return new Response(
          JSON.stringify({ success: false, error: 'Recipient member not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (recipient.id === user.id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Cannot transfer to yourself' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      recipientId = recipient.id;
    }

    // Deduct from vault, add to frozen
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: profile.vault_balance - transferAmount,
        frozen_balance: profile.frozen_balance + transferAmount
      })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(`Failed to update balance: ${updateError.message}`);
    }

    // Create ledger entry
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: user.id,
        type: destination_type === 'internal' ? 'transfer_out' : 'withdrawal',
        amount: transferAmount,
        status: 'clearing',
        reference_number: referenceNumber,
        destination: destination,
        related_user_id: recipientId,
        clearing_ends_at: clearingEndsAt,
        description: `Transfer to ${destination}`,
        metadata: {
          destination_type,
          recipient_member_id: recipient_member_id || null
        }
      });

    if (ledgerError) {
      // Rollback balance update
      await supabase
        .from('profiles')
        .update({
          vault_balance: profile.vault_balance,
          frozen_balance: profile.frozen_balance
        })
        .eq('id', user.id);

      throw new Error(`Failed to create ledger entry: ${ledgerError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Transfer initiated successfully',
        data: {
          reference_number: referenceNumber,
          amount: transferAmount,
          destination: destination,
          status: 'clearing',
          clearing_ends_at: clearingEndsAt,
          new_vault_balance: profile.vault_balance - transferAmount,
          new_frozen_balance: profile.frozen_balance + transferAmount
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
