import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Linkedin, Twitter, Facebook } from 'lucide-react';
import abcLogo from '@/assets/abc-logo.png';
const footerLinks = {
  institution: {
    title: 'Institution',
    links: [{
      label: 'About ABC',
      href: '#'
    }, {
      label: 'Leadership',
      href: '#'
    }, {
      label: 'Governance',
      href: '#'
    }, {
      label: 'Sustainability',
      href: '#'
    }]
  },
  solutions: {
    title: 'Solutions',
    links: [{
      label: 'Sovereign Vault',
      href: '#'
    }, {
      label: 'P2P Marketplace',
      href: '#'
    }, {
      label: 'Referral Network',
      href: '#'
    }, {
      label: 'Enterprise',
      href: '#'
    }]
  },
  security: {
    title: 'Security',
    links: [{
      label: 'Security Center',
      href: '#'
    }, {
      label: 'Fraud Awareness',
      href: '#'
    }, {
      label: 'Data Protection',
      href: '#'
    }, {
      label: 'Incident Response',
      href: '#'
    }]
  },
  compliance: {
    title: 'Compliance',
    links: [{
      label: 'Privacy Policy',
      href: '#'
    }, {
      label: 'Terms of Service',
      href: '#'
    }, {
      label: 'Cookie Policy',
      href: '#'
    }, {
      label: 'Disclosures',
      href: '#'
    }]
  }
};
export default function LandingFooter() {
  return <footer className="relative z-10 bg-[#0a0a0a] border-t border-gray-800/50">
      {/* Main Footer Content */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} whileInView={{
            opacity: 1,
            y: 0
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.5
          }}>
              <div className="flex items-center gap-3 mb-4">
                <img alt="ABC Logo" className="w-10 h-10 rounded-full" style={{
                filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))'
              }} src="/lovable-uploads/389305a4-94f8-484b-80a7-d0accbe48f53.png" />
                <span className="text-lg font-bold text-[#D4AF37]" style={{
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                  ₳฿C
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                Alpha Bankers Cooperative. The architecture of financial sovereignty.
              </p>
              <p className="text-[10px] text-[#00FF41] uppercase tracking-[0.15em]" style={{
              fontFamily: 'JetBrains Mono, monospace'
            }}>
                Integrity Outside The System
              </p>
            </motion.div>
          </div>

          {/* Institution Links */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.1
        }}>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.institution.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.institution.links.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </motion.div>

          {/* Solutions Links */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.15
        }}>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.solutions.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.solutions.links.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </motion.div>

          {/* Security Links */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.2
        }}>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.security.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.security.links.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </motion.div>

          {/* Compliance Links */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          duration: 0.5,
          delay: 0.25
        }}>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              {footerLinks.compliance.title}
            </h4>
            <ul className="space-y-3">
              {footerLinks.compliance.links.map(link => <li key={link.label}>
                  <Link to={link.href} className="text-sm text-gray-500 hover:text-[#D4AF37] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>)}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800/50 bg-[#050505]">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright & Trust Badges */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span>© {new Date().getFullYear()} Alpha Bankers Cooperative</span>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#00FF41]" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#D4AF37]" />
                <span>Cooperative Member</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-200" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-200" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full border border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition-all duration-200" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
}