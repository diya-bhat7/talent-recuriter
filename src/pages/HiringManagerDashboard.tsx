
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { notifyCandidateStatusChanged } from '@/services/notifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { ReviewCandidateCard } from '@/components/dashboard/ReviewCandidateCard';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Calendar, Briefcase, Users, ChevronRight, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HiringManagerDashboard() {
    const { user, company } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // 1. Fetch Candidates to Review (New or Screening status)
    const { data: candidatesToReview, isLoading: loadingCandidates } = useQuery({
        queryKey: ['candidates', 'to-review'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('candidates')
                .select(`
          id, name, status, created_at,
          position:positions(id, position_name)
        `)
                .in('status', ['new', 'screening'])
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            return data;
        }
    });

    // 2. Fetch Upcoming Interviews (Mocked for now until table is live/populated)
    const { data: upcomingInterviews, isLoading: loadingInterviews } = useQuery({
        queryKey: ['interviews', 'upcoming'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('interviews')
                .select(`
           id, scheduled_at, meeting_link,
           interview_candidates(candidate_id, candidates(name)),
           position:positions(position_name)
         `)
                .gte('scheduled_at', new Date().toISOString())
                .order('scheduled_at', { ascending: true })
                .limit(5);

            if (error) throw error;

            return data.map((item: any) => ({
                id: item.id,
                candidate: item.interview_candidates?.[0]?.candidates?.name || 'Multiple/Unknown',
                position: item.position?.position_name,
                time: item.scheduled_at,
                meeting_link: item.meeting_link
            }));
        }
    });

    // 3. Fetch My Open Positions
    const { data: myPositions, isLoading: loadingPositions } = useQuery({
        queryKey: ['my-positions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('positions')
                .select('id, position_name, status, num_roles, candidates(count)')
                .eq('status', 'active')
                .limit(3);

            if (error) throw error;
            return data;
        }
    });

    const handleReview = (id: string) => {
        // Open candidate detail modal (reuse existing logic or route)
        // For now, maybe just navigate to the candidates page with a filter?
        // Or ideally, open the modal directly.
        navigate(`/candidates?id=${id}`);
    };

    const handlePass = async (id: string) => {
        try {
            // Get candidate info before update
            const { data: candidate } = await supabase
                .from('candidates')
                .select('name, status')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('candidates')
                .update({ status: 'interview', updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;

            toast({ title: 'Candidate passed', description: 'Moved to interview stage.' });
            queryClient.invalidateQueries({ queryKey: ['candidates', 'to-review'] });
            queryClient.invalidateQueries({ queryKey: ['positions'] });

            // Notify team (fire-and-forget)
            if (company?.id && user?.id && candidate) {
                notifyCandidateStatusChanged({
                    companyId: company.id,
                    actorUserId: user.id,
                    actorName: user.user_metadata?.full_name || user.email || 'User',
                    candidateId: id,
                    candidateName: candidate.name,
                    oldStatus: candidate.status,
                    newStatus: 'interview',
                }).catch(() => { });
            }
        } catch (err: any) {
            toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
        }
    };

    const handleReject = async (id: string) => {
        try {
            // Get candidate info before update
            const { data: candidate } = await supabase
                .from('candidates')
                .select('name, status')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('candidates')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;

            toast({ title: 'Candidate rejected', description: 'Candidate has been rejected.' });
            queryClient.invalidateQueries({ queryKey: ['candidates', 'to-review'] });
            queryClient.invalidateQueries({ queryKey: ['positions'] });

            // Notify team (fire-and-forget)
            if (company?.id && user?.id && candidate) {
                notifyCandidateStatusChanged({
                    companyId: company.id,
                    actorUserId: user.id,
                    actorName: user.user_metadata?.full_name || user.email || 'User',
                    candidateId: id,
                    candidateName: candidate.name,
                    oldStatus: candidate.status,
                    newStatus: 'rejected',
                }).catch(() => { });
            }
        } catch (err: any) {
            toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
        }
    };


    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Good morning, {company?.contact_name?.split(' ')[0] || 'User'}
                        </h1>
                        <p className="text-muted-foreground mt-1">Here's what needs your attention today.</p>
                    </div>
                    <Button onClick={() => navigate('/positions/new')}>
                        <Briefcase className="mr-2 h-4 w-4" />
                        Post New Job
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Candidates to Review (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Candidates to Review
                                </h2>
                                <Button variant="link" className="text-primary" onClick={() => navigate('/candidates')}>
                                    View all
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {loadingCandidates ? (
                                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
                                ) : candidatesToReview && candidatesToReview.length > 0 ? (
                                    candidatesToReview.map((candidate: any) => (
                                        <ReviewCandidateCard
                                            key={candidate.id}
                                            candidate={candidate}
                                            onReview={handleReview}
                                            onPass={handlePass}
                                            onReject={handleReject}
                                        />
                                    ))
                                ) : (
                                    <Card className="bg-muted/50 border-dashed">
                                        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                                            <p className="text-muted-foreground">No new candidates to review!</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </section>

                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                    My Active Positions
                                </h2>
                                <Button variant="link" className="text-primary" onClick={() => navigate('/dashboard')}>
                                    View Dashboard
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loadingPositions ? (
                                    [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
                                ) : myPositions?.map((pos: any) => (
                                    <Card key={pos.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(`/positions/${pos.id}/candidates`)}>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base font-medium truncate">{pos.position_name}</CardTitle>
                                            <CardDescription>{pos.num_roles} opening{pos.num_roles !== 1 ? 's' : ''}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex justify-between items-center">
                                                <span className="text-2xl font-bold">{pos.candidates[0]?.count || 0}</span>
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Candidates</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: Upcoming Interviews & Summary */}
                    <div className="space-y-6">
                        <section>
                            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                                <Calendar className="h-5 w-5 text-primary" />
                                Upcoming Interviews
                            </h2>
                            <Card>
                                <CardContent className="p-0">
                                    {loadingInterviews ? (
                                        <div className="p-4 space-y-3">
                                            <Skeleton className="h-12 w-full" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    ) : upcomingInterviews && upcomingInterviews.length > 0 ? (
                                        <div className="divide-y">
                                            {upcomingInterviews.map((interview: any) => (
                                                <div key={interview.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-3">
                                                    <div className="bg-primary/10 text-primary p-2 rounded-md flex-shrink-0 text-center min-w-[3rem]">
                                                        <div className="text-xs font-bold uppercase">{format(new Date(interview.time), 'MMM')}</div>
                                                        <div className="text-lg font-bold leading-none">{format(new Date(interview.time), 'd')}</div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{interview.candidate}</div>
                                                        <div className="text-xs text-muted-foreground mb-1">{interview.position}</div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs font-medium flex items-center text-primary">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {format(new Date(interview.time), 'h:mm a')}
                                                            </div>
                                                            {String(interview.meeting_link || '').trim().length > 0 && (
                                                                <Button
                                                                    variant="link"
                                                                    className="h-auto p-0 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                                                    onClick={() => {
                                                                        const rawUrl = String(interview.meeting_link || '').trim();
                                                                        const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
                                                                        window.open(url, '_blank');
                                                                    }}
                                                                >
                                                                    Join Meet
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-muted-foreground text-sm">
                                            No upcoming interviews.
                                        </div>
                                    )}
                                    <div className="p-2 border-t bg-muted/20">
                                        <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                                            View Calendar <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        {/* Helpful Tip or Quick Stat */}
                        <Card className="bg-slate-900 text-white border-none overflow-hidden relative">
                            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
                            <CardContent className="p-6 relative z-10">
                                <h3 className="font-semibold mb-2">Pro Tip</h3>
                                <p className="text-sm text-slate-300 mb-4">
                                    You can mention @colleagues in candidate notes to get their quick feedback.
                                </p>
                                <Button size="sm" variant="secondary" className="w-full">
                                    Learn more
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
