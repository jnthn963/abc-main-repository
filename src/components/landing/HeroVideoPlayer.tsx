import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type VideoType = "none" | "upload" | "youtube" | "vimeo";

interface HeroVideoPlayerProps {
  className?: string;
}

const HeroVideoPlayer = ({ className = "" }: HeroVideoPlayerProps) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoType, setVideoType] = useState<VideoType>("none");
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch video config from public_config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await supabase
          .from("public_config")
          .select("hero_video_url, hero_video_type")
          .maybeSingle();

        if (data) {
          setVideoUrl(data.hero_video_url);
          setVideoType((data.hero_video_type as VideoType) || "none");
        }
      } catch (err) {
        console.error("Failed to fetch hero video config:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("public_config_hero")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "public_config",
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData) {
            setVideoUrl(newData.hero_video_url);
            setVideoType(newData.hero_video_type || "none");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Extract video ID from YouTube/Vimeo URL
  const extractVideoId = (url: string, type: "youtube" | "vimeo"): string | null => {
    if (type === "youtube") {
      const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
      );
      return match ? match[1] : null;
    } else {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return match ? match[1] : null;
    }
  };

  // Get embed URL for iframe
  const getEmbedUrl = (): string | null => {
    if (!videoUrl) return null;

    if (videoType === "youtube") {
      const videoId = extractVideoId(videoUrl, "youtube");
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1`;
    } else if (videoType === "vimeo") {
      const videoId = extractVideoId(videoUrl, "vimeo");
      if (!videoId) return null;
      return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&background=1`;
    }

    return null;
  };

  // Don't render if no video configured
  if (isLoading) {
    return (
      <div className={`relative aspect-video rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4AF37]/20 overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
        </div>
      </div>
    );
  }

  if (videoType === "none" || !videoUrl) {
    // Show placeholder card when no video is configured
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`relative aspect-video rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-[#D4AF37]/20 overflow-hidden ${className}`}
      >
        {/* Abstract background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37]/50 flex items-center justify-center mb-4 backdrop-blur-sm">
            <Play className="w-8 h-8 text-[#D4AF37] ml-1" />
          </div>
          <p className="text-sm text-muted-foreground">Video Coming Soon</p>
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-[#D4AF37]/30 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-[#D4AF37]/30 rounded-br-2xl" />
      </motion.div>
    );
  }

  // Render uploaded video
  if (videoType === "upload") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className={`relative aspect-video rounded-2xl overflow-hidden border border-[#D4AF37]/20 ${className}`}
      >
        <video
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted={isMuted}
          playsInline
        />

        {/* Mute toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="absolute bottom-4 right-4 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white hover:bg-black/70 transition-colors"
          aria-label={isMuted ? "Unmute video" : "Mute video"}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
      </motion.div>
    );
  }

  // Render YouTube/Vimeo embed
  const embedUrl = getEmbedUrl();
  if (!embedUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`relative aspect-video rounded-2xl overflow-hidden border border-[#D4AF37]/20 ${className}`}
    >
      <iframe
        src={embedUrl}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Hero Video"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
      />

      {/* Gradient overlay for embedded videos */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
    </motion.div>
  );
};

export default HeroVideoPlayer;
