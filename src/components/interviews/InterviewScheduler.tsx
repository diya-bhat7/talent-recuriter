import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useScheduleInterview } from '@/hooks/useInterviews';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Calendar as CalendarIcon,
    Clock,
    Link as LinkIcon,
    Video,
    User,
    CheckCircle2,
    Star,
    Plus,
    X,
    Users,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMinutes } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCandidates } from '@/hooks/useCandidates';

interface InterviewSchedulerProps {
    candidateId: string;
    candidateName: string;
    positionId: string;
    onSuccess?: () => void;
    onStartInterview?: (guideId: string) => void;
}

type InterviewType = 'screening' | 'technical' | 'cultural' | 'final';

export function InterviewScheduler({ candidateId, candidateName, positionId, onSuccess, onStartInterview }: InterviewSchedulerProps) {
    const { user, company } = useAuth();
    const scheduleInterview = useScheduleInterview();

    // Secondary candidates for group interviews
    const [extraCandidateIds, setExtraCandidateIds] = useState<string[]>([]);
    // Panel members for multi-interviewer sessions
    const [panelMemberIds, setPanelMemberIds] = useState<string[]>(user ? [user.id] : []);
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
    const [collaboratorSearch, setCollaboratorSearch] = useState('');

    // Fetch team members for panel selection
    const { data: teamMembers = [] } = useQuery({
        queryKey: ['team-members', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data, error } = await supabase
                .from('team_members')
                .select('user_id, name, email')
                .eq('company_id', company.id);
            if (error) throw error;
            return data;
        },
        enabled: !!company?.id,
    });

    // Search for external collaborators in profiles
    const { data: profileResults = [] } = useQuery({
        queryKey: ['profiles-search', collaboratorSearch],
        queryFn: async () => {
            if (collaboratorSearch.length < 3) return [];
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, avatar_url, email')
                .or(`name.ilike.%${collaboratorSearch}%,email.ilike.%${collaboratorSearch}%`)
                .limit(5);
            if (error) throw error;
            return data as any[];
        },
        enabled: collaboratorSearch.length >= 3,
    });

    // Fetch other candidates for this position for group interviews
    const { data: otherCandidates = [] } = useCandidates(positionId);

    const availableExtraCandidates = useMemo(() =>
        (otherCandidates || []).filter(c => c.id !== candidateId && !extraCandidateIds.includes(c.id)),
        [otherCandidates, candidateId, extraCandidateIds]);

    const { data: guides } = useQuery({
        queryKey: ['interview_guides'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('interview_guides')
                .select('id, title');
            if (error) throw error;
            return data;
        },
    });

    const [selectedGuideId, setSelectedGuideId] = useState<string>('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [time, setTime] = useState('10:00');
    const [duration, setDuration] = useState(45);
    const [type, setType] = useState<InterviewType>('technical');
    const [link, setLink] = useState('');

    const handleSubmit = async () => {
        if (!user) return;

        const scheduledAt = new Date(`${date}T${time}:00`);
        if (isNaN(scheduledAt.getTime())) {
            alert('Please select a valid date and time');
            return;
        }

        try {
            await scheduleInterview.mutateAsync({
                interview: {
                    position_id: positionId,
                    interview_type: type,
                    scheduled_at: scheduledAt.toISOString(),
                    duration_minutes: duration,
                    meeting_link: link || null,
                    status: 'scheduled',
                } as any,
                candidateIds: [candidateId, ...extraCandidateIds],
                interviewerIds: panelMemberIds,
            });

            if (onSuccess) onSuccess();
        } catch (error) {
            // Error is handled by the hook's toast
        }
    };

    const types: { value: InterviewType; label: string; icon: any; color: string }[] = [
        { value: 'screening', label: 'Screening', icon: User, color: 'text-blue-500' },
        { value: 'technical', label: 'Technical', icon: Video, color: 'text-purple-500' },
        { value: 'cultural', label: 'Cultural', icon: CheckCircle2, color: 'text-emerald-500' },
        { value: 'final', label: 'Final', icon: Star, color: 'text-amber-500' },
    ];

    const generateCalendarLink = (platform: 'google' | 'outlook') => {
        const start = new Date(`${date}T${time}:00`);
        if (isNaN(start.getTime())) return '#';

        const end = addMinutes(start, duration);
        const title = `${type.toUpperCase()} Interview: ${candidateName}${extraCandidateIds.length > 0 ? ` + ${extraCandidateIds.length} more` : ''}`;
        const details = `Interview for participants. Meeting Link: ${link || 'TBD'}`;

        const formatGCalTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');

        if (platform === 'google') {
            return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCalTime(start)}/${formatGCalTime(end)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(link || '')}`;
        } else {
            return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(details)}&startdt=${start.toISOString()}&enddt=${end.toISOString()}&location=${encodeURIComponent(link || '')}`;
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Participants Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Candidates</Label>
                    {availableExtraCandidates.length > 0 && (
                        <Select onValueChange={(val) => setExtraCandidateIds(prev => [...prev, val])}>
                            <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold uppercase rounded-full">
                                <Plus className="h-3 w-3 mr-1" /> Add Group
                            </SelectTrigger>
                            <SelectContent>
                                {availableExtraCandidates.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="pl-1 pr-3 py-1 h-8 rounded-full bg-slate-900 text-white border-none gap-2">
                        <Avatar className="h-6 w-6 border-2 border-white/20">
                            <AvatarFallback className="text-[10px] bg-primary text-white">{candidateName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-bold">{candidateName}</span>
                    </Badge>
                    {extraCandidateIds.map(id => {
                        const c = otherCandidates.find(cand => cand.id === id);
                        return (
                            <Badge key={id} variant="outline" className="pl-1 pr-3 py-1 h-8 rounded-full gap-2 group hover:border-destructive transition-colors">
                                <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px]">{c?.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-[11px] font-bold">{c?.name}</span>
                                <X
                                    className="h-3 w-3 text-slate-400 cursor-pointer hover:text-destructive"
                                    onClick={() => setExtraCandidateIds(prev => prev.filter(p => p !== id))}
                                />
                            </Badge>
                        );
                    })}
                </div>
            </div>

            {/* Panel Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-400 text-primary">Interview Panel</Label>
                    <div className="flex gap-2">
                        {!isAddingCollaborator ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAddingCollaborator(true)}
                                className="h-8 text-[10px] font-bold uppercase rounded-full border-primary/20 text-primary"
                            >
                                <Search className="h-3 w-3 mr-1" /> External
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                <Input
                                    placeholder="Search email/name..."
                                    value={collaboratorSearch}
                                    onChange={(e) => setCollaboratorSearch(e.target.value)}
                                    className="h-8 w-[150px] text-[10px] rounded-full"
                                    autoFocus
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setIsAddingCollaborator(false);
                                        setCollaboratorSearch('');
                                    }}
                                    className="h-8 w-8 rounded-full"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                        <Select onValueChange={(val) => !panelMemberIds.includes(val) && setPanelMemberIds(prev => [...prev, val])}>
                            <SelectTrigger className="w-[120px] h-8 text-[10px] font-bold uppercase rounded-full border-primary/20 text-primary">
                                <Users className="h-3 w-3 mr-1" /> Team
                            </SelectTrigger>
                            <SelectContent>
                                {teamMembers.filter(m => !panelMemberIds.includes(m.user_id)).map(m => (
                                    <SelectItem key={m.user_id} value={m.user_id}>{m.name || m.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {isAddingCollaborator && profileResults.length > 0 && (
                    <div className="bg-muted/50 rounded-xl p-2 border border-dashed border-primary/20 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] font-black uppercase text-muted-foreground px-2 mb-1">External Results</p>
                        <div className="space-y-1">
                            {profileResults.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        if (!panelMemberIds.includes(p.id)) {
                                            setPanelMemberIds(prev => [...prev, p.id]);
                                        }
                                        setIsAddingCollaborator(false);
                                        setCollaboratorSearch('');
                                    }}
                                    className="flex items-center gap-2 w-full p-2 hover:bg-white rounded-lg transition-colors text-left"
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{p.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{p.email}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    {panelMemberIds.map(id => {
                        const m = teamMembers.find(member => member.user_id === id);
                        const p = profileResults.find(prof => prof.id === id);
                        const isSelf = id === user?.id;
                        return (
                            <Badge key={id} variant="outline" className={cn(
                                "pl-1 pr-3 py-1 h-9 rounded-full gap-2 transition-colors",
                                isSelf ? "border-primary bg-primary/5" : "hover:border-destructive"
                            )}>
                                <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-[10px]">{m?.name?.[0] || p?.name?.[0] || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-bold">{isSelf ? "You" : m?.name || p?.name || "Collaborator"}</span>
                                {!isSelf && (
                                    <X
                                        className="h-3 w-3 text-slate-400 cursor-pointer hover:text-destructive"
                                        onClick={() => setPanelMemberIds(prev => prev.filter(p => p !== id))}
                                    />
                                )}
                            </Badge>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-5">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Date</Label>
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            type="date"
                            className="pl-9 h-9 rounded-lg text-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Start Time</Label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                            type="time"
                            className="pl-9 h-9 rounded-lg text-sm"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Interview Type</Label>
                <div className="grid grid-cols-4 gap-2">
                    {types.map((t) => {
                        const Icon = t.icon;
                        const isSelected = type === t.value;
                        return (
                            <button
                                key={t.value}
                                onClick={() => setType(t.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-300",
                                    isSelected
                                        ? "bg-slate-900 border-slate-900 text-white scale-105 shadow-md"
                                        : "bg-white border-slate-100 hover:border-slate-200 text-slate-500"
                                )}
                            >
                                <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : t.color)} />
                                <span className="text-[9px] font-bold">{t.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Meeting Link</Label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <Input
                        placeholder="https://meet.google.com/..."
                        className="pl-9 h-9 rounded-lg text-sm"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                    />
                </div>
            </div>

            {guides && guides.length > 0 && (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest mb-2 block">Interview Guide Assistance</Label>
                    <div className="flex gap-2">
                        <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
                            <SelectTrigger className="flex-1 rounded-lg h-9 text-xs">
                                <SelectValue placeholder="Select guide..." />
                            </SelectTrigger>
                            <SelectContent>
                                {guides.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-lg font-bold h-9"
                            disabled={!selectedGuideId}
                            onClick={() => onStartInterview?.(selectedGuideId)}
                        >
                            Start
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                    href={generateCalendarLink('google')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition-all text-xs font-bold"
                >
                    <img src="https://www.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_31_2x.png" className="h-4 w-4" alt="GCal" />
                    Sync GCal
                </a>
                <a
                    href={generateCalendarLink('outlook')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-slate-100 hover:bg-slate-50 transition-all text-xs font-bold"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg" className="h-4 w-4" alt="Outlook" />
                    Sync Outlook
                </a>
            </div>

            <Button
                className="w-full h-11 text-md font-bold rounded-xl shadow-lg hover:shadow-xl transition-all bg-primary"
                onClick={handleSubmit}
                disabled={scheduleInterview.isPending}
            >
                {scheduleInterview.isPending ? "Scheduling..." : "Confirm & Schedule"}
            </Button>
        </div>
    );
}
