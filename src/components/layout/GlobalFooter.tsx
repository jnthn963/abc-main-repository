import { Link } from 'react-router-dom';
import { Shield, Lock, Mail, Phone, Building } from 'lucide-react';
import SovereignCalculator from './SovereignCalculator';

/**
 * Global Footer Component
 * 
 * A compact, persistent footer that appears on all authenticated pages.
 * Maintains ABC branding consistency and provides essential links.
 * Features the embedded Sovereign Hardware Calculator.
 * 
 * Mobile-optimized: Does not interfere with floating action buttons.
 */
export default function GlobalFooter() {
  return (
    <footer className="relative z-10 bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-t border-[#D4AF37]/10 mt-auto">
      {/* Compact Command Center Layout */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-3 items-start">
          
          {/* Column 1: Logo & Brand (Desktop: 2 cols) */}
          <div className="md:col-span-2 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-2">
              <img
                alt="ABC Logo"
                className="w-8 h-8 rounded-full"
                style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))' }}
                src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png"
              />
              <div>
                <div className="text-[#D4AF37] font-bold text-sm tracking-wide">₳฿C</div>
                <div className="text-[8px] text-gray-500 -mt-0.5">Alpha Bankers Cooperative</div>
              </div>
            </div>
            <p className="text-[9px] text-gray-600 text-center md:text-left leading-relaxed max-w-[150px] hidden md:block">
              The Architecture of Financial Sovereignty.
            </p>
            
            {/* Trust badges - Desktop */}
            <div className="hidden md:flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-1 text-[8px] text-gray-600">
                <Shield className="w-2.5 h-2.5 text-[#00FF41]" />
                <span>100% Collateral</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] text-gray-600">
                <Lock className="w-2.5 h-2.5 text-[#00FF41]" />
                <span>256-bit SSL</span>
              </div>
            </div>
          </div>

          {/* Column 2: Sovereign Calculator (Desktop: 4 cols, centered) */}
          <div className="md:col-span-4 flex justify-center">
            <SovereignCalculator />
          </div>

          {/* Column 3: Governance Links (Desktop: 2 cols) */}
          <div className="md:col-span-2">
            <h4 className="text-[9px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2 text-center md:text-left">
              Governance
            </h4>
            <div className="flex flex-wrap justify-center md:justify-start md:flex-col gap-1.5">
              <Link to="/governance/articles" className="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Articles
              </Link>
              <Link to="/governance/board" className="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Board
              </Link>
              <Link to="/governance/assembly" className="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Assembly
              </Link>
            </div>
          </div>

          {/* Column 4: Legal & Support (Desktop: 2 cols) */}
          <div className="md:col-span-2">
            <h4 className="text-[9px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2 text-center md:text-left">
              Member Services
            </h4>
            <div className="flex flex-wrap justify-center md:justify-start md:flex-col gap-1.5">
              <a href="#" className="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Terms
              </a>
              <a href="#" className="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Privacy
              </a>
              <a href="#" className="text-[9px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Support
              </a>
            </div>
          </div>

          {/* Column 5: Contact (Desktop: 2 cols) */}
          <div className="md:col-span-2">
            <h4 className="text-[9px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2 text-center md:text-left">
              Contact
            </h4>
            <div className="flex flex-col items-center md:items-start gap-1">
              <div className="flex items-center gap-1 text-[8px] text-gray-600">
                <Mail className="w-2.5 h-2.5 text-[#D4AF37]" />
                <span>support@abc.coop</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] text-gray-600">
                <Phone className="w-2.5 h-2.5 text-[#D4AF37]" />
                <span>+63 (2) 8888-ABC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Regulatory & Copyright - Clean Single Line */}
      <div className="bg-[#030303] border-t border-gray-900/50">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-1 text-[8px] text-gray-700/60">
            <div className="flex items-center gap-1.5">
              <Building className="w-2.5 h-2.5" />
              <span>CDA Reg. No. 9520-XXXX</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">R.A. 9520</span>
            </div>
            <p className="text-center">
              © 2026 Alpha Bankers Cooperative. Philippine Laws Apply.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
