import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Calendar, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSecurityHardening } from '@/hooks/useSecurityHardening';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SovereignMonolith } from '@/components/transitions/SovereignMonolith';
import { StaggeredContainer, StaggeredItem } from '@/components/transitions/StaggeredContainer';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { AccountSettings } from '@/components/profile/AccountSettings';
import { SecuritySettings } from '@/components/profile/SecuritySettings';
import Navbar from '@/components/layout/Navbar';
import DepositModal from '@/components/deposit/DepositModal';

interface ProfileData {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  member_id: string;
  membership_tier: string;
  kyc_status: string;
  created_at: string;
  avatar_url: string | null;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  useSecurityHardening();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, phone, address_line1, address_line2, city, province, postal_code, member_id, membership_tier, kyc_status, created_at, avatar_url')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfileData(data);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    if (profileData) {
      setProfileData({ ...profileData, avatar_url: url || null });
    }
  };

  if (loading) {
    return <SovereignMonolith message="LOADING PROFILE..." />;
  }

  if (!user || !profileData) {
    return <SovereignMonolith message="AUTHENTICATING..." />;
  }

  const memberSince = new Date(profileData.created_at).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'founding': return 'bg-gradient-to-r from-[#8B7500] to-[#D4AF37] text-black';
      case 'gold': return 'bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] text-black';
      case 'silver': return 'bg-gradient-to-r from-gray-400 to-gray-300 text-black';
      default: return 'bg-gradient-to-r from-amber-700 to-amber-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onDepositClick={() => setShowDepositModal(true)} />
      
      <main className="pt-20 pb-8 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>

          <StaggeredContainer className="space-y-6">
            {/* Profile Header Card */}
            <StaggeredItem>
              <Card className="glass-card p-6 border-[#D4AF37]/20 bg-gradient-to-b from-[#1a1a1a]/80 to-[#0d0d0d]/80">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Avatar Section */}
                  <AvatarUpload
                    userId={user.id}
                    currentAvatarUrl={profileData.avatar_url}
                    onAvatarUpdate={handleAvatarUpdate}
                  />

                  {/* Member Info */}
                  <div className="flex-1 text-center md:text-left">
                    <h1 
                      className="text-2xl font-bold mb-1"
                      style={{
                        background: 'linear-gradient(180deg, #F5D76E 0%, #D4AF37 60%, #8B7500 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {profileData.display_name || 'Alpha Member'}
                    </h1>
                    <p className="text-sm text-muted-foreground mb-3">
                      Member ID: {profileData.member_id}
                    </p>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-2">
                      <Badge className={`${getTierColor(profileData.membership_tier)} flex items-center gap-1`}>
                        <Crown className="w-3 h-3" />
                        {profileData.membership_tier.charAt(0).toUpperCase() + profileData.membership_tier.slice(1)}
                      </Badge>
                      
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1 ${
                          profileData.kyc_status === 'verified' 
                            ? 'border-success text-success' 
                            : 'border-yellow-500 text-yellow-500'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {profileData.kyc_status === 'verified' ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>Member since {memberSince}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </StaggeredItem>

            {/* Account Settings */}
            <StaggeredItem>
              <AccountSettings 
                profile={profileData} 
                onProfileUpdate={fetchProfile}
              />
            </StaggeredItem>

            {/* Security Settings */}
            <StaggeredItem>
              <SecuritySettings userId={user.id} />
            </StaggeredItem>
          </StaggeredContainer>
        </div>
      </main>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </div>
  );
}
