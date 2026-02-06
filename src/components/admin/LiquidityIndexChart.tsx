/**
 * ABC Master Build: CoinMarketCap-Style Liquidity Index Chart
 * Obsidian Black + Alpha Gold (#D4AF37) aesthetic with area gradient glow
 * 15-second RESTful polling for real-time updates
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Activity, RefreshCw, 
  Settings, AlertTriangle, BarChart3,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts";

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

// Alpha Gold color
const ALPHA_GOLD = "#D4AF37";
const EMERALD_GREEN = "#10B981";
const VIBRANT_RED = "#EF4444";
const OBSIDIAN_BLACK = "#050505";

export default function LiquidityIndexChart() {
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
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Format peso value
  const formatPeso = (centavos: number) => {
    const pesos = Math.floor(centavos / 100);
    if (pesos >= 1000000) return `₱${(pesos / 1000000).toFixed(2)}M`;
    if (pesos >= 1000) return `₱${(pesos / 1000).toFixed(1)}K`;
    return `₱${pesos.toLocaleString()}`;
  };

  // Fetch current liquidity data
  const fetchLiquidityData = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_liquidity_index');
      if (error) throw error;
      if (data && typeof data === 'object') {
        setCurrentData(data as unknown as LiquidityData);
        setLastUpdate(new Date());
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
        .limit(48);
      
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
      const { error } = await supabase.rpc('record_liquidity_snapshot');
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

  // 15-second RESTful polling
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchLiquidityData(), fetchCandleHistory(), fetchSettings()]);
      setLoading(false);
    };
    load();

    // Set up 15-second polling interval
    pollingRef.current = setInterval(() => {
      fetchLiquidityData();
      fetchCandleHistory();
    }, 15000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchLiquidityData, fetchCandleHistory, fetchSettings]);

  // Calculate status
  const getStatus = () => {
    if (!currentData) return { level: 'unknown', color: 'text-muted-foreground', bg: 'bg-muted', accent: ALPHA_GOLD };
    
    const ratio = currentData.liquidity_ratio;
    if (ratio <= settings.criticalThreshold) {
      return { level: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500/10', accent: VIBRANT_RED };
    }
    if (ratio <= settings.warningThreshold) {
      return { level: 'WARNING', color: 'text-amber-500', bg: 'bg-amber-500/10', accent: ALPHA_GOLD };
    }
    return { level: 'HEALTHY', color: 'text-emerald-500', bg: 'bg-emerald-500/10', accent: EMERALD_GREEN };
  };

  const status = getStatus();

  // Prepare chart data with trend colors
  const chartData = candleHistory.map((candle, index) => {
    const prevCandle = candleHistory[index - 1];
    const isUptrend = prevCandle ? candle.close_value >= prevCandle.close_value : true;
    
    return {
      ...candle,
      time: new Date(candle.period_start).toLocaleTimeString('en-PH', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      value: candle.close_value,
      isUptrend,
      trendColor: isUptrend ? EMERALD_GREEN : VIBRANT_RED,
    };
  });

  // Calculate 24h change
  const get24hChange = () => {
    if (chartData.length < 2) return { value: 0, percent: 0, isPositive: true };
    const first = chartData[0]?.value || 0;
    const last = chartData[chartData.length - 1]?.value || 0;
    const change = last - first;
    const percent = first > 0 ? ((change / first) * 100) : 0;
    return { value: change, percent, isPositive: change >= 0 };
  };

  const change24h = get24hChange();

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const isUp = data.net_flow >= 0;
    
    return (
      <div 
        className="rounded-lg p-4 shadow-xl border text-sm"
        style={{ 
          backgroundColor: 'rgba(5, 5, 5, 0.95)', 
          borderColor: ALPHA_GOLD,
          boxShadow: `0 0 20px ${ALPHA_GOLD}33`
        }}
      >
        <p className="font-semibold mb-2" style={{ color: ALPHA_GOLD }}>{data.time}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">Index Value:</span>
            <span className="font-mono text-white">{formatPeso(data.value)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">High:</span>
            <span className="font-mono" style={{ color: EMERALD_GREEN }}>{formatPeso(data.high_value)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-gray-400">Low:</span>
            <span className="font-mono" style={{ color: VIBRANT_RED }}>{formatPeso(data.low_value)}</span>
          </div>
          <div className="flex justify-between gap-6 pt-1 border-t border-gray-700">
            <span className="text-gray-400">Net Flow:</span>
            <span className="font-mono" style={{ color: isUp ? EMERALD_GREEN : VIBRANT_RED }}>
              {isUp ? '+' : ''}{formatPeso(data.net_flow)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6 border-border" style={{ backgroundColor: OBSIDIAN_BLACK }}>
        <div className="flex items-center justify-center h-80">
          <Activity className="w-10 h-10 animate-pulse" style={{ color: ALPHA_GOLD }} />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-6 border overflow-hidden"
      style={{ 
        backgroundColor: OBSIDIAN_BLACK,
        borderColor: `${ALPHA_GOLD}33`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="p-3 rounded-xl"
            style={{ 
              background: `linear-gradient(135deg, ${ALPHA_GOLD}22, ${ALPHA_GOLD}11)`,
              border: `1px solid ${ALPHA_GOLD}44`
            }}
          >
            <BarChart3 className="w-6 h-6" style={{ color: ALPHA_GOLD }} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-white">Co-op Liquidity Index</h2>
            <p className="text-xs text-gray-500">
              Live updates every 15s • Last: {lastUpdate.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={recordSnapshot}
            disabled={refreshing}
            className="text-gray-400 hover:text-white hover:bg-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-700">
            <span className="text-xs text-gray-500">Active</span>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => updateSettings({ enabled })}
              className="data-[state=checked]:bg-emerald-500"
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
          className="mb-6 p-4 rounded-xl space-y-4"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: `1px solid ${ALPHA_GOLD}22`
          }}
        >
          <h3 className="text-sm font-medium" style={{ color: ALPHA_GOLD }}>Governor Controls</h3>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Target Index</span>
              <span className="text-sm font-mono" style={{ color: ALPHA_GOLD }}>
                {formatPeso(settings.target)}
              </span>
            </div>
            <Slider
              value={[settings.target / 100000]}
              onValueChange={([v]) => updateSettings({ target: v * 100000 })}
              min={10}
              max={1000}
              step={10}
              className="[&_[role=slider]]:border-0"
              style={{ '--slider-thumb-bg': ALPHA_GOLD } as any}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Warning (%)</span>
                <span className="text-sm font-mono text-amber-500">{settings.warningThreshold}%</span>
              </div>
              <Slider
                value={[settings.warningThreshold]}
                onValueChange={([v]) => updateSettings({ warningThreshold: v })}
                min={20}
                max={50}
                step={5}
                className="[&_[role=slider]]:bg-amber-500"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Critical (%)</span>
                <span className="text-sm font-mono text-red-500">{settings.criticalThreshold}%</span>
              </div>
              <Slider
                value={[settings.criticalThreshold]}
                onValueChange={([v]) => updateSettings({ criticalThreshold: v })}
                min={5}
                max={25}
                step={5}
                className="[&_[role=slider]]:bg-red-500"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Current Stats Row */}
      {currentData && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {/* Status Card */}
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              backgroundColor: `${status.accent}08`,
              borderColor: `${status.accent}33`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {status.level === 'CRITICAL' ? (
                <AlertTriangle className="w-4 h-4" style={{ color: status.accent }} />
              ) : status.level === 'WARNING' ? (
                <AlertTriangle className="w-4 h-4" style={{ color: status.accent }} />
              ) : (
                <TrendingUp className="w-4 h-4" style={{ color: status.accent }} />
              )}
              <span className="text-xs font-semibold" style={{ color: status.accent }}>
                {status.level}
              </span>
            </div>
            <p className="text-2xl font-bold text-white balance-number">
              {currentData.liquidity_ratio}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Liquidity Ratio</p>
          </div>
          
          {/* Index Value */}
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              backgroundColor: `${ALPHA_GOLD}08`,
              borderColor: `${ALPHA_GOLD}22`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" style={{ color: ALPHA_GOLD }} />
              <span className="text-xs text-gray-400">Index</span>
            </div>
            <p className="text-2xl font-bold text-white balance-number">
              {formatPeso(currentData.index_value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Current Value</p>
          </div>
          
          {/* Available Funds */}
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              backgroundColor: `${EMERALD_GREEN}08`,
              borderColor: `${EMERALD_GREEN}22`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="w-4 h-4" style={{ color: EMERALD_GREEN }} />
              <span className="text-xs text-gray-400">Available</span>
            </div>
            <p className="text-2xl font-bold balance-number" style={{ color: EMERALD_GREEN }}>
              {formatPeso(currentData.total_vault)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Liquid Funds</p>
          </div>
          
          {/* 24h Change */}
          <div 
            className="p-4 rounded-xl border"
            style={{ 
              backgroundColor: change24h.isPositive ? `${EMERALD_GREEN}08` : `${VIBRANT_RED}08`,
              borderColor: change24h.isPositive ? `${EMERALD_GREEN}22` : `${VIBRANT_RED}22`
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              {change24h.isPositive ? (
                <TrendingUp className="w-4 h-4" style={{ color: EMERALD_GREEN }} />
              ) : (
                <TrendingDown className="w-4 h-4" style={{ color: VIBRANT_RED }} />
              )}
              <span className="text-xs text-gray-400">24h Change</span>
            </div>
            <p 
              className="text-2xl font-bold balance-number"
              style={{ color: change24h.isPositive ? EMERALD_GREEN : VIBRANT_RED }}
            >
              {change24h.isPositive ? '+' : ''}{change24h.percent.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {change24h.isPositive ? '+' : ''}{formatPeso(change24h.value)}
            </p>
          </div>
        </div>
      )}

      {/* CoinMarketCap-Style Area Chart */}
      <div className="h-72">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs>
                {/* Gradient for uptrend */}
                <linearGradient id="areaGradientUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={EMERALD_GREEN} stopOpacity={0.4} />
                  <stop offset="50%" stopColor={EMERALD_GREEN} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={EMERALD_GREEN} stopOpacity={0} />
                </linearGradient>
                {/* Gradient for downtrend */}
                <linearGradient id="areaGradientDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={VIBRANT_RED} stopOpacity={0.4} />
                  <stop offset="50%" stopColor={VIBRANT_RED} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={VIBRANT_RED} stopOpacity={0} />
                </linearGradient>
                {/* Dynamic gradient based on overall trend */}
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset="0%" 
                    stopColor={change24h.isPositive ? EMERALD_GREEN : VIBRANT_RED} 
                    stopOpacity={0.5} 
                  />
                  <stop 
                    offset="40%" 
                    stopColor={change24h.isPositive ? EMERALD_GREEN : VIBRANT_RED} 
                    stopOpacity={0.2} 
                  />
                  <stop 
                    offset="100%" 
                    stopColor={change24h.isPositive ? EMERALD_GREEN : VIBRANT_RED} 
                    stopOpacity={0} 
                  />
                </linearGradient>
                {/* Gold glow filter */}
                <filter id="goldGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(255,255,255,0.05)" 
                vertical={false}
              />
              
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              
              <YAxis 
                tick={{ fontSize: 10, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatPeso(v)}
                domain={['dataMin - 500000', 'dataMax + 500000']}
                width={65}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line for target */}
              <ReferenceLine 
                y={settings.target} 
                stroke={ALPHA_GOLD}
                strokeDasharray="5 5" 
                strokeOpacity={0.5}
                label={{
                  value: 'Target',
                  position: 'right',
                  fill: ALPHA_GOLD,
                  fontSize: 10,
                }}
              />
              
              {/* Area with gradient glow */}
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#areaGradient)"
                fillOpacity={1}
              />
              
              {/* Main line with trend color */}
              <Line
                type="monotone"
                dataKey="value"
                stroke={change24h.isPositive ? EMERALD_GREEN : VIBRANT_RED}
                strokeWidth={2.5}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: change24h.isPositive ? EMERALD_GREEN : VIBRANT_RED,
                  stroke: OBSIDIAN_BLACK,
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-3 opacity-20" style={{ color: ALPHA_GOLD }} />
              <p className="text-sm text-gray-400">No historical data yet</p>
              <p className="text-xs text-gray-500 mt-1">Click refresh to record the first snapshot</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {chartData.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: EMERALD_GREEN, boxShadow: `0 0 8px ${EMERALD_GREEN}66` }}
                />
                <span className="text-gray-400">Uptrend (Inflow)</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: VIBRANT_RED, boxShadow: `0 0 8px ${VIBRANT_RED}66` }}
                />
                <span className="text-gray-400">Downtrend (Outflow)</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-0.5"
                  style={{ backgroundColor: ALPHA_GOLD }}
                />
                <span className="text-gray-400">Target</span>
              </div>
            </div>
            <span className="text-gray-500">
              {chartData.length} periods tracked
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
