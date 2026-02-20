import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CandidateStatus } from './CandidateStatusBadge';
import { Candidate } from './CandidateCard';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { CandidateDetailTabs } from './CandidateDetailTabs';
import { CandidateProfileHeader } from './CandidateProfileHeader';
import { getOptimizedImageUrl } from '@/lib/images';

interface CandidateDetailModalProps {
    candidate: Candidate | null;
    open: boolean;
    onClose: () => void;
    onEdit: (candidate: Candidate) => void;
    onDelete: (candidate: Candidate) => void;
    onStatusChange: (candidate: Candidate, newStatus: CandidateStatus) => void;
    initialTab?: string;
}

export function CandidateDetailModal({
    candidate,
    open,
    onClose,
    onEdit,
    onDelete,
    onStatusChange,
    initialTab,
}: CandidateDetailModalProps) {
    const { company, user } = useAuth();
    const { viewers } = usePresence(candidate?.id);
    const otherViewers = viewers.filter(v => v.user_id !== user?.id);

    if (!candidate) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden h-[90vh] flex flex-col">
                <DialogHeader className="sr-only">
                    <DialogTitle>Candidate Details: {candidate.name}</DialogTitle>
                    <DialogDescription>
                        Detailed view of candidate profile, activity, and evaluations.
                    </DialogDescription>
                </DialogHeader>

                {/* Header with shared component */}
                <div className="relative group">
                    {/* Presence Indicators (Absolute positioned to top-right) */}
                    {otherViewers.length > 0 && (
                        <div className="absolute top-6 right-12 z-20">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex -space-x-2 mr-2">
                                            {otherViewers.slice(0, 3).map((viewer) => (
                                                <Avatar key={viewer.user_id} className="h-7 w-7 border-2 border-background ring-1 ring-border">
                                                    {viewer.avatar_url && <AvatarImage src={getOptimizedImageUrl(viewer.avatar_url, { width: 32, height: 32 })} />}
                                                    <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                                        {viewer.user_name.slice(0, 1)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            ))}
                                            {otherViewers.length > 3 && (
                                                <div className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-background bg-muted text-[10px] font-bold text-muted-foreground z-10 ring-1 ring-border">
                                                    +{otherViewers.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p className="text-xs font-semibold">Also viewing this candidate:</p>
                                        <div className="mt-1 space-y-0.5">
                                            {otherViewers.map(v => (
                                                <p key={v.user_id} className="text-xs opacity-70">• {v.user_name}</p>
                                            ))}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}

                    <CandidateProfileHeader candidate={candidate} className="pr-20" />
                </div>

                {/* Tabs Navigation via Shared Component */}
                <div className="flex-1 min-h-0">
                    <CandidateDetailTabs
                        candidate={candidate}
                        onEdit={(c) => { onClose(); onEdit(c); }}
                        onDelete={(c) => { onClose(); onDelete(c); }}
                        onStatusChange={onStatusChange}
                        companyId={company?.id}
                        defaultTab={initialTab}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
