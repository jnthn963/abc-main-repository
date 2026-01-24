import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit configuration: 50 notifications per minute (internal service)
const RATE_LIMIT = 50;
const RATE_WINDOW_SECONDS = 60; // 1 minute

// Governor Notification Edge Function
// Sends email notifications to governors when new pending actions require review
// This function can be called after creating deposits, transfers, or loans
// Includes rate limiting to prevent notification flooding

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limit (global for this endpoint to prevent notification flooding)
    const rateLimitKey = `notify_governor:global`;
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (allowed === false) {
      console.log('Governor notification rate limited - too many requests');
      return new Response(
        JSON.stringify({ success: false, error: 'Notification rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action_type, member_id, amount, reference_number } = body;

    // Get all governors' emails
    const { data: governors, error: govError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'governor');

    if (govError) {
      console.error('Failed to fetch governors:', govError);
      throw new Error('Failed to fetch governors');
    }

    if (!governors || governors.length === 0) {
      console.log('No governors found to notify');
      return new Response(
        JSON.stringify({ success: true, message: 'No governors to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get governor profiles for email addresses
    const governorIds = governors.map(g => g.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .in('id', governorIds);

    if (profileError) {
      console.error('Failed to fetch governor profiles:', profileError);
      throw new Error('Failed to fetch governor profiles');
    }

    // Get current pending counts
    const { data: counts, error: countsError } = await supabase
      .rpc('get_pending_action_counts');

    // Log notification attempt to audit log
    await supabase
      .from('admin_audit_log')
      .insert({
        action: 'GOVERNOR_NOTIFICATION_SENT',
        details: {
          action_type,
          member_id,
          amount,
          reference_number,
          pending_counts: counts,
          notified_governors: profiles?.map(p => p.id),
        },
      });

    // For now, we log the notification details
    // In production, integrate with an email service like Resend, SendGrid, etc.
    console.log('Governor Notification:', {
      action_type,
      member_id,
      amount: amount ? `₱${(amount / 100).toLocaleString()}` : 'N/A',
      reference_number,
      pending_counts: counts,
      governors_to_notify: profiles?.length || 0,
    });

    // If you want to send actual emails, you would:
    // 1. Set up a RESEND_API_KEY or similar email service secret
    // 2. Use the service to send emails to each governor
    // Example with Resend:
    /*
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      for (const profile of profiles || []) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Alpha Banking <no-reply@alphabanking.coop>',
            to: profile.email,
            subject: `[ACTION REQUIRED] New ${action_type} pending review`,
            html: `
              <h2>New Pending Action</h2>
              <p>A new ${action_type} requires your review:</p>
              <ul>
                <li><strong>Member:</strong> ${member_id}</li>
                <li><strong>Amount:</strong> ₱${(amount / 100).toLocaleString()}</li>
                <li><strong>Reference:</strong> ${reference_number}</li>
              </ul>
              <p><strong>Total Pending Actions:</strong> ${counts?.total || 'N/A'}</p>
              <p><a href="https://abcoop.lovable.app/governor/login">Review Now →</a></p>
            `,
          }),
        });
      }
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Governor notification logged',
        notified: profiles?.length || 0,
        pending_counts: counts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-governor:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to send notification' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
