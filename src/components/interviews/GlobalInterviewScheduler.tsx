import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { InterviewScheduler } from './InterviewScheduler';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalInterviewSchedulerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function GlobalInterviewScheduler({ open, onOpenChange }: GlobalInterviewSchedulerProps) {
    const { company } = useAuth();
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

    // Fetch all candidates for the selector
    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ['all-candidates-list', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data, error } = await supabase
                .from('candidates')
                .select(`
                    id,
                    name,
                    email,
                    position_id,
                    positions!inner(position_name)
                `)
                .order('name');
            if (error) throw error;
            return data.map(c => ({
                ...c,
                position_name: (c.positions as any).position_name
            }));
        },
        enabled: !!company?.id && open,
    });

    const reset = () => {
        setSelectedCandidate(null);
    };

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen);
        if (!newOpen) setTimeout(reset, 300); // Reset after animation
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                {!selectedCandidate ? (
                    <div className="flex flex-col h-[500px]">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Search className="h-6 w-6 text-primary" />
                                Find Candidate
                            </DialogTitle>
                            <DialogDescription>
                                Search across all job positions to schedule an interview.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden p-4 pt-0">
                            <Command className="rounded-2xl border bg-muted/20">
                                <CommandInput placeholder="Search by name, email, or position..." className="h-12" />
                                <CommandList className="max-h-[350px]">
                                    <CommandEmpty>No candidates found.</CommandEmpty>
                                    <CommandGroup heading="Candidates">
                                        {candidates.map((candidate) => (
                                            <CommandItem
                                                key={candidate.id}
                                                onSelect={() => setSelectedCandidate(candidate)}
                                                className="p-3 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>{candidate.name.split(' ').map((n: any) => n[0]).join('')}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold truncate text-foreground">{candidate.name}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                                                    </div>
                                                    <Badge variant="outline" className="gap-1 px-2 whitespace-nowrap">
                                                        <Building2 className="h-3 w-3" />
                                                        {candidate.position_name}
                                                    </Badge>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <DialogHeader className="p-6 border-b bg-muted/30">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setSelectedCandidate(null)}
                                    className="h-8 w-8 rounded-full"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <DialogTitle className="text-xl font-black uppercase tracking-tight">
                                        Schedule: {selectedCandidate.name}
                                    </DialogTitle>
                                    <DialogDescription className="flex items-center gap-1.5 font-medium text-xs">
                                        <Building2 className="h-3 w-3" />
                                        {selectedCandidate.position_name}
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-8">
                            <InterviewScheduler
                                candidateId={selectedCandidate.id}
                                candidateName={selectedCandidate.name}
                                positionId={selectedCandidate.position_id}
                                onSuccess={() => handleOpenChange(false)}
                            />
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
