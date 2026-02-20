import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import {
    History,
    UserPlus,
    ArrowRightLeft,
    Trash2,
    MessageSquare,
    Star,
    User,
    CheckCircle2,
    Clock,
    UserCircle
} from 'lucide-react';
import { activityLogService } from '@/services/activityLog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ActivityAction } from '@/types/advanced-features';
import { MentionText } from '../comments/MentionText';

interface CandidateActivityProps {
    candidateId: string;
}

const actionIcons: Record<ActivityAction | string, React.ReactNode> = {
    created: <UserPlus className="h-4 w-4 text-blue-500" />,
    status_changed: <ArrowRightLeft className="h-4 w-4 text-orange-500" />,
    updated: <History className="h-4 w-4 text-slate-500" />,
    deleted: <Trash2 className="h-4 w-4 text-red-500" />,
    commented: <MessageSquare className="h-4 w-4 text-purple-500" />,
    scored: <Star className="h-4 w-4 text-amber-500" />,
};

export function CandidateActivity({ candidateId }: CandidateActivityProps) {
    const { data: activity, isLoading } = useQuery({
        queryKey: ['candidate-activity', candidateId],
        queryFn: () => activityLogService.getEntityActivity('candidate', candidateId),
        refetchOnWindowFocus: false,
    });

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-3 w-full" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!activity || activity.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <History className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm">No activity recorded yet</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="relative p-4 space-y-6">
                {/* Vertical line connecting the timeline */}
                <div className="absolute left-7 top-6 bottom-6 w-0.5 bg-slate-100" />

                {activity.map((entry, index) => {
                    const icon = actionIcons[entry.action] || <History className="h-4 w-4" />;

                    return (
                        <div key={entry.id} className="relative flex gap-4 items-start">
                            {/* Connector Dot/Icon */}
                            <div className="z-10 flex items-center justify-center h-7 w-7 rounded-full bg-white border-2 border-slate-100 shadow-sm shrink-0">
                                {icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                        <UserCircle className="h-3 w-3 opacity-40" />
                                        {entry.user_name || 'System'}
                                    </p>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        {entry.created_at ? formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }) : 'Recently'}
                                    </span>
                                </div>

                                <div className="mt-1">
                                    {renderActionContent(entry)}
                                </div>

                                <p className="text-[10px] text-slate-400 mt-1">
                                    {entry.created_at ? format(new Date(entry.created_at), 'PPP p') : 'Unknown time'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}

function renderActionContent(entry: any) {
    const { action, metadata } = entry;

    switch (action) {
        case 'status_changed':
            return (
                <p className="text-sm text-slate-600">
                    Moved to <span className="font-bold text-slate-900 capitalize italic">{metadata.new_status}</span>
                    <span className="mx-1 opacity-40">←</span>
                    <span className="text-xs opacity-60 capitalize">{metadata.old_status}</span>
                </p>
            );
        case 'created':
            return <p className="text-sm text-slate-600">Added candidate to pipeline</p>;
        case 'updated':
            const fields = metadata.updates as string[];
            return (
                <p className="text-sm text-slate-600">
                    Updated {fields?.length > 0 ? fields.join(', ') : 'profile details'}
                </p>
            );
        case 'commented':
            return (
                <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-2.5 mt-1.5 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        Added a Comment
                    </p>
                    <div className="text-sm text-slate-600 leading-relaxed italic">
                        <MentionText content={metadata.content || "Commented"} />
                    </div>
                </div>
            );
        case 'scored':
            return (
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-lg p-2 mt-1">
                    <p className="text-xs font-semibold text-amber-800 mb-1">Scorecard Submitted</p>
                    <p className="text-xs text-amber-700 italic">"{metadata.recommendation}"</p>
                </div>
            );
        default:
            return <p className="text-sm text-slate-600 capitalize">{action.replace('_', ' ')}</p>;
    }
}
