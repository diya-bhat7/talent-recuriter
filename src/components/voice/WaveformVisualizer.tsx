import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';

interface WaveformVisualizerProps {
    url: string;
    onPlay?: () => void;
    onFinish?: () => void;
    isPlaying?: boolean;
    height?: number;
    waveColor?: string;
    progressColor?: string;
}

export function WaveformVisualizer({
    url,
    onPlay,
    onFinish,
    isPlaying: isPlayingProp = false,
    height = 40,
    waveColor = '#cbd5e1',
    progressColor = '#3b82f6',
}: WaveformVisualizerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!containerRef.current || !url) return;

        let ws: WaveSurfer | null = null;
        let isDestroyed = false;

        const initWaveSurfer = async () => {
            setIsLoading(true);

            // Create instance
            ws = WaveSurfer.create({
                container: containerRef.current!,
                height,
                waveColor,
                progressColor,
                cursorColor: 'transparent',
                barWidth: 2,
                barGap: 3,
                barRadius: 3,
            });

            wavesurferRef.current = ws;

            ws.on('ready', () => {
                if (!isDestroyed) setIsLoading(false);
            });

            ws.on('finish', () => {
                onFinish?.();
            });

            ws.on('play', () => onPlay?.());

            try {
                console.log('WaveformVisualizer: Loading URL:', url);

                // If it's a Supabase URL, we need to fetch it with auth headers
                if (url.includes('.supabase.co/storage/v1/object/')) {
                    const urlObj = new URL(url);
                    const pathParts = urlObj.pathname.split('/');

                    // Supabase URLs look like: /storage/v1/object/[public|authenticated]/[bucket]/[path]
                    // We need to find the bucket and extract everything after it.
                    const bucketIndex = pathParts.indexOf('voice-notes');

                    if (bucketIndex !== -1) {
                        // The bucket is 'voice-notes'. The path is everything after it.
                        const storagePath = pathParts.slice(bucketIndex + 1).join('/');
                        console.log('WaveformVisualizer: Detected Supabase voice-notes bucket. Internal path:', storagePath);

                        const { data: blob, error } = await supabase.storage
                            .from('voice-notes')
                            .download(storagePath);

                        if (error) {
                            console.error('WaveformVisualizer: Supabase download error:', error);
                            throw error;
                        }

                        if (blob && !isDestroyed) {
                            console.log('WaveformVisualizer: Successfully downloaded blob, size:', blob.size);
                            ws.loadBlob(blob);
                        }
                    } else {
                        console.warn('WaveformVisualizer: Supabase URL detected but "voice-notes" bucket not found in path. Falling back to standard load.');
                        ws.load(url);
                    }
                } else {
                    ws.load(url);
                }
            } catch (err) {
                console.error('Error loading waveform:', err);
                if (!isDestroyed) setIsLoading(false);
            }
        };

        initWaveSurfer();

        return () => {
            isDestroyed = true;
            if (ws) ws.destroy();
        };
    }, [url, height, waveColor, progressColor, onFinish, onPlay]);

    useEffect(() => {
        if (wavesurferRef.current) {
            if (isPlayingProp) {
                wavesurferRef.current.play();
            } else {
                wavesurferRef.current.pause();
            }
        }
    }, [isPlayingProp]);

    const handleTogglePlay = () => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    };

    return (
        <div className="flex items-center gap-3 w-full bg-slate-50/50 rounded-lg p-2 border border-slate-100/50">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 bg-white shadow-sm border"
                onClick={handleTogglePlay}
                disabled={isLoading}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : isPlayingProp ? (
                    <Pause className="h-4 w-4 text-primary fill-primary" />
                ) : (
                    <Play className="h-4 w-4 text-primary fill-primary" />
                )}
            </Button>

            <div className="flex-1 min-w-0 h-10 flex items-center">
                <div ref={containerRef} className="w-full" />
            </div>

            {isLoading && (
                <div className="text-[10px] text-muted-foreground animate-pulse font-medium px-2">
                    Loading
                </div>
            )}
        </div>
    );
}
