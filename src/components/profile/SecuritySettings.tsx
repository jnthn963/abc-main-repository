import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Lock, Eye, EyeOff, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your elementary school?",
  "What is your favorite movie?",
  "What was your childhood nickname?",
  "What is the name of the street you grew up on?",
  "What was your first car?",
];

interface SecuritySettingsProps {
  userId: string;
}

export function SecuritySettings({ userId }: SecuritySettingsProps) {
  const [currentQuestions, setCurrentQuestions] = useState<{ question_1: string; question_2: string } | null>(null);
  const [formData, setFormData] = useState({
    question1: '',
    answer1: '',
    question2: '',
    answer2: '',
    confirmAnswer1: '',
    confirmAnswer2: '',
  });
  const [showAnswers, setShowAnswers] = useState({
    answer1: false,
    answer2: false,
    confirmAnswer1: false,
    confirmAnswer2: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityQuestions();
  }, [userId]);

  const fetchSecurityQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_security_questions', {
        p_user_id: userId
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentQuestions(data[0]);
        setFormData(prev => ({
          ...prev,
          question1: data[0].question_1 || '',
          question2: data[0].question_2 || '',
        }));
      }
    } catch (error) {
      console.error('Fetch security questions error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleShowAnswer = (field: keyof typeof showAnswers) => {
    setShowAnswers(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = () => {
    if (!formData.question1 || !formData.answer1 || !formData.question2 || !formData.answer2) {
      toast({
        title: "Missing information",
        description: "Please fill in all security questions and answers",
        variant: "destructive",
      });
      return false;
    }

    if (formData.question1 === formData.question2) {
      toast({
        title: "Duplicate questions",
        description: "Please select two different security questions",
        variant: "destructive",
      });
      return false;
    }

    if (formData.answer1 !== formData.confirmAnswer1 || formData.answer2 !== formData.confirmAnswer2) {
      toast({
        title: "Answers don't match",
        description: "Please make sure your answers match the confirmation fields",
        variant: "destructive",
      });
      return false;
    }

    if (formData.answer1.length < 3 || formData.answer2.length < 3) {
      toast({
        title: "Answers too short",
        description: "Security answers must be at least 3 characters long",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const { data, error } = await supabase.rpc('set_security_credentials', {
        p_user_id: userId,
        p_question_1: formData.question1,
        p_answer_1: formData.answer1.toLowerCase().trim(),
        p_question_2: formData.question2,
        p_answer_2: formData.answer2.toLowerCase().trim(),
      });

      if (error) throw error;

      setCurrentQuestions({
        question_1: formData.question1,
        question_2: formData.question2,
      });
      setFormData(prev => ({
        ...prev,
        answer1: '',
        answer2: '',
        confirmAnswer1: '',
        confirmAnswer2: '',
      }));
      setIsEditing(false);

      toast({
        title: "Security questions updated",
        description: "Your security questions have been saved successfully",
      });
    } catch (error) {
      console.error('Save security questions error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save security questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card p-6 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Security Questions</h3>
            <p className="text-xs text-muted-foreground">Used for account recovery</p>
          </div>
        </div>
        
        {currentQuestions && !isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <Key className="w-4 h-4 mr-2" />
            Update
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {currentQuestions && !isEditing ? (
          <motion.div
            key="display"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 p-4 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm text-success">Security questions are configured</span>
            </div>
            
            <div className="space-y-3 p-4 rounded-lg bg-[#1a1a2e]/50">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Question 1:</p>
                  <p className="text-sm text-muted-foreground">{currentQuestions.question_1}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Question 2:</p>
                  <p className="text-sm text-muted-foreground">{currentQuestions.question_2}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {!currentQuestions && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-yellow-500">Please set up security questions for account recovery</span>
              </div>
            )}

            {/* Question 1 */}
            <div className="space-y-4 p-4 rounded-lg bg-[#1a1a2e]/30 border border-[#D4AF37]/10">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">1</span>
                <span className="text-sm font-medium text-foreground">Security Question 1</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Question</Label>
                <Select
                  value={formData.question1}
                  onValueChange={(value) => handleChange('question1', value)}
                >
                  <SelectTrigger className="bg-[#1a1a2e]/50 border-[#D4AF37]/20">
                    <SelectValue placeholder="Choose a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_QUESTIONS.filter(q => q !== formData.question2).map((question) => (
                      <SelectItem key={question} value={question}>
                        {question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Answer</Label>
                  <div className="relative">
                    <Input
                      type={showAnswers.answer1 ? 'text' : 'password'}
                      value={formData.answer1}
                      onChange={(e) => handleChange('answer1', e.target.value)}
                      placeholder="Your answer"
                      className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowAnswer('answer1')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAnswers.answer1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Confirm Answer</Label>
                  <div className="relative">
                    <Input
                      type={showAnswers.confirmAnswer1 ? 'text' : 'password'}
                      value={formData.confirmAnswer1}
                      onChange={(e) => handleChange('confirmAnswer1', e.target.value)}
                      placeholder="Confirm your answer"
                      className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowAnswer('confirmAnswer1')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAnswers.confirmAnswer1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Question 2 */}
            <div className="space-y-4 p-4 rounded-lg bg-[#1a1a2e]/30 border border-[#D4AF37]/10">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-xs font-bold text-[#D4AF37]">2</span>
                <span className="text-sm font-medium text-foreground">Security Question 2</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Select Question</Label>
                <Select
                  value={formData.question2}
                  onValueChange={(value) => handleChange('question2', value)}
                >
                  <SelectTrigger className="bg-[#1a1a2e]/50 border-[#D4AF37]/20">
                    <SelectValue placeholder="Choose a security question" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECURITY_QUESTIONS.filter(q => q !== formData.question1).map((question) => (
                      <SelectItem key={question} value={question}>
                        {question}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Answer</Label>
                  <div className="relative">
                    <Input
                      type={showAnswers.answer2 ? 'text' : 'password'}
                      value={formData.answer2}
                      onChange={(e) => handleChange('answer2', e.target.value)}
                      placeholder="Your answer"
                      className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowAnswer('answer2')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAnswers.answer2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Confirm Answer</Label>
                  <div className="relative">
                    <Input
                      type={showAnswers.confirmAnswer2 ? 'text' : 'password'}
                      value={formData.confirmAnswer2}
                      onChange={(e) => handleChange('confirmAnswer2', e.target.value)}
                      placeholder="Confirm your answer"
                      className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowAnswer('confirmAnswer2')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAnswers.confirmAnswer2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {isEditing && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(prev => ({
                      ...prev,
                      answer1: '',
                      answer2: '',
                      confirmAnswer1: '',
                      confirmAnswer2: '',
                    }));
                  }}
                  className="flex-1 border-muted-foreground/30"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-[#8B7500] via-[#D4AF37] to-[#F5D76E] text-black font-semibold hover:opacity-90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Security Questions
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default SecuritySettings;
