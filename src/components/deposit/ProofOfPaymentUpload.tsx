/**
 * ABC Proof of Payment Upload Component
 * Mobile-first image upload for deposit verification
 * Supports JPG, PNG with thumbnail preview
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Camera, 
  AlertCircle,
  CheckCircle,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProofOfPaymentUploadProps {
  userId: string;
  referenceNumber: string;
  onUploadComplete: (url: string) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

const ProofOfPaymentUpload = ({
  userId,
  referenceNumber,
  onUploadComplete,
  onUploadError,
  disabled = false,
}: ProofOfPaymentUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const errorMsg = 'Please upload a JPG or PNG image';
      setError(errorMsg);
      onUploadError(errorMsg);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = 'File size must be less than 10MB';
      setError(errorMsg);
      onUploadError(errorMsg);
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    setUploadComplete(false);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadComplete(false);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!selectedFile || !userId) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/${referenceNumber}_${timestamp}.${fileExt}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('deposit-receipts')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      // Get the file path (not public URL since bucket is private)
      const filePath = data.path;
      
      setUploadProgress(100);
      setUploadComplete(true);
      onUploadComplete(filePath);

      toast({
        title: 'Receipt Uploaded',
        description: 'Your proof of payment has been attached.',
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      const errorMsg = err.message || 'Failed to upload receipt';
      setError(errorMsg);
      onUploadError(errorMsg);
      toast({
        title: 'Upload Failed',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        Proof of Payment (Required)
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-colors duration-200
              ${error 
                ? 'border-destructive/50 bg-destructive/5' 
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Upload Transaction Receipt
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tap to capture or select • JPG/PNG • Max 10MB
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Image Preview Card */}
            <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
              {/* Preview Image */}
              <div className="relative aspect-video flex items-center justify-center bg-black/5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-48 w-auto object-contain"
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-muted-foreground" />
                )}

                {/* Upload Progress Overlay */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                    <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-success"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <p className="text-white text-xs mt-2">{uploadProgress}%</p>
                  </div>
                )}

                {/* Success Overlay */}
                {uploadComplete && !uploading && (
                  <div className="absolute inset-0 bg-success/20 flex items-center justify-center">
                    <div className="bg-success rounded-full p-2">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedFile.name}
                  </p>
                </div>
                
                {!uploading && !uploadComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Upload Button */}
            {!uploadComplete && !uploading && (
              <Button
                onClick={uploadFile}
                disabled={disabled || uploading}
                className="w-full mt-3 bg-gradient-to-r from-success to-emerald-600 hover:opacity-90 min-h-[48px]"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Receipt
              </Button>
            )}

            {/* Change Image Button */}
            {uploadComplete && (
              <Button
                variant="outline"
                onClick={clearSelection}
                className="w-full mt-3 min-h-[48px]"
              >
                Change Image
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive text-xs"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.div>
      )}
    </div>
  );
};

export default ProofOfPaymentUpload;
