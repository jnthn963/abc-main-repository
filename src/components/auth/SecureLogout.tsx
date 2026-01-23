import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecureLogoutProps {
  variant?: 'default' | 'governor';
  className?: string;
}

export function SecureLogout({ variant = 'default', className = '' }: SecureLogoutProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { signOut, user, hasRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSecureLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Log the logout event for audit trail
      if (user) {
        const isGovernor = hasRole('governor') || hasRole('admin');
        
        await supabase.from('admin_audit_log').insert({
          admin_id: user.id,
          action: isGovernor ? 'GOVERNOR_LOGOUT' : 'MEMBER_LOGOUT',
          details: { description: `User securely logged out from ${isGovernor ? 'governor' : 'member'} session` },
          ip_address: 'client',
        });
      }

      // Clear all local storage data
      const keysToRemove = [
        'abc-member-data',
        'abc-system-stats',
        'abc-p2p-loans',
        'abc-interest-history',
        'abc-last-interest-calc',
        'abc_gateway_settings',
        'abc-onboarding-complete',
      ];
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage completely
      sessionStorage.clear();
      
      // Clear any cached data
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (e) {
          // Cache clearing failed, continue with logout
          console.warn('Cache clearing failed:', e);
        }
      }

      // Sign out from Supabase (this invalidates the session token)
      await signOut();

      toast({
        title: 'Secure Logout Complete',
        description: 'Your session has been terminated and all local data cleared.',
      });

      // Navigate to home page
      navigate('/', { replace: true });
      
      // Force page reload to clear any in-memory state
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout Error',
        description: 'There was an issue logging out. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  const isGovernorVariant = variant === 'governor';

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={isGovernorVariant ? 'destructive' : 'outline'}
          className={`gap-2 ${className}`}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Securing...
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4" />
              {isGovernorVariant ? 'Secure Logout' : 'Sign Out'}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {isGovernorVariant ? (
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
            )}
            <AlertDialogTitle>
              {isGovernorVariant ? 'Secure Governor Logout' : 'Sign Out'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left">
            {isGovernorVariant ? (
              <>
                You are about to terminate your governor session. This will:
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Invalidate your authentication token</li>
                  <li>Clear all cached administrative data</li>
                  <li>Log this action for security audit</li>
                  <li>Require full re-authentication to access again</li>
                </ul>
              </>
            ) : (
              <>
                Are you sure you want to sign out? This will clear your session and any locally stored data.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSecureLogout}
            disabled={isLoggingOut}
            className={isGovernorVariant ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Terminating Session...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                {isGovernorVariant ? 'Confirm Secure Logout' : 'Sign Out'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
