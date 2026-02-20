/**
 * All Candidates Page
 * Global view of all candidates across all positions with filtering
 */

import { useState, useMemo, useRef, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/integrations/supabase/client';
import { CandidateFiltersPanel, CandidateFilters, defaultFilters } from '@/components/candidates/CandidateFilters';
import { CandidateStatusBadge, CandidateStatus } from '@/components/candidates/CandidateStatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { exportToCSV } from '@/lib/export';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { CandidateForm } from '@/components/candidates/CandidateForm';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Search,
    Users,
    Star,
    Mail,
    Building2,
    ExternalLink,
    Download,
    Pencil,
    MoreHorizontal,
} from 'lucide-react';
import { format } from 'date-fns';
import { CandidateActionMenu } from '@/components/candidates/CandidateActionMenu';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Pagination } from '@/components/ui/pagination';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDebouncedMutation } from '@/hooks/useDebouncedMutation';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkActionBar } from '@/components/candidates/BulkActionBar';
import { CandidateTable } from '@/components/candidates/CandidateTable';

export interface CandidateWithPosition {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: CandidateStatus;
    rating: number | null;
    linkedin_url: string | null;
    resume_url: string | null;
    experience_years: number | null;
    skills: string[] | null;
    created_at: string;
    position_id: string;
    position_name: string;
    avatar_url?: string | null;
}

export default function AllCandidates() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const { user, company, loading: authLoading } = useAuth();
    const { canManageCandidates } = usePermissions();
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<CandidateFilters>(defaultFilters);
    const [editingCandidate, setEditingCandidate] = useState<CandidateWithPosition | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithPosition | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
    const [formOpen, setFormOpen] = useState(false);
    const [candidateToDelete, setCandidateToDelete] = useState<CandidateWithPosition | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const PAGE_SIZE = 25;
    const searchRef = useRef<HTMLInputElement>(null);

    // Fetch all candidates with their positions
    const { data: candidates = [], isLoading } = useQuery({
        queryKey: ['all-candidates', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];

            const { data, error } = await supabase
                .from('candidates')
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    status,
                    rating,
                    linkedin_url,
                    resume_url,
                    experience_years,
                    skills,
                    created_at,
                    updated_at,
                    position_id,
                    positions!inner(position_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map((c: any) => ({
                ...c,
                position_name: c.positions?.position_name || 'Unknown',
                experience_years: (c as any).experience_years || null,
                skills: (c as any).skills || null,
            })) as CandidateWithPosition[];
        },
        enabled: !!company?.id,
    });

    // Update candidate mutation (debounced + optimistic)
    const updateCandidate = useDebouncedMutation({
        mutationFn: async (data: any) => {
            const { error } = await supabase
                .from('candidates')
                .update({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    status: data.status,
                    rating: data.rating,
                    notes: data.notes,
                    linkedin_url: data.linkedin_url,
                    resume_url: data.resume_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', data.id);

            if (error) throw error;
        },
        onMutate: async (data: any) => {
            await queryClient.cancelQueries({ queryKey: ['all-candidates', company?.id] });
            const previous = queryClient.getQueryData<CandidateWithPosition[]>(['all-candidates', company?.id]);
            queryClient.setQueryData<CandidateWithPosition[]>(
                ['all-candidates', company?.id],
                (old) => old?.map(c => c.id === data.id ? { ...c, ...data } : c),
            );
            return { previous };
        },
        onSuccess: () => {
            toast({
                title: 'Candidate updated',
                description: 'The candidate information has been saved.',
            });
        },
        onError: (error: any, _variables: any, context: any) => {
            if (context?.previous) {
                queryClient.setQueryData(['all-candidates', company?.id], context.previous);
            }
            toast({
                title: 'Error updating candidate',
                description: error.message,
                variant: 'destructive',
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['all-candidates', company?.id] });
        },
    });

    const handleEditCandidate = (candidate: CandidateWithPosition) => {
        setEditingCandidate(candidate);
        setFormOpen(true);
    };

    const handleUpdateCandidate = async (data: Partial<CandidateWithPosition> & { id: string }) => {
        await updateCandidate.mutateAsync(data);
    };

    // Fetch positions for filter dropdown
    const { data: positions = [] } = useQuery({
        queryKey: ['positions-list', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];

            const { data } = await supabase
                .from('positions')
                .select('id, position_name')
                .eq('company_id', company.id)
                .order('position_name');

            return data || [];
        },
        enabled: !!company?.id,
    });

    // Filter candidates
    const filteredCandidates = useMemo(() => {
        return candidates.filter((c) => {
            // Search query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (
                    !c.name.toLowerCase().includes(query) &&
                    !c.email.toLowerCase().includes(query) &&
                    !c.position_name.toLowerCase().includes(query)
                ) {
                    return false;
                }
            }

            // Experience filter
            if (filters.experienceMin !== null && (c.experience_years ?? 0) < filters.experienceMin) {
                return false;
            }
            if (filters.experienceMax !== null && (c.experience_years ?? 0) > filters.experienceMax) {
                return false;
            }

            // Skills filter
            if (filters.skills.length > 0) {
                const candidateSkills = (c.skills || []).map((s) => s.toLowerCase());
                const hasAllSkills = filters.skills.every((skill) =>
                    candidateSkills.some((cs) => cs.includes(skill))
                );
                if (!hasAllSkills) return false;
            }

            // Status filter
            if (filters.status !== 'all' && c.status !== filters.status) {
                return false;
            }

            // Position filter
            if (filters.positionId !== 'all' && c.position_id !== filters.positionId) {
                return false;
            }

            return true;
        });
    }, [candidates, searchQuery, filters]);

    // Paginate filtered results
    const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE);
    const paginatedCandidates = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredCandidates.slice(start, start + PAGE_SIZE);
    }, [filteredCandidates, currentPage]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
        setSelectedCandidateIds(new Set());
    }, [searchQuery, filters]);

    const toggleAllSelection = (ids: string[]) => {
        const allOnPageSelected = ids.every(id => selectedCandidateIds.has(id));
        const newSelected = new Set(selectedCandidateIds);
        if (allOnPageSelected) {
            ids.forEach(id => newSelected.delete(id));
        } else {
            ids.forEach(id => newSelected.add(id));
        }
        setSelectedCandidateIds(newSelected);
    };

    const toggleCandidateSelection = (id: string) => {
        const newSelected = new Set(selectedCandidateIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedCandidateIds(newSelected);
    };

    const handleBulkStatusUpdate = async (newStatus: CandidateStatus) => {
        setIsBulkUpdating(true);
        const { error } = await supabase
            .from('candidates')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .in('id', Array.from(selectedCandidateIds));

        if (!error) {
            queryClient.invalidateQueries({ queryKey: ['all-candidates'] });
            toast({ title: 'Success', description: `Updated ${selectedCandidateIds.size} candidates to ${newStatus}.` });
            setSelectedCandidateIds(new Set());
        } else {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
        setIsBulkUpdating(false);
    };

    const handleBulkMoveToPosition = async (newPositionId: string) => {
        setIsBulkUpdating(true);
        const { error } = await supabase
            .from('candidates')
            .update({ position_id: newPositionId, updated_at: new Date().toISOString() })
            .in('id', Array.from(selectedCandidateIds));

        if (!error) {
            queryClient.invalidateQueries({ queryKey: ['all-candidates'] });
            toast({ title: 'Success', description: `Moved ${selectedCandidateIds.size} candidates to new position.` });
            setSelectedCandidateIds(new Set());
        } else {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
        setIsBulkUpdating(false);
    };

    const handleBulkDelete = async () => {
        setIsBulkUpdating(true);
        const { error } = await supabase
            .from('candidates')
            .delete()
            .in('id', Array.from(selectedCandidateIds));

        if (!error) {
            queryClient.invalidateQueries({ queryKey: ['all-candidates'] });
            toast({ title: 'Deleted', description: `Removed ${selectedCandidateIds.size} candidates.` });
            setSelectedCandidateIds(new Set());
            setBulkDeleteOpen(false);
        } else {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
        setIsBulkUpdating(false);
    };

    // Keyboard shortcuts
    useKeyboardShortcuts([
        { key: 'ctrl+k', action: () => searchRef.current?.focus() },
    ]);

    const handleCandidateClick = (candidate: CandidateWithPosition, tab?: string) => {
        setSelectedCandidate(candidate);
        setActiveTab(tab);
        setDetailModalOpen(true);
    };

    // Redirect to login if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/login" replace />;
    }

    function getInitials(name: string): string {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    }

    return (
        <>
            <Header />
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <Breadcrumbs
                                items={[
                                    { label: 'Dashboard', href: '/dashboard' },
                                    { label: 'All Candidates' },
                                ]}
                                className="mb-2"
                            />
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6 text-primary" />
                                All Candidates
                            </h1>
                            <p className="text-muted-foreground">
                                {filteredCandidates.length} of {candidates.length} candidates
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => exportToCSV(filteredCandidates, 'all-candidates-export', {
                                    name: 'Name',
                                    email: 'Email',
                                    position_name: 'Position',
                                    status: 'Status',
                                    rating: 'Rating',
                                    experience_years: 'Exp (yrs)',
                                    created_at: 'Applied At'
                                })}
                                disabled={filteredCandidates.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardContent className="py-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    ref={searchRef}
                                    placeholder="Search by name, email, or position... (Ctrl+K)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <CandidateFiltersPanel
                                filters={filters}
                                onFiltersChange={setFilters}
                                positions={positions}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Candidates Table */}
                <Card>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="p-6 space-y-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : filteredCandidates.length === 0 ? (
                            <EmptyState
                                icon={Search}
                                title="No candidates found"
                                description={searchQuery || Object.values(filters).some(v => v !== 'all' && v !== null && (Array.isArray(v) ? v.length > 0 : true))
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "You haven't added any candidates yet."}
                                actionLabel={searchQuery || Object.values(filters).some(v => v !== 'all' && v !== null && (Array.isArray(v) ? v.length > 0 : true)) ? "Clear all filters" : undefined}
                                onAction={() => {
                                    setSearchQuery('');
                                    setFilters(defaultFilters);
                                }}
                                className="py-16"
                            />
                        ) : (
                            <>
                                <CandidateTable
                                    candidates={paginatedCandidates}
                                    selectedIds={selectedCandidateIds}
                                    onSelect={toggleCandidateSelection}
                                    onSelectAll={toggleAllSelection}
                                    onCandidateClick={handleCandidateClick}
                                    onEdit={handleEditCandidate}
                                    onDelete={(c) => setCandidateToDelete(c)}
                                    canManageCandidates={canManageCandidates}
                                />

                                {totalPages > 1 && (
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        totalItems={filteredCandidates.length}
                                        pageSize={PAGE_SIZE}
                                    />
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                <CandidateForm
                    open={formOpen}
                    onOpenChange={(open) => {
                        setFormOpen(open);
                        if (!open) setEditingCandidate(null);
                    }}
                    onSubmit={handleUpdateCandidate}
                    candidate={editingCandidate}
                    positionId={editingCandidate?.position_id || ''}
                />

                <CandidateDetailModal
                    candidate={selectedCandidate}
                    open={detailModalOpen}
                    onClose={() => {
                        setDetailModalOpen(false);
                        setSelectedCandidate(null);
                        setActiveTab(undefined);
                    }}
                    onEdit={handleEditCandidate}
                    onDelete={(c) => setCandidateToDelete(c as unknown as CandidateWithPosition)}
                    onStatusChange={(c, newStatus) => {
                        handleUpdateCandidate({ id: c.id, status: newStatus });
                    }}
                    initialTab={activeTab}
                />

                <ConfirmDialog
                    open={!!candidateToDelete}
                    onOpenChange={(open) => { if (!open) setCandidateToDelete(null); }}
                    title="Delete candidate?"
                    description={`Are you sure you want to delete ${candidateToDelete?.name || 'this candidate'}? This action cannot be undone.`}
                    confirmLabel="Delete"
                    onConfirm={async () => {
                        if (!candidateToDelete) return;
                        const { error } = await supabase.from('candidates').delete().eq('id', candidateToDelete.id);
                        if (!error) {
                            queryClient.invalidateQueries({ queryKey: ['all-candidates'] });
                            toast({ title: 'Deleted', description: `${candidateToDelete.name} has been removed.` });
                        }
                    }}
                />

                <ConfirmDialog
                    open={bulkDeleteOpen}
                    onOpenChange={setBulkDeleteOpen}
                    title="Delete multiple candidates?"
                    description={`Are you sure you want to delete ${selectedCandidateIds.size} candidates? This action cannot be undone.`}
                    confirmLabel="Delete All"
                    onConfirm={handleBulkDelete}
                />

                <BulkActionBar
                    selectedCount={selectedCandidateIds.size}
                    onStatusUpdate={handleBulkStatusUpdate}
                    onMoveToPosition={handleBulkMoveToPosition}
                    onDelete={() => setBulkDeleteOpen(true)}
                    onClearSelection={() => setSelectedCandidateIds(new Set())}
                    positions={positions}
                    isUpdating={isBulkUpdating}
                />
            </div>
        </>
    );
}
