/**
 * Relative Time Component
 * Displays human-readable relative timestamps (e.g., "2 hours ago")
 */

import { formatDistanceToNow } from 'date-fns';

interface LastUpdatedProps {
    date: string | Date;
    className?: string;
}

export function LastUpdated({ date, className }: LastUpdatedProps) {
    const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });

    return (
        <span className={className} title={new Date(date).toLocaleString()}>
            Updated {timeAgo}
        </span>
    );
}
