import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PresenceUser {
    user_id: string;
    user_name: string;
    avatar_url?: string;
    last_seen: string;
    is_typing?: boolean;
}

export function usePresence(candidateId: string | undefined) {
    const { user } = useAuth();
    const [viewers, setViewers] = useState<PresenceUser[]>([]);
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        if (!candidateId || !user) return;

        const newChannel = supabase.channel(`presence:candidate:${candidateId}`, {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        const userPresenceState: PresenceUser = {
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
            avatar_url: user.user_metadata?.avatar_url,
            last_seen: new Date().toISOString(),
            is_typing: false,
        };

        newChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = newChannel.presenceState();
                const flattenedViewers = Object.values(newState)
                    .flat() as unknown as PresenceUser[];

                setViewers(flattenedViewers);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await newChannel.track(userPresenceState);
                }
            });

        setChannel(newChannel);

        return () => {
            supabase.removeChannel(newChannel);
        };
    }, [candidateId, user]);

    const updatePresence = async (data: Partial<PresenceUser>) => {
        if (channel && user) {
            const currentState: PresenceUser = {
                user_id: user.id,
                user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
                avatar_url: user.user_metadata?.avatar_url,
                last_seen: new Date().toISOString(),
                is_typing: false,
                ...data,
            };
            await channel.track(currentState);
        }
    };

    return { viewers, updatePresence };
}
