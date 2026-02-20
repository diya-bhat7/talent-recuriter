import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Search,
    Briefcase,
    Users,
    Plus,
    ArrowRight,
} from "lucide-react";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/useAuth";
import { usePositions } from "@/hooks/usePositions";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function CommandMenu() {
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();
    const { company } = useAuth();
    const { data: positions = [] } = usePositions();

    // Fetch recent candidates
    const { data: recentCandidates = [] } = useQuery({
        queryKey: ['recent-candidates-search', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data } = await supabase
                .from('candidates')
                .select('id, name, status, positions(position_name)')
                .order('updated_at', { ascending: false })
                .limit(10);
            return data || [];
        },
        enabled: !!company?.id,
    });

    // Fetch team members
    const { data: teamMembers = [] } = useQuery({
        queryKey: ['team-members-search', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data } = await supabase
                .from('team_members')
                .select('id, user_id, role, profiles(full_name)')
                .eq('company_id', company.id)
                .limit(5);
            return data || [];
        },
        enabled: !!company?.id,
    });

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList className="max-h-[450px]">
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Suggestions">
                    <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Search Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/candidates"))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>All Candidates</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/positions/new"))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Add New Position</span>
                    </CommandItem>
                </CommandGroup>

                {positions.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Active Positions">
                            {positions.slice(0, 5).map((pos) => (
                                <CommandItem
                                    key={pos.id}
                                    onSelect={() => runCommand(() => navigate(`/positions/${pos.id}/edit`))}
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <span>{pos.position_name}</span>
                                    <CommandShortcut className="text-[10px] uppercase font-bold text-primary/60">
                                        {pos.status}
                                    </CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {recentCandidates.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Recent Candidates">
                            {recentCandidates.map((candidate: any) => (
                                <CommandItem
                                    key={candidate.id}
                                    onSelect={() => runCommand(() => navigate(`/candidates`))}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{candidate.name}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {candidate.positions?.position_name || 'No Position'}
                                        </span>
                                    </div>
                                    <CommandShortcut>
                                        <ArrowRight className="h-3 w-3 opacity-50" />
                                    </CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {teamMembers.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="Team">
                            {teamMembers.map((member: any) => (
                                <CommandItem
                                    key={member.id}
                                    onSelect={() => runCommand(() => navigate("/settings/team"))}
                                >
                                    <Shield className="mr-2 h-4 w-4" />
                                    <span>{member.profiles?.full_name || 'Teammate'}</span>
                                    <CommandShortcut className="text-[9px] font-black uppercase text-slate-400">
                                        {member.role}
                                    </CommandShortcut>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                <CommandSeparator />
                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}

// Re-using Shield icon for team as others are imported
import { Shield } from "lucide-react";
