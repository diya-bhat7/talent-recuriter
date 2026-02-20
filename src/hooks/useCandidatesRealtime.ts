import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { candidateKeys, Candidate } from './useCandidates';
import { CandidateStatus } from '@/components/candidates/CandidateStatusBadge';

type RealtimePayload = {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, any>;
    old: Record<string, any>;
};

/**
 * Hook to subscribe to real-time candidate updates for a position
 * Automatically updates the React Query cache when changes occur
 */
export function useCandidatesRealtime(positionId: string | undefined) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!positionId) return;

        const channel = supabase
            .channel(`candidates:${positionId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'candidates',
                    filter: `position_id=eq.${positionId}`,
                },
                (payload: RealtimePayload) => {
                    const queryKey = candidateKeys.list(positionId);

                    switch (payload.eventType) {
                        case 'INSERT': {
                            const newCandidate = mapToCandidate(payload.new);
                            queryClient.setQueryData<Candidate[]>(queryKey, (old) =>
                                old ? [newCandidate, ...old] : [newCandidate]
                            );
                            break;
                        }
                        case 'UPDATE': {
                            const updatedCandidate = mapToCandidate(payload.new);
                            queryClient.setQueryData<Candidate[]>(queryKey, (old) =>
                                old?.map((c) =>
                                    c.id === updatedCandidate.id ? updatedCandidate : c
                                )
                            );
                            break;
                        }
                        case 'DELETE': {
                            const deletedId = payload.old.id;
                            queryClient.setQueryData<Candidate[]>(queryKey, (old) =>
                                old?.filter((c) => c.id !== deletedId)
                            );
                            break;
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [positionId, queryClient]);
}

// Helper to map database record to Candidate type
function mapToCandidate(record: Record<string, any>): Candidate {
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
