/**
 * useComments Hook
 * React Query hooks for candidate comments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { commentService, Comment } from '@/services/comments';

// Query keys
export const commentKeys = {
    all: ['comments'] as const,
    candidate: (candidateId: string) => [...commentKeys.all, 'candidate', candidateId] as const,
};

/**
 * Fetch comments for a candidate
 */
export function useComments(candidateId: string | undefined) {
    return useQuery({
        queryKey: candidateId ? commentKeys.candidate(candidateId) : ['disabled'],
        queryFn: () => commentService.getComments(candidateId!),
        enabled: !!candidateId,
        staleTime: 1000 * 60, // 1 minute
    });
}

/**
 * Prefetch comments for a candidate
 */
export async function prefetchComments(queryClient: any, candidateId: string) {
    return queryClient.prefetchQuery({
        queryKey: commentKeys.candidate(candidateId),
        queryFn: () => commentService.getComments(candidateId),
        staleTime: 1000 * 60,
    });
}

interface AddCommentVariables {
    content: string;
    companyId?: string;
    candidateName?: string;
}

/**
 * Add a new comment
 */
export function useAddComment(
    candidateId: string | undefined,
    userId: string | undefined,
    userName: string
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: AddCommentVariables) => {
            if (!candidateId || !userId) throw new Error('Missing required params');

            const mentions = commentService.extractMentions(variables.content);

            return commentService.addComment({
                candidateId,
                userId,
                userName,
                content: variables.content,
                mentions,
                companyId: variables.companyId,
                candidateName: variables.candidateName,
            });
        },
        onSuccess: (newComment) => {
            queryClient.setQueryData<Comment[]>(
                commentKeys.candidate(candidateId!),
                (old) => [...(old || []), newComment]
            );
        },
    });
}

/**
 * Update an existing comment
 */
export function useUpdateComment(candidateId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
            const mentions = commentService.extractMentions(content);
            return commentService.updateComment({ commentId, content, mentions });
        },
        onSuccess: (updatedComment) => {
            queryClient.setQueryData<Comment[]>(
                commentKeys.candidate(candidateId!),
                (old) => old?.map(c => c.id === updatedComment.id ? updatedComment : c)
            );
        },
    });
}

/**
 * Delete a comment
 */
export function useDeleteComment(candidateId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (commentId: string) => {
            await commentService.deleteComment(commentId);
            return commentId;
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData<Comment[]>(
                commentKeys.candidate(candidateId!),
                (old) => old?.filter(c => c.id !== deletedId)
            );
        },
    });
}

/**
 * Real-time subscription for comments
 */
export function useCommentsRealtime(candidateId: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!candidateId) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const channel = (supabase as any)
            .channel(`comments-${candidateId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'comments',
                    filter: `candidate_id=eq.${candidateId}`,
                },
                () => {
                    // Refetch on any change
                    queryClient.invalidateQueries({
                        queryKey: commentKeys.candidate(candidateId),
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [candidateId, queryClient]);
}
