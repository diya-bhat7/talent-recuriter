import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePosition } from '@/hooks/usePositions';
import {
    useCandidates,
    useCreateCandidate,
    useUpdateCandidate,
    useDeleteCandidate,
    useUpdateCandidateStatus,
    Candidate,
} from '@/hooks/useCandidates';
import { useCandidatesRealtime } from '@/hooks/useCandidatesRealtime';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CandidateCard } from '@/components/candidates/CandidateCard';
import { CandidateForm } from '@/components/candidates/CandidateForm';
import { CandidateKanban } from '@/components/candidates/CandidateKanban';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';
import { CandidateStatus } from '@/components/candidates/CandidateStatusBadge';
import { exportToCSV } from '@/lib/export';
import { EmptyState } from '@/components/ui/EmptyState';
import { PipelineAnalytics } from '@/components/analytics/PipelineAnalytics';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
    Plus,
    LayoutGrid,
    List,
    Users,
    Briefcase,
    Download,
    Search,
    BarChart3
} from 'lucide-react';

export default function Candidates() {
    const { positionId } = useParams<{ positionId: string }>();
    const navigate = useNavigate();
    const { user, company, loading: authLoading } = useAuth();
    const { toast } = useToast();

    // React Query hooks for data fetching with caching
    const { data: position } = usePosition(positionId);
    const { data: candidates = [], isLoading: candidatesLoading } = useCandidates(positionId);

    // Real-time subscription for live updates (e.g., when multiple users are collaborating)
    useCandidatesRealtime(positionId);

    // Mutation hooks with optimistic updates
    const createCandidate = useCreateCandidate(positionId);
    const updateCandidate = useUpdateCandidate(positionId);
    const deleteCandidate = useDeleteCandidate(positionId);
    const updateStatus = useUpdateCandidateStatus(positionId);

    const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'analytics'>('kanban');
    const [formOpen, setFormOpen] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Handle direct link to a candidate
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const candidateIdFromUrl = params.get('candidateId');
        if (candidateIdFromUrl && candidates.length > 0) {
            const candidate = candidates.find(c => c.id === candidateIdFromUrl);
            if (candidate) {
                setSelectedCandidate(candidate);
                setDetailModalOpen(true);
            }
        }
    }, [candidates]);

    // Filter candidates based on search query
    const filteredCandidates = useMemo(() => {
        if (!searchQuery.trim()) return candidates;

        const query = searchQuery.toLowerCase().trim();
        return candidates.filter((c) =>
            c.name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query) ||
            (c.notes && c.notes.toLowerCase().includes(query)) ||
            c.status.toLowerCase().includes(query)
        );
    }, [candidates, searchQuery]);

    const handleCandidateClick = (candidate: Candidate, tab?: string) => {
        setSelectedCandidate(candidate);
        setActiveTab(tab);
        // Only show the central modal if we're in list mode
        // Kanban view has its own integrated side drawer
        if (viewMode !== 'kanban') {
            setDetailModalOpen(true);
        }
    };

    // Redirect to login if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/login" replace />;
    }

    const handleAddCandidate = async (data: Partial<Candidate>) => {
        try {
            await createCandidate.mutateAsync({
                name: data.name!,
                email: data.email!,
                phone: data.phone,
                resume_url: data.resume_url,
                linkedin_url: data.linkedin_url,
                status: data.status || 'new',
                notes: data.notes,
                rating: data.rating,
            });
            toast({
                title: 'Candidate added',
                description: `${data.name} has been added to the pipeline.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error adding candidate',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleEditCandidate = (candidate: Candidate) => {
        setEditingCandidate(candidate);
        setFormOpen(true);
    };

    const handleUpdateCandidate = async (data: Partial<Candidate>) => {
        if (!data.id) return;

        try {
            await updateCandidate.mutateAsync({
                id: data.id,
                name: data.name,
                email: data.email,
                phone: data.phone,
                resume_url: data.resume_url,
                linkedin_url: data.linkedin_url,
                status: data.status,
                notes: data.notes,
                rating: data.rating,
            });
            setEditingCandidate(null);
            toast({
                title: 'Candidate updated',
                description: 'Candidate information has been updated.',
            });
        } catch (error: any) {
            toast({
                title: 'Error updating candidate',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleDeleteCandidate = async (candidate: Candidate) => {
        setCandidateToDelete(candidate);
    };

    const confirmDeleteCandidate = async () => {
        if (!candidateToDelete) return;
        try {
            await deleteCandidate.mutateAsync(candidateToDelete.id);
            toast({
                title: 'Candidate removed',
                description: `${candidateToDelete.name} has been removed.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error removing candidate',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleStatusChange = async (candidate: Candidate, newStatus: CandidateStatus) => {
        try {
            await updateStatus.mutateAsync({ id: candidate.id, status: newStatus });
            toast({
                title: 'Status updated',
                description: `${candidate.name} moved to ${newStatus}.`,
            });
        } catch (error: any) {
            toast({
                title: 'Error updating status',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    // Show loading only when fetching auth or candidates
    const isLoading = authLoading || candidatesLoading;

    // Keyboard shortcuts
    useKeyboardShortcuts([
        { key: 'ctrl+k', action: () => searchRef.current?.focus() },
        { key: 'n', action: () => setFormOpen(true), requireNoFocus: true },
    ]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <Skeleton className="h-8 w-64 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </main>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect in conditional above
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
                    <div className="text-center space-y-4">
                        <h2 className="text-xl font-semibold">Company Profile Missing</h2>
                        <p className="text-muted-foreground">Please complete your company profile to continue.</p>
                        <Button onClick={() => navigate('/profile')}>Create Profile</Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Subtle background pattern */}
            <div className="fixed inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22currentColor%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 pointer-events-none text-foreground" />

            {/* Gradient orbs */}
            <div className="fixed top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            <Header />

            <main className="relative container mx-auto px-4 py-8 pb-20 md:pb-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumbs
                        items={[
                            { label: 'Dashboard', href: '/dashboard' },
                            { label: position?.position_name || 'Position', href: position ? `/positions/${positionId}/edit` : undefined },
                            { label: 'Candidates' },
                        ]}
                        className="mb-4"
                    />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6 text-primary" />
                                Candidates
                            </h1>
                            {position && (
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Briefcase className="h-4 w-4" />
                                    {position.position_name}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-1 md:max-w-md items-center relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                ref={searchRef}
                                placeholder="Search candidates... (Ctrl+K)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-background/50 border-input focus:bg-background transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                                    onClick={() => setSearchQuery('')}
                                >
                                    Clear
                                </Button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center border rounded-lg p-1">
                                <Button
                                    variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('kanban')}
                                >
                                    <LayoutGrid className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                >
                                    <List className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'analytics' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('analytics')}
                                    className="gap-2"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="hidden lg:inline text-xs font-semibold">Analytics</span>
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => exportToCSV(candidates, `candidates-${position?.position_name || 'export'}`, {
                                        name: 'Name',
                                        email: 'Email',
                                        status: 'Status',
                                        rating: 'Rating',
                                        phone: 'Phone',
                                        linkedin_url: 'LinkedIn',
                                        created_at: 'Applied At'
                                    })}
                                    disabled={candidates.length === 0}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>

                                <Button onClick={() => setFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Candidate
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {candidates.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No candidates yet"
                        description="Start adding candidates to track your hiring pipeline."
                        actionLabel="Add First Candidate"
                        onAction={() => setFormOpen(true)}
                    />
                ) : filteredCandidates.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No results found"
                        description={`We couldn't find any candidates matching "${searchQuery}".`}
                        actionLabel="Clear Search"
                        onAction={() => setSearchQuery('')}
                    />
                ) : viewMode === 'kanban' ? (
                    <CandidateKanban
                        candidates={filteredCandidates}
                        onClick={handleCandidateClick}
                        onEdit={handleEditCandidate}
                        onDelete={handleDeleteCandidate}
                        onStatusChange={handleStatusChange}
                    />
                ) : viewMode === 'list' ? (
                    <CandidateTable
                        candidates={filteredCandidates}
                        onClick={handleCandidateClick}
                        onEdit={handleEditCandidate}
                        onDelete={handleDeleteCandidate}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <PipelineAnalytics candidates={filteredCandidates} />
                )}

                {/* Form dialog */}
                <CandidateForm
                    open={formOpen}
                    onOpenChange={(open) => {
                        setFormOpen(open);
                        if (!open) setEditingCandidate(null);
                    }}
                    onSubmit={editingCandidate ? handleUpdateCandidate : handleAddCandidate}
                    candidate={editingCandidate}
                    positionId={positionId!}
                />

                {/* Detail modal */}
                <CandidateDetailModal
                    candidate={selectedCandidate}
                    open={detailModalOpen}
                    onClose={() => {
                        setDetailModalOpen(false);
                        setSelectedCandidate(null);
                        setActiveTab(undefined);
                    }}
                    onEdit={handleEditCandidate}
                    onDelete={handleDeleteCandidate}
                    onStatusChange={handleStatusChange}
                    initialTab={activeTab}
                />

                <ConfirmDialog
                    open={!!candidateToDelete}
                    onOpenChange={(open) => { if (!open) setCandidateToDelete(null); }}
                    title="Delete candidate?"
                    description={`Are you sure you want to delete ${candidateToDelete?.name || 'this candidate'}? This action cannot be undone and all associated data will be lost.`}
                    confirmLabel="Delete"
                    onConfirm={confirmDeleteCandidate}
                />
            </main>
        </div>
    );
}
