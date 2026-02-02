/**
 * ABC Master Build: Simplified Connection Status
 * Displays online/offline status without websocket complexity
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionStatusBannerProps {
  onReconnect?: () => void;
  variant?: 'minimal' | 'full';
}

export function ConnectionStatusBanner({ 
  onReconnect, 
  variant = 'minimal' 
}: ConnectionStatusBannerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show success briefly then hide
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 2000);
      onReconnect?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReconnect]);

  // Don't show banner when online (minimal mode)
  if (isOnline && !showBanner && variant === 'minimal') {
    return null;
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 py-2 px-4 border-b ${
            isOnline 
              ? 'bg-success/20 border-success/50 text-success' 
              : 'bg-destructive/20 border-destructive text-destructive'
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span className="text-sm font-medium">Connection restored</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">No internet connection</span>
              <button
                onClick={() => window.location.reload()}
                className="ml-2 px-3 py-1 text-xs font-medium bg-background/50 rounded hover:bg-background/80 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </>
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div 
        className={`w-2 h-2 rounded-full ${
          isOnline ? 'bg-[#00FF41] animate-pulse' : 'bg-destructive'
        }`} 
      />
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {isOnline ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}

export default ConnectionStatusBanner;
