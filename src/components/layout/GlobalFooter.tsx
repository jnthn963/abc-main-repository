import { Link } from 'react-router-dom';
import { Shield, Lock, Mail, Phone, Building, Users, FileText, BookOpen } from 'lucide-react';

/**
 * Global Footer Component
 * 
 * A clean, professional multi-column footer for the ABC platform.
 * Maintains institutional branding and provides essential navigation.
 * Calculator has been moved to a floating FAB for better UX.
 * 
 * Mobile-optimized: Does not interfere with floating action buttons.
 */
export default function GlobalFooter() {
  return (
    <footer className="relative z-10 bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-t border-[#D4AF37]/10 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6">
          
          {/* Column 1: Brand & Trust Badges */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <img
                alt="ABC Logo"
                className="w-10 h-10 rounded-full"
                style={{ filter: 'drop-shadow(0 0 10px rgba(212, 175, 55, 0.5))' }}
                src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png"
              />
              <div>
                <div className="text-[#D4AF37] font-bold text-base tracking-wide">₳฿C</div>
                <div className="text-[9px] text-gray-500 -mt-0.5">Alpha Bankers Cooperative</div>
              </div>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed mb-4 max-w-[200px]">
              The Architecture of Financial Sovereignty. Building wealth through community trust.
            </p>
            
            {/* Trust badges */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <Shield className="w-3 h-3 text-[#00FF41]" />
                <span>100% Collateral Backed</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                <Lock className="w-3 h-3 text-[#00FF41]" />
                <span>256-bit SSL Encryption</span>
              </div>
            </div>
          </div>

          {/* Column 2: Governance */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              Governance
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/governance/ideology" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Our Manifesto
                </Link>
              </li>
              <li>
                <Link to="/governance/articles" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Articles of Cooperation
                </Link>
              </li>
              <li>
                <Link to="/governance/board" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Board of Directors
                </Link>
              </li>
              <li>
                <Link to="/governance/assembly" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  General Assembly
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Member Services */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              Member Services
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Vault Ledger
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Credit Marketplace
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Patronage Refund
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Dividends
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Member Agreement
                </a>
              </li>
              <li>
                <a href="#" className="text-[11px] text-gray-500 hover:text-[#D4AF37] transition-colors">
                  Audit Committee
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact */}
          <div>
            <h4 className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              Contact
            </h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-[11px] text-gray-500">
                <Mail className="w-3 h-3 text-[#D4AF37]/60" />
                <span>support@abc.coop</span>
              </li>
              <li className="flex items-center gap-2 text-[11px] text-gray-500">
                <Phone className="w-3 h-3 text-[#D4AF37]/60" />
                <span>+63 (2) 8888-ABC</span>
              </li>
            </ul>
            
            {/* Support Hours */}
            <div className="mt-4 pt-3 border-t border-gray-800/50">
              <p className="text-[9px] text-gray-600">
                Support Hours: Mon-Fri 8AM-6PM PHT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Regulatory & Copyright */}
      <div className="bg-[#030303] border-t border-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-[9px] text-gray-700/60">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <div className="flex items-center gap-1.5">
                <Building className="w-3 h-3" />
                <span>CDA Reg. No. 9520-XXXX</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span>Republic Act No. 9520</span>
              <span className="hidden md:inline">•</span>
              <span>Treasurer's Affidavit Verified</span>
            </div>
            <p className="text-center">
              © 2026 Alpha Bankers Cooperative. All Rights Reserved. Philippine Laws Apply.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
