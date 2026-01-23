import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Process Referral Commission Edge Function
// Automates the 3% commission logic for Level 1 direct referrals
// Called when a referred member makes their first deposit

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { user_id, deposit_amount } = body;

    if (!user_id || !deposit_amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile to check for referrer
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('referrer_id, member_id')
      .eq('id', user_id)
      .single();

    if (userError || !userProfile) {
      // Log server-side, return generic message
      console.error('User profile lookup error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to process referral commission' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No referrer, no commission
    if (!userProfile.referrer_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No referrer found, no commission to process' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get commission rate from global settings
    const { data: settings, error: settingsError } = await supabase
      .from('global_settings')
      .select('referral_level1_rate')
      .single();

    if (settingsError) {
      console.error('Settings lookup error:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to process referral commission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const commissionRate = settings?.referral_level1_rate || 3; // Default 3%
    
    // Calculate commission using floor() for Integer Rule
    const commissionAmount = Math.floor(deposit_amount * (commissionRate / 100));

    if (commissionAmount <= 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Commission amount too small (less than ₱1)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get referrer's profile
    const { data: referrerProfile, error: referrerError } = await supabase
      .from('profiles')
      .select('vault_balance, total_referral_earnings, member_id')
      .eq('id', userProfile.referrer_id)
      .single();

    if (referrerError || !referrerProfile) {
      console.error('Referrer profile lookup error:', referrerError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to process referral commission' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Credit commission to referrer
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        vault_balance: referrerProfile.vault_balance + commissionAmount,
        total_referral_earnings: referrerProfile.total_referral_earnings + commissionAmount
      })
      .eq('id', userProfile.referrer_id);

    if (updateError) {
      console.error('Commission credit error:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Unable to process referral commission' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate reference number
    const referenceNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create ledger entry for commission
    const { error: ledgerError } = await supabase
      .from('ledger')
      .insert({
        user_id: userProfile.referrer_id,
        type: 'referral_commission',
        amount: commissionAmount,
        status: 'completed',
        reference_number: referenceNumber,
        related_user_id: user_id,
        description: `Referral commission from deposit`,
        metadata: {
          commission_rate: commissionRate
        }
      });

    if (ledgerError) {
      // Log but don't fail - commission was already credited
      console.error('Ledger entry error:', ledgerError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Referral commission processed successfully',
        data: {
          commission_amount: commissionAmount,
          reference_number: referenceNumber
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log full error details server-side only
    console.error('Error in process-referral-commission:', error);
    
    // Return generic error message to client
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred processing the referral commission.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
