import { useAuth } from './useAuth';
import { ROLE_PERMISSIONS } from '@/types/advanced-features';

export function usePermissions() {
    const { role } = useAuth();

    /**
     * Check if the user has a specific permission
     */
    const can = (permission: keyof typeof ROLE_PERMISSIONS['admin']): boolean => {
        if (!role || !ROLE_PERMISSIONS[role]) return false;
        return ROLE_PERMISSIONS[role][permission] || false;
    };

    return {
        can,
        role,
        isCoordinator: role === 'coordinator',
        isRecruiter: role === 'recruiter',
        isAdmin: role === 'admin',

        // Convenience flags
        canPostJobs: can('canPostJobs'),
        canEditJobs: can('canEditJobs'),
        canDeleteJobs: can('canDeleteJobs'),
        canManageCandidates: can('canManageCandidates'),
        canManageInterviews: can('canManageInterviews'),
        canManageTeam: can('canManageTeam'),
        canEditCompany: can('canEditCompany'),
        viewFullDashboard: can('viewFullDashboard'),
    };
}
