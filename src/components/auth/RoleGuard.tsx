import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
import { ROLE_PERMISSIONS } from '@/types/advanced-features';

type Permission = keyof typeof ROLE_PERMISSIONS['admin'];
type Role = 'admin' | 'recruiter' | 'coordinator';

interface RoleGuardProps {
    children: React.ReactNode;
    /** Require a specific permission flag from ROLE_PERMISSIONS */
    requiredPermission?: Permission;
    /** Require one of these roles */
    requiredRoles?: Role[];
    /** Where to redirect on denial (default: /dashboard) */
    redirectTo?: string;
}

/**
 * RoleGuard — wraps a route element and redirects users who lack
 * the required permission or role. Shows a toast on denial.
 */
export function RoleGuard({
    children,
    requiredPermission,
    requiredRoles,
    redirectTo = '/dashboard',
}: RoleGuardProps) {
    const { can, role } = usePermissions();
    const { toast } = useToast();
    const toastShown = useRef(false);

    const hasAccess = (() => {
        if (requiredPermission && !can(requiredPermission)) return false;
        if (requiredRoles && (!role || !requiredRoles.includes(role as Role))) return false;
        return true;
    })();

    useEffect(() => {
        if (!hasAccess && !toastShown.current) {
            toastShown.current = true;
            toast({
                title: 'Access denied',
                description: 'You don\u2019t have permission to view that page.',
                variant: 'destructive',
            });
        }
    }, [hasAccess, toast]);

    if (!hasAccess) {
        return <Navigate to={redirectTo} replace />;
    }

    return <>{children}</>;
}
