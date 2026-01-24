import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'member' | 'admin' | 'governor';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  profile: {
    id: string;
    member_id: string;
    display_name: string | null;
    email: string | null;
    vault_balance: number;
    frozen_balance: number;
    lending_balance: number;
    membership_tier: 'bronze' | 'silver' | 'gold';
    kyc_status: 'pending' | 'verified' | 'rejected';
    onboarding_completed: boolean;
    created_at: string;
  } | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  const fetchProfile = async (userId: string) => {
    // Use profiles_user_view to avoid exposing security answer hashes
    // The view excludes security_answer_1 and security_answer_2 columns
    const { data, error } = await supabase
      .from('profiles_user_view')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile({
        id: data.id,
        member_id: data.member_id,
        display_name: data.display_name,
        email: data.email,
        vault_balance: data.vault_balance,
        frozen_balance: data.frozen_balance,
        lending_balance: data.lending_balance,
        membership_tier: data.membership_tier as 'bronze' | 'silver' | 'gold',
        kyc_status: data.kyc_status as 'pending' | 'verified' | 'rejected',
        onboarding_completed: data.onboarding_completed,
        created_at: data.created_at,
      });
    }
  };

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state update
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });

    if (!error && user) {
      // Update profile with display name
      await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);
    }

    return { error: error ? new Error(error.message) : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    // Clear all localStorage data on logout
    localStorage.removeItem('abc-member-data');
    localStorage.removeItem('abc-system-stats');
    localStorage.removeItem('abc-p2p-loans');
    localStorage.removeItem('abc-interest-history');
    localStorage.removeItem('abc-last-interest-calc');
    localStorage.removeItem('abc_gateway_settings');
    localStorage.removeItem('abc-onboarding-complete');
    sessionStorage.clear();
    
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        profile,
        signUp,
        signIn,
        signOut,
        hasRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
