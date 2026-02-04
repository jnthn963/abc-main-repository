/**
 * ABC Master Build: Co-op Liquidity Index Manager
 * Governor-controlled candlestick chart for liquidity monitoring
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Activity, RefreshCw, 
  Settings, AlertTriangle, Target, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ComposedChart, Bar, Line, XAxis, YAxis, Cell, ResponsiveContainer, ReferenceLine } from "recharts";

interface LiquidityData {
  index_value: number;
  total_vault: number;
  total_frozen: number;
  total_lending: number;
  reserve_fund: number;
  pending_withdrawals: number;
  liquidity_ratio: number;
}

interface CandleData {
  id: string;
  period_start: string;
  open_value: number;
  high_value: number;
  low_value: number;
  close_value: number;
  total_deposits: number;
  total_withdrawals: number;
  net_flow: number;
}

interface LiquiditySettings {
  enabled: boolean;
  target: number;
  warningThreshold: number;
  criticalThreshold: number;
}

const chartConfig: ChartConfig = {
  candle: {
    label: "Liquidity",
    color: "hsl(var(--primary))",
  },
  flow: {
    label: "Net Flow",
    color: "hsl(var(--success))",
  },
};

// Custom Candlestick Bar component
const CandlestickBar = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;
  
  const { open_value, close_value, high_value, low_value } = payload;
  const isUp = close_value >= open_value;
  const color = isUp ? "hsl(var(--success))" : "hsl(var(--destructive))";
  
  // Convert values to display (centavos to pesos)
  const scale = props.yAxisMap?.[0]?.scale || ((v: number) => v);
  
  const candleWidth = Math.max(width * 0.6, 8);
  const candleX = x + (width - candleWidth) / 2;
  
  // Body of candle
  const bodyTop = Math.min(scale(open_value), scale(close_value));
  const bodyBottom = Math.max(scale(open_value), scale(close_value));
  const bodyHeight = Math.max(Math.abs(bodyBottom - bodyTop), 2);
  
  // Wick positions
  const highY = scale(high_value);
  const lowY = scale(low_value);
  const wickX = x + width / 2;
  
  return (
    <g>
      {/* Upper wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={bodyTop}
        stroke={color}
        strokeWidth={1}
      />
      {/* Lower wick */}
      <line
        x1={wickX}
        y1={bodyBottom}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Candle body */}
      <rect
        x={candleX}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={isUp ? color : color}
        stroke={color}
        strokeWidth={1}
        rx={1}
      />
    </g>
  );
};

export default function LiquidityIndexManager() {
  const [currentData, setCurrentData] = useState<LiquidityData | null>(null);
  const [candleHistory, setCandleHistory] = useState<CandleData[]>([]);
  const [settings, setSettings] = useState<LiquiditySettings>({
    enabled: true,
    target: 10000000,
    warningThreshold: 30,
    criticalThreshold: 15,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Format peso value
  const formatPeso = (centavos: number) => {
    const pesos = Math.floor(centavos / 100);
    if (pesos >= 1000000) return `₱${(pesos / 1000000).toFixed(2)}M`;
    if (pesos >= 1000) return `₱${(pesos / 1000).toFixed(0)}K`;
    return `₱${pesos.toLocaleString()}`;
  };

  // Fetch current liquidity data
  const fetchLiquidityData = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_liquidity_index');
      if (error) throw error;
      if (data && typeof data === 'object') {
        setCurrentData(data as unknown as LiquidityData);
      }
    } catch (err) {
      console.error('Failed to fetch liquidity data:', err);
    }
  }, []);

  // Fetch candle history
  const fetchCandleHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('liquidity_index_history')
        .select('*')
        .order('period_start', { ascending: true })
        .limit(24);
      
      if (error) throw error;
      setCandleHistory((data || []) as CandleData[]);
    } catch (err) {
      console.error('Failed to fetch candle history:', err);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('global_settings')
        .select('liquidity_index_enabled, liquidity_index_target, liquidity_index_warning_threshold, liquidity_index_critical_threshold')
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setSettings({
          enabled: data.liquidity_index_enabled ?? true,
          target: data.liquidity_index_target ?? 10000000,
          warningThreshold: data.liquidity_index_warning_threshold ?? 30,
          criticalThreshold: data.liquidity_index_critical_threshold ?? 15,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  }, []);

  // Record snapshot
  const recordSnapshot = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.rpc('record_liquidity_snapshot');
      if (error) throw error;
      
      await Promise.all([fetchLiquidityData(), fetchCandleHistory()]);
      
      toast({
        title: "Snapshot Recorded",
        description: "Liquidity index updated successfully",
      });
    } catch (err) {
      console.error('Failed to record snapshot:', err);
      toast({
        title: "Error",
        description: "Failed to record liquidity snapshot",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchLiquidityData, fetchCandleHistory]);

  // Update settings
  const updateSettings = async (updates: Partial<LiquiditySettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    try {
      const { data: settingsData } = await supabase
        .from('global_settings')
        .select('id')
        .maybeSingle();
      
      if (!settingsData?.id) throw new Error('Settings not found');
      
      const { error } = await supabase
        .from('global_settings')
        .update({
          liquidity_index_enabled: newSettings.enabled,
          liquidity_index_target: newSettings.target,
          liquidity_index_warning_threshold: newSettings.warningThreshold,
          liquidity_index_critical_threshold: newSettings.criticalThreshold,
        })
        .eq('id', settingsData.id);
      
      if (error) throw error;
      
      toast({
        title: "Settings Saved",
        description: "Liquidity index settings updated",
      });
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLiquidityData(), fetchCandleHistory(), fetchSettings()]);
      setLoading(false);
    };
    load();
  }, [fetchLiquidityData, fetchCandleHistory, fetchSettings]);

  // Calculate status
  const getStatus = () => {
    if (!currentData) return { level: 'unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
    
    const ratio = currentData.liquidity_ratio;
    if (ratio <= settings.criticalThreshold) {
      return { level: 'CRITICAL', color: 'text-destructive', bg: 'bg-destructive/20' };
    }
    if (ratio <= settings.warningThreshold) {
      return { level: 'WARNING', color: 'text-[hsl(45,93%,47%)]', bg: 'bg-[hsl(45,93%,47%)]/20' };
    }
    return { level: 'HEALTHY', color: 'text-success', bg: 'bg-success/20' };
  };

  const status = getStatus();

  // Prepare chart data
  const chartData = candleHistory.map((candle) => ({
    ...candle,
    time: new Date(candle.period_start).toLocaleTimeString('en-PH', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    // For the bar chart we need range
    range: [candle.low_value, candle.high_value],
    bodyRange: [
      Math.min(candle.open_value, candle.close_value),
      Math.max(candle.open_value, candle.close_value)
    ],
    isUp: candle.close_value >= candle.open_value,
  }));

  if (loading) {
    return (
      <Card className="p-5 bg-card/50 border-border">
        <div className="flex items-center justify-center h-64">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-card/50 border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Co-op Liquidity Index</h2>
            <p className="text-xs text-muted-foreground">Real-time capital flow monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={recordSnapshot}
            disabled={refreshing}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <span className="text-xs text-muted-foreground">Enabled</span>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
              className="data-[state=checked]:bg-success"
            />
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 p-4 rounded-lg bg-muted/30 border border-border space-y-4"
        >
          <h3 className="text-sm font-medium text-foreground">Governor Controls</h3>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Target Index (₱)</span>
              <span className="text-sm font-mono text-primary">
                {formatPeso(settings.target)}
              </span>
            </div>
            <Slider
              value={[settings.target / 100000]}
              onValueChange={([v]) => updateSettings({ target: v * 100000 })}
              min={10}
              max={1000}
              step={10}
              className="[&_[role=slider]]:bg-primary"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Warning (%)</span>
                <span className="text-sm font-mono" style={{ color: 'hsl(45, 93%, 47%)' }}>{settings.warningThreshold}%</span>
              </div>
              <Slider
                value={[settings.warningThreshold]}
                onValueChange={([v]) => updateSettings({ warningThreshold: v })}
                min={20}
                max={50}
                step={5}
                className="[&_[role=slider]]:bg-[hsl(45,93%,47%)]"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Critical (%)</span>
                <span className="text-sm font-mono text-destructive">{settings.criticalThreshold}%</span>
              </div>
              <Slider
                value={[settings.criticalThreshold]}
                onValueChange={([v]) => updateSettings({ criticalThreshold: v })}
                min={5}
                max={25}
                step={5}
                className="[&_[role=slider]]:bg-destructive"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Status */}
      {currentData && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className={`p-3 rounded-lg ${status.bg} border border-border`}>
            <div className="flex items-center gap-2 mb-1">
              {status.level === 'CRITICAL' ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : status.level === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4" style={{ color: 'hsl(45, 93%, 47%)' }} />
              ) : (
                <TrendingUp className="w-4 h-4 text-success" />
              )}
              <span className={`text-xs font-medium ${status.color}`}>{status.level}</span>
            </div>
            <p className={`text-lg font-bold ${status.color} balance-number`}>
              {currentData.liquidity_ratio}%
            </p>
            <p className="text-[10px] text-muted-foreground">Ratio</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Index</span>
            </div>
            <p className="text-lg font-bold text-foreground balance-number">
              {formatPeso(currentData.index_value)}
            </p>
            <p className="text-[10px] text-muted-foreground">Current Value</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">Available</span>
            </div>
            <p className="text-lg font-bold text-success balance-number">
              {formatPeso(currentData.total_vault)}
            </p>
            <p className="text-[10px] text-muted-foreground">Liquid Funds</p>
          </div>
          
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg font-bold text-destructive balance-number">
              {formatPeso(currentData.pending_withdrawals)}
            </p>
            <p className="text-[10px] text-muted-foreground">Withdrawals</p>
          </div>
        </div>
      )}

      {/* Candlestick Chart */}
      <div className="h-64">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatPeso(v)}
                domain={['dataMin - 1000000', 'dataMax + 1000000']}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-xs space-y-1">
                      <p className="font-medium text-foreground">{data.time}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-muted-foreground">Open:</span>
                        <span className="font-mono">{formatPeso(data.open_value)}</span>
                        <span className="text-muted-foreground">High:</span>
                        <span className="font-mono text-success">{formatPeso(data.high_value)}</span>
                        <span className="text-muted-foreground">Low:</span>
                        <span className="font-mono text-destructive">{formatPeso(data.low_value)}</span>
                        <span className="text-muted-foreground">Close:</span>
                        <span className="font-mono">{formatPeso(data.close_value)}</span>
                        <span className="text-muted-foreground">Net Flow:</span>
                        <span className={`font-mono ${data.net_flow >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {data.net_flow >= 0 ? '+' : ''}{formatPeso(data.net_flow)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
              {/* Reference line for target */}
              <ReferenceLine 
                y={settings.target} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
              />
              {/* Candlestick bars */}
              <Bar 
                dataKey="bodyRange"
                barSize={12}
                shape={(props: any) => {
                  const { x, width, payload } = props;
                  if (!payload) return null;
                  
                  const isUp = payload.close_value >= payload.open_value;
                  const color = isUp ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)";
                  
                  // Get Y positions from the range
                  const yScale = props.background?.y !== undefined ? 
                    (v: number) => props.background.y + props.background.height * (1 - (v - props.yAxis.domain[0]) / (props.yAxis.domain[1] - props.yAxis.domain[0])) :
                    (v: number) => v;
                  
                  const candleWidth = Math.max(width * 0.7, 6);
                  const candleX = x + (width - candleWidth) / 2;
                  const wickX = x + width / 2;
                  
                  // Simple bar representation
                  const openY = yScale(payload.open_value);
                  const closeY = yScale(payload.close_value);
                  const highY = yScale(payload.high_value);
                  const lowY = yScale(payload.low_value);
                  
                  return (
                    <g>
                      {/* Wick line */}
                      <line
                        x1={wickX}
                        y1={highY}
                        x2={wickX}
                        y2={lowY}
                        stroke={color}
                        strokeWidth={1.5}
                      />
                      {/* Body */}
                      <rect
                        x={candleX}
                        y={Math.min(openY, closeY)}
                        width={candleWidth}
                        height={Math.max(Math.abs(closeY - openY), 3)}
                        fill={color}
                        stroke={color}
                        strokeWidth={1}
                        rx={1}
                      />
                    </g>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.isUp ? "hsl(142, 76%, 36%)" : "hsl(0, 84%, 60%)"}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No historical data yet</p>
              <p className="text-xs">Click refresh to record the first snapshot</p>
            </div>
          </div>
        )}
      </div>

      {/* Flow Summary */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-success" />
                <span className="text-muted-foreground">Bullish (Inflow)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-destructive" />
                <span className="text-muted-foreground">Bearish (Outflow)</span>
              </div>
            </div>
            <span className="text-muted-foreground">
              {chartData.length} periods tracked
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
