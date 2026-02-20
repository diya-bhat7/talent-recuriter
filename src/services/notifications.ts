import { supabase } from '@/integrations/supabase/client';

export type NotificationType = 'mention' | 'activity' | 'system';

export interface CreateNotificationParams {
    userId: string;
    companyId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}

class NotificationService {
    /**
     * Create a new notification
     */
    async createNotification(params: CreateNotificationParams) {
        const { error } = await (supabase as any)
            .from('notifications')
            .insert({
                user_id: params.userId,
                company_id: params.companyId,
                type: params.type,
                title: params.title,
                message: params.message,
                link: params.link || null,
                metadata: params.metadata || {},
            });

        if (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Specifically for @mentions
     */
    async notifyMention(params: {
        mentionedUserId: string;
        companyId: string;
        authorName: string;
        candidateName: string;
        candidateId: string;
    }) {
        // Fetch position_id to build the correct link
        const { data: candidate } = await (supabase as any)
            .from('candidates')
            .select('position_id')
            .eq('id', params.candidateId)
            .single();

        const positionId = candidate?.position_id;
        const link = positionId
            ? `/positions/${positionId}/candidates?candidateId=${params.candidateId}`
            : `/candidates?candidateId=${params.candidateId}`;

        await this.createNotification({
            userId: params.mentionedUserId,
            companyId: params.companyId,
            type: 'mention',
            title: 'New Mention',
            message: `${params.authorName} mentioned you in a comment regarding ${params.candidateName}`,
            link,
            metadata: {
                candidate_id: params.candidateId,
            },
        });
    }

    /**
     * Resolve a mention tag to a user ID from team_members
     */
    async resolveUserIdByTag(tag: string, companyId: string): Promise<string | null> {
        const { data, error } = await (supabase as any)
            .from('team_members')
            .select('user_id')
            .eq('mention_tag', tag)
            .eq('company_id', companyId)
            .single();

        if (error || !data) return null;
        return data.user_id;
    }
}

export const notificationService = new NotificationService();

/**
 * Notify all team members in a company (except the actor) 
 */
async function notifyTeam(params: {
    companyId: string;
    actorUserId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}) {
    try {
        // Get all team members + the company owner
        const { data: members } = await (supabase as any)
            .from('team_members')
            .select('user_id')
            .eq('company_id', params.companyId);

        const { data: company } = await (supabase as any)
            .from('companies')
            .select('user_id')
            .eq('id', params.companyId)
            .single();

        const userIds = new Set<string>();
        members?.forEach((m: any) => m.user_id && userIds.add(m.user_id));
        if (company?.user_id) userIds.add(company.user_id);
        // Remove the actor so they don't notify themselves
        userIds.delete(params.actorUserId);

        for (const userId of userIds) {
            await notificationService.createNotification({
                userId,
                companyId: params.companyId,
                type: params.type,
                title: params.title,
                message: params.message,
                link: params.link,
                metadata: params.metadata,
            });
        }
    } catch (err) {
        console.error('Error notifying team:', err);
    }
}

/**
 * Notify team when candidate status changes
 */
export async function notifyCandidateStatusChanged(params: {
    companyId: string;
    actorUserId: string;
    actorName: string;
    candidateId: string;
    candidateName: string;
    oldStatus: string;
    newStatus: string;
    positionId?: string;
}) {
    const link = params.positionId
        ? `/positions/${params.positionId}/candidates?candidateId=${params.candidateId}`
        : `/candidates?candidateId=${params.candidateId}`;

    await notifyTeam({
        companyId: params.companyId,
        actorUserId: params.actorUserId,
        type: 'activity',
        title: 'Candidate Status Updated',
        message: `${params.actorName} moved ${params.candidateName} from ${params.oldStatus} to ${params.newStatus}`,
        link,
        metadata: {
            candidate_id: params.candidateId,
            old_status: params.oldStatus,
            new_status: params.newStatus,
        },
    });
}

/**
 * Notify team when interview is scheduled
 */
export async function notifyInterviewScheduled(params: {
    companyId: string;
    actorUserId: string;
    actorName: string;
    candidateNames: string[];
    interviewType: string;
}) {
    const names = params.candidateNames.join(', ');
    await notifyTeam({
        companyId: params.companyId,
        actorUserId: params.actorUserId,
        type: 'activity',
        title: 'Interview Scheduled',
        message: `${params.actorName} scheduled a ${params.interviewType} interview for ${names}`,
        link: '/interviews',
        metadata: { interview_type: params.interviewType },
    });
}

/**
 * Notify team when interview status changes (completed/cancelled)
 */
export async function notifyInterviewStatusChanged(params: {
    companyId: string;
    actorUserId: string;
    actorName: string;
    candidateName: string;
    status: string;
}) {
    await notifyTeam({
        companyId: params.companyId,
        actorUserId: params.actorUserId,
        type: 'activity',
        title: 'Interview Status Updated',
        message: `${params.actorName} marked interview with ${params.candidateName} as ${params.status}`,
        link: '/interviews',
    });
}

/**
 * Notify a specific new team member
 */
export async function notifyTeamMemberAdded(params: {
    userId: string;
    companyId: string;
    companyName: string;
    role: string;
}) {
    await notificationService.createNotification({
        userId: params.userId,
        companyId: params.companyId,
        type: 'system',
        title: 'Welcome to the team!',
        message: `You've been added to ${params.companyName} as a ${params.role}`,
        link: '/dashboard',
    });
}
