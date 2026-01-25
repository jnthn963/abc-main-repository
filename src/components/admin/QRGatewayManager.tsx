import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface QRGatewayManagerProps {
  currentQRUrl: string;
  onQRUpdate: (newUrl: string, receiverName: string, receiverNumber: string) => void;
}

const QRGatewayManager = ({
  currentQRUrl,
  onQRUpdate,
}: QRGatewayManagerProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiverName, setReceiverName] = useState("Alpha Banking Cooperative");
  const [receiverNumber, setReceiverNumber] = useState("+63 917 XXX XXXX");
  const [hasChanges, setHasChanges] = useState(false);

  // Allowed file types and max size (example: 5 MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

  // Cleanup blob URL when previewUrl/selectedFile changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = useCallback((file: File) => {
    // Basic validation: size and mime-type
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum allowed is 5 MB.");
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPEG, WEBP, or SVG.");
      return;
    }

    // If we previously created a blob URL, revoke it before creating a new one
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Keep the File for upload, but use a blob URL for preview (fast, no base64)
    setSelectedFile(file);
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    setHasChanges(true);
  }, [previewUrl]);

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

  // Handle save - upload to Supabase Storage and update public_config
  const handleSave = async () => {
    if (!hasChanges) return;

    setIsUploading(true);

    try {
      let publicUrl = currentQRUrl;

      // If there's a new file to upload
      if (selectedFile) {
        // Generate unique filename
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `qr-gateway-${Date.now()}.${fileExt}`;

        // Delete old QR code if exists
        if (currentQRUrl && currentQRUrl.includes('qr-codes')) {
          try {
            const oldPath = currentQRUrl.split('qr-codes/')[1]?.split('?')[0];
            if (oldPath) {
              await supabase.storage.from('qr-codes').remove([oldPath]);
            }
          } catch (err) {
            console.warn('Failed to delete old QR code:', err);
          }
        }

        // Upload new QR code to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('qr-codes')
          .upload(fileName, selectedFile, {
            cacheControl: '86400', // 1 day - reduce repeated downloads
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('qr-codes')
          .getPublicUrl(uploadData.path);

        publicUrl = urlData.publicUrl;

        // Revoke preview blob URL after successful upload to free memory
        if (previewUrl && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      }

      // Update public_config table (this triggers realtime sync to all users)
      const { data: configData } = await supabase
        .from('public_config')
        .select('id')
        .maybeSingle();

      if (configData?.id) {
        const { error: updateError } = await supabase
          .from('public_config')
          .update({
            qr_gateway_url: publicUrl,
            receiver_name: receiverName,
            receiver_phone: receiverNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configData.id);

        if (updateError) throw updateError;
      }

      // Also update global_settings for backward compatibility
      onQRUpdate(publicUrl, receiverName, receiverNumber);

      setSelectedFile(null);
      setPreviewUrl(null);
      setHasChanges(false);
      toast.success("QR Gateway updated successfully! Changes are now live for all users.");
    } catch (err) {
      console.error('Upload error:', err);
      toast.error("Failed to update QR Gateway. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // ... (rest of the component rendering stays the same, using previewUrl for preview image)
  return (
    <Card>
      {/* simplified UI section for brevity */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" onChange={handleInputChange} />
        {previewUrl ? (
          <img src={previewUrl} alt="QR preview" className="max-w-xs" />
        ) : (
          <div>Drop image here or click to select</div>
        )}
        <div>
          <Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          <Input value={receiverNumber} onChange={(e) => setReceiverNumber(e.target.value)} />
        </div>
        <button onClick={handleSave} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Save'}
        </button>
      </div>
    </Card>
  );
};

export default QRGatewayManager;
