/**
 * ABC Master Build: Safety Guardrails Component
 * Emergency Read-Only Toggle based on Liquidity Ratio
 * Auto-triggers when ratio falls below 50.5% safety buffer
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, Lock, Unlock, AlertTriangle, 
  Activity, Loader2, Settings 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const SAFETY_THRESHOLD = 50.5;
const POLLING_INTERVAL = 10000; // 10 seconds

const SafetyGuardrails = () => {
  const [liquidityRatio, setLiquidityRatio] = useState(100);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // Fetch current settings
      const { data: settings } = await supabase
        .from('global_settings')
        .select('system_kill_switch')
        .maybeSingle();

      setReadOnlyMode(settings?.system_kill_switch || false);

      // Calculate current liquidity ratio
      const { data: profiles } = await supabase
        .from('profiles')
        .select('vault_balance, frozen_balance, lending_balance');

      const totalVault = (profiles || []).reduce((sum, p) => sum + Number(p.vault_balance), 0);
      const totalFrozen = (profiles || []).reduce((sum, p) => sum + Number(p.frozen_balance), 0);
      const totalLending = (profiles || []).reduce((sum, p) => sum + Number(p.lending_balance), 0);
      const totalHoldings = totalVault + totalFrozen + totalLending;

      const ratio = totalHoldings > 0 
        ? Math.round((totalVault / totalHoldings) * 1000) / 10 
        : 100;

      setLiquidityRatio(ratio);

      // Auto-trigger read-only if below threshold and auto-trigger is enabled
      if (autoTriggerEnabled && ratio < SAFETY_THRESHOLD && !settings?.system_kill_switch) {
        await toggleReadOnlyMode(true, true);
      }
    } catch (err) {
      console.error('Failed to fetch safety status:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [autoTriggerEnabled]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const toggleReadOnlyMode = async (enabled: boolean, isAuto: boolean = false) => {
    setUpdating(true);
    
    try {
      const { data: settingsData } = await supabase
        .from('global_settings')
        .select('id')
        .maybeSingle();

      if (!settingsData?.id) throw new Error('Settings not found');

      const { error } = await supabase
        .from('global_settings')
        .update({ system_kill_switch: enabled })
        .eq('id', settingsData.id);

      if (error) throw error;

      // Log audit entry
      await supabase.from('admin_audit_log').insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id || '',
        action: enabled ? 'SAFETY_LOCKDOWN_ENABLED' : 'SAFETY_LOCKDOWN_DISABLED',
        details: {
          triggered_by: isAuto ? 'auto_liquidity_monitor' : 'manual_governor_action',
          liquidity_ratio: liquidityRatio,
          safety_threshold: SAFETY_THRESHOLD,
        },
      });

      setReadOnlyMode(enabled);
      
      toast({
        title: enabled ? 'Emergency Lockdown Activated' : 'System Unlocked',
        description: isAuto 
          ? `Liquidity ratio (${liquidityRatio}%) dropped below safety threshold (${SAFETY_THRESHOLD}%)`
          : enabled 
            ? 'Withdrawals and loan funding are now disabled'
            : 'Normal operations resumed',
        variant: enabled ? 'destructive' : 'default',
      });
    } catch (err) {
      console.error('Failed to toggle read-only mode:', err);
      toast({
        title: 'Error',
        description: 'Failed to update system status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = () => {
    if (readOnlyMode) return 'border-destructive bg-destructive/10';
    if (liquidityRatio < SAFETY_THRESHOLD) return 'border-yellow-500 bg-yellow-500/10';
    return 'border-success bg-success/10';
  };

  const getStatusIcon = () => {
    if (readOnlyMode) return <Lock className="w-5 h-5 text-destructive" />;
    if (liquidityRatio < SAFETY_THRESHOLD) return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    return <Unlock className="w-5 h-5 text-success" />;
  };

  if (loading) {
    return (
      <Card className="p-5 bg-card/50 border-border">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading safety status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-5 border-2 transition-all ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Safety Guardrails</h2>
        </div>
        {getStatusIcon()}
      </div>

      {/* Status Indicator */}
      <AnimatePresence mode="wait">
        <motion.div
          key={readOnlyMode ? 'locked' : 'unlocked'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`p-3 rounded-lg mb-4 ${
            readOnlyMode 
              ? 'bg-destructive/20 border border-destructive/40' 
              : 'bg-success/20 border border-success/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`font-semibold ${readOnlyMode ? 'text-destructive' : 'text-success'}`}>
                {readOnlyMode ? 'EMERGENCY LOCKDOWN ACTIVE' : 'SYSTEM OPERATIONAL'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {readOnlyMode 
                  ? 'Withdrawals and loan funding are disabled' 
                  : 'All financial operations are enabled'}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Liquidity Monitor */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Liquidity Ratio</span>
          </div>
          <span className={`text-lg font-bold balance-number ${
            liquidityRatio >= SAFETY_THRESHOLD ? 'text-success' : 'text-destructive'
          }`}>
            {liquidityRatio}%
          </span>
        </div>
        <Progress 
          value={liquidityRatio} 
          className="h-2"
        />
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>0%</span>
          <span className={liquidityRatio < SAFETY_THRESHOLD ? 'text-destructive' : ''}>
            {SAFETY_THRESHOLD}% Threshold
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Manual Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Emergency Read-Only</p>
              <p className="text-[10px] text-muted-foreground">
                Manually disable withdrawals & loan funding
              </p>
            </div>
          </div>
          <Switch
            checked={readOnlyMode}
            onCheckedChange={(checked) => toggleReadOnlyMode(checked)}
            disabled={updating}
            className="data-[state=checked]:bg-destructive"
          />
        </div>

        {/* Auto-Trigger Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Trigger Protection</p>
              <p className="text-[10px] text-muted-foreground">
                Enable lockdown when ratio falls below {SAFETY_THRESHOLD}%
              </p>
            </div>
          </div>
          <Switch
            checked={autoTriggerEnabled}
            onCheckedChange={setAutoTriggerEnabled}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </div>

      {/* Warning */}
      {liquidityRatio < SAFETY_THRESHOLD && !readOnlyMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-2 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs flex items-start gap-2"
        >
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Liquidity Warning</p>
            <p className="text-yellow-400/80">
              System liquidity is below the {SAFETY_THRESHOLD}% safety buffer. 
              Consider enabling read-only mode to protect member withdrawals.
            </p>
          </div>
        </motion.div>
      )}
    </Card>
  );
};

export default SafetyGuardrails;
