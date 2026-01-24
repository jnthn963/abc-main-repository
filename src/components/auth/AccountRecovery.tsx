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
              <Label htmlFor="recovery-email" className="text-sm font-medium">
                Registered Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="recovery-email"
                  type="email"
                  placeholder="alpha@member.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
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
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mb-4">
              <p className="text-sm text-primary flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account: {state.maskedMemberId}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {state.questions?.question_1}
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={answer1}
                  onChange={(e) => setAnswer1(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {state.questions?.question_2}
                </Label>
                <Input
                  type="text"
                  placeholder="Your answer"
                  value={answer2}
                  onChange={(e) => setAnswer2(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
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
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Verification Successful
              </h3>
              <p className="text-sm text-muted-foreground">
                A password reset link has been sent to your email address.
                Please check your inbox and follow the instructions.
              </p>
            </div>
            <Button onClick={onSuccess} className="w-full" size="lg">
              Return to Login
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Recovery Not Available
              </h3>
              <p className="text-sm text-muted-foreground">
                {state.error}
              </p>
            </div>
            <Button onClick={onBack} variant="outline" className="w-full" size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {state.step === 'email' || state.step === 'questions' ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      ) : null}

      <div className="glass-card p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 glow-gold">
            <Key className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Account Recovery</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {state.step === 'email' && 'Enter your email to start the recovery process'}
            {state.step === 'questions' && 'Answer your security questions to verify your identity'}
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