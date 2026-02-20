import { useState } from 'react';
import {
    LayoutDashboard,
    ClipboardList,
    MessageSquare,
    Mic,
    Activity,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Components
import { CandidateOverview } from './CandidateOverview';
import { CandidateActivity } from './CandidateActivity';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { CommentSection } from '@/components/comments/CommentSection';
import { InterviewScheduler } from '@/components/interviews/InterviewScheduler';
import { InterviewList } from './InterviewList';
import { InterviewGuideViewer } from '../guides/InterviewGuideViewer';
import { ScorecardList } from '@/components/scorecards/ScorecardList';
import { ScorecardForm } from '@/components/scorecards/ScorecardForm';
import { ScorecardSummary } from '@/components/scorecards/ScorecardSummary';
import { Candidate } from './CandidateCard';
import { CandidateStatus } from './CandidateStatusBadge';

interface CandidateDetailTabsProps {
    candidate: Candidate;
    onEdit: (candidate: Candidate) => void;
    onDelete: (candidate: Candidate) => void;
    onStatusChange: (candidate: Candidate, newStatus: CandidateStatus) => void;
    companyId?: string;
    isReviewMode?: boolean;
    defaultTab?: string;
}

export function CandidateDetailTabs({
    candidate,
    onEdit,
    onDelete,
    onStatusChange,
    companyId,
    isReviewMode = false,
    defaultTab = 'overview'
}: CandidateDetailTabsProps) {
    const [scorecardFormOpen, setScorecardFormOpen] = useState(false);
    const [guideViewerOpen, setGuideViewerOpen] = useState(false);
    const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

    const handleStartInterview = (guideId: string) => {
        setSelectedGuideId(guideId);
        setGuideViewerOpen(true);
    };

    return (
        <Tabs defaultValue={isReviewMode ? 'evaluation' : defaultTab} className="flex-1 flex flex-col h-full">
            {/* Header Tabs - Full Width & Equal Distribution */}
            <div className="border-b bg-background z-10 sticky top-0">
                <TabsList className="w-full h-12 p-0 bg-transparent flex">
                    {!isReviewMode && (
                        <>
                            <TabsTrigger
                                value="overview"
                                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 shadow-none h-full px-1 text-xs sm:text-sm transition-all"
                            >
                                <LayoutDashboard className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Overview</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 shadow-none h-full px-1 text-xs sm:text-sm transition-all"
                            >
                                <Activity className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Activity</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="comments"
                                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 shadow-none h-full px-1 text-xs sm:text-sm transition-all"
                            >
                                <MessageSquare className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Comments</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="voice"
                                className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 shadow-none h-full px-1 text-xs sm:text-sm transition-all"
                            >
                                <Mic className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Voice</span>
                            </TabsTrigger>
                        </>
                    )}
                    <TabsTrigger
                        value="evaluation"
                        className={cn(
                            "flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 shadow-none h-full px-1 text-xs sm:text-sm transition-all",
                            isReviewMode && "text-base font-bold"
                        )}
                    >
                        <ClipboardList className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Evaluation</span>
                    </TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-hidden relative bg-muted/30">
                <TabsContent value="overview" className="h-full m-0 absolute inset-0">
                    <ScrollArea className="h-full">
                        <CandidateOverview
                            candidate={candidate}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusChange={onStatusChange}
                        />
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="activity" className="h-full m-0 absolute inset-0">
                    <CandidateActivity candidateId={candidate.id} />
                </TabsContent>

                <TabsContent value="comments" className="h-full m-0 absolute inset-0">
                    <ScrollArea className="h-full">
                        <div className="p-6">
                            <CommentSection
                                candidateId={candidate.id}
                                candidateName={candidate.name}
                                companyId={companyId}
                            />
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="voice" className="h-full m-0 absolute inset-0">
                    <ScrollArea className="h-full">
                        <div className="p-6">
                            <VoiceRecorder candidateId={candidate.id} />
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="evaluation" className="h-full m-0 absolute inset-0">
                    <ScrollArea className="h-full">
                        <div className="p-6 space-y-10">
                            {/* Interview Scheduling Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Interview Suite</h4>
                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary">Beta</Badge>
                                </div>

                                {isReviewMode && (
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Quick Review Decision</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" className="h-10 text-xs font-bold border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" onClick={() => onStatusChange(candidate, 'offer')}>Strong Yes</Button>
                                            <Button variant="outline" className="h-10 text-xs font-bold border-red-200 text-red-700 bg-red-50 hover:bg-red-100" onClick={() => onStatusChange(candidate, 'rejected')}>Decline</Button>
                                        </div>
                                    </div>
                                )}

                                <InterviewScheduler
                                    candidateId={candidate.id}
                                    candidateName={candidate.name}
                                    positionId={candidate.position_id}
                                    onStartInterview={handleStartInterview}
                                />
                                <InterviewList candidateId={candidate.id} />
                            </div>

                            <Separator />

                            {/* Scorecards Section */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Recruiter Scorecards</h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-[10px] font-black uppercase text-primary hover:text-primary hover:bg-primary/5"
                                        onClick={() => setScorecardFormOpen(true)}
                                    >
                                        Submit New Scorecard
                                    </Button>
                                </div>
                                <ScorecardSummary candidateId={candidate.id} />
                                <ScorecardForm candidateId={candidate.id} />
                                <ScorecardList candidateId={candidate.id} />
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>
            </div>

            {/* Scorecard Form Dialog */}
            <Dialog open={scorecardFormOpen} onOpenChange={setScorecardFormOpen}>
                <DialogContent className="max-w-2xl bg-background">
                    <DialogHeader>
                        <DialogTitle>Evaluation: {candidate.name}</DialogTitle>
                    </DialogHeader>
                    <ScorecardForm
                        candidateId={candidate.id}
                        onSuccess={() => setScorecardFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Interview Guide Viewer Dialog */}
            <Dialog open={guideViewerOpen} onOpenChange={setGuideViewerOpen}>
                <DialogContent className="max-w-4xl bg-background p-0 rounded-[2.5rem] border-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Interview Guide</DialogTitle>
                        <DialogDescription>
                            Review interview questions and guides for this position.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-8">
                        {selectedGuideId && (
                            <InterviewGuideViewer
                                guideId={selectedGuideId}
                                onComplete={() => setGuideViewerOpen(false)}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Tabs>
    );
}
