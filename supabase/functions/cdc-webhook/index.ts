import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cdc-event-id, x-cdc-table, x-cdc-operation',
};

interface CDCPayload {
  event_type: 'cdc';
  table: string;
  schema: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  timestamp: string;
  trigger_name: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get CDC metadata from headers
    const eventId = req.headers.get('X-CDC-Event-ID');
    const table = req.headers.get('X-CDC-Table');
    const operation = req.headers.get('X-CDC-Operation');
    
    console.log(`[CDC] Received event: ${eventId} | Table: ${table} | Operation: ${operation}`);
    
    // Parse the CDC payload
    const payload: CDCPayload = await req.json();
    
    console.log(`[CDC] Processing ${payload.operation} on ${payload.table}:`, {
      record_id: payload.record_id,
      timestamp: payload.timestamp,
    });
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // =====================================================
    // CUSTOM CDC PROCESSING LOGIC
    // Add your sync/replication logic here
    // =====================================================
    
    let processingResult: Record<string, unknown> = {
      processed: true,
      event_id: eventId,
    };
    
    switch (payload.table) {
      case 'profiles':
        // Example: Sync profile changes to external system
        processingResult = await handleProfileChange(payload);
        break;
        
      case 'ledger':
        // Example: Sync transaction data
        processingResult = await handleLedgerChange(payload);
        break;
        
      case 'p2p_loans':
        // Example: Sync loan data
        processingResult = await handleLoanChange(payload);
        break;
        
      default:
        // Generic handling for other tables
        processingResult = {
          processed: true,
          table: payload.table,
          operation: payload.operation,
          record_id: payload.record_id,
        };
    }
    
    // Update CDC event status if we have the event ID
    if (eventId) {
      await supabase
        .from('cdc_events')
        .update({
          webhook_status: 'processed',
          webhook_response: JSON.stringify(processingResult),
        })
        .eq('id', eventId);
    }
    
    console.log(`[CDC] Successfully processed event ${eventId}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventId,
        result: processingResult,
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
  } catch (error) {
    console.error('[CDC] Error processing webhook:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// =====================================================
// CDC Handler Functions
// Customize these for your sync requirements
// =====================================================

async function handleProfileChange(payload: CDCPayload): Promise<Record<string, unknown>> {
  const { operation, new_data, old_data, record_id } = payload;
  
  console.log(`[CDC:profiles] ${operation} for user ${record_id}`);
  
  // Example: You could sync to an external CRM, analytics, etc.
  // For now, we just log and acknowledge
  
  if (operation === 'UPDATE' && new_data && old_data) {
    // Track which fields changed
    const changedFields = Object.keys(new_data).filter(
      key => JSON.stringify(new_data[key]) !== JSON.stringify(old_data[key])
    );
    
    console.log(`[CDC:profiles] Changed fields:`, changedFields);
    
    // Example: Notify on balance changes
    if (changedFields.includes('vault_balance')) {
      console.log(`[CDC:profiles] Balance changed from ${old_data.vault_balance} to ${new_data.vault_balance}`);
    }
  }
  
  return {
    processed: true,
    table: 'profiles',
    operation,
    record_id,
  };
}

async function handleLedgerChange(payload: CDCPayload): Promise<Record<string, unknown>> {
  const { operation, new_data, record_id } = payload;
  
  console.log(`[CDC:ledger] ${operation} transaction ${record_id}`);
  
  if (operation === 'INSERT' && new_data) {
    // Example: Could trigger notifications, sync to accounting system, etc.
    console.log(`[CDC:ledger] New ${new_data.type} transaction: ₱${new_data.amount}`);
  }
  
  return {
    processed: true,
    table: 'ledger',
    operation,
    record_id,
    transaction_type: new_data?.type,
  };
}

async function handleLoanChange(payload: CDCPayload): Promise<Record<string, unknown>> {
  const { operation, new_data, old_data, record_id } = payload;
  
  console.log(`[CDC:p2p_loans] ${operation} loan ${record_id}`);
  
  if (operation === 'UPDATE' && new_data && old_data) {
    // Track status changes
    if (new_data.status !== old_data.status) {
      console.log(`[CDC:p2p_loans] Status changed: ${old_data.status} -> ${new_data.status}`);
    }
    
    if (new_data.approval_status !== old_data.approval_status) {
      console.log(`[CDC:p2p_loans] Approval changed: ${old_data.approval_status} -> ${new_data.approval_status}`);
    }
  }
  
  return {
    processed: true,
    table: 'p2p_loans',
    operation,
    record_id,
    loan_status: new_data?.status,
  };
}
