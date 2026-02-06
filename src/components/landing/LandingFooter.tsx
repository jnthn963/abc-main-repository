import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Linkedin, Twitter, Facebook, Mail, Phone, MapPin, Award, CheckCircle, Zap, Building } from 'lucide-react';

const footerLinks = {
  governance: {
    title: 'Governance',
    links: [
      { label: 'Articles of Cooperation', href: '#' },
      { label: 'Board of Directors', href: '#' },
      { label: 'General Assembly', href: '#' },
      { label: 'Cooperative Principles', href: '#' },
      { label: 'Membership PRS', href: '#' }
    ]
  },
  memberServices: {
    title: 'Member Services',
    links: [
      { label: 'Share Capital Ledger', href: '#' },
      { label: 'Credit Facilities', href: '#' },
      { label: 'Patronage Refund', href: '#' },
      { label: 'Savings & Loans', href: '#' },
      { label: 'Member Dividends', href: '#' }
    ]
  },
  protection: {
    title: 'Protection',
    links: [
      { label: 'Security Center', href: '#' },
      { label: 'Fraud Awareness', href: '#' },
      { label: "Treasurer's Affidavit", href: '#' },
      { label: 'Incident Response', href: '#' },
      { label: 'Audit Committee', href: '#' }
    ]
  },
  compliance: {
    title: 'Compliance',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
      { label: 'Disclosures', href: '#' },
      { label: 'AML Policy', href: '#' }
    ]
  }
};

const trustBadges = [
  { icon: Shield, label: 'AML Compliant', color: '#D4AF37' },
  { icon: Lock, label: 'SSL Secured', color: '#00FF41' },
  { icon: CheckCircle, label: 'KYC Verified', color: '#D4AF37' },
  { icon: Award, label: 'BSP Registered', color: '#00FF41' }
];

export default function LandingFooter() {
  return (
    <footer className="relative z-10 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
      {/* Trust Badges Banner */}
      <div className="border-b border-gray-800/50 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10"
          >
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#050505] border border-gray-800/50"
              >
                <badge.icon className="w-4 h-4" style={{ color: badge.color }} />
                <span className="text-xs text-gray-400 font-medium">{badge.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column - Larger */}
          <div className="col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-6">
                <img
                  alt="ABC Logo"
                  className="w-12 h-12 rounded-full"
                  style={{ filter: 'drop-shadow(0 0 12px rgba(212, 175, 55, 0.5))' }}
                  src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png"
                />
                <div>
                  <span
                    className="text-xl font-bold text-[#D4AF37] block"
                    style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                  >
                    ₳฿C
                  </span>
                  <span className="text-[9px] text-gray-500 uppercase tracking-wider">
                    Alpha Bankers Cooperative
                  </span>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-xs">
                The architecture of financial sovereignty. Building wealth outside traditional constraints.
              </p>

              {/* Brand Tagline */}
              <p
                className="text-[10px] text-[#00FF41] uppercase tracking-[0.15em] mb-6"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                Integrity Outside The System
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>support@alphabankers.coop</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>+63 (2) 8888-ALPHA</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Bonifacio Global City, Taguig</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Linkedin, label: 'LinkedIn' },
                  { icon: Twitter, label: 'Twitter' },
                  { icon: Facebook, label: 'Facebook' }
                ].map((social) => (
                  <a
                    key={social.label}
                    href="#"
                    className="w-9 h-9 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all duration-200"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Governance Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {footerLinks.governance.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.governance.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Member Services Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {footerLinks.memberServices.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.memberServices.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Protection Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {footerLinks.protection.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.protection.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Compliance Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-5">
              {footerLinks.compliance.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.compliance.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Auto-Repayment Guarantee Strip */}
      <div className="border-t border-gray-800/50 bg-gradient-to-r from-[#050505] via-[#00FF41]/5 to-[#050505]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 text-center"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00FF41]" />
              <span className="text-xs text-[#00FF41] font-semibold uppercase tracking-wider">
                100% Auto-Repayment Guarantee
              </span>
            </div>
            <span className="hidden md:inline text-gray-700">•</span>
            <span className="text-xs text-gray-500">
              Your capital is protected by the Reserve Fund Protocol
            </span>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800/50 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright & Trust Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-600">
              <span>© {new Date().getFullYear()} Alpha Bankers Cooperative. All rights reserved.</span>
            </div>

            {/* Regulatory Info */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-600">
              <div className="flex items-center gap-1">
                <Building className="w-3 h-3 text-gray-700" />
                <span>CDA Reg. No. 9520-XXXX</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#00FF41]" />
                <span>256-bit SSL Encryption</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#D4AF37]" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-[#030303] border-t border-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-[10px] text-gray-700 text-center leading-relaxed">
            Alpha Bankers Cooperative operates under the Authority of the Cooperative Development Authority (CDA). 
            Legitimacy is maintained through our verified Articles of Cooperation, By-Laws, and Treasurer's Affidavit 
            as ratified by the General Assembly Resolution. All financial transactions are subject to applicable laws and regulations.
          </p>
        </div>
      </div>
    </footer>
  );
}
