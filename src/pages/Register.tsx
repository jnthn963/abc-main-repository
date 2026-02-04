import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  Key,
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowLeft,
  ArrowRight,
  Check,
  Award
} from 'lucide-react';
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
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Step 2: Contact Information
const contactSchema = z.object({
  phone: z.string().min(10, 'Please enter a valid phone number'),
  referralCode: z.string().optional(),
});

// Step 3: Address Information
const addressSchema = z.object({
  addressLine1: z.string().min(5, 'Please enter your street address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Please enter your city'),
  province: z.string().min(2, 'Please select your province'),
  postalCode: z.string().min(4, 'Please enter your postal code'),
});

// Step 4: Security Questions
const securitySchema = z.object({
  securityQuestion1: z.string().min(1, 'Please select a security question'),
  securityAnswer1: z.string().min(2, 'Please provide an answer'),
  securityQuestion2: z.string().min(1, 'Please select a security question'),
  securityAnswer2: z.string().min(2, 'Please provide an answer'),
});

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was the name of your elementary school?",
  "What is your favorite movie?",
  "What was the make of your first car?",
];

const PROVINCES = [
  "Metro Manila", "Cebu", "Davao", "Pampanga", "Bulacan",
  "Cavite", "Laguna", "Rizal", "Batangas", "Quezon",
  "Iloilo", "Negros Occidental", "Pangasinan", "Zambales", "Other"
];

const STEPS = [
  { title: 'Account', icon: User },
  { title: 'Contact', icon: Phone },
  { title: 'Address', icon: MapPin },
  { title: 'Security', icon: Key },
];

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
    securityAnswer2: '',
  });

  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
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
            displayName: formData.displayName,
          });
          break;
        case 1:
          contactSchema.parse({
            phone: formData.phone,
            referralCode: formData.referralCode,
          });
          break;
        case 2:
          addressSchema.parse({
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            city: formData.city,
            province: formData.province,
            postalCode: formData.postalCode,
          });
          break;
        case 3:
          securitySchema.parse({
            securityQuestion1: formData.securityQuestion1,
            securityAnswer1: formData.securityAnswer1,
            securityQuestion2: formData.securityQuestion2,
            securityAnswer2: formData.securityAnswer2,
          });
          break;
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
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
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.displayName
      );

      if (signUpError) {
        toast({
          title: 'Registration Failed',
          description: signUpError.message,
          variant: 'destructive',
        });
        return;
      }

      // 2. Wait for session and update profile
      // The profile is auto-created by the trigger, we need to update it
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Look up referrer by referral code if provided
        let referrerId = null;
        if (formData.referralCode) {
          const { data: referrer } = await supabase
            .from('profiles')
            .select('id')
            .eq('referral_code', formData.referralCode.toUpperCase())
            .single();
          
          if (referrer) {
            referrerId = referrer.id;
          }
        }

        // Update profile with non-sensitive info
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: formData.displayName,
            phone: formData.phone,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2 || null,
            city: formData.city,
            province: formData.province,
            postal_code: formData.postalCode,
            referrer_id: referrerId,
            membership_tier: 'founding', // Founding Alpha status!
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
        }

        // Store security credentials via secure server-side RPC
        // This hashes answers server-side, never exposing the algorithm to client
        const { error: credError } = await supabase.rpc('set_security_credentials', {
          p_user_id: user.id,
          p_question_1: formData.securityQuestion1,
          p_answer_1: formData.securityAnswer1.toLowerCase().trim(),
          p_question_2: formData.securityQuestion2,
          p_answer_2: formData.securityAnswer2.toLowerCase().trim()
        });

        if (credError) {
          console.error('Security credentials error:', credError);
          // Don't block registration for credential storage failure
          // User can reset them later via account recovery
        }
      }

      toast({
        title: 'Welcome to Alpha Bankers!',
        description: 'Your Founding Alpha membership has been activated.',
      });
      
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Registration error:', err);
      toast({
        title: 'System Error',
        description: 'Unable to complete registration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="displayName"
                  placeholder="Juan Dela Cruz"
                  value={formData.displayName}
                  onChange={(e) => updateFormData('displayName', e.target.value)}
                  className={`pl-10 ${errors.displayName ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.displayName && <p className="text-xs text-destructive">{errors.displayName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="juan@email.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              <p className="text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="referralCode"
                  placeholder="ALPHA-XXXXXX"
                  value={formData.referralCode}
                  onChange={(e) => updateFormData('referralCode', e.target.value.toUpperCase())}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter a referral code to link to your sponsor
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Street Address</Label>
              <Input
                id="addressLine1"
                placeholder="123 Main Street"
                value={formData.addressLine1}
                onChange={(e) => updateFormData('addressLine1', e.target.value)}
                className={errors.addressLine1 ? 'border-destructive' : ''}
              />
              {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Apartment, Suite, etc. (Optional)</Label>
              <Input
                id="addressLine2"
                placeholder="Unit 4B"
                value={formData.addressLine2}
                onChange={(e) => updateFormData('addressLine2', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Makati"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  className={errors.city ? 'border-destructive' : ''}
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="1200"
                  value={formData.postalCode}
                  onChange={(e) => updateFormData('postalCode', e.target.value)}
                  className={errors.postalCode ? 'border-destructive' : ''}
                />
                {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Province/Region</Label>
              <Select
                value={formData.province}
                onValueChange={(value) => updateFormData('province', value)}
              >
                <SelectTrigger className={errors.province ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && <p className="text-xs text-destructive">{errors.province}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mb-4">
              <p className="text-sm text-primary flex items-center gap-2">
                <Key className="w-4 h-4" />
                Security questions help verify your identity for account recovery.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Security Question 1</Label>
              <Select
                value={formData.securityQuestion1}
                onValueChange={(value) => updateFormData('securityQuestion1', value)}
              >
                <SelectTrigger className={errors.securityQuestion1 ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.filter(q => q !== formData.securityQuestion2).map((question) => (
                    <SelectItem key={question} value={question}>
                      {question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.securityQuestion1 && <p className="text-xs text-destructive">{errors.securityQuestion1}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer1">Answer 1</Label>
              <Input
                id="securityAnswer1"
                placeholder="Your answer"
                value={formData.securityAnswer1}
                onChange={(e) => updateFormData('securityAnswer1', e.target.value)}
                className={errors.securityAnswer1 ? 'border-destructive' : ''}
              />
              {errors.securityAnswer1 && <p className="text-xs text-destructive">{errors.securityAnswer1}</p>}
            </div>

            <div className="space-y-2">
              <Label>Security Question 2</Label>
              <Select
                value={formData.securityQuestion2}
                onValueChange={(value) => updateFormData('securityQuestion2', value)}
              >
                <SelectTrigger className={errors.securityQuestion2 ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select a question" />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.filter(q => q !== formData.securityQuestion1).map((question) => (
                    <SelectItem key={question} value={question}>
                      {question}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.securityQuestion2 && <p className="text-xs text-destructive">{errors.securityQuestion2}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="securityAnswer2">Answer 2</Label>
              <Input
                id="securityAnswer2"
                placeholder="Your answer"
                value={formData.securityAnswer2}
                onChange={(e) => updateFormData('securityAnswer2', e.target.value)}
                className={errors.securityAnswer2 ? 'border-destructive' : ''}
              />
              {errors.securityAnswer2 && <p className="text-xs text-destructive">{errors.securityAnswer2}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <img src={abcLogo} alt="Alpha Bankers Cooperative" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
          <span className="text-xl font-bold gradient-gold">ALPHA BANKERS</span>
        </div>

        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-border">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
              />
            </div>
            
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.title} className="relative flex flex-col items-center z-10">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-primary text-primary-foreground' 
                        : isCurrent 
                          ? 'bg-primary/20 border-2 border-primary text-primary'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {currentStep === 0 && 'Create Your Alpha Account'}
              {currentStep === 1 && 'Contact Information'}
              {currentStep === 2 && 'Address Details'}
              {currentStep === 3 && 'Security Questions'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStep === 0 && 'Start your journey to financial sovereignty'}
              {currentStep === 1 && 'How can we reach you?'}
              {currentStep === 2 && 'Where should we send important documents?'}
              {currentStep === 3 && 'Protect your account with security verification'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="glow-gold">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="glow-gold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    Become Founding Alpha
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already an Alpha member?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Founding Alpha Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Founding Alpha Status Included</span>
          </div>
        </div>
      </div>
    </div>
  );
}
