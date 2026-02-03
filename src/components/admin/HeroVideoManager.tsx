import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Upload,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  X,
  Play,
  Youtube,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type VideoType = "none" | "upload" | "youtube" | "vimeo";

interface HeroVideoManagerProps {
  currentVideoUrl: string | null;
  currentVideoType: VideoType;
  onVideoUpdate: (url: string | null, type: VideoType) => void;
}

const HeroVideoManager = ({
  currentVideoUrl,
  currentVideoType,
  onVideoUpdate,
}: HeroVideoManagerProps) => {
  const [videoType, setVideoType] = useState<VideoType>(currentVideoType || "none");
  const [videoUrl, setVideoUrl] = useState<string>(currentVideoUrl || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with props
  useEffect(() => {
    setVideoType(currentVideoType || "none");
    setVideoUrl(currentVideoUrl || "");
  }, [currentVideoType, currentVideoUrl]);

  // Validate file type
  const isValidFileType = (file: File): boolean => {
    const validTypes = ["video/mp4", "video/webm", "video/ogg"];
    return validTypes.includes(file.type);
  };

  // Validate file size (max 100MB)
  const isValidFileSize = (file: File): boolean => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    return file.size <= maxSize;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!isValidFileType(file)) {
      toast.error("Invalid file type. Please upload MP4, WebM, or OGG only.");
      return;
    }

    if (!isValidFileSize(file)) {
      toast.error("File too large. Maximum size is 100MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setVideoType("upload");
    setHasChanges(true);
  }, []);

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Handle file input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Extract video ID from YouTube/Vimeo URL
  const extractVideoId = (url: string, type: "youtube" | "vimeo"): string | null => {
    if (type === "youtube") {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
      return match ? match[1] : null;
    } else {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return match ? match[1] : null;
    }
  };

  // Get embed URL
  const getEmbedUrl = (url: string, type: "youtube" | "vimeo"): string | null => {
    const videoId = extractVideoId(url, type);
    if (!videoId) return null;
    
    if (type === "youtube") {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
    } else {
      return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!hasChanges) return;
    setIsUploading(true);

    try {
      let finalUrl: string | null = null;

      if (videoType === "none") {
        finalUrl = null;
      } else if (videoType === "upload" && selectedFile) {
        // Upload to Supabase Storage
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `hero-video-${Date.now()}.${fileExt}`;

        // Delete old video if exists
        if (currentVideoUrl && currentVideoUrl.includes("hero-videos")) {
          try {
            const oldPath = currentVideoUrl.split("hero-videos/")[1]?.split("?")[0];
            if (oldPath) {
              await supabase.storage.from("hero-videos").remove([oldPath]);
            }
          } catch (err) {
            console.warn("Failed to delete old video:", err);
          }
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("hero-videos")
          .upload(fileName, selectedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("hero-videos")
          .getPublicUrl(uploadData.path);

        finalUrl = urlData.publicUrl;
      } else if (videoType === "youtube" || videoType === "vimeo") {
        // Validate URL format
        const embedUrl = getEmbedUrl(videoUrl, videoType);
        if (!embedUrl) {
          toast.error(`Invalid ${videoType === "youtube" ? "YouTube" : "Vimeo"} URL`);
          setIsUploading(false);
          return;
        }
        finalUrl = videoUrl;
      }

      // Update via callback (this updates global_settings)
      onVideoUpdate(finalUrl, videoType);

      setSelectedFile(null);
      setPreviewUrl(null);
      setHasChanges(false);
      toast.success("Hero video updated successfully!");
    } catch (err) {
      console.error("Failed to save hero video:", err);
      toast.error("Failed to update hero video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle type change
  const handleTypeChange = (value: string) => {
    setVideoType(value as VideoType);
    setHasChanges(true);
    if (value !== "upload") {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    if (value === "none") {
      setVideoUrl("");
    }
  };

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
    setHasChanges(true);
  };

  // Remove preview
  const handleRemovePreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setHasChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="p-5 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Hero Video</h3>
        </div>
        {hasChanges && (
          <span className="text-xs text-primary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Video Type Selection */}
        <RadioGroup
          value={videoType}
          onValueChange={handleTypeChange}
          className="grid grid-cols-2 gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="video-type-none" />
            <Label htmlFor="video-type-none" className="text-sm cursor-pointer">No Video</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upload" id="video-type-upload" />
            <Label htmlFor="video-type-upload" className="text-sm cursor-pointer">Upload MP4</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="youtube" id="video-type-youtube" />
            <Label htmlFor="video-type-youtube" className="text-sm cursor-pointer">YouTube</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="vimeo" id="video-type-vimeo" />
            <Label htmlFor="video-type-vimeo" className="text-sm cursor-pointer">Vimeo</Label>
          </div>
        </RadioGroup>

        {/* Upload Area */}
        {videoType === "upload" && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative aspect-video rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              onChange={handleInputChange}
              className="hidden"
              id="hero-video-upload"
            />

            <AnimatePresence mode="wait">
              {previewUrl || (currentVideoType === "upload" && currentVideoUrl) ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <video
                    src={previewUrl || currentVideoUrl || ""}
                    className="w-full h-full object-cover"
                    controls
                  />
                  {previewUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePreview();
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive/90 text-white hover:bg-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                >
                  <Upload
                    className={`w-10 h-10 ${
                      isDragging ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      Drop Video Here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, WebM, or OGG, max 100MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* YouTube/Vimeo URL Input */}
        {(videoType === "youtube" || videoType === "vimeo") && (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {videoType === "youtube" ? (
                  <Youtube className="w-4 h-4 text-red-500" />
                ) : (
                  <Play className="w-4 h-4 text-blue-500" />
                )}
              </div>
              <Input
                id="hero-video-url"
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder={
                  videoType === "youtube"
                    ? "https://youtube.com/watch?v=..."
                    : "https://vimeo.com/..."
                }
                className="pl-10 bg-muted/30 border-border"
              />
            </div>

            {/* Preview iframe */}
            {videoUrl && getEmbedUrl(videoUrl, videoType) && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={getEmbedUrl(videoUrl, videoType) || ""}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Hero Video Preview"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>
            )}
          </div>
        )}

        {/* Status Indicator */}
        {videoType !== "none" && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
            <CheckCircle className="w-4 h-4 text-success" />
            <div>
              <p className="text-xs font-medium text-success">Video Configured</p>
              <p className="text-xs text-muted-foreground">
                Will display in Hero section on landing page
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isUploading}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            hasChanges && !isUploading
              ? "bg-gradient-to-r from-primary to-amber-600 text-black hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading & Syncing...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Hero Video
            </>
          )}
        </button>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            The hero video will autoplay (muted) on the landing page. For best
            results, use a short, looping video (15-30 seconds).
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HeroVideoManager;
