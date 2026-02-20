/* eslint-disable react-refresh/only-export-components */
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type PositionStatus = 'draft' | 'active' | 'interviewing' | 'filled' | 'closed';

interface StatusBadgeProps {
    status: PositionStatus;
    className?: string;
    size?: 'sm' | 'md';
}

const statusConfig: Record<PositionStatus, { label: string; className: string }> = {
    draft: {
        label: 'Draft',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    active: {
        label: 'Active',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    interviewing: {
        label: 'Interviewing',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    filled: {
        label: 'Filled',
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    closed: {
        label: 'Closed',
        className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    },
};

export const StatusBadge = memo(function StatusBadge({
    status,
    className,
    size = 'md'
}: StatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.draft;

    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
});

// Status options for select dropdowns
export const STATUS_OPTIONS: { value: PositionStatus; label: string }[] = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'filled', label: 'Filled' },
    { value: 'closed', label: 'Closed' },
];
