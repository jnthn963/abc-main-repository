import { useState, useEffect } from "react";
import {
  Mail,
  Server,
  Lock,
  User,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SMTPConfig {
  smtp_host: string | null;
  smtp_port: number;
  smtp_user: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
}

interface SMTPConfigManagerProps {
  initialConfig?: SMTPConfig;
  onConfigUpdate: (config: Partial<SMTPConfig>) => void;
}

const SMTPConfigManager = ({
  initialConfig,
  onConfigUpdate,
}: SMTPConfigManagerProps) => {
  const [config, setConfig] = useState<SMTPConfig>({
    smtp_host: initialConfig?.smtp_host || "",
    smtp_port: initialConfig?.smtp_port || 587,
    smtp_user: initialConfig?.smtp_user || "",
    smtp_from_email: initialConfig?.smtp_from_email || "",
    smtp_from_name: initialConfig?.smtp_from_name || "Alpha Business Cooperative",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPassword, setSMTPPassword] = useState("");

  // Sync with props
  useEffect(() => {
    if (initialConfig) {
      setConfig({
        smtp_host: initialConfig.smtp_host || "",
        smtp_port: initialConfig.smtp_port || 587,
        smtp_user: initialConfig.smtp_user || "",
        smtp_from_email: initialConfig.smtp_from_email || "",
        smtp_from_name: initialConfig.smtp_from_name || "Alpha Business Cooperative",
      });
    }
  }, [initialConfig]);

  // Handle input changes
  const handleChange = (field: keyof SMTPConfig, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update via callback
      onConfigUpdate(config);
      setHasChanges(false);
      toast.success("SMTP configuration saved successfully!");

      // Note about password
      if (smtpPassword) {
        toast.info(
          "SMTP password must be stored in Supabase secrets as SMTP_PASSWORD. This is not stored in the database for security."
        );
      }
    } catch (err) {
      console.error("Failed to save SMTP config:", err);
      toast.error("Failed to save SMTP configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isConfigured = config.smtp_host && config.smtp_user && config.smtp_from_email;

  return (
    <Card className="p-5 bg-card/50 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">SMTP Configuration</h3>
        </div>
        {hasChanges && (
          <span className="text-xs text-primary flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Unsaved changes
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Configure SMTP settings for Hostinger Email integration. The password
        must be stored as a Supabase secret (SMTP_PASSWORD).
      </p>

      <div className="space-y-4">
        {/* SMTP Host */}
        <div className="space-y-2">
          <Label htmlFor="smtp-host" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Server className="w-3 h-3" />
            SMTP Host
          </Label>
          <Input
            id="smtp-host"
            value={config.smtp_host || ""}
            onChange={(e) => handleChange("smtp_host", e.target.value)}
            placeholder="smtp.hostinger.com"
            className="bg-muted/30 border-border text-sm"
          />
        </div>

        {/* SMTP Port */}
        <div className="space-y-2">
          <Label htmlFor="smtp-port" className="text-xs font-medium text-muted-foreground">
            SMTP Port
          </Label>
          <Input
            id="smtp-port"
            type="number"
            value={config.smtp_port}
            onChange={(e) => handleChange("smtp_port", parseInt(e.target.value) || 587)}
            placeholder="587"
            className="bg-muted/30 border-border text-sm"
          />
          <p className="text-xs text-muted-foreground">
            587 (TLS) or 465 (SSL)
          </p>
        </div>

        {/* SMTP Username */}
        <div className="space-y-2">
          <Label htmlFor="smtp-user" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <User className="w-3 h-3" />
            SMTP Username
          </Label>
          <Input
            id="smtp-user"
            value={config.smtp_user || ""}
            onChange={(e) => handleChange("smtp_user", e.target.value)}
            placeholder="noreply@yourdomain.com"
            className="bg-muted/30 border-border text-sm"
          />
        </div>

        {/* SMTP Password (info only) */}
        <div className="space-y-2">
          <Label htmlFor="smtp-password" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Lock className="w-3 h-3" />
            SMTP Password
          </Label>
          <div className="relative">
            <Input
              id="smtp-password"
              type={showPassword ? "text" : "password"}
              value={smtpPassword}
              onChange={(e) => {
                setSMTPPassword(e.target.value);
                setHasChanges(true);
              }}
              placeholder="••••••••"
              className="bg-muted/30 border-border text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Store as <code className="text-yellow-500">SMTP_PASSWORD</code> in
              Supabase secrets. Not saved in database.
            </p>
          </div>
        </div>

        {/* From Email */}
        <div className="space-y-2">
          <Label htmlFor="smtp-from-email" className="text-xs font-medium text-muted-foreground flex items-center gap-2">
            <Mail className="w-3 h-3" />
            From Email
          </Label>
          <Input
            id="smtp-from-email"
            type="email"
            value={config.smtp_from_email || ""}
            onChange={(e) => handleChange("smtp_from_email", e.target.value)}
            placeholder="noreply@yourdomain.com"
            className="bg-muted/30 border-border text-sm"
          />
          {config.smtp_from_email && !isValidEmail(config.smtp_from_email) && (
            <p className="text-xs text-destructive">Invalid email format</p>
          )}
        </div>

        {/* From Name */}
        <div className="space-y-2">
          <Label htmlFor="smtp-from-name" className="text-xs font-medium text-muted-foreground">
            From Name
          </Label>
          <Input
            id="smtp-from-name"
            value={config.smtp_from_name || ""}
            onChange={(e) => handleChange("smtp_from_name", e.target.value)}
            placeholder="Alpha Business Cooperative"
            className="bg-muted/30 border-border text-sm"
          />
        </div>

        {/* Status Indicator */}
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            isConfigured
              ? "bg-success/10 border border-success/30"
              : "bg-muted/30 border border-border"
          }`}
        >
          {isConfigured ? (
            <CheckCircle className="w-4 h-4 text-success" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          )}
          <div>
            <p className={`text-xs font-medium ${isConfigured ? "text-success" : "text-muted-foreground"}`}>
              {isConfigured ? "SMTP Configured" : "SMTP Not Configured"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConfigured
                ? "Ready for email sending (requires SMTP_PASSWORD secret)"
                : "Complete all required fields to enable email"}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
            hasChanges && !isSaving
              ? "bg-gradient-to-r from-primary to-amber-600 text-black hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save SMTP Settings
            </>
          )}
        </button>
      </div>
    </Card>
  );
};

export default SMTPConfigManager;
