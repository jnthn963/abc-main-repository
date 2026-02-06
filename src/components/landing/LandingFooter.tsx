import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Facebook, Shield, Building2 } from 'lucide-react';
import abcLogo from '@/assets/abc-logo.png';

const footerLinks = {
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Sustainability', href: '#' },
  ],
  products: [
    { label: 'Personal Banking', href: '#' },
    { label: 'Digital Assets', href: '#' },
    { label: 'Global Remittance', href: '#' },
    { label: 'Business Solutions', href: '#' },
  ],
  support: [
    { label: 'Help Center', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'Fraud Awareness', href: '#' },
    { label: 'Security Center', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'Disclosures', href: '#' },
  ],
};

const socialLinks = [
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Twitter, href: '#', label: 'X (Twitter)' },
  { icon: Facebook, href: '#', label: 'Facebook' },
];

export default function LandingFooter() {
  return (
    <footer className="relative z-10 bg-[#0a0a12] border-t border-gray-800">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={abcLogo} 
                alt="ABC" 
                className="w-10 h-10 rounded-full object-contain" 
              />
              <div>
                <span 
                  className="text-xl font-bold text-[#D4AF37]"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  ₳฿C
                </span>
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">
                  Banking Cooperative
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Building the future of cooperative finance with transparency, security, and sovereign principles.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Products</h4>
            <ul className="space-y-3">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-xs text-gray-500 text-center md:text-left">
              © 2026 Alpha Bankers Cooperative. All rights reserved. Sovereign Ledger Protocol™
            </p>

            {/* Trust Badges */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Shield className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider">SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Building2 className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-wider">Cooperative Member</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
