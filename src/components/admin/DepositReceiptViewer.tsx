/**
 * ABC Deposit Receipt Viewer for Governor Dashboard
 * Displays proof of payment images with modal preview
 * Uses signed URLs for private bucket access
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  X,
  ExternalLink,
  Download,
  Loader2,
  AlertCircle,
  ZoomIn,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface DepositReceiptViewerProps {
  receiptPath: string | null;
  referenceNumber: string;
  memberName?: string;
  compact?: boolean;
}

const DepositReceiptViewer = ({
  receiptPath,
  referenceNumber,
  memberName = 'Member',
  compact = false,
}: DepositReceiptViewerProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchSignedUrl = async () => {
    if (!receiptPath) return;

    setLoading(true);
    setError(null);

    try {
      // Get a signed URL valid for 1 hour
      const { data, error: urlError } = await supabase.storage
        .from('deposit-receipts')
        .createSignedUrl(receiptPath, 3600);

      if (urlError) {
        throw urlError;
      }

      setSignedUrl(data.signedUrl);
    } catch (err: any) {
      console.error('Failed to get signed URL:', err);
      setError('Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (receiptPath && modalOpen) {
      fetchSignedUrl();
    }
  }, [receiptPath, modalOpen]);

  const handleViewClick = () => {
    if (!receiptPath) return;
    setModalOpen(true);
  };

  const handleDownload = () => {
    if (!signedUrl) return;
    window.open(signedUrl, '_blank');
  };

  if (!receiptPath) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <ImageIcon className="w-3 h-3" />
        <span>No receipt attached</span>
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewClick}
          className="gap-1 h-7 text-xs"
        >
          <ImageIcon className="w-3 h-3" />
          View Receipt
        </Button>

        <ReceiptModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          signedUrl={signedUrl}
          loading={loading}
          error={error}
          referenceNumber={referenceNumber}
          memberName={memberName}
          onDownload={handleDownload}
          onRetry={fetchSignedUrl}
        />
      </>
    );
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleViewClick}
        className="relative rounded-lg overflow-hidden border border-border bg-muted/30 cursor-pointer group"
      >
        <div className="aspect-video flex items-center justify-center bg-black/5 min-h-[80px]">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs font-medium">Proof of Payment</span>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </motion.div>

      <ReceiptModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        signedUrl={signedUrl}
        loading={loading}
        error={error}
        referenceNumber={referenceNumber}
        memberName={memberName}
        onDownload={handleDownload}
        onRetry={fetchSignedUrl}
      />
    </>
  );
};

// Internal Modal Component
interface ReceiptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  loading: boolean;
  error: string | null;
  referenceNumber: string;
  memberName: string;
  onDownload: () => void;
  onRetry: () => void;
}

const ReceiptModal = ({
  open,
  onOpenChange,
  signedUrl,
  loading,
  error,
  referenceNumber,
  memberName,
  onDownload,
  onRetry,
}: ReceiptModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ImageIcon className="w-4 h-4 text-primary" />
            Receipt: {referenceNumber}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Submitted by {memberName}
          </p>
        </DialogHeader>

        <div className="p-4 pt-2">
          <div className="relative rounded-lg overflow-hidden bg-black/5 min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading receipt...</p>
                </motion.div>
              )}

              {error && !loading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <AlertCircle className="w-8 h-8 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" size="sm" onClick={onRetry}>
                    Retry
                  </Button>
                </motion.div>
              )}

              {signedUrl && !loading && !error && (
                <motion.img
                  key="image"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  src={signedUrl}
                  alt="Proof of payment receipt"
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              disabled={!signedUrl}
              className="gap-1"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signedUrl && window.open(signedUrl, '_blank')}
              disabled={!signedUrl}
              className="gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositReceiptViewer;
