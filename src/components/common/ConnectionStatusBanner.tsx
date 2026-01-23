/**
 * Connection Status Banner
 * Displays bank-grade secure connection messaging
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, Shield } from 'lucide-react';
import { useRealtimeConnection } from '@/hooks/useRealtimeConnection';

interface ConnectionStatusBannerProps {
  onReconnect?: () => void;
  variant?: 'minimal' | 'full';
}

export function ConnectionStatusBanner({ 
  onReconnect, 
  variant = 'minimal' 
}: ConnectionStatusBannerProps) {
  const { 
    state, 
    isConnected, 
    isReconnecting, 
    hasError, 
    statusMessage,
    forceReconnect,
    reconnectAttempts 
  } = useRealtimeConnection({ onReconnect });

  // Don't show banner when connected (unless full variant)
  if (isConnected && variant === 'minimal') {
    return null;
  }

  const getIcon = () => {
    if (hasError) return <AlertTriangle className="w-4 h-4" />;
    if (isReconnecting) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (isConnected) return <Shield className="w-4 h-4" />;
    return <WifiOff className="w-4 h-4" />;
  };

  const getBannerStyles = () => {
    if (hasError) return 'bg-destructive/20 border-destructive text-destructive';
    if (isReconnecting) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500';
    if (isConnected) return 'bg-success/20 border-success/50 text-success';
    return 'bg-muted/50 border-border text-muted-foreground';
  };

  return (
    <AnimatePresence>
      {(!isConnected || variant === 'full') && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 py-2 px-4 border-b ${getBannerStyles()}`}
        >
          {getIcon()}
          <span className="text-sm font-medium">{statusMessage}</span>
          
          {hasError && (
            <button
              onClick={forceReconnect}
              className="ml-2 px-3 py-1 text-xs font-medium bg-background/50 rounded hover:bg-background/80 transition-colors"
            >
              Retry Connection
            </button>
          )}

          {isConnected && variant === 'full' && (
            <Wifi className="w-4 h-4 text-success ml-2" />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline connection indicator for use in headers/navbars
 */
export function ConnectionIndicator() {
  const { isConnected, isReconnecting } = useRealtimeConnection();

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`w-2 h-2 rounded-full ${
          isConnected 
            ? 'bg-success animate-pulse' 
            : isReconnecting 
              ? 'bg-yellow-500 animate-pulse' 
              : 'bg-destructive'
        }`} 
      />
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {isConnected ? 'Live' : isReconnecting ? 'Syncing...' : 'Offline'}
      </span>
    </div>
  );
}

export default ConnectionStatusBanner;
