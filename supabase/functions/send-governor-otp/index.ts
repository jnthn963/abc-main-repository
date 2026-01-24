import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration: 5 OTP requests per 15 minutes per email/IP
const RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 900; // 15 minutes

// Supreme Governor email - loaded from environment variable for security
const SUPREME_GOVERNOR_EMAIL = Deno.env.get("SUPREME_GOVERNOR_EMAIL");

// Validate that the secret is configured
if (!SUPREME_GOVERNOR_EMAIL) {
  console.error("SUPREME_GOVERNOR_EMAIL environment variable not configured");
}

interface OTPRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Parse request body with error handling
    let email: string;
    try {
      const body = await req.json();
      if (!body || typeof body !== 'object') {
        return new Response(
          JSON.stringify({ error: "Invalid request format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      email = body.email;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get IP for rate limiting (unauthenticated endpoint)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    
    // Check rate limit by email and IP
    const rateLimitKeyEmail = `gov_otp:email:${email.toLowerCase()}`;
    const rateLimitKeyIP = `gov_otp:ip:${clientIP}`;
    
    const { data: emailAllowed } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: rateLimitKeyEmail,
      p_limit: RATE_LIMIT,
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    const { data: ipAllowed } = await supabaseAdmin.rpc('check_rate_limit', {
      p_key: rateLimitKeyIP,
      p_limit: RATE_LIMIT * 2, // Slightly higher limit for IP to handle shared networks
      p_window_seconds: RATE_WINDOW_SECONDS
    });

    if (emailAllowed === false || ipAllowed === false) {
      // Log rate limit violation
      await supabaseAdmin.from("admin_audit_log").insert({
        admin_id: "00000000-0000-0000-0000-000000000000",
        action: "GOVERNOR_OTP_RATE_LIMITED",
        details: { 
          description: "OTP request rate limited",
          target_email: email,
          ip_address: clientIP
        },
        ip_address: clientIP,
      });

      return new Response(
        JSON.stringify({ error: "Too many attempts. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if this is the Supreme Governor
    // If SUPREME_GOVERNOR_EMAIL is not configured, no one can use this special path
    const isSupremeGovernor = SUPREME_GOVERNOR_EMAIL 
      ? email.toLowerCase() === SUPREME_GOVERNOR_EMAIL.toLowerCase() 
      : false;

    if (!isSupremeGovernor) {
      // Check if user exists and has governor role
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        console.error("Error listing users:", userError);
        return new Response(
          JSON.stringify({ error: "Authentication service unavailable" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        // Don't reveal if email exists - generic message
        return new Response(
          JSON.stringify({ error: "Access denied. Governor credentials required." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check governor role
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "governor")
        .maybeSingle();

      if (roleError || !roleData) {
        // Log unauthorized attempt
        await supabaseAdmin.from("admin_audit_log").insert({
          admin_id: "00000000-0000-0000-0000-000000000000",
          action: "UNAUTHORIZED_GOVERNOR_OTP_REQUEST",
          details: { 
            description: "Non-governor attempted OTP request",
            target_email: email 
          },
          ip_address: clientIP,
        });

        return new Response(
          JSON.stringify({ error: "Access denied. Governor credentials required." }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Send OTP via Supabase Auth magic link (passwordless)
    const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: isSupremeGovernor, // Only create user for Supreme Governor
        emailRedirectTo: `${req.headers.get("origin") || supabaseUrl}/governor`,
      },
    });

    if (otpError) {
      console.error("OTP send error:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to send verification code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log successful OTP request
    await supabaseAdmin.from("admin_audit_log").insert({
      admin_id: "00000000-0000-0000-0000-000000000000",
      action: "GOVERNOR_OTP_SENT",
      details: { 
        description: "OTP sent to governor email",
        target_email: email,
        is_supreme: isSupremeGovernor
      },
      ip_address: clientIP,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verification code sent to your email" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in send-governor-otp:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
