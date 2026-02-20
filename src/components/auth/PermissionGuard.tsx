import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_PERMISSIONS } from '@/types/advanced-features';

interface PermissionGuardProps {
    permission?: keyof typeof ROLE_PERMISSIONS['admin'];
    adminOnly?: boolean;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Higher-order component to protect UI elements based on user roles/permissions
 */
export function PermissionGuard({
    permission,
    adminOnly,
    children,
    fallback = null
}: PermissionGuardProps) {
    const { isAdmin, canDo, loading } = useAuth();

    if (loading) return null;

    if (adminOnly && !isAdmin) {
        return <>{fallback}</>;
    }

    if (permission && !canDo(permission)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
