import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface QRGatewayManagerProps {
  currentQRUrl: string;
  onQRUpdate: (newUrl: string, receiverName: string, receiverNumber: string) => void;
}

const QRGatewayManager = ({
  currentQRUrl,
  onQRUpdate,
}: QRGatewayManagerProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiverName, setReceiverName] = useState("Alpha Banking Cooperative");
  const [receiverNumber, setReceiverNumber] = useState("+63 917 XXX XXXX");
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file type
  const isValidFileType = (file: File): boolean => {
    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    return validTypes.includes(file.type);
  };

  // Validate file size (max 5MB)
  const isValidFileSize = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    return file.size <= maxSize;
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!isValidFileType(file)) {
      toast.error("Invalid file type. Please upload PNG or JPEG only.");
      return;
    }

    if (!isValidFileSize(file)) {
      toast.error("File too large. Maximum size is 5MB.");
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
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

  // Handle save
  const handleSave = async () => {
    if (!previewUrl && !hasChanges) return;

    setIsUploading(true);

    // Simulate upload delay (in production, this would be an actual API call)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Update the QR code globally
    onQRUpdate(previewUrl || currentQRUrl, receiverName, receiverNumber);

    setIsUploading(false);
    setHasChanges(false);
    toast.success("QR Gateway updated successfully! Changes are now live.");
  };

  // Handle remove preview
  const handleRemovePreview = () => {
    setPreviewUrl(null);
    setHasChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle receiver info changes
  const handleReceiverNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic sanitization - remove special characters that could be malicious
    const sanitized = e.target.value.replace(/[<>\"'&]/g, "").slice(0, 100);
    setReceiverName(sanitized);
    setHasChanges(true);
  };

  const handleReceiverNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, +, spaces, and dashes
    const sanitized = e.target.value.replace(/[^0-9+\-\s]/g, "").slice(0, 20);
    setReceiverNumber(sanitized);
    setHasChanges(true);
  };

  return (
    <Card className="p-5 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">QR Payment Gateway</h3>
        </div>
        {hasChanges && (
          <span className="text-xs text-primary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* QR Code Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInputChange}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {previewUrl || currentQRUrl ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <img
                  src={previewUrl || currentQRUrl}
                  alt="QR Code Preview"
                  className="max-w-full max-h-full object-contain rounded-lg"
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
                    Drop QR Image Here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG or JPEG, max 5MB
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Receiver Details */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Receiver Name
            </label>
            <Input
              value={receiverName}
              onChange={handleReceiverNameChange}
              placeholder="Enter receiver name"
              className="bg-muted/30 border-border text-sm"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Receiver Number
            </label>
            <Input
              value={receiverNumber}
              onChange={handleReceiverNumberChange}
              placeholder="+63 XXX XXX XXXX"
              className="bg-muted/30 border-border text-sm font-mono"
              maxLength={20}
            />
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30">
          <CheckCircle className="w-4 h-4 text-success" />
          <div>
            <p className="text-xs font-medium text-success">Gateway Active</p>
            <p className="text-xs text-muted-foreground">
              All deposits will use this QR code
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isUploading}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            hasChanges && !isUploading
              ? "bg-gradient-to-r from-success to-emerald-600 text-white hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing Globally...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save & Sync Globally
            </>
          )}
        </button>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-destructive">Warning:</span>{" "}
            Changing the QR code will immediately update the payment receiver
            for all incoming deposits. Verify the QR code is correct before
            saving.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default QRGatewayManager;
