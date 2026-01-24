import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';
import { SovereignMonolith } from '@/components/transitions/SovereignMonolith';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'member' | 'admin' | 'governor';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SovereignMonolith message="AUTHENTICATING SECURE SESSION..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center space-y-4 max-w-md">
          <Shield className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground">
            You do not have the required permissions to access this area.
            This incident has been logged.
          </p>
          <p className="text-xs text-muted-foreground terminal-text">
            REQUIRED: {requiredRole?.toUpperCase()} | YOUR ROLES: {hasRole('member') ? 'MEMBER' : 'NONE'}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
