import { useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAllInterviews, useUpdateInterviewStatus, useDeleteInterview, useUpdateInterviewNotes } from '@/hooks/useInterviews';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlobalInterviewScheduler } from '@/components/interviews/GlobalInterviewScheduler';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScorecardForm } from '@/components/scorecards/ScorecardForm';
import { Textarea } from '@/components/ui/textarea';
import {
    Calendar as CalendarIcon,
    List as ListIcon,
    Search,
    Clock,
    Video,
    MapPin,
    ArrowRight,
    CheckCircle2,
    XCircle,
    User,
    Briefcase,
    Plus,
    Star,
    Users,
    MoreVertical,
    AlertCircle,
} from 'lucide-react';
import { format, isToday, isTomorrow, isFuture, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Interviews() {
    const { user, company, loading: authLoading } = useAuth();
    const { data: interviews = [], isLoading, error } = useAllInterviews(company?.id);
    const updateStatus = useUpdateInterviewStatus();

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

    // Filter interviews based on search
    const filteredInterviews = useMemo(() => {
        let result = interviews;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(i => {
                const candidateMatches = i.interview_candidates?.some((ic: any) =>
                    ic.candidates?.name?.toLowerCase().includes(query)
                );
                const positionName = i.positions?.position_name || (i.positions as any)?.[0]?.position_name;
                const positionMatches = positionName?.toLowerCase().includes(query);

                return candidateMatches || positionMatches;
            });
        }

        return result as any[];
    }, [interviews, searchQuery]);

    // Group interviews for the list view
    const groups = useMemo(() => {
        const today: typeof interviews = [];
        const tomorrow: typeof interviews = [];
        const upcoming: typeof interviews = [];
        const past: typeof interviews = [];

        filteredInterviews.forEach(i => {
            const date = parseISO(i.scheduled_at);
            if (isToday(date)) today.push(i);
            else if (isTomorrow(date)) tomorrow.push(i);
            else if (isFuture(date)) upcoming.push(i);
            else past.push(i);
        });

        return { today, tomorrow, upcoming, past };
    }, [filteredInterviews]);

    // Interviews for the selected date in calendar view
    const calendarInterviews = useMemo(() => {
        if (!selectedDate) return [];
        return filteredInterviews.filter(i => {
            const date = parseISO(i.scheduled_at);
            return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        });
    }, [filteredInterviews, selectedDate]);

    if (!authLoading && !user) return <Navigate to="/login" replace />;

    const handleStatusChange = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
        await updateStatus.mutateAsync({ id, status });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8 pb-20 md:pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <CalendarIcon className="h-8 w-8 text-primary" />
                            Interview Schedule
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage all upcoming interviews across your open positions.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setIsSchedulerOpen(true)}
                            className="h-10 gap-2 font-bold shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Schedule Interview
                        </Button>
                        <div className="flex items-center border rounded-lg p-1 bg-muted/50 ml-2">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-8 gap-2"
                            >
                                <ListIcon className="h-4 w-4" />
                                List
                            </Button>
                            <Button
                                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('calendar')}
                                className="h-8 gap-2"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Calendar
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Filters & Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Search</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Candidate or role..."
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Schedule Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Today</span>
                                    <Badge variant="secondary">{groups.today.length}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">This Week</span>
                                    <Badge variant="outline">{groups.tomorrow.length + groups.upcoming.length}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Past</span>
                                    <Badge variant="outline" className="text-muted-foreground">{groups.past.length}</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {viewMode === 'list' && (
                            <div className="hidden lg:block p-4 border rounded-xl bg-primary/5 border-primary/10">
                                <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Quick Tip
                                </h3>
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                    Interviews are automatically synced from candidate profiles. Update status here to keep your pipeline clean.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {error ? (
                            <Card className="border-destructive/20 bg-destructive/5">
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="rounded-full bg-destructive/10 p-4 mb-4">
                                        <XCircle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">Failed to load interviews</h3>
                                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                                        {(error as any).message || 'An unexpected error occurred while fetching your schedule.'}
                                    </p>
                                    <Button variant="outline" onClick={() => window.location.reload()}>
                                        Try Again
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="space-y-8">
                                <InterviewSection
                                    title="Today"
                                    interviews={groups.today}
                                    onStatusChange={handleStatusChange}
                                />
                                <InterviewSection
                                    title="Tomorrow"
                                    interviews={groups.tomorrow}
                                    onStatusChange={handleStatusChange}
                                />
                                <InterviewSection
                                    title="Upcoming"
                                    interviews={groups.upcoming}
                                    onStatusChange={handleStatusChange}
                                />
                                <InterviewSection
                                    title="Past Interviews"
                                    interviews={groups.past}
                                    onStatusChange={handleStatusChange}
                                />
                                {filteredInterviews.length === 0 && (
                                    <EmptyState
                                        icon={CalendarIcon}
                                        title="No interviews scheduled"
                                        description="When you schedule an interview with a candidate, it will appear here."
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="p-4 flex justify-center h-fit">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        className="rounded-md"
                                        modifiers={{
                                            hasInterview: (date) => filteredInterviews.some(i =>
                                                format(parseISO(i.scheduled_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                                            )
                                        }}
                                        modifiersStyles={{
                                            hasInterview: { fontWeight: 'bold', color: 'var(--primary)' }
                                        }}
                                    />
                                </Card>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                                    </h3>
                                    {calendarInterviews.length > 0 ? (
                                        calendarInterviews.map(i => (
                                            <InterviewCard
                                                key={i.id}
                                                interview={i}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                            <p className="text-muted-foreground text-sm">No interviews for this date</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <GlobalInterviewScheduler
                open={isSchedulerOpen}
                onOpenChange={setIsSchedulerOpen}
            />
        </div>
    );
}

function InterviewSection({ title, interviews, onStatusChange }: {
    title: string;
    interviews: any[];
    onStatusChange: (id: string, status: 'scheduled' | 'completed' | 'cancelled') => Promise<void>
}) {
    if (interviews.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {title}
            </h2>
            <div className="grid gap-4">
                {interviews.map(i => (
                    <InterviewCard key={i.id} interview={i} onStatusChange={onStatusChange} />
                ))}
            </div>
        </div>
    );
}

function InterviewCard({ interview, onStatusChange }: {
    interview: any;
    onStatusChange: (id: string, status: 'scheduled' | 'completed' | 'cancelled') => Promise<void>
}) {
    const time = format(parseISO(interview.scheduled_at), 'h:mm a');
    const participants = interview.interview_candidates || [];
    const panel = interview.interview_panel || [];
    const updateNotes = useUpdateInterviewNotes();
    const deleteInterview = useDeleteInterview();
    const [notes, setNotes] = useState(interview.notes || '');
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isScorecardOpen, setIsScorecardOpen] = useState(false);

    const handleSaveNotes = async () => {
        await updateNotes.mutateAsync({ id: interview.id, notes });
        setIsNotesOpen(false);
    };

    return (
        <Card className="hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-stretch">
                    {/* Time & Status Sidebar */}
                    <div className="md:w-32 bg-muted/30 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r gap-3">
                        <div className="text-xl font-black text-primary">{time}</div>
                        <Badge variant={
                            interview.status === 'scheduled' ? 'secondary' :
                                interview.status === 'completed' ? 'default' : 'destructive'
                        } className="text-[10px] uppercase font-bold tracking-widest px-1.5 h-5">
                            {interview.status}
                        </Badge>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4 min-w-0">
                            <div>
                                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-tight mb-2">
                                    <Video className="h-3 w-3" />
                                    {interview.interview_type} • {!!interview.meeting_link ? (
                                        <div className="flex items-center gap-1.5">
                                            <span>Video Link</span>
                                            <a
                                                href={String(interview.meeting_link).startsWith('http') ? String(interview.meeting_link) : `https://${interview.meeting_link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="normal-case text-blue-600 hover:text-blue-700 hover:underline font-bold"
                                            >
                                                (Join Now!)
                                            </a>
                                        </div>
                                    ) : 'In-person'}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Candidate Avatars */}
                                    <div className="flex -space-x-3 overflow-hidden">
                                        {participants.map((p: any) => (
                                            <TooltipProvider key={p.candidate_id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-muted/10">
                                                            <AvatarFallback className="text-xs bg-slate-900 text-white font-bold">
                                                                {p.candidates.name[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </TooltipTrigger>
                                                    <TooltipContent>{p.candidates.name}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-lg font-bold flex items-center gap-2 truncate">
                                            {participants.length > 1
                                                ? `${participants[0].candidates.name} + ${participants.length - 1} more`
                                                : participants[0]?.candidates.name || 'Unknown Candidate'}
                                        </h3>
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            {interview.positions?.position_name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Interview Panel */}
                            <div className="flex items-center gap-3 border-t pt-4">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Panel</span>
                                <div className="flex items-center gap-2">
                                    {panel.map((m: any) => (
                                        <TooltipProvider key={m.user_id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Avatar className="h-7 w-7 ring-2 ring-primary/5">
                                                        <AvatarImage src={m.profiles?.avatar_url} />
                                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                                            {m.profiles?.name?.[0] || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent>{m.profiles?.name || 'Collaborator'}</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                    {panel.length === 0 && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 italic">
                                            <Users className="h-3 w-3" />
                                            Needs Assignment
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center">
                            {/* Join Meeting - Simplified Truthy Check */}
                            {!!interview.meeting_link && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-10 px-4 gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black shadow-lg hover:shadow-xl transition-all border-2 border-white/20"
                                    onClick={() => {
                                        const url = String(interview.meeting_link).startsWith('http') ? String(interview.meeting_link) : `https://${interview.meeting_link}`;
                                        window.open(url, '_blank');
                                    }}
                                >
                                    <Video className="h-4 w-4" />
                                    JOIN MEETING
                                </Button>
                            )}

                            {interview.status === 'scheduled' && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-2 text-green-600 border-green-200 hover:bg-green-50 rounded-lg font-bold"
                                        onClick={() => onStatusChange(interview.id, 'completed')}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Complete
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-2 text-red-600 border-red-200 hover:bg-red-50 rounded-lg font-bold"
                                        onClick={() => onStatusChange(interview.id, 'cancelled')}
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            )}

                            {/* Actions Dropdown (The Three Dots) */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-lg border-2 border-slate-100 hover:bg-slate-50 transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none ring-1 ring-black/5">
                                    <DropdownMenuItem
                                        className="rounded-xl gap-3 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 py-3 transition-colors"
                                        onClick={() => {
                                            if (window.confirm('🚨 PERMANENTLY delete this interview?')) {
                                                deleteInterview.mutate(interview.id);
                                            }
                                        }}
                                    >
                                        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm">Delete Permanently</div>
                                            <div className="text-[10px] opacity-70">Remove from system</div>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Feedback & Notes Actions */}
                            <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-9 gap-2 font-bold rounded-lg px-3">
                                        <Plus className="h-4 w-4" />
                                        Notes
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
                                    <Button variant="ghost" size="sm" className="h-9 gap-2 font-bold rounded-lg px-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                        <Plus className="h-4 w-4" />
                                        Rate
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
                                                <p className="text-amber-700/60 text-xs font-bold uppercase tracking-wider">Evaluation for {participants[0]?.candidates.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <ScorecardForm
                                            candidateId={participants[0]?.candidate_id}
                                            onSuccess={() => setIsScorecardOpen(false)}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
