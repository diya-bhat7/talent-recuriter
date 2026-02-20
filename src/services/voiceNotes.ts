/**
 * Voice Notes Service
 * Handle recording, storage, and playback of audio notes
 */

import { supabase } from '@/integrations/supabase/client';

import { Tables, Database } from '@/integrations/supabase/types';

export type VoiceNote = Tables<'voice_notes'>;
export type VoiceNoteInsert = Database['public']['Tables']['voice_notes']['Insert'];

interface CreateVoiceNoteParams {
    candidateId: string;
    userId: string;
    userName: string;
    audioBlob: Blob;
    durationSeconds: number;
}

class VoiceNoteService {
    /**
     * Get all voice notes for a candidate
     */
    async getVoiceNotes(candidateId: string): Promise<VoiceNote[]> {
        const { data, error } = await supabase
            .from('voice_notes')
            .select('*')
            .eq('candidate_id', candidateId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    /**
     * Upload audio blob to Supabase Storage and create voice note record
     */
    async createVoiceNote(params: CreateVoiceNoteParams): Promise<VoiceNote> {
        // Correct path: /candidateId/timestamp.webm
        // The bucket is already 'voice-notes', adding it again in the path
        // creates redundant 'voice-notes/voice-notes/...' URLs.
        const fileName = `${params.candidateId}/${Date.now()}.webm`;

        // Upload audio file to storage
        const { error: uploadError } = await supabase.storage
            .from('voice-notes')
            .upload(fileName, params.audioBlob, {
                contentType: 'audio/webm',
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw new Error(`Failed to upload audio file: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('voice-notes')
            .getPublicUrl(fileName);

        const audioUrl = urlData.publicUrl;

        // Create database record
        const { data, error } = await supabase
            .from('voice_notes')
            .insert({
                candidate_id: params.candidateId,
                user_id: params.userId,
                user_name: params.userName,
                audio_url: audioUrl,
                duration_seconds: Math.round(params.durationSeconds),
            })
            .select()
            .single();

        if (error) {
            // Attempt to clean up storage if DB insert fails
            await supabase.storage.from('voice-notes').remove([fileName]);
            throw error;
        }

        return data;
    }

    /**
     * Delete a voice note (and its audio file)
     */
    async deleteVoiceNote(voiceNoteId: string, audioUrl: string): Promise<void> {
        // Extract file path from URL
        // Handles both old: .../public/voice-notes/voice-notes/candidateId/file.webm
        // And new: .../public/voice-notes/candidateId/file.webm
        try {
            const url = new URL(audioUrl);
            const pathParts = url.pathname.split('/');
            const bucketIndex = pathParts.findIndex(p => p === 'voice-notes');

            if (bucketIndex !== -1) {
                const filePath = pathParts.slice(bucketIndex + 1).join('/');
                // If the path starts with 'voice-notes/' (old redundant format),
                // Supabase remove() needs the full path within the bucket
                const { error: storageError } = await supabase.storage
                    .from('voice-notes')
                    .remove([filePath]);

                if (storageError) {
                    console.warn('Failed to remove audio file from storage:', storageError);
                }
            }
        } catch (e) {
            console.warn('Failed to parse audio URL for deletion:', e);
        }

        // Delete database record
        const { data, error } = await supabase
            .from('voice_notes')
            .delete()
            .eq('id', voiceNoteId)
            .select();

        if (error) {
            console.error('Database deletion error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.warn('VoiceNoteService: No record was deleted from database. RLS might be blocking it or ID mismatch.', { voiceNoteId });
        } else {
            console.log('VoiceNoteService: Successfully deleted database record:', data[0]);
        }
    }

    /**
     * Format duration for display (e.g., "1:23")
     */
    formatDuration(seconds: number | null): string {
        if (seconds === null || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

export const voiceNoteService = new VoiceNoteService();
