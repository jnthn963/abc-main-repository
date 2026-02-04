import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import abcLogo from '@/assets/abc-logo.png';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ResetState = 'loading' | 'ready' | 'success' | 'error';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [resetState, setResetState] = useState<ResetState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Check URL hash for recovery token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (type === 'recovery' && accessToken) {
          // Set the session from the recovery token
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get('refresh_token') || '',
          });
          
          if (sessionError) {
            setResetState('error');
            setErrorMessage('Invalid or expired reset link. Please request a new one.');
            return;
          }
          
          setResetState('ready');
        } else {
          setResetState('error');
          setErrorMessage('Invalid or expired reset link. Please request a new password reset.');
        }
      } else {
        setResetState('ready');
      }
    };

    // Listen for auth state changes (recovery event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setResetState('ready');
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = passwordSchema.safeParse({ password, confirmPassword });
    if (!result.success) {
      const fieldErrors: { password?: string; confirmPassword?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'password') fieldErrors.password = err.message;
        if (err.path[0] === 'confirmPassword') fieldErrors.confirmPassword = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        toast({
          title: 'Reset Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setResetState('success');
        toast({
          title: 'Vault Key Updated',
          description: 'Your password has been successfully reset.',
        });
        
        // Sign out and redirect to login after a delay
        setTimeout(async () => {
          await supabase.auth.signOut();
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (err) {
      toast({
        title: 'System Error',
        description: 'Unable to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (resetState) {
      case 'loading':
        return (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#D4AF37] mx-auto animate-spin mb-4" />
            <p className="text-gray-500 text-sm uppercase tracking-[0.1em]">
              Validating Reset Token...
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 
              className="text-lg font-bold uppercase tracking-[0.1em] mb-3"
              style={{ color: '#D4AF37' }}
            >
              Reset Link Invalid
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              {errorMessage}
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold text-xs uppercase tracking-[0.15em]"
            >
              Return to Login
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#00FF41]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00FF41]" />
            </div>
            <h3 
              className="text-lg font-bold uppercase tracking-[0.1em] mb-3"
              style={{ color: '#D4AF37' }}
            >
              Vault Key Reset Complete
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Your password has been successfully updated. Redirecting to login...
            </p>
            <Loader2 className="w-6 h-6 text-[#D4AF37] mx-auto animate-spin" />
          </div>
        );

      case 'ready':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500"
              >
                New Vault Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 ${errors.password ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="confirmPassword" 
                className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500"
              >
                Confirm Vault Key
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="p-3 bg-[#0a0a0a] border border-[#D4AF37]/10 rounded">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.1em] mb-2">
                Security Requirements
              </p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className={password.length >= 8 ? 'text-[#00FF41]' : ''}>
                  • At least 8 characters
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-[#00FF41]' : ''}>
                  • One uppercase letter
                </li>
                <li className={/[a-z]/.test(password) ? 'text-[#00FF41]' : ''}>
                  • One lowercase letter
                </li>
                <li className={/[0-9]/.test(password) ? 'text-[#00FF41]' : ''}>
                  • One number
                </li>
              </ul>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#00FF41] hover:bg-[#00FF41]/90 text-[#050505] font-bold text-xs uppercase tracking-[0.15em] transition-all duration-300" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Reset Vault Key'
              )}
            </Button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-[#D4AF37]/10">
        <div className="absolute inset-0 bg-[#050505]" />
        
        <div className="relative z-10 flex flex-col justify-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-12">
              <img 
                src={abcLogo} 
                alt="ABC" 
                className="w-12 h-12 rounded-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
              />
              <span 
                className="text-2xl font-bold"
                style={{ 
                  color: '#D4AF37',
                  fontFamily: 'Georgia, "Times New Roman", serif'
                }}
              >
                ₳฿C
              </span>
            </div>
            
            <div className="w-12 h-[1px] bg-[#D4AF37] mb-6" />
            
            <h1 
              className="text-3xl font-bold mb-4 uppercase tracking-[0.1em]"
              style={{ color: '#D4AF37' }}
            >
              Reset Vault Key
            </h1>
            
            <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
              Create a new secure password to restore access to your sovereign vault.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                <span>256-bit encryption standard</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                <span>Password strength validation</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                <span>Secure server-side hashing</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Reset Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img 
              src={abcLogo} 
              alt="ABC" 
              className="w-8 h-8 rounded-full object-contain" 
            />
            <span className="text-lg font-bold" style={{ color: '#D4AF37' }}>₳฿C</span>
          </div>

          <div className="border border-[#D4AF37]/10 bg-[#050505] p-8">
            <div className="mb-8">
              <div className="w-8 h-[2px] bg-[#D4AF37] mb-6" />
              <h2 
                className="text-xl font-bold uppercase tracking-[0.15em] mb-2"
                style={{ color: '#D4AF37' }}
              >
                Reset Vault Key
              </h2>
              <p className="text-xs text-gray-600 uppercase tracking-[0.1em]">
                Create a new secure password
              </p>
            </div>

            {renderContent()}
          </div>

          {/* Security Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-700 uppercase tracking-[0.1em]">
            <Lock className="w-3 h-3" />
            <span>Protected by 256-bit SSL</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}