/**
 * Comments Service
 * CRUD operations for candidate comments with @mention support
 */

import { supabase } from '@/integrations/supabase/client';
import { logCommentAdded, activityLogService } from '@/services/activityLog';
import { MENTION_REGEX } from '@/utils/user';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

export interface Comment {
    id: string;
    candidate_id: string;
    user_id: string | null;
    user_name: string;
    content: string;
    mentions: string[];
    is_edited: boolean;
    created_at: string;
    updated_at: string;
}

interface CreateCommentParams {
    candidateId: string;
    userId: string;
    userName: string;
    content: string;
    mentions?: string[];
    companyId?: string;
    candidateName?: string;
}

interface UpdateCommentParams {
    commentId: string;
    content: string;
    mentions?: string[];
}

class CommentService {
    /**
     * Get all comments for a candidate
     */
    async getComments(candidateId: string): Promise<Comment[]> {
        const { data, error } = await supabaseAny
            .from('comments')
            .select('*')
            .eq('candidate_id', candidateId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    /**
     * Add a new comment
     */
    async addComment(params: CreateCommentParams): Promise<Comment> {
        const { data, error } = await supabaseAny
            .from('comments')
            .insert({
                candidate_id: params.candidateId,
                user_id: params.userId,
                user_name: params.userName,
                content: params.content,
                company_id: params.companyId,
                mentions: params.mentions || [],
            })
            .select()
            .single();

        if (error) throw error;

        // Log activity
        if (params.companyId && params.candidateName) {
            logCommentAdded(
                params.companyId,
                params.userId,
                params.userName,
                params.candidateId,
                params.candidateName,
                params.content
            );

            // Handle Notifications for mentions
            if (params.mentions && params.mentions.length > 0) {
                const { notificationService } = await import('./notifications');
                params.mentions.forEach(async (tag) => {
                    const mentionedUserId = await notificationService.resolveUserIdByTag(tag, params.companyId!);
                    if (mentionedUserId && mentionedUserId !== params.userId) {
                        await notificationService.notifyMention({
                            mentionedUserId,
                            companyId: params.companyId!,
                            authorName: params.userName,
                            candidateName: params.candidateName!,
                            candidateId: params.candidateId
                        });
                    }
                });
            }
        }

        return data;
    }

    /**
     * Update an existing comment
     */
    async updateComment(params: UpdateCommentParams): Promise<Comment> {
        const { data, error } = await supabaseAny
            .from('comments')
            .update({
                content: params.content,
                mentions: params.mentions || [],
                is_edited: true,
                updated_at: new Date().toISOString(),
            })
            .eq('id', params.commentId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId: string): Promise<void> {
        const { error } = await supabaseAny
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) throw error;
    }

    /**
     * Extract @mentions from content
     * Returns array of mentioned usernames
     */
    extractMentions(content: string): string[] {
        const matches = content.match(MENTION_REGEX);
        if (!matches) return [];
        return matches.map(m => m.substring(1)); // Remove @ prefix
    }
}

export const commentService = new CommentService();
