import { Link } from 'react-router-dom';
import { Shield, Lock, Mail, Phone, Building, Zap } from 'lucide-react';

/**
 * Global Footer Component
 * 
 * A compact, persistent footer that appears on all authenticated pages.
 * Maintains ABC branding consistency and provides essential links.
 * 
 * Mobile-optimized: Does not interfere with floating action buttons.
 */
export default function GlobalFooter() {
  return (
    <footer className="relative z-10 bg-gradient-to-b from-[#0a0a0a] to-[#050505] border-t border-[#D4AF37]/10 mt-auto">
      {/* Quick Links Row */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs text-gray-500">
          <Link to="/governance/articles" className="hover:text-[#D4AF37] transition-colors">
            Articles of Cooperation
          </Link>
          <Link to="/governance/board" className="hover:text-[#D4AF37] transition-colors">
            Board of Directors
          </Link>
          <Link to="/governance/assembly" className="hover:text-[#D4AF37] transition-colors">
            General Assembly
          </Link>
          <a href="#" className="hover:text-[#D4AF37] transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-[#D4AF37] transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-[#D4AF37] transition-colors">
            Member Support
          </a>
        </div>
      </div>

      {/* Trust & Contact Strip */}
      <div className="border-t border-gray-800/50 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <img
                alt="ABC Logo"
                className="w-8 h-8 rounded-full"
                style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.3))' }}
                src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png"
              />
              <div className="text-xs text-gray-600">
                <span className="text-[#D4AF37] font-semibold">₳฿C</span>
                <span className="mx-2">•</span>
                <span>© {new Date().getFullYear()} Alpha Bankers Cooperative</span>
              </div>
            </div>

            {/* Contact & Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-600">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-[#D4AF37]" />
                <span>support@alphabankers.coop</span>
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#D4AF37]" />
                <span>+63 (2) 8888-ALPHA</span>
              </div>
              <div className="hidden md:flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#00FF41]" />
                <span>100% Auto-Repayment Guarantee</span>
              </div>
            </div>

            {/* Regulatory Info */}
            <div className="flex items-center gap-3 text-[10px] text-gray-600">
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3 text-gray-700" />
                <span>CDA Reg. No. 9520-XXXX</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#00FF41]" />
                <span>256-bit SSL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CDA Regulatory Disclaimer */}
      <div className="bg-[#030303] border-t border-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-[11px] text-gray-700 text-center leading-relaxed">
            Alpha Bankers Cooperative operates under the Authority of the Cooperative Development Authority (CDA) 
            pursuant to Republic Act No. 9520. All financial transactions are subject to applicable laws of the Republic of the Philippines.
          </p>
        </div>
      </div>
    </footer>
  );
}
