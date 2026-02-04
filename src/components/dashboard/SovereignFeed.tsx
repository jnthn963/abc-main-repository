/**
 * ABC Master Build: Sovereign Feed with Polling
 * Live announcements and audit trail using 15s polling
 * 
 * STABILITY FIX: Uses hasInitialData pattern to prevent flicker
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Megaphone, Clock, ChevronRight, Image, Video, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { usePollingRefresh } from '@/hooks/usePollingRefresh';

interface Announcement {
  id: string;
  type: 'text' | 'image' | 'video';
  title: string;
  body: string;
  timestamp: string;
}

interface AuditEvent {
  id: string;
  time: string;
  event: string;
}

// Default announcements (fallback)
const defaultAnnouncements: Announcement[] = [
  {
    id: '1',
    type: 'text',
    title: 'System Status: Operational',
    body: 'All Alpha Bankers systems are running at optimal performance.',
    timestamp: 'Just now',
  },
];

const SovereignFeed = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(defaultAnnouncements);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  
  // STABILITY FIX: Track initial data load
  const hasInitialDataRef = useRef(false);
  const [hasInitialData, setHasInitialData] = useState(false);

  // Fetch live data
  const fetchFeedData = useCallback(async () => {
    try {
      // Fetch CMS posts for announcements
      const { data: posts } = await supabase
        .from('cms_posts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (posts && posts.length > 0) {
        setAnnouncements(posts.map(post => ({
          id: post.id,
          type: (post.media_type || 'text') as 'text' | 'image' | 'video',
          title: post.title,
          body: post.body_text,
          timestamp: getRelativeTime(new Date(post.created_at)),
        })));
      }

      // Fetch recent ledger activity for audit trail
      const { data: transactions } = await supabase
        .from('ledger')
        .select('id, type, amount, created_at, status')
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactions) {
        setAuditEvents(transactions.map(tx => ({
          id: tx.id,
          time: new Date(tx.created_at).toLocaleTimeString('en-PH', { hour12: false }),
          event: formatAuditEvent(tx),
        })));
      }
      
      // STABILITY FIX: Mark initial data loaded
      if (!hasInitialDataRef.current) {
        hasInitialDataRef.current = true;
        setHasInitialData(true);
      }
    } catch (err) {
      console.error('Failed to fetch feed data:', err);
      // Still mark as loaded on error
      if (!hasInitialDataRef.current) {
        hasInitialDataRef.current = true;
        setHasInitialData(true);
      }
    }
  }, []);

  // STABILITY FIX: Increased poll interval to 15s to match other components
  usePollingRefresh(fetchFeedData, {
    interval: 15000,
    enabled: true,
    immediate: true,
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="w-3 h-3" />;
      case "video": return <Video className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sovereign Announcements - Midnight Obsidian Theme */}
      <Card className="glass-card p-4 border-[#D4AF37]/20 bg-gradient-to-b from-[#050505]/90 to-[#0a0a0a]/90">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider">Sovereign Broadcast</h3>
        </div>
        <div className="space-y-3">
          {announcements.map((post) => (
            <div 
              key={post.id}
              className="p-3 rounded-lg bg-[#050505]/70 hover:bg-[#0a0a0a] cursor-pointer transition-colors group border border-transparent hover:border-[#D4AF37]/20"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#D4AF37] text-[10px]">
                      {getTypeIcon(post.type)}
                      {post.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{post.timestamp}</span>
                  </div>
                  <h4 className="text-sm font-medium truncate">{post.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.body}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#D4AF37] transition-colors shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Live Audit Trail - Yield Green Theme */}
      <Card className="glass-card p-4 border-[#00FF41]/20 bg-gradient-to-b from-[#050505]/80 to-[#0a0a0a]/80">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#00FF41]" />
          <h3 className="text-sm font-semibold text-[#00FF41] uppercase tracking-wider">Ledger Verification Trail</h3>
          <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {auditEvents.length > 0 ? (
            auditEvents.map((event) => (
              <div 
                key={event.id}
                className="flex items-start gap-2 py-1.5 border-b border-[#D4AF37]/10 last:border-0"
              >
                <span className="terminal-text text-[#D4AF37]/60 shrink-0">
                  [{event.time}]
                </span>
                <span className="terminal-text text-foreground/80 leading-relaxed">
                  {event.event}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Monitoring system activity...
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

// Helper functions
function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

function formatAuditEvent(tx: { type: string; amount: number; status: string }): string {
  const amount = Math.floor(Number(tx.amount) / 100);
  const typeFormatted = tx.type.replace(/_/g, ' ').toUpperCase();
  const statusIcon = tx.status === 'completed' ? '✓' : tx.status === 'clearing' ? '⏳' : '';
  return `${typeFormatted} - ₱${amount.toLocaleString()} ${statusIcon}`;
}

export default SovereignFeed;
