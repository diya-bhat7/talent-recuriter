/**
 * useActivityLog Hook
 * React Query hooks for activity log
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { activityLogService } from '@/services/activityLog';
import type { ActivityLogEntry, EntityType } from '@/types/advanced-features';

// Query keys
export const activityLogKeys = {
    all: ['activity-log'] as const,
    company: (companyId: string) => [...activityLogKeys.all, 'company', companyId] as const,
    entity: (entityType: EntityType, entityId: string) =>
        [...activityLogKeys.all, 'entity', entityType, entityId] as const,
};

// Get recent activity for a company
export function useCompanyActivity(companyId: string | undefined, limit = 50) {
    return useQuery({
        queryKey: companyId ? activityLogKeys.company(companyId) : ['disabled'],
        queryFn: () => activityLogService.getRecentActivity(companyId!, limit),
        enabled: !!companyId,
        staleTime: 1000 * 30, // 30 seconds
    });
}

// Get activity for a specific entity (e.g., a candidate)
export function useEntityActivity(
    entityType: EntityType,
    entityId: string | undefined,
    limit = 20
) {
    return useQuery({
        queryKey: entityId ? activityLogKeys.entity(entityType, entityId) : ['disabled'],
        queryFn: () => activityLogService.getEntityActivity(entityType, entityId!, limit),
        enabled: !!entityId,
        staleTime: 1000 * 30,
    });
}

// Real-time activity feed subscription
export function useActivityRealtime(companyId: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!companyId) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel = (supabase as any)
            .channel(`activity-${companyId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_log',
                    filter: `company_id=eq.${companyId}`,
                },
                (payload: { new: ActivityLogEntry }) => {
                    // Prepend new activity to the list
                    queryClient.setQueryData<ActivityLogEntry[]>(
                        activityLogKeys.company(companyId),
                        (old) => [payload.new, ...(old || [])].slice(0, 100)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [companyId, queryClient]);
}
