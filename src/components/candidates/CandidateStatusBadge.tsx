/* eslint-disable react-refresh/only-export-components */
import { memo } from 'react';
import { cn } from '@/lib/utils';

export type CandidateStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

interface CandidateStatusBadgeProps {
    status: CandidateStatus;
    className?: string;
    size?: 'sm' | 'md';
}

const statusConfig: Record<CandidateStatus, { label: string; className: string }> = {
    new: {
        label: 'New',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    screening: {
        label: 'Screening',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    interview: {
        label: 'Interview',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    offer: {
        label: 'Offer',
        className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    hired: {
        label: 'Hired',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export const CandidateStatusBadge = memo(function CandidateStatusBadge({
    status,
    className,
    size = 'md',
}: CandidateStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.new;

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

export const CANDIDATE_STATUS_OPTIONS: { value: CandidateStatus; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
];
