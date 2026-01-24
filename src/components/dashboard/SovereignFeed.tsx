import { Megaphone, Clock, ChevronRight, Image, Video, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

const announcements = [
  {
    id: 1,
    type: "text",
    title: "System Maintenance Notice",
    body: "Scheduled maintenance on Jan 20, 2026 from 2:00 AM to 4:00 AM PHT. All transactions will be temporarily paused.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "image",
    title: "New Vault Rates Effective!",
    body: "We're excited to announce our new competitive vault rates. Your money works harder for you!",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    type: "video",
    title: "Alpha Tutorial: P2P Lending",
    body: "Learn how to maximize your returns through our peer-to-peer lending marketplace.",
    timestamp: "1 day ago",
  },
];

const auditEvents = [
  { time: "09:45:12", event: "Vault Interest Distribution Initiated..." },
  { time: "09:44:58", event: "Security Scan Completed - All Clear" },
  { time: "09:44:30", event: "Member A***4 - Deposit Cleared ✓" },
  { time: "09:43:15", event: "P2P Loan #8842 - Funded Successfully" },
  { time: "09:42:00", event: "Reserve Fund Updated: ₱1,240,500" },
  { time: "09:41:30", event: "KYC Verification: Member E***1 Approved" },
];

const SovereignFeed = () => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="w-3 h-3" />;
      case "video": return <Video className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Alpha Announcements - Obsidian Theme */}
      <Card className="glass-card p-4 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-[#D4AF37]">Alpha Announcements</h3>
        </div>
        <div className="space-y-3">
          {announcements.map((post) => (
            <div 
              key={post.id}
              className="p-3 rounded-lg bg-[#1a1a1a]/50 hover:bg-[#1a1a1a]/80 cursor-pointer transition-colors group border border-transparent hover:border-[#D4AF37]/20"
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

      {/* Live Audit Trail - Success/Gold Theme */}
      <Card className="glass-card p-4 border-success/20 bg-gradient-to-b from-[#1a1a1a]/60 to-[#0d0d0d]/60">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-success" />
          <h3 className="text-sm font-semibold">Live Audit Trail</h3>
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {auditEvents.map((event, index) => (
            <div 
              key={index}
              className="flex items-start gap-2 py-1.5 border-b border-[#D4AF37]/10 last:border-0"
            >
              <span className="terminal-text text-[#D4AF37]/60 shrink-0">
                [{event.time}]
              </span>
              <span className="terminal-text text-foreground/80 leading-relaxed">
                {event.event}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SovereignFeed;
