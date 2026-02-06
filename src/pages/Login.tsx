import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AccountRecovery from '@/components/auth/AccountRecovery';
import ForgotPassword from '@/components/auth/ForgotPassword';
import { z } from 'zod';
import abcLogo from '@/assets/abc-logo.png';
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});
type RecoveryMode = 'none' | 'forgot' | 'security';
export default function Login() {
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const {
    signIn
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as {
    from?: {
      pathname: string;
    };
  })?.from?.pathname || '/dashboard';
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
      } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      const {
        error
      } = await signIn(email, password);
      if (error) {
        toast({
          title: 'Access Denied',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Ledger Access Granted',
          description: 'Secure session initialized.'
        });
        navigate(from, {
          replace: true
        });
      }
    } catch (err) {
      toast({
        title: 'System Error',
        description: 'Unable to establish secure connection.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password flow (email-based)
  if (recoveryMode === 'forgot') {
    return <div className="min-h-screen bg-[#050505] flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-[#D4AF37]/10">
          <div className="absolute inset-0 bg-[#050505]" />
          
          <div className="relative z-10 flex flex-col justify-center px-12">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.4
          }}>
              <div className="flex items-center gap-3 mb-12">
                <img src={abcLogo} alt="ABC" className="w-12 h-12 rounded-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
                <span className="text-2xl font-bold" style={{
                color: '#D4AF37',
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                  ₳฿C
                </span>
              </div>
              
              <div className="w-12 h-[1px] bg-[#D4AF37] mb-6" />
              
              <h1 className="text-3xl font-bold mb-4 uppercase tracking-[0.1em]" style={{
              color: '#D4AF37'
            }}>
                Forgot Vault Key
              </h1>
              
              <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
                Request a secure password reset link via email to restore ledger access.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                  <span>Secure email verification</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                  <span>One-time reset link</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                  <span>1 hour expiration</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Forgot Password Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#050505]">
          <AnimatePresence mode="wait">
            <motion.div key="forgot" initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -20
          }} transition={{
            duration: 0.3
          }} className="w-full max-w-md">
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <img src={abcLogo} alt="ABC" className="w-8 h-8 rounded-full object-contain" />
                <span className="text-lg font-bold" style={{
                color: '#D4AF37'
              }}>₳฿C</span>
              </div>

              <ForgotPassword onBack={() => setRecoveryMode('none')} onRecoverViaQuestions={() => setRecoveryMode('security')} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>;
  }

  // Security Questions Recovery flow
  if (recoveryMode === 'security') {
    return <div className="min-h-screen bg-[#050505] flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-[#D4AF37]/10">
          <div className="absolute inset-0 bg-[#050505]" />
          
          <div className="relative z-10 flex flex-col justify-center px-12">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.4
          }}>
              <div className="flex items-center gap-3 mb-12">
                <img src={abcLogo} alt="ABC" className="w-12 h-12 rounded-full object-contain drop-shadow-[0_0_20px_rgba(212,175,55,0.3)]" />
                <span className="text-2xl font-bold" style={{
                color: '#D4AF37',
                fontFamily: 'Georgia, "Times New Roman", serif'
              }}>
                  ₳฿C
                </span>
              </div>
              
              <div className="w-12 h-[1px] bg-[#D4AF37] mb-6" />
              
              <h1 className="text-3xl font-bold mb-4 uppercase tracking-[0.1em]" style={{
              color: '#D4AF37'
            }}>
                Security Recovery
              </h1>
              
              <p className="text-gray-500 mb-8 max-w-md text-sm leading-relaxed">
                Verify your identity using your security questions to restore ledger access.
              </p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                  <span>Secure verification process</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                  <span>Rate-limited for protection</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41]" />
                  <span>Answers never exposed</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Panel - Recovery Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#050505]">
          <AnimatePresence mode="wait">
            <motion.div key="security" initial={{
            opacity: 0,
            x: 20
          }} animate={{
            opacity: 1,
            x: 0
          }} exit={{
            opacity: 0,
            x: -20
          }} transition={{
            duration: 0.3
          }} className="w-full max-w-md">
              {/* Mobile Header */}
              <div className="lg:hidden flex items-center gap-2 mb-8">
                <img src={abcLogo} alt="ABC" className="w-8 h-8 rounded-full object-contain" />
                <span className="text-lg font-bold" style={{
                color: '#D4AF37'
              }}>₳฿C</span>
              </div>

              <AccountRecovery onBack={() => setRecoveryMode('none')} onSuccess={() => setRecoveryMode('none')} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-[#050505] flex">
      {/* Left Panel - Branding */}
      

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-[#050505]">
        <motion.div initial={{
        opacity: 0,
        x: 20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.4
      }} className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={abcLogo} alt="ABC" className="w-8 h-8 rounded-full object-contain" />
            <span className="text-lg font-bold" style={{
            color: '#D4AF37'
          }}>₳฿C</span>
          </div>

          <Link to="/" className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-[#D4AF37] transition-all duration-300 mb-8 uppercase tracking-[0.1em]">
            <ArrowLeft className="w-3 h-3" />
            Return to Portal
          </Link>

          <div className="border border-[#D4AF37]/10 bg-[#050505] p-8">
            <div className="mb-8">
              <div className="w-8 h-[2px] bg-[#D4AF37] mb-6" />
              <h2 className="text-xl font-bold uppercase tracking-[0.15em] mb-2" style={{
              color: '#D4AF37'
            }}>
                Ledger Access
              </h2>
              <p className="text-xs text-gray-600 uppercase tracking-[0.1em]">
                Enter credentials to initialize session
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input id="email" type="email" placeholder="alpha@member.com" value={email} onChange={e => setEmail(e.target.value)} className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 ${errors.email ? 'border-red-500' : ''}`} disabled={isLoading} />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">
                    Vault Key
                  </Label>
                  <button type="button" onClick={() => setRecoveryMode('forgot')} className="text-[10px] text-[#D4AF37]/70 hover:text-[#D4AF37] uppercase tracking-[0.1em] transition-all duration-300">
                    Forgot Vault Key?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} className={`pl-10 pr-10 bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 ${errors.password ? 'border-red-500' : ''}`} disabled={isLoading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <Button type="submit" className="w-full bg-[#00FF41] hover:bg-[#00FF41]/90 text-[#050505] font-bold text-xs uppercase tracking-[0.15em] transition-all duration-300" size="lg" disabled={isLoading}>
                {isLoading ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </> : 'Initialize Session'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#D4AF37]/10 text-center">
              <p className="text-xs text-gray-600">
                Not yet registered?{' '}
                <Link to="/register" className="text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium uppercase tracking-[0.05em] transition-all duration-300">
                  Initialize Ledger
                </Link>
              </p>
            </div>
          </div>

          {/* Security Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-700 uppercase tracking-[0.1em]">
            <Lock className="w-3 h-3" />
            <span>Protected by 256-bit SSL</span>
          </div>
        </motion.div>
      </div>
    </div>;
}