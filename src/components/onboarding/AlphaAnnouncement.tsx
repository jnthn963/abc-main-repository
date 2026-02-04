import { useState, useEffect } from "react";
import { X, Shield, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import abcLogo from "@/assets/abc-logo.png";

interface Announcement {
  id: string;
  type: "text" | "image" | "video";
  title: string;
  body: string;
  mediaUrl?: string;
}

const AlphaAnnouncement = ({ onClose }: { onClose: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch latest active announcement from CMS
  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const { data, error } = await supabase
          .from('cms_posts')
          .select('*')
          .eq('is_active', true)
          .eq('is_announcement', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setAnnouncement({
            id: data.id,
            type: (data.media_type as "text" | "image" | "video") || "text",
            title: data.title,
            body: data.body_text,
            mediaUrl: data.content_url || undefined,
          });
        } else {
          // Default sovereign welcome announcement
          setAnnouncement({
            id: "default",
            type: "text",
            title: "Welcome to the Sovereign Ledger",
            body: "You have been granted access to the Alpha Banking Cooperative. Your vault is now active with 0.5% daily yield generation.",
          });
        }
      } catch (err) {
        console.error('Failed to fetch announcement:', err);
        // Fallback announcement
        setAnnouncement({
          id: "fallback",
          type: "text",
          title: "Welcome to the Sovereign Ledger",
          body: "You have been granted access to the Alpha Banking Cooperative. Your vault is now active with 0.5% daily yield generation.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505]/90 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img 
            src={abcLogo} 
            alt="ABC" 
            className="w-16 h-16 rounded-full"
            style={{ filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.5))' }}
          />
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          <span className="text-[#D4AF37]/60 text-sm uppercase tracking-[0.2em]">
            Initializing Protocol...
          </span>
        </div>
      </div>
    );
  }

  if (!announcement) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#050505]/90 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm"
          >
            <div 
              className="rounded-xl overflow-hidden shadow-2xl border border-[#D4AF37]/30"
              style={{ 
                background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.15)'
              }}
            >
              {/* Header */}
              <div 
                className="p-4 flex items-center justify-between border-b border-[#D4AF37]/20"
                style={{ background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ 
                      background: 'linear-gradient(135deg, #D4AF37 0%, #8B7500 100%)',
                      boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)'
                    }}
                  >
                    <img src={abcLogo} alt="ABC" className="w-8 h-8 rounded-full" />
                  </div>
                  <div>
                    <span 
                      className="font-semibold text-sm uppercase tracking-[0.1em]"
                      style={{ color: '#D4AF37' }}
                    >
                      System Protocol
                    </span>
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em]">
                      Sovereign Broadcast
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
                >
                  <X className="w-4 h-4 text-[#D4AF37]/60" />
                </button>
              </div>

              {/* Media */}
              {announcement.mediaUrl && announcement.type === "image" && (
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={announcement.mediaUrl}
                    alt={announcement.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                  <h3 
                    className="font-bold uppercase tracking-[0.05em]"
                    style={{ 
                      color: '#D4AF37',
                      fontFamily: 'Georgia, serif'
                    }}
                  >
                    {announcement.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {announcement.body}
                </p>
                
                <button
                  onClick={handleClose}
                  className="w-full mt-5 py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-[0.15em] transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: '#00FF41',
                    color: '#050505',
                    boxShadow: '0 0 20px rgba(0, 255, 65, 0.3)'
                  }}
                >
                  Initialize Access
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AlphaAnnouncement;
