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
        JSON.stringify({ success: false, error: 'Missing user_id or deposit_amount' }),
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
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
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
      throw new Error(`Failed to get settings: ${settingsError.message}`);
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
      return new Response(
        JSON.stringify({ success: false, error: 'Referrer profile not found' }),
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
      throw new Error(`Failed to credit commission: ${updateError.message}`);
    }

    // Generate reference number
    const referenceNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create ledger entry for commission
    await supabase
      .from('ledger')
      .insert({
        user_id: userProfile.referrer_id,
        type: 'referral_commission',
        amount: commissionAmount,
        status: 'completed',
        reference_number: referenceNumber,
        related_user_id: user_id,
        description: `${commissionRate}% referral commission from ${userProfile.member_id}'s deposit`,
        metadata: {
          referred_member_id: userProfile.member_id,
          deposit_amount: deposit_amount,
          commission_rate: commissionRate
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Referral commission processed successfully',
        data: {
          referrer_id: userProfile.referrer_id,
          commission_amount: commissionAmount,
          commission_rate: commissionRate,
          deposit_amount: deposit_amount,
          reference_number: referenceNumber
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-referral-commission:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
