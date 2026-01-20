/**
 * Admin Gatekeeper Component
 * Temporary authentication gate for Governor Dashboard
 * 
 * SECURITY WARNING: This uses hardcoded credentials as a temporary solution.
 * This should be replaced with proper Supabase Auth in production.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, AlertTriangle, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AdminGatekeeperProps {
  onAuthenticated: () => void;
}

// Session storage key for admin auth state
const ADMIN_AUTH_KEY = 'abc-admin-authenticated';
const ADMIN_SESSION_EXPIRY = 'abc-admin-session-expiry';
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// Check if admin is already authenticated (session-based)
export const isAdminAuthenticated = (): boolean => {
  try {
    const authenticated = sessionStorage.getItem(ADMIN_AUTH_KEY);
    const expiry = sessionStorage.getItem(ADMIN_SESSION_EXPIRY);
    
    if (authenticated === 'true' && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        return true;
      }
      // Session expired, clear it
      clearAdminSession();
    }
  } catch (e) {
    console.error('Failed to check admin auth:', e);
  }
  return false;
};

// Set admin authenticated
const setAdminAuthenticated = (): void => {
  try {
    sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
    sessionStorage.setItem(ADMIN_SESSION_EXPIRY, String(Date.now() + SESSION_DURATION_MS));
  } catch (e) {
    console.error('Failed to set admin auth:', e);
  }
};

// Clear admin session
export const clearAdminSession = (): void => {
  try {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_EXPIRY);
  } catch (e) {
    console.error('Failed to clear admin session:', e);
  }
};

const AdminGatekeeper = ({ onAuthenticated }: AdminGatekeeperProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Rate limiting - lock after 5 failed attempts
  const isLocked = attempts >= 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      setError("Too many failed attempts. Please try again later.");
      return;
    }

    setIsLoading(true);
    setError("");

    // Simulate network delay for security
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate credentials
    // WARNING: This is NOT secure for production use
    const validEmail = "master@admin.com";
    const validPassword = "MasterPassword1213";

    if (email.trim().toLowerCase() === validEmail && password === validPassword) {
      setAdminAuthenticated();
      onAuthenticated();
    } else {
      setAttempts(prev => prev + 1);
      setError("Invalid credentials. Access denied.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,4%)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 bg-card/50 border-destructive/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Governor Access
            </h1>
            <p className="text-sm text-muted-foreground">
              Alpha Banking Cooperative • Admin Portal
            </p>
          </div>

          {/* Security Warning */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-500/80">
              This is a restricted area. All access attempts are logged for security purposes.
            </p>
          </motion.div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Admin Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="bg-muted/30 border-border focus:border-destructive/50"
                disabled={isLocked}
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Master Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter master password"
                  className="bg-muted/30 border-border focus:border-destructive/50 pr-10"
                  disabled={isLocked}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/30"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lock Message */}
            {isLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-lg bg-destructive/20 border border-destructive/50"
              >
                <p className="text-sm text-destructive font-medium">
                  🔒 Access temporarily locked due to multiple failed attempts.
                </p>
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isLocked}
              className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground font-semibold py-5"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Access Governor Dashboard
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Attempt {Math.min(attempts, 5)} of 5 • Session expires in 4 hours
          </p>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminGatekeeper;
