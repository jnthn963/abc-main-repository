import abcLogo from '@/assets/abc-logo.png';

export default function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-[#D4AF37]/10 py-8 px-4 bg-[#050505]">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <img 
            src={abcLogo} 
            alt="ABC" 
            className="w-6 h-6 rounded-full object-contain opacity-60" 
          />
          <span className="text-sm font-bold text-[#D4AF37]/60">₳฿C</span>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
          © 2026 Alpha Bankers Cooperative. Sovereign Ledger Protocol.
        </p>
      </div>
    </footer>
  );
}
