import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'member' | 'admin' | 'governor';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <Shield className="w-16 h-16 text-primary mx-auto animate-pulse" />
            <Loader2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
          </div>
          <p className="text-muted-foreground terminal-text">
            AUTHENTICATING SECURE SESSION...
          </p>
        </div>
      </div>
    );
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
