import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordState = 'email' | 'sent' | 'error';

interface ForgotPasswordProps {
  onBack: () => void;
  onRecoverViaQuestions: () => void;
}

export default function ForgotPassword({ onBack, onRecoverViaQuestions }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [state, setState] = useState<ForgotPasswordState>('email');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        // Don't reveal if email exists or not for security
        if (error.message.includes('rate limit')) {
          setErrorMessage('Too many requests. Please wait before trying again.');
          setState('error');
        } else {
          // Always show success to prevent email enumeration
          setState('sent');
        }
      } else {
        setState('sent');
        toast({
          title: 'Reset Link Dispatched',
          description: 'If an account exists, a reset link has been sent.',
        });
      }
    } catch (err) {
      setErrorMessage('Unable to process request. Please try again.');
      setState('error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (state) {
      case 'email':
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label 
                htmlFor="forgot-email" 
                className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500"
              >
                Registered Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="alpha@member.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
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
                  Dispatching...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>

            <div className="pt-4 border-t border-[#D4AF37]/10">
              <button
                type="button"
                onClick={onRecoverViaQuestions}
                className="w-full text-center text-xs text-[#D4AF37]/70 hover:text-[#D4AF37] uppercase tracking-[0.1em] transition-all duration-300"
              >
                <Key className="w-3 h-3 inline-block mr-2" />
                Recover via Security Questions
              </button>
            </div>
          </form>
        );

      case 'sent':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#00FF41]/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00FF41]" />
            </div>
            <h3 
              className="text-lg font-bold uppercase tracking-[0.1em] mb-3"
              style={{ color: '#D4AF37' }}
            >
              Reset Link Dispatched
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              If an account exists with that email, a password reset link has been sent. 
              Please check your inbox and spam folder.
            </p>
            <p className="text-gray-600 text-xs mb-6">
              Link expires in 1 hour
            </p>
            <Button
              onClick={onBack}
              variant="outline"
              className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs uppercase tracking-[0.1em]"
            >
              Return to Login
            </Button>
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
              Request Failed
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => setState('email')}
                className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold text-xs uppercase tracking-[0.15em]"
              >
                Try Again
              </Button>
              <Button
                onClick={onBack}
                variant="outline"
                className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs uppercase tracking-[0.1em]"
              >
                Return to Login
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md">
      {state === 'email' && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-[#D4AF37] transition-all duration-300 mb-8 uppercase tracking-[0.1em]"
        >
          <ArrowLeft className="w-3 h-3" />
          Return to Login
        </button>
      )}

      <div className="border border-[#D4AF37]/10 bg-[#050505] p-8">
        <div className="mb-8">
          <div className="w-8 h-[2px] bg-[#D4AF37] mb-6" />
          <h2 
            className="text-xl font-bold uppercase tracking-[0.15em] mb-2"
            style={{ color: '#D4AF37' }}
          >
            Forgot Vault Key
          </h2>
          <p className="text-xs text-gray-600 uppercase tracking-[0.1em]">
            {state === 'email' && 'Enter email to receive reset link'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}