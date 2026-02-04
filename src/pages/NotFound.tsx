import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import abcLogo from "@/assets/abc-logo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        {/* Logo */}
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <img 
            src={abcLogo} 
            alt="ABC" 
            className="w-20 h-20 mx-auto rounded-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
          />
        </motion.div>

        {/* Error Code */}
        <div className="mb-6">
          <h1 
            className="text-6xl font-bold mb-2"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              color: '#D4AF37',
              textShadow: '0 2px 8px rgba(212, 175, 55, 0.3)'
            }}
          >
            404
          </h1>
          <div className="w-12 h-[1px] bg-[#D4AF37] mx-auto mb-4" />
        </div>

        {/* Message */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 text-[#D4AF37] mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm uppercase tracking-[0.15em]">Route Not Found</span>
          </div>
          <p className="text-gray-600 text-sm">
            The requested ledger path does not exist in the sovereign system.
          </p>
        </div>

        {/* Return Link */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FF41] text-[#050505] font-bold text-sm uppercase tracking-[0.1em] hover:bg-[#00FF41]/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Sovereign Portal
        </Link>

        {/* Footer */}
        <p className="mt-8 text-[10px] text-gray-700 uppercase tracking-[0.15em]">
          Alpha Bankers Cooperative • Sovereign Ledger Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default NotFound;
