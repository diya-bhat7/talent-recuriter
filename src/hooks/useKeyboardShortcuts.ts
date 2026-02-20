import { useEffect, useCallback } from 'react';

interface Shortcut {
    /** Key combo, e.g. 'ctrl+k', 'n', 'escape' */
    key: string;
    /** Callback when shortcut fires */
    action: () => void;
    /** If true, shortcut only fires when no input/textarea is focused */
    requireNoFocus?: boolean;
}

/**
 * Hook to register global keyboard shortcuts.
 * 
 * Usage:
 *   useKeyboardShortcuts([
 *     { key: 'ctrl+k', action: () => focusSearch() },
 *     { key: 'n', action: () => openForm(), requireNoFocus: true },
 *   ]);
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
    const handler = useCallback((e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInputFocused =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.isContentEditable;

        for (const shortcut of shortcuts) {
            const parts = shortcut.key.toLowerCase().split('+');
            const key = parts[parts.length - 1];
            const needsCtrl = parts.includes('ctrl') || parts.includes('meta');
            const needsShift = parts.includes('shift');
            const needsAlt = parts.includes('alt');

            const ctrlMatch = needsCtrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
            const shiftMatch = needsShift ? e.shiftKey : !e.shiftKey;
            const altMatch = needsAlt ? e.altKey : !e.altKey;
            const keyMatch = e.key.toLowerCase() === key;

            if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                // Skip if input is focused and shortcut requires no focus
                if (shortcut.requireNoFocus && isInputFocused) continue;

                e.preventDefault();
                shortcut.action();
                return;
            }
        }
    }, [shortcuts]);

    useEffect(() => {
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handler]);
}
