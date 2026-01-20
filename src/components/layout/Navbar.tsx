import { Shield, User, Bell, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import LiveTicker from "./LiveTicker";

interface NavbarProps {
  onDepositClick?: () => void;
}

const Navbar = ({ onDepositClick }: NavbarProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center glow-gold">
            <span className="text-xl font-bold text-primary-foreground">α</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold gradient-gold">Alpha Banking</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Cooperative</p>
          </div>
        </div>

        {/* Center: Live Ticker */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <LiveTicker />
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 border border-border">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium">A***7</p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-success" />
                <span className="text-[10px] text-success">Verified</span>
              </div>
            </div>
          </div>

          <Button 
            id="deposit-button"
            onClick={onDepositClick}
            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-primary-foreground font-semibold animate-glow-pulse flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            DEPOSIT
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
