import { Link } from "react-router-dom";
import { User, Bell, Wallet, Shield } from "lucide-react";
import abcLogo from "@/assets/abc-logo.png";
import { Button } from "@/components/ui/button";
import { SecureLogout } from "@/components/auth/SecureLogout";
import { useAuth } from "@/hooks/useAuth";
import LiveTicker from "./LiveTicker";

interface NavbarProps {
  onDepositClick?: () => void;
}

const Navbar = ({ onDepositClick }: NavbarProps) => {
  const { profile } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4AF37]/10 bg-[#050505]/95 backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Logo + Tagline */}
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <img 
            src={abcLogo} 
            alt="Alpha Bankers Cooperative" 
            className="w-9 h-9 rounded-full object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
          />
          <div className="hidden sm:block">
            <h1 
              className="text-lg font-bold"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                color: '#D4AF37',
              }}
            >
              ₳฿C
            </h1>
            <p className="text-[9px] text-[#00FF41] uppercase" style={{ letterSpacing: '0.15em' }}>
              Integrity Outside the System
            </p>
          </div>
        </Link>

        {/* Center: Live Ticker */}
        <div className="flex-1 max-w-2xl mx-4 hidden md:block">
          <LiveTicker />
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">
            <Bell className="w-5 h-5 text-[#D4AF37]/60" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#00FF41] rounded-full" />
          </button>
          
          {/* Profile Link */}
          <Link 
            to="/profile"
            className="flex items-center gap-2 px-3 py-1.5 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors bg-[#0a0a0a]"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8B7500] flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-[#050505]" />
              )}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-[#D4AF37]">
                {profile?.display_name 
                  ? `${profile.display_name.slice(0, 1)}***${profile.display_name.slice(-1)}`
                  : 'Member'
                }
              </p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#00FF41]" />
                <span className="text-[10px] text-[#00FF41]">
                  {profile?.kyc_status === 'verified' ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          </Link>

          <Button 
            id="deposit-button"
            onClick={onDepositClick}
            className="bg-[#00FF41] hover:bg-[#00FF41]/90 text-[#050505] font-bold uppercase text-xs tracking-[0.1em] flex items-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            INITIALIZE
          </Button>
          
          <SecureLogout variant="default" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
