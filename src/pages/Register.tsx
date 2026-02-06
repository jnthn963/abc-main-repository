import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Phone, MapPin, Key, Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Check, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import abcLogo from '@/assets/abc-logo.png';

// Step 1: Account Information
const accountSchema = z.object({
  email: z.string().email('Please enter a valid ledger address'),
  password: z.string().min(8, 'Vault key must be at least 8 characters').regex(/[A-Z]/, 'Vault key must contain at least one uppercase letter').regex(/[a-z]/, 'Vault key must contain at least one lowercase letter').regex(/[0-9]/, 'Vault key must contain at least one number'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Identity must be at least 2 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: "Vault keys don't match",
  path: ["confirmPassword"]
});

// Step 2: Contact Information
const contactSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid contact number'),
  referralCode: z.string().optional()
});

// Step 3: Address Information
const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Please enter your address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Please enter your city'),
  province: z.string().min(2, 'Please select your province'),
  postalCode: z.string().min(4, 'Please enter your postal code')
});

// Step 4: Security Questions
const securitySchema = z.object({
  securityQuestion1: z.string().min(1, 'Please select a verification protocol'),
  securityAnswer1: z.string().min(2, 'Please provide an answer'),
  securityQuestion2: z.string().min(1, 'Please select a verification protocol'),
  securityAnswer2: z.string().min(2, 'Please provide an answer')
});
const SECURITY_QUESTIONS = ["What was the name of your first pet?", "What is your mother's maiden name?", "What city were you born in?", "What was the name of your elementary school?", "What is your favorite movie?", "What was the make of your first car?"];
const PROVINCES = ["Metro Manila", "Cebu", "Davao", "Pampanga", "Bulacan", "Cavite", "Laguna", "Rizal", "Batangas", "Quezon", "Iloilo", "Negros Occidental", "Pangasinan", "Zambales", "Other"];
const STEPS = [{
  title: 'Credentials',
  icon: User
}, {
  title: 'Contact',
  icon: Phone
}, {
  title: 'Location',
  icon: MapPin
}, {
  title: 'Protocols',
  icon: Key
}];
export default function Register() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    // Step 1
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    // Step 2
    phone: '',
    referralCode: '',
    // Step 3
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    // Step 4
    securityQuestion1: '',
    securityAnswer1: '',
    securityQuestion2: '',
    securityAnswer2: ''
  });
  const {
    signUp
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = {
          ...prev
        };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  const validateStep = (step: number): boolean => {
    setErrors({});
    try {
      switch (step) {
        case 0:
          accountSchema.parse({
            email: formData.email,
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            displayName: formData.displayName
          });
          break;
        case 1:
          contactSchema.parse({
            phone: formData.phone,
            referralCode: formData.referralCode
          });
          break;
        case 2:
          addressSchema.parse({
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode
          });
          break;
        case 3:
          securitySchema.parse({
            securityQuestion1: formData.securityQuestion1,
            securityAnswer1: formData.securityAnswer1,
            securityQuestion2: formData.securityQuestion2,
            securityAnswer2: formData.securityAnswer2
          });
          break;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };
  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsLoading(true);
    try {
      // 1. Create auth user
      const {
        error: signUpError
      } = await signUp(formData.email, formData.password, formData.displayName);
      if (signUpError) {
        toast({
          title: 'Initialization Failed',
          description: signUpError.message,
          variant: 'destructive'
        });
        return;
      }

      // 2. Wait for session and update profile
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (user) {
        // Look up referrer by referral code if provided
        let referrerId = null;
        if (formData.referralCode) {
          const {
            data: referrer
          } = await supabase.from('profiles').select('id').eq('referral_code', formData.referralCode.toUpperCase()).single();
          if (referrer) {
            referrerId = referrer.id;
          }
        }

        // Update profile with non-sensitive info
        const {
          error: updateError
        } = await supabase.from('profiles').update({
          display_name: formData.displayName,
          phone: formData.phone,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          referrer_id: referrerId,
          membership_tier: 'founding'
        }).eq('id', user.id);
        if (updateError) {
          console.error('Profile update error:', updateError);
        }

        // Store security credentials via secure server-side RPC
        const {
          error: credError
        } = await supabase.rpc('set_security_credentials', {
          p_user_id: user.id,
          p_question_1: formData.securityQuestion1,
          p_answer_1: formData.securityAnswer1.toLowerCase().trim(),
          p_question_2: formData.securityQuestion2,
          p_answer_2: formData.securityAnswer2.toLowerCase().trim()
        });
        if (credError) {
          console.error('Security credentials error:', credError);
        }
      }
      toast({
        title: 'Ledger Initialized',
        description: 'Your Founding Alpha sovereignty has been activated.'
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Initialization error:', err);
      toast({
        title: 'System Error',
        description: 'Unable to complete initialization. Please retry.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Sovereign Identity
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                <Input id="displayName" placeholder="Juan Dela Cruz" value={formData.displayName} onChange={e => updateFormData('displayName', e.target.value)} className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.displayName ? 'border-destructive' : ''}`} />
              </div>
              {errors.displayName && <p className="text-xs text-destructive">{errors.displayName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Ledger Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                <Input id="email" type="email" placeholder="juan@email.com" value={formData.email} onChange={e => updateFormData('email', e.target.value)} className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.email ? 'border-destructive' : ''}`} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Vault Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••••••" value={formData.password} onChange={e => updateFormData('password', e.target.value)} className={`pl-10 pr-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.password ? 'border-destructive' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4AF37]/40 hover:text-[#D4AF37]">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              <p className="text-[10px] text-gray-600">
                8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Confirm Vault Key
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                <Input id="confirmPassword" type="password" placeholder="••••••••••••" value={formData.confirmPassword} onChange={e => updateFormData('confirmPassword', e.target.value)} className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.confirmPassword ? 'border-destructive' : ''}`} />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>;
      case 1:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Contact Protocol
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                <Input id="phone" type="tel" placeholder="09XX XXX XXXX" value={formData.phone} onChange={e => updateFormData('phone', e.target.value)} className={`pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.phone ? 'border-destructive' : ''}`} />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Sponsor Code (Optional)
              </Label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#D4AF37]/40" />
                <Input id="referralCode" placeholder="ALPHA-XXXXXX" value={formData.referralCode} onChange={e => updateFormData('referralCode', e.target.value.toUpperCase())} className="pl-10 bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50" />
              </div>
              <p className="text-[10px] text-gray-600">
                Enter a sponsor code to link to your referrer
              </p>
            </div>
          </div>;
      case 2:
        return <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Primary Address
              </Label>
              <Input id="addressLine1" placeholder="123 Main Street" value={formData.addressLine1} onChange={e => updateFormData('addressLine1', e.target.value)} className={`bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.addressLine1 ? 'border-destructive' : ''}`} />
              {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">
                Unit/Suite (Optional)
              </Label>
              <Input id="addressLine2" placeholder="Unit 4B" value={formData.addressLine2} onChange={e => updateFormData('addressLine2', e.target.value)} className="bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">City</Label>
                <Input id="city" placeholder="Makati" value={formData.city} onChange={e => updateFormData('city', e.target.value)} className={`bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.city ? 'border-destructive' : ''}`} />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">Postal Code</Label>
                <Input id="postalCode" placeholder="1200" value={formData.postalCode} onChange={e => updateFormData('postalCode', e.target.value)} className={`bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.postalCode ? 'border-destructive' : ''}`} />
                {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">Province/Region</Label>
              <Select value={formData.province} onValueChange={value => updateFormData('province', value)}>
                <SelectTrigger className={`bg-[#0a0a0a] border-[#D4AF37]/20 ${errors.province ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#D4AF37]/20">
                  {PROVINCES.map(province => <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
            </div>
          </div>;
      case 3:
        return <div className="space-y-4">
            <div className="p-4 border border-[#D4AF37]/20 bg-[#D4AF37]/5 mb-4">
              <p className="text-sm text-[#D4AF37] flex items-center gap-2">
                <Key className="w-4 h-4" />
                Recovery protocols verify your identity for account access restoration.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">Recovery Protocol 1</Label>
              <Select value={formData.securityQuestion1} onValueChange={value => updateFormData('securityQuestion1', value)}>
                <SelectTrigger className={`bg-[#0a0a0a] border-[#D4AF37]/20 ${errors.securityQuestion1 ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#D4AF37]/20">
                  {SECURITY_QUESTIONS.filter(q => q !== formData.securityQuestion2).map(question => <SelectItem key={question} value={question}>
                      {question}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {errors.securityQuestion1 && <p className="text-xs text-destructive">{errors.securityQuestion1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer1" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">Answer 1</Label>
              <Input id="securityAnswer1" placeholder="Your answer" value={formData.securityAnswer1} onChange={e => updateFormData('securityAnswer1', e.target.value)} className={`bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.securityAnswer1 ? 'border-destructive' : ''}`} />
              {errors.securityAnswer1 && <p className="text-xs text-destructive">{errors.securityAnswer1}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">Recovery Protocol 2</Label>
              <Select value={formData.securityQuestion2} onValueChange={value => updateFormData('securityQuestion2', value)}>
                <SelectTrigger className={`bg-[#0a0a0a] border-[#D4AF37]/20 ${errors.securityQuestion2 ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-[#D4AF37]/20">
                  {SECURITY_QUESTIONS.filter(q => q !== formData.securityQuestion1).map(question => <SelectItem key={question} value={question}>
                      {question}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              {errors.securityQuestion2 && <p className="text-xs text-destructive">{errors.securityQuestion2}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer2" className="text-[#D4AF37]/80 text-xs uppercase tracking-[0.1em]">Answer 2</Label>
              <Input id="securityAnswer2" placeholder="Your answer" value={formData.securityAnswer2} onChange={e => updateFormData('securityAnswer2', e.target.value)} className={`bg-[#0a0a0a] border-[#D4AF37]/20 focus:border-[#D4AF37]/50 ${errors.securityAnswer2 ? 'border-destructive' : ''}`} />
              {errors.securityAnswer2 && <p className="text-xs text-destructive">{errors.securityAnswer2}</p>}
            </div>
          </div>;
      default:
        return null;
    }
  };
  return <div className="min-h-screen bg-[#050505] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <motion.img alt="Alpha Bankers Cooperative" className="w-12 h-12 rounded-full drop-shadow-[0_0_12px_rgba(212,175,55,0.4)] object-fill shadow-xl" animate={{
          y: [0, -4, 0]
        }} transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }} src="/lovable-uploads/4f616d45-0e4e-498f-9279-2d013e38aef2.png" />
          <div>
            <span className="font-bold text-4xl text-amber-400" style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            color: '#D4AF37'
          }}>
              ₳฿C
            </span>
            <p className="text-[10px] text-[#00FF41] uppercase tracking-[0.2em]">
              Initialize Ledger
            </p>
          </div>
        </div>

        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#D4AF37] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-[1px] bg-[#D4AF37]/20">
              <div className="h-full bg-[#D4AF37] transition-all duration-500" style={{
              width: `${currentStep / (STEPS.length - 1) * 100}%`
            }} />
            </div>
            
            {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return <div key={step.title} className="relative flex flex-col items-center z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted ? 'bg-[#D4AF37] text-[#050505]' : isCurrent ? 'bg-[#D4AF37]/20 border-2 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#1a1a1a] border border-[#D4AF37]/20 text-gray-600'}`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-[10px] mt-2 uppercase tracking-[0.1em] ${isCurrent ? 'text-[#D4AF37]' : 'text-gray-600'}`}>
                    {step.title}
                  </span>
                </div>;
          })}
          </div>
        </div>

        {/* Form Card */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        duration: 0.3
      }} className="p-8 border border-[#D4AF37]/20 bg-[#050505]/80 backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold uppercase tracking-[0.1em]" style={{
            color: '#D4AF37'
          }}>
              {currentStep === 0 && 'Sovereign Credentials'}
              {currentStep === 1 && 'Contact Protocol'}
              {currentStep === 2 && 'Location Registry'}
              {currentStep === 3 && 'Recovery Protocols'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {currentStep === 0 && 'Establish your sovereign identity'}
              {currentStep === 1 && 'Configure contact channels'}
              {currentStep === 2 && 'Register your physical location'}
              {currentStep === 3 && 'Secure your ledger access'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{
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
          }}>
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-[#D4AF37]/10">
            <Button type="button" variant="outline" onClick={handleBack} disabled={currentStep === 0 || isLoading} className="border-[#D4AF37]/20 text-gray-400 hover:border-[#D4AF37]/50 hover:text-[#D4AF37]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? <Button onClick={handleNext} className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#050505] font-bold uppercase tracking-[0.1em]">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button> : <Button onClick={handleSubmit} className="bg-[#00FF41] hover:bg-[#00FF41]/90 text-[#050505] font-bold uppercase tracking-[0.1em]" disabled={isLoading}>
                {isLoading ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                  </> : <>
                    <Award className="w-4 h-4 mr-2" />
                    Initialize Ledger
                  </>}
              </Button>}
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already a sovereign member?{' '}
              <Link to="/login" className="text-[#D4AF37] hover:underline font-medium">
                Access Ledger
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Founding Alpha Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5">
            <Award className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm text-[#D4AF37] uppercase tracking-[0.1em]">Founding Alpha Sovereignty Included</span>
          </div>
        </div>
      </div>
    </div>;
}