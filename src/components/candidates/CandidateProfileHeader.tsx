import { format } from 'date-fns';
import { Mail, Star, MapPin, CalendarPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { Candidate } from './CandidateCard';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/images';
import { InterviewScheduler } from '@/components/interviews/InterviewScheduler';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';

interface CandidateProfileHeaderProps {
    candidate: Candidate;
    className?: string;
}

// Status-based accent backgrounds
const statusAccents: Record<string, string> = {
    new: 'bg-blue-50/50 border-blue-100',
    screening: 'bg-orange-50/50 border-orange-100',
    interview: 'bg-amber-50/50 border-amber-100',
    offer: 'bg-purple-50/50 border-purple-100',
    hired: 'bg-emerald-50/50 border-emerald-100',
    rejected: 'bg-red-50/50 border-red-100',
};

export function CandidateProfileHeader({ candidate, className }: CandidateProfileHeaderProps) {
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

    const initials = candidate.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={cn("p-6 border-b flex items-start gap-4", statusAccents[candidate.status], className)}>
            <Avatar className="h-16 w-16 border-4 border-background shadow-sm shrink-0">
                <AvatarImage src={getOptimizedImageUrl(candidate.avatar_url, { width: 128, height: 128 })} className="object-cover" />
                <AvatarFallback className="text-xl font-bold bg-foreground text-background">
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 space-y-2">
                <div>
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-foreground leading-none truncate pr-4">
                            {candidate.name}
                        </h2>
                        <Button
                            size="sm"
                            className="bg-primary/90 hover:bg-primary text-white shadow-sm"
                            onClick={() => setIsSchedulerOpen(true)}
                        >
                            <CalendarPlus className="h-4 w-4 mr-2" />
                            Schedule Interview
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{candidate.email}</span>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                    <CandidateStatusBadge status={candidate.status} />

                    {candidate.rating !== undefined && candidate.rating > 0 && (
                        <div className="flex items-center gap-0.5 bg-background/60 px-2 py-1 rounded-full border border-border/50 shadow-sm ml-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={cn(
                                        "h-3 w-3",
                                        i < candidate.rating!
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-muted"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
                <DialogContent className="max-w-2xl p-8 rounded-[2.5rem] border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Schedule Interview</DialogTitle>
                        <DialogDescription className="text-xs font-medium">
                            Set up an interview for {candidate.name}
                        </DialogDescription>
                    </DialogHeader>
                    <InterviewScheduler
                        candidateId={candidate.id}
                        candidateName={candidate.name}
                        positionId={candidate.position_id}
                        onSuccess={() => setIsSchedulerOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
