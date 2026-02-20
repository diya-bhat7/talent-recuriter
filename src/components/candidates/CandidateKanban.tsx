import { useState, useMemo, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { format } from 'date-fns';
import { CandidateCard, Candidate } from './CandidateCard';
import { CandidateStatus, CandidateStatusBadge, CANDIDATE_STATUS_OPTIONS } from './CandidateStatusBadge';
import {
    Users,
    ChevronDown,
    ChevronRight,
    Mail,
    Phone,
    Linkedin,
    FileText,
    Star,
    Calendar,
    StickyNote,
    Edit,
    Trash2,
    ExternalLink,
    X,
    GripVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    History as HistoryIcon,
    Mic,
    ArrowRight,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CandidateActivity } from './CandidateActivity';
import { VoiceRecorder } from '../voice/VoiceRecorder';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { useAuth } from '@/hooks/useAuth';
import { usePresence } from '@/hooks/usePresence';
import { CandidateDetailTabs } from './CandidateDetailTabs';
import { CandidateProfileHeader } from './CandidateProfileHeader';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScorecardForm } from '@/components/scorecards/ScorecardForm';
import { ScorecardList } from '@/components/scorecards/ScorecardList';
import { useAverageRatings } from '@/hooks/useScorecards';
import { InterviewScheduler } from '@/components/interviews/InterviewScheduler';
import { InterviewList } from './InterviewList';
import { useInterviews } from '@/hooks/useInterviews';

function AverageRatingsBrief({ candidateId }: { candidateId: string }) {
    const { data: averages } = useAverageRatings(candidateId);
    if (!averages) return null;
    return (
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100 shadow-sm">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-700">{((averages.tech + averages.comm + averages.culture) / 3).toFixed(1)}</span>
        </div>
    );
}

interface CandidateKanbanProps {
    candidates: Candidate[];
    onClick?: (candidate: Candidate, tab?: string) => void;
    onEdit: (candidate: Candidate) => void;
    onDelete: (candidate: Candidate) => void;
    onStatusChange: (candidate: Candidate, newStatus: CandidateStatus) => void;
}

// Status colors
const statusColors: Record<CandidateStatus, { bg: string; border: string; text: string; accent: string; light: string }> = {
    new: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500', light: 'bg-blue-100/50' },
    screening: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500', light: 'bg-orange-100/50' },
    interview: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500', light: 'bg-amber-100/50' },
    offer: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-500', light: 'bg-purple-100/50' },
    hired: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500', light: 'bg-emerald-100/50' },
    rejected: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', accent: 'bg-red-500', light: 'bg-red-100/50' },
};

const statusAvatarColors: Record<CandidateStatus, string> = {
    new: 'bg-blue-100 text-blue-700',
    screening: 'bg-orange-100 text-orange-700',
    interview: 'bg-amber-100 text-amber-700',
    offer: 'bg-purple-100 text-purple-700',
    hired: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
};

// Status order for quick change buttons
const statusOrder: CandidateStatus[] = ['new', 'screening', 'interview', 'offer', 'hired'];

export function CandidateKanban({
    candidates,
    onClick,
    onEdit,
    onDelete,
    onStatusChange,
}: CandidateKanbanProps) {
    const { user, company, canDo } = useAuth();
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
    const [isExpanded, setIsExpanded] = useState(false);
    const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
    const [isReviewMode, setIsReviewMode] = useState(false);
    const { viewers } = usePresence(selectedCandidate?.id);
    const otherViewers = viewers.filter(v => v.user_id !== user?.id);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const scrollToStatus = (status: string) => {
        const element = document.getElementById(`kanban-column-${status}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        }
    };

    const candidatesByStatus = useMemo(() => {
        const grouped: Record<CandidateStatus, Candidate[]> = {
            new: [],
            screening: [],
            interview: [],
            offer: [],
            hired: [],
            rejected: [],
        };

        candidates.forEach((candidate) => {
            const status = candidate.status || 'new';
            if (grouped[status]) {
                grouped[status].push(candidate);
            }
        });

        return grouped;
    }, [candidates]);

    const handleCandidateSelect = (candidate: Candidate, tab?: string) => {
        setSelectedCandidate(candidate);
        setActiveTab(tab);
        onClick?.(candidate, tab);
    };

    const getInitials = (name: string) => {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const toggleColumn = (status: string) => {
        setCollapsedColumns(prev => {
            const next = new Set(prev);
            if (next.has(status)) next.delete(status);
            else next.add(status);
            return next;
        });
    };

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const candidate = candidates.find(c => c.id === draggableId);
        if (candidate && destination.droppableId !== source.droppableId) {
            onStatusChange(candidate, destination.droppableId as CandidateStatus);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] min-h-[600px] gap-4">
            {/* Stage Quick Navigator & Review Mode Toggle */}
            <div className="flex items-center justify-between bg-background/50 backdrop-blur-sm p-3 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <div className="flex items-center px-3 py-1 text-[10px] font-black uppercase text-slate-400 border-r mr-1 shrink-0">
                        Jump to:
                    </div>
                    {CANDIDATE_STATUS_OPTIONS.map((status) => (
                        <button
                            key={status.value}
                            onClick={() => scrollToStatus(status.value)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-background hover:shadow-sm whitespace-nowrap",
                                statusColors[status.value].text,
                                "group"
                            )}
                        >
                            <span className={cn("w-2 h-2 rounded-full", statusColors[status.value].accent)} />
                            {status.label}
                            <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] font-black bg-background/50">
                                {candidatesByStatus[status.value]?.length || 0}
                            </Badge>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-border shrink-0">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/50 border border-border">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Review Mode</span>
                        <button
                            onClick={() => setIsReviewMode(!isReviewMode)}
                            className={cn(
                                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                isReviewMode ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                        >
                            <span className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                                isReviewMode ? "translate-x-4" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <ScrollArea className="flex-1 w-full pb-4" ref={scrollAreaRef}>
                    <div className="flex gap-6 h-full p-2 min-w-max">
                        {CANDIDATE_STATUS_OPTIONS.map((status) => {
                            const isCollapsed = collapsedColumns.has(status.value);
                            const colors = statusColors[status.value];
                            const currentCandidates = candidatesByStatus[status.value];

                            return (
                                <div
                                    key={status.value}
                                    id={`kanban-column-${status.value}`}
                                    className={cn(
                                        "flex flex-col shrink-0 rounded-2xl border transition-all duration-500",
                                        isCollapsed ? "w-20" : "w-80",
                                        "bg-card/30 backdrop-blur-md border-border/50 shadow-sm",
                                        snapshot => snapshot.isDraggingOver && "bg-primary/5 border-primary/20"
                                    )}
                                >
                                    {/* Column Header */}
                                    <div className={cn(
                                        "flex items-center justify-between px-4 py-4 rounded-t-2xl h-16 border-b border-border/50",
                                        "bg-background/20 backdrop-blur-xl"
                                    )}>
                                        <div className={cn(
                                            "flex items-center gap-3 overflow-hidden",
                                            isCollapsed && "flex-col gap-1 items-center justify-center w-full"
                                        )}>
                                            <span className={cn(
                                                "shrink-0 w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                                                colors.accent,
                                                "ring-4 ring-background/10"
                                            )} />
                                            {!isCollapsed && (
                                                <h3 className={cn("font-black text-xs uppercase tracking-tighter truncate", "text-foreground/80")}>
                                                    {status.label}
                                                </h3>
                                            )}
                                        </div>

                                        {!isCollapsed && (
                                            <div className="flex items-center gap-3">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 shrink-0",
                                                )}>
                                                    {currentCandidates.length}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:bg-background/50 hover:text-foreground transition-colors"
                                                    onClick={() => toggleColumn(status.value)}
                                                >
                                                    <ChevronDown className="h-4 w-4 rotate-90" />
                                                </Button>
                                            </div>
                                        )}

                                        {isCollapsed && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground mt-2"
                                                onClick={() => toggleColumn(status.value)}
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Droppable Area */}
                                    {!isCollapsed && (
                                        <Droppable droppableId={status.value}>
                                            {(provided, snapshot) => (
                                                <div
                                                    className={cn(
                                                        "flex-1 p-3 transition-colors duration-200",
                                                        snapshot.isDraggingOver ? colors.light : ""
                                                    )}
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    {currentCandidates.length > 0 ? (
                                                        <Virtuoso
                                                            style={{ height: '100%', minHeight: '400px' }}
                                                            data={currentCandidates}
                                                            itemContent={(index, candidate) => (
                                                                <div className="pb-3">
                                                                    <Draggable
                                                                        key={candidate.id}
                                                                        draggableId={candidate.id}
                                                                        index={index}
                                                                    >
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                className={cn(
                                                                                    "transition-transform",
                                                                                    snapshot.isDragging ? "z-50 rotate-2 scale-105" : ""
                                                                                )}
                                                                            >
                                                                                <CandidateCard
                                                                                    candidate={candidate}
                                                                                    onCardClick={(c, tab) => handleCandidateSelect(c, tab)}
                                                                                    className={cn(
                                                                                        "shadow-sm hover:shadow-md border-2",
                                                                                        selectedCandidate?.id === candidate.id
                                                                                            ? colors.border
                                                                                            : "border-transparent"
                                                                                    )}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                </div>
                                                            )}
                                                            components={{
                                                                Footer: () => (
                                                                    <div className="h-1">{provided.placeholder}</div>
                                                                )
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl border-border/50">
                                                            <div className="bg-muted p-3 rounded-full mb-3">
                                                                <Users className="h-6 w-6 opacity-20" />
                                                            </div>
                                                            <p className="text-xs font-medium">No candidates</p>
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
                                    )}

                                    {isCollapsed && (
                                        <div className="flex-1 flex flex-col items-center pt-8 gap-4 px-2">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest text-muted-foreground [writing-mode:vertical-lr] rotate-180",
                                            )}>
                                                {status.label}
                                            </span>
                                            <div className={cn(
                                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border bg-background shadow-inner",
                                                colors.text,
                                                colors.border
                                            )}>
                                                {currentCandidates.length}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </DragDropContext>

            {/* Candidate Detail Overlay/Drawer */}
            {selectedCandidate && (
                <div className={cn(
                    "fixed inset-y-0 right-0 bg-background/80 backdrop-blur-2xl shadow-2xl z-[60] border-l border-border/50 transform transition-all animate-in slide-in-from-right duration-500 ease-out flex flex-col",
                    isExpanded ? "w-full sm:w-[900px]" : "w-full sm:w-[600px]"
                )}>
                    <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0 bg-transparent z-10">
                        <h2 className="font-black text-xl tracking-tighter text-foreground px-2">Candidate Profile</h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="hidden sm:flex text-muted-foreground hover:bg-muted/50 transition-colors"
                            >
                                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>

                            <Separator orientation="vertical" className="h-8 mx-2 opacity-50" />

                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted/50 transition-colors" onClick={() => setSelectedCandidate(null)}>
                                <X className="h-6 w-6" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        <CandidateProfileHeader candidate={selectedCandidate} className="bg-muted/10 backdrop-blur-sm border-b border-border/30" />

                        <div className="flex-1 overflow-hidden">
                            <CandidateDetailTabs
                                candidate={selectedCandidate}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onStatusChange={onStatusChange}
                                isReviewMode={isReviewMode}
                                companyId={company?.id}
                                defaultTab={activeTab}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
