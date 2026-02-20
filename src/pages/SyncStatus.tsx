import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    ExternalLink,
    Search
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/hooks/use-toast';

interface Submission {
    id: string;
    name: string;
    email: string;
    sync_status: 'pending' | 'synced' | 'error';
    last_synced_at: string | null;
    airtable_id: string | null;
    created_at: string;
}

export default function SyncStatus() {
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const { data: submissions = [], isLoading, refetch } = useQuery({
        queryKey: ['submissions-sync'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Submission[];
        }
    });

    const filteredSubmissions = useMemo(() => {
        return submissions.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [submissions, searchQuery]);

    const stats = useMemo(() => {
        const total = submissions.length;
        const synced = submissions.filter(s => s.sync_status === 'synced').length;
        const pending = submissions.filter(s => s.sync_status === 'pending').length;
        const error = submissions.filter(s => s.sync_status === 'error').length;

        return { total, synced, pending, error };
    }, [submissions]);

    const handleRetrySync = async (submission: Submission) => {
        try {
            const { error: syncError } = await supabase.functions.invoke('sync-to-airtable', {
                body: {
                    id: submission.id,
                    name: submission.name,
                    email: submission.email,
                    source: 'retry'
                },
            });

            if (syncError) throw syncError;

            toast({
                title: 'Sync re-triggered',
                description: `Successfully re-triggered sync for ${submission.name}.`,
            });
            refetch();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            toast({
                title: 'Retry failed',
                description: errorMessage,
                variant: 'destructive',
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'synced':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Synced</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary" className="bg-slate-100 text-slate-600">Pending</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'synced':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-destructive" />;
            default:
                return <Clock className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Airtable Sync Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Monitor and manage your candidate submissions synchronization with Airtable.
                        </p>
                    </div>
                    <Button onClick={() => refetch()} variant="outline" className="gap-2">
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">Total Submissions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
                            <p className="text-xs text-muted-foreground">Successfully Synced</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-slate-500">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">Pending Sync</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-destructive">{stats.error}</div>
                            <p className="text-xs text-muted-foreground">Sync Errors</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="h-20" />
                            </Card>
                        ))
                    ) : filteredSubmissions.length === 0 ? (
                        <EmptyState
                            icon={Search}
                            title="No submissions found"
                            description={searchQuery ? `No results matching "${searchQuery}"` : "You haven't received any submissions yet."}
                            className="bg-card border rounded-lg py-12"
                        />
                    ) : (
                        filteredSubmissions.map((submission) => (
                            <Card key={submission.id} className="group hover:border-primary/20 transition-all duration-200">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {getStatusIcon(submission.sync_status)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{submission.name}</h3>
                                                <p className="text-sm text-muted-foreground">{submission.email}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400">
                                                        Submitted {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                                                    </span>
                                                    {submission.last_synced_at && (
                                                        <>
                                                            <span className="text-[10px] text-slate-300">•</span>
                                                            <span className="text-xs text-slate-400">
                                                                Synced {formatDistanceToNow(new Date(submission.last_synced_at), { addSuffix: true })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 self-end sm:self-center">
                                            {getStatusBadge(submission.sync_status)}

                                            {submission.sync_status === 'error' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleRetrySync(submission)}
                                                    className="gap-2"
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                    Retry
                                                </Button>
                                            )}

                                            {submission.airtable_id && (
                                                <Button variant="ghost" size="icon" asChild>
                                                    <a href={`https://airtable.com/${submission.airtable_id}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Integration Help */}
                <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                            <AlertCircle className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-1">About Airtable Sync</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Candidates are automatically synced to your designated Airtable base when they apply.
                                This dashboard helps you track the status of those syncs and troubleshoot any issues
                                that might arise during the process. If a sync fails, you can manually trigger a
                                retry once the connection issue is resolved.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
