import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewService, InterviewInsert, Interview } from '@/services/interviews';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { logInterviewScheduled, logInterviewStatusChanged } from '@/services/activityLog';
import { notifyInterviewScheduled, notifyInterviewStatusChanged } from '@/services/notifications';
import { supabase } from '@/integrations/supabase/client';

export function useInterviews(candidateId: string) {
    return useQuery({
        queryKey: ['interviews', candidateId],
        queryFn: () => interviewService.getInterviews(candidateId),
        enabled: !!candidateId,
    });
}

export function useAllInterviews(companyId: string | undefined) {
    return useQuery({
        queryKey: ['interviews', 'all', companyId],
        queryFn: () => interviewService.getAllInterviews(companyId!),
        enabled: !!companyId,
    });
}

export function useScheduleInterview() {
    const queryClient = useQueryClient();
    const { user, company } = useAuth();

    return useMutation({
        mutationFn: async ({
            interview,
            candidateIds,
            interviewerIds
        }: {
            interview: InterviewInsert;
            candidateIds: string[];
            interviewerIds: string[];
        }) => {
            const newInterview = await interviewService.scheduleInterview(interview, candidateIds, interviewerIds);

            // 1. Update candidate status to 'interview' for all involved candidates
            if (candidateIds.length > 0) {
                const { error } = await supabase
                    .from('candidates')
                    .update({
                        status: 'interview',
                        updated_at: new Date().toISOString()
                    })
                    .in('id', candidateIds);
                if (error) console.error('Failed to update candidate status:', error);
            }

            // 2. Log activity for each candidate
            if (user && company) {
                const candidateNames: string[] = [];
                for (const cid of candidateIds) {
                    // Get candidate name for logging (optional, could be passed or fetched)
                    const { data: c } = await supabase.from('candidates').select('name').eq('id', cid).single();
                    logInterviewScheduled(
                        company.id,
                        user.id,
                        user.user_metadata?.full_name || user.email || 'User',
                        cid,
                        c?.name || 'Candidate',
                        interview.interview_type || 'General'
                    );
                    candidateNames.push(c?.name || 'Candidate');
                }

                // Notify team (fire-and-forget)
                notifyInterviewScheduled({
                    companyId: company.id,
                    actorUserId: user.id,
                    actorName: user.user_metadata?.full_name || user.email || 'User',
                    candidateNames,
                    interviewType: interview.interview_type || 'General',
                }).catch(() => { });
            }

            return newInterview;
        },
        onSuccess: () => {
            // Invalidate all related queries
            queryClient.invalidateQueries({ queryKey: ['interviews'] });
            queryClient.invalidateQueries({ queryKey: ['candidates'] });
            toast.success('Interview scheduled successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to schedule interview: ${error.message}`);
        },
    });
}

export function useUpdateInterviewStatus(candidateId?: string) {
    const queryClient = useQueryClient();
    const { user, company } = useAuth();

    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: Interview['status'] }) => {
            await interviewService.updateInterviewStatus(id, status);

            // Log activity if we have context
            if (user && company) {
                // Get one candidate from the interview to log against (simplified)
                const { data: ic } = await supabase
                    .from('interview_candidates' as any)
                    .select('candidate_id, candidates(name)')
                    .eq('interview_id', id)
                    .limit(1)
                    .single() as any;

                if (ic && ic.candidates) {
                    logInterviewStatusChanged(
                        company.id,
                        user.id,
                        user.user_metadata?.full_name || user.email || 'User',
                        ic.candidate_id,
                        ic.candidates.name,
                        status
                    );

                    // Notify team (fire-and-forget)
                    notifyInterviewStatusChanged({
                        companyId: company.id,
                        actorUserId: user.id,
                        actorName: user.user_metadata?.full_name || user.email || 'User',
                        candidateName: ic.candidates.name,
                        status,
                    }).catch(() => { });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] });
            toast.success('Interview status updated');
        },
    });
}

export function useUpdateInterviewNotes() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes: string }) =>
            interviewService.updateInterviewNotes(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['interviews'] });
            toast.success('Interview notes updated');
        },
    });
}

