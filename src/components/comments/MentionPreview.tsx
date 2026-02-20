import React, { useState } from 'react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, ExternalLink, Loader2, Info } from "lucide-react";
import { getInitials } from "@/utils/user";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { CandidateProfileHeader } from '@/components/candidates/CandidateProfileHeader';
import { CandidateDetailTabs } from '@/components/candidates/CandidateDetailTabs';
import { Candidate } from '@/hooks/useCandidates';
import { useUpdateCandidateStatus } from '@/hooks/useCandidates';

interface MentionPreviewProps {
    username: string; // The tag (e.g. Aryan#1234)
    children: React.ReactNode;
}

interface MentionData {
    name: string;
    type: 'team' | 'candidate';
    id: string;
    candidateData?: Candidate;
    role?: string;
    status?: string;
}

export const MentionPreview = ({ username, children }: MentionPreviewProps) => {
    const { company } = useAuth();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Fetch user/candidate details when hovering
    const { data, isLoading } = useQuery({
        queryKey: ['mention-resolve', username],
        queryFn: async (): Promise<MentionData | null> => {
            if (!username) return null;

            // 1. Check unified profiles first (Covers all users: Owners, Team Members, Admins)
            const profileQuery = supabase
                .from('profiles')
                .select('id, name, email, mention_tag')
                .ilike('mention_tag', username);

            const { data: profiles, error: profileError } = await profileQuery.limit(1);

            if (profileError) {
                console.error('[MentionPreview] Profile resolution error:', profileError);
            }

            if (profiles && profiles.length > 0) {
                const profile = profiles[0];

                // Get role from team_members if possible to show in preview
                const { data: teamRole } = await supabase
                    .from('team_members')
                    .select('role')
                    .eq('user_id', profile.id)
                    .maybeSingle();

                return {
                    id: profile.id,
                    name: profile.name || username.split('#')[0],
                    type: 'team', // Display style
                    role: teamRole?.role || 'Team Member'
                };
            }

            // 2. Fallback to candidates
            const candidateQuery = supabase
                .from('candidates')
                .select('*')
                .ilike('mention_tag', username);

            const { data: candidates, error: candError } = await candidateQuery.limit(1);

            if (candError) {
                console.error('[MentionPreview] Candidate resolution error:', candError);
            }

            if (candidates && candidates.length > 0) {
                const candidate = candidates[0];
                return {
                    id: candidate.id,
                    name: candidate.name,
                    type: 'candidate',
                    status: candidate.status,
                    candidateData: candidate as Candidate
                };
            }

            console.warn(`[MentionPreview] No match found for tag: ${username}`);
            return null;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    });

    // Use the status update hook for the candidate detail tabs if needed
    const updateStatus = useUpdateCandidateStatus(data?.candidateData?.position_id);

    const handleViewProfile = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!data) {
            if (isLoading) {
                toast.info("Loading profile details...", { id: "mention-loading" });
            } else {
                toast.error("Could not find profile details for this mention.");
            }
            return;
        }

        setIsSheetOpen(true);
    };

    return (
        <>
            <HoverCard openDelay={200} closeDelay={200}>
                <HoverCardTrigger asChild>
                    <span
                        className="text-blue-600 font-semibold hover:underline cursor-pointer inline-flex items-center gap-0.5 transition-colors duration-200"
                        onClick={handleViewProfile}
                    >
                        {children}
                    </span>
                </HoverCardTrigger>
                <HoverCardContent className="w-80 shadow-xl border-border/50 bg-background/95 backdrop-blur-sm animate-in fade-in zoom-in-95 z-[60]">
                    <div className="flex justify-between space-x-4">
                        <Avatar className="h-12 w-12 border shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                {getInitials(data?.name || username.split('#')[0])}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold">@{username}</h4>
                                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                            </div>

                            {data ? (
                                <>
                                    <p className="text-xs font-medium text-foreground">
                                        {data.name}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {data.type === 'team'
                                            ? `${data.role} • Organization`
                                            : `Candidate • Status: ${data.status}`}
                                    </p>
                                    <div className="flex items-center pt-3">
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs gap-1 font-bold text-primary hover:no-underline"
                                            onClick={handleViewProfile}
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Open Sidebar View
                                        </Button>
                                    </div>
                                </>
                            ) : !isLoading && (
                                <p className="text-[11px] text-muted-foreground pt-1">
                                    No profile details found for this tag.
                                </p>
                            )}
                        </div>
                    </div>
                </HoverCardContent>
            </HoverCard>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-xl p-0 flex flex-col h-full border-l shadow-2xl overflow-hidden">
                    <SheetHeader className="sr-only">
                        <SheetTitle>
                            {data?.name ? `Profile: ${data.name}` : `Loading profile for @${username}`}
                        </SheetTitle>
                        <SheetDescription>
                            Profile preview and candidate details for mentioned user.
                        </SheetDescription>
                    </SheetHeader>

                    {data?.type === 'candidate' && data.candidateData ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <CandidateProfileHeader candidate={data.candidateData} />
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <CandidateDetailTabs
                                    candidate={data.candidateData}
                                    onEdit={() => { }} // Could link to edit form if needed
                                    onDelete={() => { }}
                                    onStatusChange={(c, status) => updateStatus.mutate({ id: c.id, status })}
                                    companyId={company?.id}
                                />
                            </div>
                        </div>
                    ) : data?.type === 'team' ? (
                        <div className="flex flex-col h-full">
                            <SheetHeader className="p-6 border-b bg-muted/30">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-16 w-16 border-4 border-background shadow-sm">
                                        <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                                            {getInitials(data.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <SheetTitle className="text-2xl font-bold">{data.name}</SheetTitle>
                                        <p className="text-sm text-muted-foreground font-medium">@{username}</p>
                                    </div>
                                </div>
                            </SheetHeader>
                            <div className="p-10 flex flex-col items-center justify-center space-y-4 text-center">
                                <div className="p-4 rounded-full bg-primary/5">
                                    <User className="h-12 w-12 text-primary/40" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">{data.role}</h3>
                                    <p className="text-sm text-muted-foreground max-w-[280px]">
                                        This team member is part of your organization. Full profile details and activity history are coming soon.
                                    </p>
                                </div>
                                <Button variant="outline" className="mt-4" onClick={() => setIsSheetOpen(false)}>
                                    Close Preview
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                            <p className="text-sm text-muted-foreground">Loading sidebar preview...</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
};
