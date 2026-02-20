/**
 * useVoiceNotes Hook
 * React Query hooks for voice notes
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceNoteService, VoiceNote } from '@/services/voiceNotes';

// Query keys
export const voiceNoteKeys = {
    all: ['voice-notes'] as const,
    candidate: (candidateId: string) => [...voiceNoteKeys.all, 'candidate', candidateId] as const,
};

/**
 * Fetch voice notes for a candidate
 */
export function useVoiceNotes(candidateId: string | undefined) {
    return useQuery({
        queryKey: candidateId ? voiceNoteKeys.candidate(candidateId) : ['disabled'],
        queryFn: () => voiceNoteService.getVoiceNotes(candidateId!),
        enabled: !!candidateId,
        staleTime: 1000 * 60 * 5,
    });
}

interface CreateVoiceNoteVariables {
    audioBlob: Blob;
    durationSeconds: number;
}

/**
 * Create a new voice note
 */
export function useCreateVoiceNote(
    candidateId: string | undefined,
    userId: string | undefined,
    userName: string
) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: CreateVoiceNoteVariables) => {
            if (!candidateId || !userId) throw new Error('Missing params');

            return voiceNoteService.createVoiceNote({
                candidateId,
                userId,
                userName,
                audioBlob: variables.audioBlob,
                durationSeconds: variables.durationSeconds,
            });
        },
        onSuccess: (newNote) => {
            queryClient.setQueryData<VoiceNote[]>(
                voiceNoteKeys.candidate(candidateId!),
                (old) => [newNote, ...(old || [])]
            );
        },
    });
}

/**
 * Delete a voice note
 */
export function useDeleteVoiceNote(candidateId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, audioUrl }: { id: string; audioUrl: string }) => {
            await voiceNoteService.deleteVoiceNote(id, audioUrl);
            return id;
        },
        onSuccess: (deletedId) => {
            queryClient.setQueryData<VoiceNote[]>(
                voiceNoteKeys.candidate(candidateId!),
                (old) => old?.filter((n) => n.id !== deletedId)
            );
        },
    });
}
