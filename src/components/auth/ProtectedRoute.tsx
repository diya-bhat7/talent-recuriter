import { useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { useToast } from '@/hooks/use-toast';

/**
 * ProtectedRoute - Wraps authenticated routes.
 * Redirects to /login if the user is not authenticated.
 * Shows a loading spinner while auth state is being resolved.
 * Auto-signs out after 30 minutes of inactivity.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const { toast } = useToast();

    const handleTimeout = useCallback(() => {
        toast({
            title: 'Session expired',
            description: 'You have been signed out due to inactivity.',
            variant: 'destructive',
        });
    }, [toast]);

    // Activate session timeout — signs out after 30 min inactivity
    useSessionTimeout(user, handleTimeout);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
