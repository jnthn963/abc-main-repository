import { TrendingUp, Wallet, Users } from "lucide-react";

const tickerItems = [
  { icon: Users, text: "Member A***4 funded ₱10,000", type: "success" },
  { icon: TrendingUp, text: "Vault Yield: 0.5% Daily Accrual", type: "primary" },
  { icon: Wallet, text: "Reserve Fund: ₱1,240,500", type: "default" },
  { icon: Users, text: "Member B***2 initialized ₱25,000", type: "success" },
  { icon: TrendingUp, text: "24h Volume: ₱458,200", type: "primary" },
  { icon: Users, text: "Member C***9 released ₱5,000", type: "default" },
];

const LiveTicker = () => {
  return (
    <div className="relative overflow-hidden border border-[#D4AF37]/10 bg-[#0a0a0a]/50 h-8">
      <div className="ticker-scroll flex items-center gap-8 h-full whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <div key={index} className="flex items-center gap-2 px-3">
            <item.icon 
              className={`w-3.5 h-3.5 ${
                item.type === "success" ? "text-[#00FF41]" : 
                item.type === "primary" ? "text-[#D4AF37]" : 
                "text-gray-600"
              }`} 
            />
            <span className="text-xs font-medium text-gray-400">
              {item.text}
            </span>
            <span className="text-[#D4AF37]/30">•</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
