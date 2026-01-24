import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PROVINCES = [
  'Metro Manila', 'Cebu', 'Davao del Sur', 'Bulacan', 'Cavite', 
  'Laguna', 'Pampanga', 'Rizal', 'Batangas', 'Pangasinan'
];

interface AccountSettingsProps {
  profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    province: string | null;
    postal_code: string | null;
  };
  onProfileUpdate: () => void;
}

export function AccountSettings({ profile, onProfileUpdate }: AccountSettingsProps) {
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    phone: profile.phone || '',
    address_line1: profile.address_line1 || '',
    address_line2: profile.address_line2 || '',
    city: profile.city || '',
    province: profile.province || '',
    postal_code: profile.postal_code || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const changed = Object.keys(formData).some(key => {
      const formValue = formData[key as keyof typeof formData];
      const profileValue = profile[key as keyof typeof profile] || '';
      return formValue !== profileValue;
    });
    setHasChanges(changed);
  }, [formData, profile]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name || null,
          phone: formData.phone || null,
          address_line1: formData.address_line1 || null,
          address_line2: formData.address_line2 || null,
          city: formData.city || null,
          province: formData.province || null,
          postal_code: formData.postal_code || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      onProfileUpdate();
      toast({
        title: "Settings saved",
        description: "Your account settings have been updated successfully",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="glass-card p-6 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center">
          <User className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Account Settings</h3>
          <p className="text-xs text-muted-foreground">Manage your personal information</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Info Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="w-3 h-3" />
                Display Name
              </Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleChange('display_name', e.target.value)}
                placeholder="Your display name"
                className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-3 h-3" />
                Email (Read Only)
              </Label>
              <Input
                id="email"
                value={profile.email || ''}
                disabled
                className="bg-[#1a1a2e]/30 border-[#D4AF37]/10 text-muted-foreground cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm text-muted-foreground flex items-center gap-2">
              <Phone className="w-3 h-3" />
              Phone Number
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+63 9XX XXX XXXX"
              className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 focus:border-[#D4AF37]/50"
            />
          </div>
        </div>

        {/* Address Section */}
        <div className="pt-4 border-t border-[#D4AF37]/10">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-medium text-foreground">Address Information</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1" className="text-sm text-muted-foreground">
                Street Address
              </Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                placeholder="House/Unit No., Street Name"
                className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2" className="text-sm text-muted-foreground">
                Barangay / Subdivision
              </Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => handleChange('address_line2', e.target.value)}
                placeholder="Barangay, Subdivision, or Village"
                className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm text-muted-foreground">
                  City / Municipality
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="City"
                  className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm text-muted-foreground">
                  Province
                </Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) => handleChange('province', value)}
                >
                  <SelectTrigger className="bg-[#1a1a2e]/50 border-[#D4AF37]/20">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code" className="text-sm text-muted-foreground">
                  Postal Code
                </Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="0000"
                  maxLength={4}
                  className="bg-[#1a1a2e]/50 border-[#D4AF37]/20 focus:border-[#D4AF37]/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <motion.div
          className="pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: hasChanges ? 1 : 0.5 }}
        >
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="w-full bg-gradient-to-r from-[#8B7500] via-[#D4AF37] to-[#F5D76E] text-black font-semibold hover:opacity-90"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </Card>
  );
}

export default AccountSettings;
