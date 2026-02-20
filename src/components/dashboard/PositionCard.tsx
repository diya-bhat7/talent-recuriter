import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    MapPin,
    Users,
    Calendar as CalendarIcon,
    Briefcase,
    Clock,
    Edit,
    Building2,
    UserSearch,
    FileText,
    ClipboardList,
    MoreHorizontal,
    CheckCircle2,
    Calendar,
    RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { candidateKeys } from '@/hooks/useCandidates';
import { supabase } from '@/integrations/supabase/client';
import { LastUpdated } from '@/components/ui/RelativeTime';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { useState } from 'react';

type Position = Database['public']['Tables']['positions']['Row'];

interface PositionCardProps {
    position: Position;
    onEdit: (position: Position) => void;
    searchQuery?: string;
    index?: number;
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
    if (!query || !text) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5">{part}</mark>
                ) : (
                    part
                )
            )}
        </>
    );
}

const priorityColors: Record<string, string> = {
    Critical: 'bg-red-500/10 text-red-600 border-red-200',
    High: 'bg-orange-500/10 text-orange-600 border-orange-200',
    Medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    Low: 'bg-green-500/10 text-green-600 border-green-200',
};

const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    closed: 'bg-slate-500/10 text-slate-600 border-slate-200',
};

const categoryIcons: Record<string, string> = {
    Engineering: '💻',
    'Product Management': '📊',
    'UX Design': '🎨',
    QA: '🧪',
    SRE: '🔧',
    DevOps: '⚙️',
};

export function PositionCard({ position, onEdit, searchQuery, index }: PositionCardProps) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Modal states
    const [jdPreviewOpen, setJdPreviewOpen] = useState(false);
    const [interviewPrepOpen, setInterviewPrepOpen] = useState(false);

    // Quick Edit State
    const [isUpdating, setIsUpdating] = useState(false);

    // Airtable Sync State
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const handleSyncToAirtable = async () => {
        setIsSyncing(true);
        setSyncSuccess(false);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await supabase.functions.invoke('sync-positions-to-airtable', {
                body: { position_id: position.id },
                headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
            });
            if (res.error) {
                const detail = res.data?.detail || res.data?.error || res.error.message;
                throw new Error(detail);
            }
            if (res.data?.errors?.length > 0) {
                throw new Error(`Airtable error: ${res.data.errors[0]}`);
            }
            setSyncSuccess(true);
            toast({
                title: '✅ Synced to Airtable',
                description: `${position.position_name} has been synced successfully.`,
            });
            setTimeout(() => setSyncSuccess(false), 3000);
        } catch (err) {
            console.error('Airtable sync error:', err);
            toast({
                title: 'Sync Failed',
                description: err instanceof Error ? err.message : 'Could not sync to Airtable.',
                variant: 'destructive',
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleQuickUpdate = async (updates: Partial<Position>) => {
        setIsUpdating(true);
        const { error } = await supabase
            .from('positions')
            .update(updates)
            .eq('id', position.id);

        if (error) {
            console.error('Error updating position:', error);
        } else {
            // Invalidate to refresh UI
            queryClient.invalidateQueries({ queryKey: ['positions'] });
        }
        setIsUpdating(false);
    };



    // Fetch candidate count for this position
    const { data: candidateCount = 0 } = useQuery({
        queryKey: ['candidate-count', position.id],
        queryFn: async () => {
            const { count } = await supabase
                .from('candidates')
                .select('*', { count: 'exact', head: true })
                .eq('position_id', position.id);
            return count || 0;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // Prefetch candidates when hovering over a position card
    const prefetchCandidates = () => {
        queryClient.prefetchQuery({
            queryKey: candidateKeys.list(position.id),
            queryFn: async () => {
                const { data } = await supabase
                    .from('candidates')
                    .select('*')
                    .eq('position_id', position.id)
                    .order('created_at', { ascending: false });
                return data || [];
            },
            staleTime: 1000 * 60 * 5, // 5 minutes
        });
    };

    return (
        <Card
            className="group hover:shadow-xl transition-all duration-500 border-border/40 hover:border-primary/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 bg-accent/40 backdrop-blur-sm"
            style={{
                animationDelay: index ? `${index * 100}ms` : '0ms',
                boxShadow: '0 10px 30px -10px rgba(0, 45, 86, 0.08)'
            }}
            onMouseEnter={prefetchCandidates}
        >
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl drop-shadow-sm">{categoryIcons[position.category] || '📋'}</span>
                            <Badge
                                variant="secondary"
                                className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-accent text-primary border-2 border-primary/10 rounded-full shadow-md group-hover:bg-white group-hover:border-primary/20 transition-all duration-300"
                            >
                                <HighlightedText text={position.category} query={searchQuery} />
                            </Badge>
                        </div>
                        <h3 className="font-black text-2xl text-primary tracking-tight mb-1 group-hover:translate-x-1 transition-transform duration-300">
                            <HighlightedText text={position.position_name} query={searchQuery} />
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge className={`${priorityColors[position.priority] || priorityColors.Medium} border-none text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md shadow-sm`}>
                            {position.priority}
                        </Badge>
                        <Badge className={`${statusColors[position.status || 'draft']} border-none text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md shadow-sm`}>
                            {position.status || 'draft'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pb-6 space-y-4">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4 text-primary/80">
                        <div className="w-6 flex justify-center">
                            <Briefcase className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <span className="text-md font-bold text-slate-700">{position.min_experience} - {position.max_experience} years</span>
                    </div>

                    <div className="flex items-center gap-4 text-primary/80">
                        <div className="w-6 flex justify-center">
                            <Building2 className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <span className="text-md font-bold text-slate-700">{position.work_type}</span>
                    </div>
                </div>

                {position.preferred_locations && position.preferred_locations.length > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="w-6 flex justify-center">
                            <MapPin className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {position.preferred_locations.slice(0, 3).map((location, idx) => (
                                <span key={idx} className="text-md font-bold text-slate-700">
                                    {location}{idx < Math.min(position.preferred_locations.length, 3) - 1 ? ',' : ''}
                                </span>
                            ))}
                            {position.preferred_locations.length > 3 && (
                                <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground self-center">
                                    +{position.preferred_locations.length - 3} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {position.hiring_start_date && (
                    <div className="flex items-center gap-4 text-primary/80">
                        <div className="w-6 flex justify-center">
                            <CalendarIcon className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors duration-300" />
                        </div>
                        <span className="text-md font-bold text-slate-700">Hiring from {format(new Date(position.hiring_start_date), 'MMM d, yyyy')}</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="pt-5 border-t border-border/30 flex flex-wrap items-center gap-3 bg-white/30">
                {/* Hired Count Progress - Sky Blue Pill */}
                <Badge
                    variant="secondary"
                    className={cn(
                        "h-10 px-6 gap-2 text-sm font-black rounded-full border-none shadow-md hover:shadow-lg transition-all",
                        position.hired_count && position.hired_count >= position.num_roles
                            ? "bg-green-100 text-green-700"
                            : "bg-accent text-primary group-hover:bg-white"
                    )}
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {position.hired_count || 0} / {position.num_roles} Hired
                </Badge>

                {/* Closing Date / Deadline */}
                {position.closing_date && (
                    <Badge variant="outline" className="h-10 gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-2 border-dashed border-border/40 rounded-xl px-4">
                        <Clock className="h-3 w-3" />
                        Due {format(new Date(position.closing_date), 'MMM d')}
                    </Badge>
                )}

                {/* Quick Edit Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted ml-1" disabled={isUpdating}>
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                        <div className="space-y-4">
                            <h4 className="font-medium leading-none">Quick Update</h4>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status</label>
                                <Select
                                    defaultValue={position.status || 'draft'}
                                    onValueChange={(val) => handleQuickUpdate({ status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Closing Date</label>
                                <CalendarComponent
                                    mode="single"
                                    selected={position.closing_date ? new Date(position.closing_date) : undefined}
                                    onSelect={(date) => handleQuickUpdate({
                                        closing_date: date ? format(date, 'yyyy-MM-dd') : null
                                    })}
                                    initialFocus
                                />
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="flex-1" />

                {/* JD Preview button - only show if JD exists */}
                {(position.generated_jd || position.client_jd_text || position.client_jd_file_url) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="group-hover:bg-green-500/10 transition-colors text-green-600"
                        onClick={() => setJdPreviewOpen(true)}
                    >
                        <FileText className="h-4 w-4 mr-1" />
                        JD
                    </Button>
                )}

                {/* Interview Prep button - only show if prep doc exists */}
                {position.interview_prep_doc && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="group-hover:bg-purple-500/10 transition-colors text-purple-600"
                        onClick={() => setInterviewPrepOpen(true)}
                    >
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Prep
                    </Button>
                )}

                <Button
                    variant="ghost"
                    size="sm"
                    className="group-hover:bg-blue-500/10 transition-colors text-blue-600"
                    onClick={() => navigate(`/positions/${position.id}/candidates`)}
                >
                    <UserSearch className="h-4 w-4 mr-2" />
                    Candidates ({candidateCount})
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`transition-colors ${syncSuccess
                        ? 'text-green-600 group-hover:bg-green-500/10'
                        : 'text-orange-500 group-hover:bg-orange-500/10'
                        }`}
                    onClick={handleSyncToAirtable}
                    disabled={isSyncing}
                    title="Sync this position to Airtable"
                >
                    {isSyncing ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : syncSuccess ? (
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                    ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    {syncSuccess ? 'Synced!' : 'Airtable'}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto group-hover:bg-primary/10 transition-colors"
                    onClick={() => onEdit(position)}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            </CardFooter>

            {/* Document Preview Modals */}
            <DocumentPreviewModal
                open={jdPreviewOpen}
                onOpenChange={setJdPreviewOpen}
                title={`${position.position_name} - Job Description`}
                content={position.generated_jd || position.client_jd_text}
                fileUrl={position.client_jd_file_url}
                type="jd"
            />
            <DocumentPreviewModal
                open={interviewPrepOpen}
                onOpenChange={setInterviewPrepOpen}
                title={`${position.position_name} - Interview Prep`}
                content={position.interview_prep_doc}
                fileUrl={null}
                type="interview_prep"
            />
        </Card>
    );
}
