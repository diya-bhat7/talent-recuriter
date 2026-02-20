import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { CandidateStatus } from '@/components/candidates/CandidateStatusBadge';

// Candidate type matching the component interface
export interface Candidate {
    id: string;
    position_id: string;
    name: string;
    email: string;
    phone?: string;
    resume_url?: string;
    linkedin_url?: string;
    status: CandidateStatus;
    notes?: string;
    rating?: number;
    created_at: string;
    updated_at: string;
}
import {
    logCandidateCreated,
    logCandidateStatusChanged,
    logCandidateDeleted,
    activityLogService
} from '@/services/activityLog';
import { notifyCandidateStatusChanged } from '@/services/notifications';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

type CandidateInsert = Omit<Candidate, 'id' | 'created_at' | 'updated_at'>;
type CandidateUpdate = Partial<CandidateInsert> & { id: string };

// Query keys for cache management
export const candidateKeys = {
    all: ['candidates'] as const,
    lists: () => [...candidateKeys.all, 'list'] as const,
    list: (positionId: string) => [...candidateKeys.lists(), positionId] as const,
    details: () => [...candidateKeys.all, 'detail'] as const,
    detail: (id: string) => [...candidateKeys.details(), id] as const,
};

// Map database record to Candidate type
function mapToCandidate(record: Tables<'candidates'>): Candidate {
    return {
        id: record.id,
        position_id: record.position_id,
        name: record.name,
        email: record.email,
        phone: record.phone || undefined,
        resume_url: record.resume_url || undefined,
        linkedin_url: record.linkedin_url || undefined,
        status: record.status as CandidateStatus,
        notes: record.notes || undefined,
        rating: record.rating || undefined,
        created_at: record.created_at,
        updated_at: record.updated_at,
    };
}

/**
 * Hook to fetch all candidates for a position
 */
export function useCandidates(positionId: string | undefined) {
    return useQuery({
        queryKey: candidateKeys.list(positionId ?? ''),
        queryFn: async () => {
            if (!positionId) return [];

            const { data, error } = await supabase
                .from('candidates')
                .select('*')
                .eq('position_id', positionId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapToCandidate);
        },
        enabled: !!positionId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to create a new candidate with optimistic updates
 */
export function useCreateCandidate(positionId: string | undefined) {
    const queryClient = useQueryClient();
    const { user, company } = useAuth(); // Access current user info
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (newCandidate: Omit<CandidateInsert, 'position_id'>) => {
            if (!positionId) throw new Error('No position ID');

            const { data, error } = await supabase
                .from('candidates')
                .insert({
                    position_id: positionId,
                    name: newCandidate.name,
                    email: newCandidate.email,
                    phone: newCandidate.phone || null,
                    resume_url: newCandidate.resume_url || null,
                    linkedin_url: newCandidate.linkedin_url || null,
                    status: newCandidate.status || 'new',
                    notes: newCandidate.notes || null,
                    rating: newCandidate.rating || null,
                })
                .select()
                .single();

            if (error) throw error;

            const candidate = mapToCandidate(data as Tables<'candidates'>);

            // Log activity
            if (company?.id && user?.id) {
                logCandidateCreated(
                    company.id,
                    user.id,
                    user.user_metadata.full_name || user.email || 'Unknown User',
                    candidate.id,
                    candidate.name
                );
            }

            return candidate;
        },
        onSuccess: (newCandidate) => {
            // Optimistically update the cache
            queryClient.setQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? ''),
                (old) => old ? [newCandidate, ...old] : [newCandidate]
            );
            // Also invalidate to ensure fresh data
            queryClient.invalidateQueries({ queryKey: candidateKeys.list(positionId ?? '') });
            // Invalidate candidate count as well
            queryClient.invalidateQueries({ queryKey: ['candidate-count', positionId] });

            toast({
                title: 'Candidate added',
                description: `${newCandidate.name} has been added successfully.`,
            });
        },
        onError: (error) => {
            toast({
                title: 'Failed to add candidate',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

/**
 * Hook to update a candidate with optimistic updates
 */
export function useUpdateCandidate(positionId: string | undefined) {
    const queryClient = useQueryClient();
    const { user, company } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, ...updates }: CandidateUpdate) => {
            // Get original candidate for comparison
            const { data: original } = await supabase
                .from('candidates')
                .select('name')
                .eq('id', id)
                .single();

            const { data, error } = await supabase
                .from('candidates')
                .update({
                    name: updates.name,
                    email: updates.email,
                    phone: updates.phone || null,
                    resume_url: updates.resume_url || null,
                    linkedin_url: updates.linkedin_url || null,
                    status: updates.status,
                    notes: updates.notes || null,
                    rating: updates.rating || null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            const updated = mapToCandidate(data);

            // Log activity only for significant updates (e.g. not every keystroke)
            if (company?.id && user?.id && original) {
                activityLogService.log({
                    companyId: company.id,
                    userId: user.id,
                    userName: user.user_metadata.full_name || user.email || 'Unknown User',
                    action: 'updated',
                    entityType: 'candidate',
                    entityId: updated.id,
                    entityName: updated.name,
                    metadata: { updates: Object.keys(updates) }
                });
            }

            return updated;
        },
        onMutate: async ({ id, ...updates }) => {
            await queryClient.cancelQueries({ queryKey: candidateKeys.list(positionId ?? '') });

            const previousCandidates = queryClient.getQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? '')
            );

            queryClient.setQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? ''),
                (old) => old?.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c)
            );

            return { previousCandidates };
        },
        onError: (err, variables, context) => {
            if (context?.previousCandidates) {
                queryClient.setQueryData(
                    candidateKeys.list(positionId ?? ''),
                    context.previousCandidates
                );
            }
            toast({
                title: 'Update failed',
                description: err.message,
                variant: 'destructive',
            });
        },
        onSuccess: (updated) => {
            toast({
                title: 'Candidate updated',
                description: `Information for ${updated.name} has been updated.`,
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: candidateKeys.list(positionId ?? '') });
        },
    });
}

/**
 * Hook to update candidate status (optimized for drag-and-drop)
 */
export function useUpdateCandidateStatus(positionId: string | undefined) {
    const queryClient = useQueryClient();
    const { user, company } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: CandidateStatus }) => {
            // Get current status and name first
            const { data: current } = await supabase
                .from('candidates')
                .select('status, name')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('candidates')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);

            if (error) throw error;

            // Log activity
            if (company?.id && user?.id && current && current.status !== status) {
                logCandidateStatusChanged(
                    company.id,
                    user.id,
                    user.user_metadata.full_name || user.email || 'Unknown User',
                    id,
                    current.name,
                    current.status,
                    status
                );

                // Notify team (fire-and-forget)
                notifyCandidateStatusChanged({
                    companyId: company.id,
                    actorUserId: user.id,
                    actorName: user.user_metadata.full_name || user.email || 'Unknown User',
                    candidateId: id,
                    candidateName: current.name,
                    oldStatus: current.status,
                    newStatus: status,
                    positionId,
                }).catch(() => { });
            }

            return { id, status };
        },
        onMutate: async ({ id, status }) => {
            await queryClient.cancelQueries({ queryKey: candidateKeys.list(positionId ?? '') });

            const previousCandidates = queryClient.getQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? '')
            );

            queryClient.setQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? ''),
                (old) => old?.map(c => c.id === id ? { ...c, status } : c)
            );

            return { previousCandidates };
        },
        onError: (err, variables, context) => {
            if (context?.previousCandidates) {
                queryClient.setQueryData(
                    candidateKeys.list(positionId ?? ''),
                    context.previousCandidates
                );
            }
            toast({
                title: 'Status update failed',
                description: err.message,
                variant: 'destructive',
            });
        },
        onSuccess: ({ status }) => {
            toast({
                title: 'Status updated',
                description: `Candidate status changed to ${status}.`,
            });
            // Invalidate positions to update hired count
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            if (positionId) {
                queryClient.invalidateQueries({ queryKey: ['positions', 'detail', positionId] });
            }
        },
    });
}

/**
 * Hook to delete a candidate with optimistic updates
 */
export function useDeleteCandidate(positionId: string | undefined) {
    const queryClient = useQueryClient();
    const { user, company } = useAuth();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async (id: string) => {
            // Get name before delete
            const { data: current } = await supabase
                .from('candidates')
                .select('name')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('candidates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Log activity
            if (company?.id && user?.id && current) {
                logCandidateDeleted(
                    company.id,
                    user.id,
                    user.user_metadata.full_name || user.email || 'Unknown User',
                    id,
                    current.name
                );
            }

            return id;
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: candidateKeys.list(positionId ?? '') });

            const previousCandidates = queryClient.getQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? '')
            );

            queryClient.setQueryData<Candidate[]>(
                candidateKeys.list(positionId ?? ''),
                (old) => old?.filter(c => c.id !== id)
            );

            return { previousCandidates };
        },
        onError: (err, id, context) => {
            if (context?.previousCandidates) {
                queryClient.setQueryData(
                    candidateKeys.list(positionId ?? ''),
                    context.previousCandidates
                );
            }
            toast({
                title: 'Delete failed',
                description: err.message,
                variant: 'destructive',
            });
        },
        onSuccess: () => {
            toast({
                title: 'Candidate removed',
                description: 'The candidate has been removed from the position.',
            });
        },
    });
}
