/**
 * ABC Compliance Shield: Floating Governance Access Button
 * Opens modal with quick links to legal documents
 * Gold and Obsidian aesthetic
 */

import { useState } from 'react';
import { Shield, FileText, Users, Gavel, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

const governanceLinks = [
  {
    title: 'Articles of Cooperation',
    description: 'Foundational document ratified by CDA',
    icon: FileText,
    path: '/governance/articles',
    badge: 'CDA Registered',
  },
  {
    title: 'Board of Directors',
    description: 'Latest resolutions and directives',
    icon: Users,
    path: '/governance/board',
    badge: '5 Active Resolutions',
  },
  {
    title: 'General Assembly',
    description: 'Member ratification records',
    icon: Gavel,
    path: '/governance/assembly',
    badge: 'Annual Meeting 2026',
  },
];

const ComplianceShield = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Floating Shield Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 group"
        aria-label="Open Compliance Shield"
      >
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-[#D4AF37]/20 animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* Main button */}
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-b from-[#D4AF37] to-[#8B7500] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 glow-gold">
            <Shield className="w-6 h-6 text-[#050505]" />
          </div>
          
          {/* Badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00FF41] flex items-center justify-center border-2 border-[#050505]">
            <span className="text-[9px] font-bold text-[#050505]">✓</span>
          </div>
        </div>
      </button>

      {/* Compliance Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-[#050505] border-[#D4AF37]/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <div>
                <span className="text-lg font-semibold" style={{
                  background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 60%, #8B7500 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Compliance Shield
                </span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  Cooperative Governance Documents
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {governanceLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavigate(link.path)}
                className="w-full p-4 rounded-xl bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 transition-all group text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                    <link.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground group-hover:text-[#D4AF37] transition-colors">
                        {link.title}
                      </h3>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{link.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-medium bg-[#D4AF37]/10 text-[#D4AF37]">
                      {link.badge}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#00FF41]/20 flex items-center justify-center">
                  <span className="text-[10px] text-[#00FF41]">✓</span>
                </div>
                <span className="text-[10px] text-muted-foreground">CDA Registered Cooperative</span>
              </div>
              <span className="text-[10px] font-mono text-[#D4AF37]">REG-2026-ABC</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComplianceShield;
