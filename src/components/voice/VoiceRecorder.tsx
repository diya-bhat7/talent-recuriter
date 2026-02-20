/**
 * Voice Recorder Component
 * Record audio notes with waveform visualization
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCreateVoiceNote, useVoiceNotes, useDeleteVoiceNote } from '@/hooks/useVoiceNotes';
import { voiceNoteService } from '@/services/voiceNotes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Mic,
    Square,
    Trash2,
    Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { WaveformVisualizer } from './WaveformVisualizer';

interface VoiceRecorderProps {
    candidateId: string;
}

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function VoiceRecorder({ candidateId }: VoiceRecorderProps) {
    const { user } = useAuth();
    const { data: voiceNotes, isLoading } = useVoiceNotes(candidateId);
    const createVoiceNote = useCreateVoiceNote(
        candidateId,
        user?.id,
        user?.user_metadata?.full_name || user?.email || 'Unknown'
    );
    const deleteVoiceNote = useDeleteVoiceNote(candidateId);

    // Recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Playback state coordination
    const [playingId, setPlayingId] = useState<string | null>(null);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm',
            });

            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());

                // Upload
                await createVoiceNote.mutateAsync({
                    audioBlob,
                    durationSeconds: recordingTime,
                });

                setRecordingTime(0);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Microphone access denied:', err);
            alert('Please allow microphone access to record voice notes.');
        }
    }, [recordingTime, createVoiceNote]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    // Handle delete
    const handleDelete = async (id: string, audioUrl: string) => {
        await deleteVoiceNote.mutateAsync({ id, audioUrl });
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mic className="h-4 w-4" />
                    <span>Voice Notes ({voiceNotes?.length || 0})</span>
                </div>


                {/* Record Button */}
                <PermissionGuard permission="canRecordVoice">
                    {isRecording ? (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                {voiceNoteService.formatDuration(recordingTime)}
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={stopRecording}
                            >
                                <Square className="h-4 w-4 mr-1" />
                                Stop
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={startRecording}
                            disabled={createVoiceNote.isPending}
                        >
                            {createVoiceNote.isPending ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                                <Mic className="h-4 w-4 mr-1" />
                            )}
                            Record
                        </Button>
                    )}
                </PermissionGuard>
            </div>

            {/* Notes List */}
            {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : voiceNotes?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No voice notes yet. Click "Record" to add one.
                </p>
            ) : (
                <div className="space-y-2">
                    {voiceNotes?.map((note) => (
                        <Card key={note.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                        {getInitials(note.user_name)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium truncate">
                                                {note.user_name}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                {formatDistanceToNow(new Date(note.created_at), {
                                                    addSuffix: true,
                                                })}
                                            </p>
                                        </div>

                                        {note.user_id === user?.id && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => handleDelete(note.id, note.audio_url)}
                                                disabled={deleteVoiceNote.isPending}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    <WaveformVisualizer
                                        url={note.audio_url}
                                        isPlaying={playingId === note.id}
                                        onPlay={() => setPlayingId(note.id)}
                                        onFinish={() => setPlayingId(null)}
                                        height={32}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
