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
      {/* Main Footer Content with Calculator */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          
          {/* Column 1: Logo & Brand (Desktop: 3 cols) */}
          <div className="md:col-span-3 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-3 mb-3">
              <img
                alt="ABC Logo"
                className="w-10 h-10 rounded-full"
                style={{ filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.4))' }}
                src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png"
              />
              <div>
                <div className="text-[#D4AF37] font-bold text-lg tracking-wide">₳฿C</div>
                <div className="text-[10px] text-gray-500 -mt-0.5">Alpha Bankers Cooperative</div>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 text-center md:text-left leading-relaxed max-w-[200px]">
              The Architecture of Financial Sovereignty. Your capital, your control.
            </p>
            
            {/* Trust badges - Desktop */}
            <div className="hidden md:flex flex-col gap-1.5 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <Shield className="w-3 h-3 text-[#00FF41]" />
                <span>100% Collateral Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <Lock className="w-3 h-3 text-[#00FF41]" />
                <span>256-bit SSL Encryption</span>
              </div>
            </div>
          </div>

          {/* Column 2: Sovereign Calculator (Desktop: 4 cols, centered) */}
          <div className="md:col-span-4 flex justify-center">
            <SovereignCalculator />
          </div>

          {/* Column 3: Governance Links (Desktop: 2 cols) */}
          <div className="md:col-span-2">
            <h4 className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-3 text-center md:text-left">
              Governance
            </h4>
            <div className="flex flex-wrap justify-center md:justify-start md:flex-col gap-2 md:gap-2.5">
              <Link to="/governance/articles" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Articles of Cooperation
              </Link>
              <Link to="/governance/board" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Board of Directors
              </Link>
              <Link to="/governance/assembly" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                General Assembly
              </Link>
            </div>
          </div>

          {/* Column 4: Legal & Support (Desktop: 3 cols) */}
          <div className="md:col-span-3">
            <h4 className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-3 text-center md:text-left">
              Member Services
            </h4>
            <div className="flex flex-wrap justify-center md:justify-start md:flex-col gap-2 md:gap-2.5">
              <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                Member Support
              </a>
            </div>
            
            {/* Contact Info */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-[10px] text-gray-600">
                <Mail className="w-3 h-3 text-[#D4AF37]" />
                <span>support@alphabankers.coop</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-[10px] text-gray-600">
                <Phone className="w-3 h-3 text-[#D4AF37]" />
                <span>+63 (2) 8888-ALPHA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Regulatory & Copyright */}
      <div className="bg-[#030303] border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-gray-700">
              <Building className="w-3 h-3" />
              <span>CDA Reg. No. 9520-XXXX</span>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Republic Act No. 9520</span>
            </div>
            <p className="text-[10px] text-gray-700 text-center">
              © 2026 Alpha Bankers Cooperative. All financial transactions are subject to applicable Philippine laws.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
