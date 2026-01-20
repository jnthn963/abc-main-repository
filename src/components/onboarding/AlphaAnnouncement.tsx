import { useState, useEffect } from "react";
import { X, Megaphone, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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
          // Default welcome announcement if none in database
          setAnnouncement({
            id: "default",
            type: "text",
            title: "Welcome to Alpha Banking! 🎉",
            body: "Experience the future of cooperative finance. Earn up to 0.5% daily interest on your vault deposits.",
          });
        }
      } catch (err) {
        console.error('Failed to fetch announcement:', err);
        // Fallback announcement
        setAnnouncement({
          id: "fallback",
          type: "text",
          title: "Welcome to Alpha Banking! 🎉",
          body: "Experience the future of cooperative finance. Earn up to 0.5% daily interest on your vault deposits.",
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
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
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
            <div className="glass-card border-primary/30 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Megaphone className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold text-primary-foreground text-sm">Alpha Announcement</span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-primary-foreground/10 transition-colors"
                >
                  <X className="w-4 h-4 text-primary-foreground" />
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
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-foreground">{announcement.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {announcement.body}
                </p>
                
                <button
                  onClick={handleClose}
                  className="w-full mt-4 py-2.5 px-4 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-lg font-semibold text-primary-foreground text-sm hover:opacity-90 transition-opacity glow-gold"
                >
                  Let's Go! 🚀
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
