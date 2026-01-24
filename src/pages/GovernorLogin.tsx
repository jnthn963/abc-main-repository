import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Loader2, ArrowLeft, Crown, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Supreme Governor emails - password validated server-side via Supabase Auth
const SUPREME_GOVERNOR_EMAILS = [
  'nangkiljonathan@gmail.com',
  'governor@alphaecosystem.com'
];

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function GovernorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
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

  // Handle login submission
  const handleLogin = async (e: React.FormEvent) => {
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
    
    // Validate input
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // Check if email matches any Supreme Governor
    const isSupremeGovernor = SUPREME_GOVERNOR_EMAILS.some(
      govEmail => email.toLowerCase() === govEmail.toLowerCase()
    );
    if (!isSupremeGovernor) {
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
          description: 'This portal is reserved for the Supreme Governor only.',
          variant: 'destructive',
        });
      }
      return;
    }

    setIsLoading(true);
    
    try {
      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
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
            title: 'Authentication Failed',
            description: 'Invalid credentials. Please check your email and password.',
            variant: 'destructive',
          });
        }
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

        if (!roleData) {
          await supabase.auth.signOut();
          toast({
            title: 'Access Denied',
            description: 'This account does not have governor privileges.',
            variant: 'destructive',
          });
          return;
        }

        // Log successful governor login
        await supabase.from('admin_audit_log').insert({
          admin_id: data.user.id,
          action: 'GOVERNOR_LOGIN_SUCCESS',
          details: { 
            description: 'Governor authenticated via email/password',
            login_method: 'password'
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
        title: 'System Error',
        description: 'Unable to establish secure connection. Please try again.',
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
              Executive Access
            </h1>
            
            <p className="text-muted-foreground mb-8 max-w-md">
              Secure login portal for the Supreme Governor. Full administrative control over the Alpha Banking Cooperative.
            </p>

            <div className="space-y-4 p-4 bg-red-950/20 rounded-lg border border-red-900/30">
              <div className="flex items-center gap-3 text-sm text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Security Protocol</span>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span>Exclusive access for Supreme Governor</span>
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
                  <span>Secure password-protected authentication</span>
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

          <div className="glass-card p-8 border-red-900/30">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500/30">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Governor Access</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your executive credentials
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

            <form onSubmit={handleLogin} className="space-y-6">
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
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
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Access Governor Portal
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

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Protected by Alpha Banking Cooperative Security Protocol
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
