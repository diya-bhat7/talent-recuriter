import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scorecardService, ScorecardInsert } from '@/services/scorecards';
import { toast } from 'sonner';

export function useScorecards(candidateId: string) {
    return useQuery({
        queryKey: ['scorecards', candidateId],
        queryFn: () => scorecardService.getScorecards(candidateId),
        enabled: !!candidateId,
    });
}

export async function prefetchScorecards(queryClient: any, candidateId: string) {
    return queryClient.prefetchQuery({
        queryKey: ['scorecards', candidateId],
        queryFn: () => scorecardService.getScorecards(candidateId),
        staleTime: 1000 * 60,
    });
}

export function useAverageRatings(candidateId: string) {
    return useQuery({
        queryKey: ['average-ratings', candidateId],
        queryFn: () => scorecardService.getAverageRatings(candidateId),
        enabled: !!candidateId,
    });
}

export async function prefetchAverageRatings(queryClient: any, candidateId: string) {
    return queryClient.prefetchQuery({
        queryKey: ['average-ratings', candidateId],
        queryFn: () => scorecardService.getAverageRatings(candidateId),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useSubmitScorecard(candidateId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (scorecard: ScorecardInsert) => scorecardService.submitScorecard(scorecard),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scorecards', candidateId] });
            queryClient.invalidateQueries({ queryKey: ['average-ratings', candidateId] });
            toast.success('Scorecard submitted successfully');
        },
        onError: (error: any) => {
            toast.error(`Failed to submit scorecard: ${error.message}`);
        },
    });
}
