/**
 * Activity Log Service
 * Logs all user actions for audit trail
 */

import { supabase } from '@/integrations/supabase/client';
import type { ActivityAction, EntityType, ActivityLogEntry } from '@/types/advanced-features';
import { Database, Json } from '@/integrations/supabase/types';

interface LogActivityParams {
    companyId: string;
    userId?: string;
    userName?: string;
    action: ActivityAction;
    entityType: EntityType;
    entityId: string;
    entityName?: string;
    metadata?: Record<string, unknown>;
}

class ActivityLogService {
    async log(params: LogActivityParams): Promise<void> {
        try {
            const entry: Database['public']['Tables']['activity_log']['Insert'] = {
                company_id: params.companyId,
                user_id: params.userId,
                user_name: params.userName,
                action: params.action,
                entity_type: params.entityType,
                entity_id: params.entityId,
                entity_name: params.entityName,
                metadata: (params.metadata as Json) || {},
            };

            await supabase.from('activity_log').insert(entry);
        } catch (error) {
            console.error('Failed to log activity:', error);
            // Don't throw - logging shouldn't break the main flow
        }
    }

    async getRecentActivity(
        companyId: string,
        limit = 50
    ): Promise<ActivityLogEntry[]> {
        try {
            const { data } = await supabase
                .from('activity_log')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: false })
                .limit(limit);

            return (data as unknown as ActivityLogEntry[]) || [];
        } catch {
            return [];
        }
    }

    async getEntityActivity(
        entityType: EntityType,
        entityId: string,
        limit = 20
    ): Promise<ActivityLogEntry[]> {
        try {
            const { data } = await supabase
                .from('activity_log')
                .select('*')
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false })
                .limit(limit);

            return (data as unknown as ActivityLogEntry[]) || [];
        } catch {
            return [];
        }
    }
}

export const activityLogService = new ActivityLogService();

// Helper functions for common actions
export const logCandidateCreated = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'created',
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
});

export const logCandidateStatusChanged = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string,
    oldStatus: string,
    newStatus: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'status_changed',
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
    metadata: { old_status: oldStatus, new_status: newStatus },
});

export const logCandidateDeleted = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'deleted',
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
});

export const logCommentAdded = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string,
    content: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'commented',
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
    metadata: { content }
});

export const logScorecardSubmitted = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string,
    recommendation: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'scored',
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
    metadata: { recommendation },
});

export const logInterviewScheduled = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string,
    interviewType: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'updated' as ActivityAction,
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
    metadata: { action: 'interview_scheduled', type: interviewType },
});

export const logInterviewStatusChanged = (
    companyId: string,
    userId: string,
    userName: string,
    candidateId: string,
    candidateName: string,
    status: string
) => activityLogService.log({
    companyId,
    userId,
    userName,
    action: 'updated' as ActivityAction,
    entityType: 'candidate',
    entityId: candidateId,
    entityName: candidateName,
    metadata: { action: 'interview_status_changed', status },
});
