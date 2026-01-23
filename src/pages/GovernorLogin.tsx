import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Loader2, ArrowLeft, Crown, AlertTriangle, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Supreme Governor email - hardcoded for maximum security
const SUPREME_GOVERNOR_EMAIL = 'nangkiljonathan@gmail.com';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export default function GovernorLogin() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [step, setStep] = useState<'email' | 'otp-sent' | 'verification'>('email');
  const [otpToken, setOtpToken] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  
  const { hasRole, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if already authenticated as governor
  useEffect(() => {
    if (user && hasRole('governor')) {
      navigate('/governor', { replace: true });
    }
  }, [user, hasRole, navigate]);

  // Lockout timer countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lockoutTimer === 0 && isLocked) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
  }, [lockoutTimer, isLocked]);

  // Handle email submission - request OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast({
        title: 'Access Temporarily Locked',
        description: `Too many failed attempts. Please wait ${lockoutTimer} seconds.`,
        variant: 'destructive',
      });
      return;
    }
    
    setErrors({});
    
    // Validate email
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: { email?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Call edge function to send OTP
      const { data, error } = await supabase.functions.invoke('send-governor-otp', {
        body: { email },
      });
      
      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          setLockoutTimer(60);
          toast({
            title: 'Access Temporarily Locked',
            description: 'Too many failed attempts. Please wait 60 seconds.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Access Denied',
            description: error.message || 'Governor credentials required.',
            variant: 'destructive',
          });
        }
        return;
      }

      if (data?.success) {
        setStep('otp-sent');
        toast({
          title: 'Verification Code Sent',
          description: 'Check your email for the secure login link.',
        });
      } else {
        toast({
          title: 'Request Failed',
          description: data?.error || 'Unable to send verification code.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'System Error',
        description: 'Unable to establish secure connection. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otpToken.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the complete 6-digit code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify OTP with Supabase Auth
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otpToken,
        type: 'email',
      });

      if (error) {
        toast({
          title: 'Verification Failed',
          description: 'Invalid or expired code. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        // Check if user has governor role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'governor')
          .maybeSingle();

        const isSupremeGovernor = email.toLowerCase() === SUPREME_GOVERNOR_EMAIL.toLowerCase();

        if (!roleData && !isSupremeGovernor) {
          await supabase.auth.signOut();
          toast({
            title: 'Access Denied',
            description: 'This portal is reserved for the Supreme Governor only.',
            variant: 'destructive',
          });
          return;
        }

        // Log successful governor login
        await supabase.from('admin_audit_log').insert({
          admin_id: data.user.id,
          action: 'GOVERNOR_OTP_LOGIN_SUCCESS',
          details: { 
            description: 'Governor authenticated via passwordless OTP',
            is_supreme: isSupremeGovernor
          },
          ip_address: 'client',
        });

        toast({
          title: 'Access Granted',
          description: 'Welcome to the Governor Terminal, Supreme Executive.',
        });
        
        navigate('/governor', { replace: true });
      }
    } catch (err) {
      toast({
        title: 'Verification Error',
        description: 'Unable to verify code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-governor-otp', {
        body: { email },
      });

      if (error || !data?.success) {
        toast({
          title: 'Resend Failed',
          description: 'Unable to resend verification code.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Code Resent',
          description: 'A new verification code has been sent to your email.',
        });
      }
    } catch {
      toast({
        title: 'System Error',
        description: 'Unable to resend code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-red-950/20 via-background to-background">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-900/50">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="text-3xl font-bold text-red-400">SUPREME</span>
                <p className="text-xs text-red-400/60 uppercase tracking-widest">Governor Portal</p>
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Passwordless Access
            </h1>
            
            <p className="text-muted-foreground mb-8 max-w-md">
              Enhanced security through email-based OTP verification. No passwords to remember or compromise.
            </p>

            <div className="space-y-4 p-4 bg-red-950/20 rounded-lg border border-red-900/30">
              <div className="flex items-center gap-3 text-sm text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Security Protocol</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Secure OTP sent directly to verified email</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>All access attempts are logged and monitored</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Account locks after 3 failed attempts</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Supreme Governor exclusive access</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Crown className="w-8 h-8 text-red-500" />
            <span className="text-xl font-bold text-red-400">SUPREME GOVERNOR</span>
          </div>

          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          {step === 'email' && (
            <div className="glass-card p-8 border-red-900/30">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500/30">
                  <Shield className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Governor Access</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your executive email for secure OTP
                </p>
              </div>

              {isLocked && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Access Temporarily Locked</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait {lockoutTimer} seconds before trying again.
                  </p>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Governor Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your governor email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                      disabled={isLoading || isLocked}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700" 
                  size="lg"
                  disabled={isLoading || isLocked}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Regular member?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Use Member Portal
                  </Link>
                </p>
              </div>
            </div>
          )}

          {step === 'otp-sent' && (
            <div className="glass-card p-8 border-amber-900/30">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 ring-2 ring-amber-500/30">
                  <Mail className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A secure verification code has been sent to:
                </p>
                <p className="text-sm font-medium text-primary mt-2">{email}</p>
              </div>

              <div className="space-y-4">
                <Button 
                  onClick={() => setStep('verification')}
                  className="w-full bg-amber-600 hover:bg-amber-700" 
                  size="lg"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Enter Code Manually
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Or click the magic link in your email</p>
                </div>

                <Button 
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    'Resend Code'
                  )}
                </Button>
              </div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => {
                    setStep('email');
                    setOtpToken('');
                  }}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Use a different email
                </button>
              </div>
            </div>
          )}

          {step === 'verification' && (
            <div className="glass-card p-8 border-amber-900/30">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4 ring-2 ring-amber-500/30">
                  <KeyRound className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Enter Verification Code</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <form onSubmit={handleOTPVerify} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={otpToken} 
                    onChange={setOtpToken}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700" 
                  size="lg"
                  disabled={otpToken.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4 mr-2" />
                      Access Governor Terminal
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <button 
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-primary hover:underline"
                >
                  Resend verification code
                </button>
                <br />
                <button 
                  onClick={() => {
                    setStep('email');
                    setOtpToken('');
                  }}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Cancel and return to login
                </button>
              </div>
            </div>
          )}

          {/* Security Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-red-400/60">
            <Lock className="w-3 h-3" />
            <span>Supreme security zone • Passwordless OTP • All activity monitored</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
