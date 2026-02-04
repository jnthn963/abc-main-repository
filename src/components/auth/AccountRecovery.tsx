import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Key, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

interface RecoveryQuestions {
  question_1: string;
  question_2: string;
}

interface RecoveryState {
  step: 'email' | 'questions' | 'success' | 'error';
  userId: string | null;
  maskedMemberId: string | null;
  questions: RecoveryQuestions | null;
  error: string | null;
}

interface AccountRecoveryProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function AccountRecovery({ onBack, onSuccess }: AccountRecoveryProps) {
  const [email, setEmail] = useState('');
  const [answer1, setAnswer1] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [state, setState] = useState<RecoveryState>({
    step: 'email',
    userId: null,
    maskedMemberId: null,
    questions: null,
    error: null,
  });

  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setErrors({ email: result.error.errors[0].message });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('initiate_account_recovery', {
        p_email: email.trim(),
      });

      if (error) {
        throw error;
      }

      const response = data as unknown as {
        success: boolean;
        has_security_questions?: boolean;
        user_id?: string;
        masked_member_id?: string;
        questions?: RecoveryQuestions;
        error?: string;
        message?: string;
      };

      if (!response.success) {
        setState(prev => ({
          ...prev,
          step: 'error',
          error: response.error || 'Recovery failed. Please try again.',
        }));
        return;
      }

      if (!response.has_security_questions) {
        setState(prev => ({
          ...prev,
          step: 'error',
          error: response.message || 'No security questions configured. Contact support.',
        }));
        return;
      }

      setState({
        step: 'questions',
        userId: response.user_id || null,
        maskedMemberId: response.masked_member_id || null,
        questions: response.questions || null,
        error: null,
      });
    } catch (err) {
      console.error('Recovery initiation error:', err);
      toast({
        title: 'Recovery Failed',
        description: 'Unable to initiate account recovery. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer1.trim() || !answer2.trim()) {
      toast({
        title: 'Answers Required',
        description: 'Please provide answers to both security questions.',
        variant: 'destructive',
      });
      return;
    }

    if (!state.userId) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: 'Session expired. Please start over.',
      }));
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.rpc('verify_recovery_answers', {
        p_user_id: state.userId,
        p_answer_1: answer1.trim(),
        p_answer_2: answer2.trim(),
      });

      if (error) {
        throw error;
      }

      const response = data as unknown as {
        success: boolean;
        verified?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.success) {
        toast({
          title: 'Verification Failed',
          description: response.error || 'Unable to verify answers. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (response.verified) {
        setState(prev => ({ ...prev, step: 'success' }));
        
        // Trigger password reset email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
          console.error('Password reset email error:', resetError);
          toast({
            title: 'Partial Success',
            description: 'Answers verified, but password reset email failed. Please try again or contact support.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Verification Successful',
          description: 'A password reset link has been sent to your email.',
        });
      } else {
        toast({
          title: 'Incorrect Answers',
          description: response.message || 'One or more security answers are incorrect.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Answer verification error:', err);
      toast({
        title: 'Verification Error',
        description: 'Unable to verify answers. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 'email':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label 
                htmlFor="recovery-email" 
                className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500"
              >
                Registered Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <Input
                  id="recovery-email"
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
                  Verifying...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Continue
                </>
              )}
            </Button>
          </form>
        );

      case 'questions':
        return (
          <form onSubmit={handleAnswersSubmit} className="space-y-6">
            <div className="p-4 bg-[#0a0a0a] border border-[#D4AF37]/20 mb-4">
              <p className="text-sm text-[#D4AF37] flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="uppercase tracking-[0.1em] text-xs">Account: {state.maskedMemberId}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">
                  {state.questions?.question_1}
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  className="bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-medium uppercase tracking-[0.15em] text-gray-500">
                  {state.questions?.question_2}
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  className="bg-[#0a0a0a] border-[#D4AF37]/20 text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50"
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
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
                  Verifying Answers...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Answers
                </>
              )}
            </Button>
          </form>
        );

      case 'success':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 rounded-full bg-[#00FF41]/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-[#00FF41]" />
            </div>
            <div>
              <h3 
                className="text-lg font-bold uppercase tracking-[0.1em] mb-3"
                style={{ color: '#D4AF37' }}
              >
                Verification Successful
              </h3>
              <p className="text-sm text-gray-500">
                A password reset link has been sent to your email address.
                Please check your inbox and follow the instructions.
              </p>
            </div>
            <Button 
              onClick={onSuccess} 
              className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold text-xs uppercase tracking-[0.15em]" 
              size="lg"
            >
              Return to Login
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 
                className="text-lg font-bold uppercase tracking-[0.1em] mb-3"
                style={{ color: '#D4AF37' }}
              >
                Recovery Not Available
              </h3>
              <p className="text-sm text-gray-500">
                {state.error}
              </p>
            </div>
            <Button 
              onClick={onBack} 
              variant="outline" 
              className="w-full border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs uppercase tracking-[0.1em]" 
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md">
      {state.step === 'email' || state.step === 'questions' ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-gray-600 hover:text-[#D4AF37] transition-all duration-300 mb-8 uppercase tracking-[0.1em]"
        >
          <ArrowLeft className="w-3 h-3" />
          Return to Login
        </button>
      ) : null}

      <div className="border border-[#D4AF37]/10 bg-[#050505] p-8">
        <div className="mb-8">
          <div className="w-8 h-[2px] bg-[#D4AF37] mb-6" />
          <h2 
            className="text-xl font-bold uppercase tracking-[0.15em] mb-2"
            style={{ color: '#D4AF37' }}
          >
            Security Recovery
          </h2>
          <p className="text-xs text-gray-600 uppercase tracking-[0.1em]">
            {state.step === 'email' && 'Enter email to start the recovery process'}
            {state.step === 'questions' && 'Answer your security questions to verify identity'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={state.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}