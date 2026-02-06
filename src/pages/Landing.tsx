import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingSecuritySection from '@/components/landing/LandingSecuritySection';
import LandingProtocols from '@/components/landing/LandingProtocols';
import LandingVaultPreview from '@/components/landing/LandingVaultPreview';
import LandingManifesto from '@/components/landing/LandingManifesto';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-[#050505] overflow-hidden">
      {/* Pure Midnight Obsidian Background */}
      <div className="fixed inset-0 bg-[#050505]" />

      {/* Navigation */}
      <LandingNav />

      {/* Hero Section */}
      <LandingHero />

      {/* Security & Compliance Section */}
      <LandingSecuritySection />

      {/* System Protocols Section */}
      <LandingProtocols />

      {/* Vault Holdings Preview Section */}
      <LandingVaultPreview />

      {/* Manifesto Section */}
      <LandingManifesto />

      {/* Professional Multi-Column Footer */}
      <LandingFooter />
    </div>
  );
}
