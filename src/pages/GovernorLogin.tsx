import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Lock, Mail, Loader2, ArrowLeft, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import abcLogo from '@/assets/abc-logo.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid ledger address'),
  password: z.string().min(6, 'Vault key must be at least 6 characters'),
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

  useEffect(() => {
    if (user && hasRole('governor')) {
      navigate('/governor', { replace: true });
    }
  }, [user, hasRole, navigate]);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const timer = setTimeout(() => setLockoutTimer(lockoutTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (lockoutTimer === 0 && isLocked) {
      setIsLocked(false);
      setLoginAttempts(0);
    }
  }, [lockoutTimer, isLocked]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const startTime = Date.now();
    const MIN_RESPONSE_TIME = 800;
    
    const uniformDelay = async () => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, MIN_RESPONSE_TIME - elapsed);
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    };
    
    if (isLocked) {
      await uniformDelay();
      toast({
        title: 'Access Temporarily Locked',
        description: `Too many failed attempts. Please wait ${lockoutTimer} seconds.`,
        variant: 'destructive',
      });
      return;
    }
    
    setErrors({});
    
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      await uniformDelay();
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error || !data.user) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        await uniformDelay();
        
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
            description: 'Invalid credentials.',
            variant: 'destructive',
          });
        }
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'governor')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        await uniformDelay();
        
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
            description: 'Invalid credentials.',
            variant: 'destructive',
          });
        }
        return;
      }

      await supabase.from('admin_audit_log').insert({
        admin_id: data.user.id,
        action: 'GOVERNOR_LOGIN_SUCCESS',
        details: { 
          description: 'Governor authenticated via sovereign protocol',
          login_method: 'password'
        },
        ip_address: 'client',
      });

      await uniformDelay();
      
      toast({
        title: 'Access Granted',
        description: 'Welcome to the Supreme Governor Terminal.',
      });
      
      navigate('/governor', { replace: true });
    } catch (err) {
      await uniformDelay();
      toast({
        title: 'Access Denied',
        description: 'Invalid credentials.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-red-950/20 via-[#050505] to-[#050505]">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <motion.img 
                src={abcLogo} 
                alt="Alpha Bankers Cooperative" 
                className="w-14 h-14 rounded-full object-contain drop-shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div>
                <span className="text-3xl font-bold text-red-400">SUPREME</span>
                <p className="text-xs text-red-400/60 uppercase tracking-[0.2em]">Governor Portal</p>
              </div>
            </div>
            
            <h1 
              className="text-4xl font-bold mb-4"
              style={{ color: '#D4AF37' }}
            >
              Executive Terminal
            </h1>
            
            <p className="text-gray-500 mb-8 max-w-md">
              Secure access portal for the Supreme Governor. Full administrative control over the Alpha Bankers Cooperative sovereign system.
            </p>

            <div className="space-y-4 p-4 border border-red-900/30 bg-red-950/20">
              <div className="flex items-center gap-3 text-sm text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold uppercase tracking-[0.1em]">Security Protocol</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
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
                  <span>Secure vault key authentication</span>
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
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={abcLogo} alt="Alpha Bankers Cooperative" className="w-10 h-10 rounded-full object-contain drop-shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
            <span className="text-xl font-bold text-red-400">SUPREME GOVERNOR</span>
          </div>

          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4AF37] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="p-8 border border-red-900/30 bg-[#050505]/80 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 ring-2 ring-red-500/30">
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <h2 
                className="text-2xl font-bold uppercase tracking-[0.1em]"
                style={{ color: '#D4AF37' }}
              >
                Governor Access
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter your executive credentials
              </p>
            </div>

            {isLocked && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Access Temporarily Locked</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Please wait {lockoutTimer} seconds before trying again.
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                  Governor Ledger Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your governor email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.email ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLocked}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                  Vault Key
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your vault key"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pl-10 pr-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.password ? 'border-destructive' : ''}`}
                    disabled={isLoading || isLocked}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 hover:text-[#D4AF37] transition-colors"
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
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-[0.1em]" 
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
                    Access Terminal
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Regular member?{' '}
                <Link to="/login" className="text-[#D4AF37] hover:underline font-medium">
                  Use Member Ledger
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-700 uppercase tracking-[0.15em]">
              Protected by Alpha Bankers Cooperative Security Protocol
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
