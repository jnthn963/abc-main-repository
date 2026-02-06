import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import abcLogo from '@/assets/abc-logo.png';

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#D4AF37]/10 bg-[#050505]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <img 
              src={abcLogo} 
              alt="ABC" 
              className="w-8 h-8 rounded-full object-contain" 
            />
            <span className="text-sm font-bold text-[#D4AF37] tracking-wider">₳฿C</span>
          </div>

          {/* Right: Navigation Options */}
          <div className="flex items-center gap-6">
            <Link to="/login">
              <Button 
                variant="ghost" 
                className="text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-transparent text-xs uppercase tracking-[0.15em] font-medium transition-all duration-300"
              >
                Ledger Login
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF41] animate-pulse" />
              <span className="text-[#00FF41]/80 text-xs uppercase tracking-[0.1em]">
                System Status
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
