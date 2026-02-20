import { useInterviews, useUpdateInterviewStatus } from '@/hooks/useInterviews';
import { format } from 'date-fns';
import { Calendar, Clock, Video, CheckCircle2, XCircle, AlertCircle, ExternalLink, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScorecardForm } from '@/components/scorecards/ScorecardForm';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useUpdateInterviewNotes } from '@/hooks/useInterviews';
import { Star, Plus } from 'lucide-react';

interface InterviewListProps {
    candidateId: string;
}

export function InterviewList({ candidateId }: InterviewListProps) {
    const { data: interviews, isLoading } = useInterviews(candidateId);
    const updateStatus = useUpdateInterviewStatus(candidateId);

    if (isLoading) return <div className="space-y-3 animate-pulse">
        <div className="h-16 bg-slate-100 rounded-xl" />
        <div className="h-16 bg-slate-100 rounded-xl" />
    </div>;

    if (!interviews || interviews.length === 0) return (
        <div className="text-center py-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            <Calendar className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No interviews scheduled yet.</p>
        </div>
    );

    const statusConfig = {
        scheduled: { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Clock },
        completed: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2 },
        cancelled: { color: 'text-slate-400 bg-slate-50 border-slate-100', icon: XCircle },
    };

    return (
        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Upcoming & Past Interviews</h4>
            {interviews.map((interview) => {
                const config = statusConfig[interview.status] || statusConfig.scheduled;
                const StatusIcon = config.icon;

                return (
                    <div key={interview.id} className="group relative flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-slate-100 hover:border-slate-200 hover:shadow-md transition-all">
                        <div className={cn("flex flex-col items-center justify-center h-12 w-12 rounded-xl border shrink-0", config.color)}>
                            <span className="text-[10px] font-black uppercase">{interview.scheduled_at ? format(new Date(interview.scheduled_at), 'MMM') : '-'}</span>
                            <span className="text-lg font-black leading-none">{interview.scheduled_at ? format(new Date(interview.scheduled_at), 'dd') : '-'}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-slate-900 capitalize">{interview.interview_type || 'General'} Interview</span>
                                <Badge className={cn("text-[9px] font-black px-1.5 h-4 uppercase", config.color)}>
                                    {interview.status}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {interview.scheduled_at ? format(new Date(interview.scheduled_at), 'p') : 'Time TBD'} ({interview.duration_minutes}m)
                                </span>
                                {interview.meeting_link && (
                                    <a
                                        href={interview.meeting_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary font-bold hover:underline"
                                    >
                                        <Video className="h-3 w-3" />
                                        Join
                                    </a>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all shrink-0"
                                >
                                    <MoreVertical className="h-4 w-4 text-slate-400" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100 p-1">
                                <DropdownMenuItem
                                    className="rounded-lg gap-2 cursor-pointer"
                                    onClick={() => updateStatus.mutate({ id: interview.id, status: 'completed' })}
                                >
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="font-semibold">Mark Completed</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                    onClick={() => updateStatus.mutate({ id: interview.id, status: 'cancelled' })}
                                >
                                    <XCircle className="h-4 w-4" />
                                    <span className="font-semibold">Cancel Interview</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Quick Notes & Feedback Actions */}
                        <div className="flex gap-2 ml-2">
                            <InterviewFeedbackActions interview={interview} candidateId={candidateId} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function InterviewFeedbackActions({ interview, candidateId }: { interview: any; candidateId: string }) {
    const updateNotes = useUpdateInterviewNotes();
    const [notes, setNotes] = useState(interview.notes || '');
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isScorecardOpen, setIsScorecardOpen] = useState(false);

    const handleSaveNotes = async () => {
        await updateNotes.mutateAsync({ id: interview.id, notes });
        setIsNotesOpen(false);
    };

    return (
        <div className="flex gap-1">
            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-100 hover:border-slate-200" title="Add Notes">
                        <Plus className="h-3.5 w-3.5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Interview Notes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Textarea
                            placeholder="Write your observation here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[150px] rounded-xl"
                        />
                        <Button
                            onClick={handleSaveNotes}
                            className="w-full h-11 font-bold rounded-xl shadow-md"
                            disabled={updateNotes.isPending}
                        >
                            {updateNotes.isPending ? "Saving..." : "Save Notes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isScorecardOpen} onOpenChange={setIsScorecardOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-amber-100 text-amber-600 hover:bg-amber-50 hover:border-amber-200" title="Submit Scorecard">
                        <Star className="h-3.5 w-3.5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden">
                    <div className="bg-amber-50 p-6 border-b border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg">
                                <Star className="h-6 w-6 text-white fill-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-amber-900">Submit Scorecard</DialogTitle>
                                <p className="text-amber-700/60 text-xs font-bold uppercase tracking-wider text-left">Evaluation for this session</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8">
                        <ScorecardForm
                            candidateId={candidateId}
                            onSuccess={() => setIsScorecardOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
