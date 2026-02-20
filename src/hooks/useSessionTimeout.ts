import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'];

/**
 * Hook to manage session timeout based on user inactivity.
 * @param user Current authenticated user
 * @param onTimeout Callback function to execute when timeout occurs
 */
export function useSessionTimeout(user: User | null, onTimeout: () => void) {
    useEffect(() => {
        if (!user) return;

        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(async () => {
                // Check if we still have a session before signing out
                const { data } = await supabase.auth.getSession();
                if (data.session) {
                    await supabase.auth.signOut();
                    onTimeout();
                }
            }, INACTIVITY_TIMEOUT);
        };

        const handleActivity = () => {
            resetTimer();
        };

        // Initial timer setup
        resetTimer();

        // Add event listeners
        ACTIVITY_EVENTS.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            clearTimeout(timeoutId);
            ACTIVITY_EVENTS.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user, onTimeout]);
}
