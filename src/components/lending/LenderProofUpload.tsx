/**
 * Lender Proof of Transfer Upload Component
 * Mandatory screenshot upload before confirming loan funding
 * Mobile-first with camera capture support
 */

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LenderProofUploadProps {
  onUploadComplete: (path: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function LenderProofUpload({
  onUploadComplete,
  onUploadError,
  disabled = false,
  className,
}: LenderProofUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (selectedFile: File): string | null => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      return 'Please upload a JPG, PNG, or WebP image';
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB';
    }
    return null;
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      onUploadError(validationError);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setUploadedPath(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Start upload
    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-lender-proof.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('deposit-receipts') // Reuse existing bucket
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      setUploadedPath(fileName);
      onUploadComplete(fileName);
    } catch (err) {
      console.error('Upload failed:', err);
      const errorMsg = 'Failed to upload proof. Please try again.';
      setError(errorMsg);
      onUploadError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete, onUploadError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setUploadedPath(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const isComplete = uploadedPath !== null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload Area */}
      {!preview ? (
        <motion.div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={cn(
            'border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200',
            disabled 
              ? 'border-muted/30 bg-muted/5 cursor-not-allowed' 
              : 'border-[#D4AF37]/30 bg-[#D4AF37]/5 hover:border-[#D4AF37]/50 cursor-pointer'
          )}
          whileHover={!disabled ? { scale: 1.01 } : undefined}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className={cn(
            'w-10 h-10 mx-auto mb-3',
            disabled ? 'text-muted-foreground/50' : 'text-[#D4AF37]'
          )} />
          <p className={cn(
            'text-sm font-medium mb-1',
            disabled ? 'text-muted-foreground/50' : 'text-foreground'
          )}>
            Upload Proof of Transfer
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Screenshot of your payment transaction
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="text-xs border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"
            >
              <ImageIcon className="w-3 h-3 mr-1" />
              Gallery
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              className="text-xs border-[#D4AF37]/30 hover:bg-[#D4AF37]/10"
            >
              <Camera className="w-3 h-3 mr-1" />
              Camera
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-3">
            Accepts: JPG, PNG, WebP • Max 10MB
          </p>
        </motion.div>
      ) : (
        /* Preview with Status */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'relative rounded-xl overflow-hidden border-2',
            isComplete ? 'border-[#00FF41]/50' : 'border-[#D4AF37]/30'
          )}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-[#0a0a0a]">
            <img
              src={preview}
              alt="Transfer proof"
              className="w-full h-full object-contain"
            />
            
            {/* Overlay for uploading state */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 flex items-center justify-center"
                >
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-2" />
                    <p className="text-sm text-[#D4AF37]">Uploading...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 rounded-full"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>

          {/* Status Bar */}
          <div className={cn(
            'px-4 py-3 flex items-center gap-2',
            isComplete ? 'bg-[#00FF41]/10' : 'bg-[#D4AF37]/10'
          )}>
            {isComplete ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#00FF41]" />
                <span className="text-sm font-medium text-[#00FF41]">Proof Uploaded</span>
              </>
            ) : isUploading ? (
              <>
                <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
                <span className="text-sm text-[#D4AF37]">Processing...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">Upload failed</span>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 text-destructive text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
