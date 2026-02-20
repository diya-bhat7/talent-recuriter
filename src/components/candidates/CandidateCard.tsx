import { memo, forwardRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CandidateStatus } from './CandidateStatusBadge';
import { usePresence } from '@/hooks/usePresence';
import { useAuth } from '@/hooks/useAuth';
import { Eye, Calendar, Star, MoreHorizontal } from 'lucide-react';
import { CandidateActionMenu } from './CandidateActionMenu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAverageRatings } from '@/hooks/useScorecards';
import { useInterviews } from '@/hooks/useInterviews';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/images';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchComments } from '@/hooks/useComments';
import { prefetchScorecards, prefetchAverageRatings } from '@/hooks/useScorecards';

export interface Candidate {
    id: string;
    position_id: string;
    name: string;
    email: string;
    phone?: string;
    resume_url?: string;
    linkedin_url?: string;
    status: CandidateStatus;
    notes?: string;
    rating?: number;
    experience_years?: number | null;
    skills?: string[] | null;
    position_name?: string;
    avatar_url?: string | null;
    created_at: string;
    updated_at?: string | null;
}

interface CandidateCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
    candidate: Candidate;
    onCardClick?: (candidate: Candidate, tab?: string) => void;
    onEdit?: (candidate: Candidate) => void;
    onDelete?: (candidate: Candidate) => void;
    onStatusChange?: (candidate: Candidate, newStatus: CandidateStatus) => void;
}

// Status-based avatar colors
const statusAvatarColors: Record<CandidateStatus, string> = {
    new: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    screening: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    interview: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    offer: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    hired: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

export const CandidateCard = memo(forwardRef<HTMLDivElement, CandidateCardProps>(
    function CandidateCard({
        candidate,
        onCardClick: onClick,
        className,
        ...props
    }, ref) {
        const queryClient = useQueryClient();
        const { user } = useAuth();
        const { viewers } = usePresence(candidate.id);

        // Filter out current user and limit to 3 others for display
        const otherViewers = viewers.filter(v => v.user_id !== user?.id);

        const { data: averages } = useAverageRatings(candidate.id);
        const { data: interviews } = useInterviews(candidate.id);
        const hasUpcomingInterview = interviews?.some(i => i.status === 'scheduled');
        const avgScore = averages ? (averages.tech + averages.comm + averages.culture) / 3 : null;

        const initials = candidate.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

        const handleMouseEnter = () => {
            prefetchComments(queryClient, candidate.id);
            prefetchScorecards(queryClient, candidate.id);
            prefetchAverageRatings(queryClient, candidate.id);
        };

        return (
            <TooltipProvider>
                <div
                    ref={ref}
                    className={`group relative flex items-center gap-2.5 p-3 rounded-xl bg-card/60 backdrop-blur-md border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 cursor-pointer transition-all duration-300 ${className}`}
                    onClick={() => onClick?.(candidate)}
                    onMouseEnter={handleMouseEnter}
                    {...props}
                >
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all opacity-0 group-hover:opacity-100",
                        candidate.status === 'new' ? "bg-blue-500" :
                            candidate.status === 'screening' ? "bg-orange-500" :
                                candidate.status === 'interview' ? "bg-emerald-500" :
                                    candidate.status === 'offer' ? "bg-purple-500" :
                                        candidate.status === 'hired' ? "bg-emerald-600" : "bg-red-500"
                    )} />

                    <Avatar className={`h-10 w-10 shrink-0 shadow-sm ${statusAvatarColors[candidate.status]}`}>
                        <AvatarImage src={getOptimizedImageUrl(candidate.avatar_url, { width: 64, height: 64 })} className="object-cover" />
                        <AvatarFallback className={`text-xs font-black ${statusAvatarColors[candidate.status]}`}>
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {candidate.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            {avgScore !== null && (
                                <div className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/40">
                                    <Star className="h-2.5 w-2.5 fill-current" />
                                    {avgScore.toFixed(1)}
                                </div>
                            )}
                            {hasUpcomingInterview && (
                                <div className="flex items-center gap-0.5 text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40">
                                    <Calendar className="h-2.5 w-2.5" />
                                    Interview
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Presence Indicators */}
                    {otherViewers.length > 0 && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex -space-x-1.5 overflow-hidden items-center ml-2">
                                    {otherViewers.slice(0, 3).map((viewer) => (
                                        <Avatar key={viewer.user_id} className="h-6 w-6 border-2 border-background ring-0 shadow-sm">
                                            {viewer.avatar_url && <AvatarImage src={getOptimizedImageUrl(viewer.avatar_url, { width: 32, height: 32 })} />}
                                            <AvatarFallback className="text-[8px] bg-muted/80 text-muted-foreground font-black">
                                                {viewer.user_name.slice(0, 1)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ))}
                                    {otherViewers.length > 3 && (
                                        <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-background bg-muted/80 text-[8px] font-black text-muted-foreground z-10">
                                            +{otherViewers.length - 3}
                                        </div>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-xs font-bold">
                                    {otherViewers.length} active {otherViewers.length === 1 ? 'viewer' : 'viewers'}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {/* Quick Access Menu */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1" onClick={(e) => e.stopPropagation()}>
                        <CandidateActionMenu
                            candidate={candidate}
                            onAction={onClick}
                            align="end"
                            trigger={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full hover:bg-muted/80"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            }
                        />
                    </div>
                </div>
            </TooltipProvider>
        );
    }
));
