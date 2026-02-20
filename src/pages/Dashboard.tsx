import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { usePositions } from '@/hooks/usePositions';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { Tables } from '@/integrations/supabase/types';
import { Header } from '@/components/layout/Header';
import { PositionCard } from '@/components/dashboard/PositionCard';
import { PositionFilters, PositionFiltersState } from '@/components/dashboard/PositionFilters';
import { AnalyticsCards } from '@/components/dashboard/AnalyticsCards';
import { HiringPipeline } from '@/components/dashboard/HiringPipeline';
import { PositionsByCategory } from '@/components/dashboard/PositionsByCategory';
import { ActivityFeed } from '@/components/activity/ActivityFeed';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Briefcase, Search, BarChart2, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/export';
import { Input } from '@/components/ui/input';

type Position = Tables<'positions'>;

export default function Dashboard() {
    const navigate = useNavigate();
    const { user, company, role, loading: authLoading } = useAuth();
    const { canPostJobs } = usePermissions();

    // Use React Query for positions data with caching
    const { data: positions = [], isLoading: positionsLoading } = usePositions();

    const [searchQuery, setSearchQuery] = useState('');
    // Debounce search to avoid excessive re-renders (300ms delay)
    const debouncedSearch = useDebounce(searchQuery, 300);

    const [showAnalytics, setShowAnalytics] = useState(false);
    const [filters, setFilters] = useState<PositionFiltersState>({
        category: '',
        workType: '',
        priority: '',
        location: '',
        status: '',
    });

    const filteredPositions = useMemo(() => {
        return positions.filter(position => {
            // Search filter (using debounced value)
            if (debouncedSearch) {
                const query = debouncedSearch.toLowerCase();
                const matchesSearch =
                    position.position_name.toLowerCase().includes(query) ||
                    position.category.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Category filter
            if (filters.category && position.category !== filters.category) {
                return false;
            }

            // Work type filter
            if (filters.workType && position.work_type !== filters.workType) {
                return false;
            }

            // Priority filter
            if (filters.priority && position.priority !== filters.priority) {
                return false;
            }

            // Location filter
            if (filters.location && position.preferred_locations) {
                if (!position.preferred_locations.includes(filters.location)) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && (position.status || 'draft') !== filters.status) {
                return false;
            }

            return true;
        });
    }, [positions, filters, debouncedSearch]);

    // Redirect to login if not authenticated
    if (!authLoading && !user) {
        return <Navigate to="/login" replace />;
    }

    const handleEditPosition = (position: Position) => {
        navigate(`/positions/${position.id}/edit`);
    };

    const handleAddPosition = () => {
        navigate('/positions/new');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!company) {
        // If user is logged in but has no company profile, redirect to profile creation
        // or show a specific onboarding state. For now, let's redirect to profile.
        // Or if you want to force registration flow:
        // return <Navigate to="/register" replace />; 
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <h2 className="text-xl font-semibold">Company Profile Missing</h2>
                    <p className="text-muted-foreground">Please complete your company profile to continue.</p>
                    <Button onClick={() => navigate('/profile')}>Create Profile</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            <main className="relative container mx-auto px-4 py-8 pb-20 md:pb-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="animate-in fade-in slide-in-from-left duration-500">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
                            Positions Dashboard
                            {role && (
                                <Badge variant="secondary" className="uppercase font-black text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20 px-2 py-0.5">
                                    {role}
                                </Badge>
                            )}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {positions.length > 0
                                ? `You have ${positions.length} open positions.`
                                : 'Get started by creating your first hiring position.'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => exportToCSV(positions, 'positions-export', {
                                position_name: 'Position Name',
                                category: 'Category',
                                status: 'Status',
                                priority: 'Priority',
                                work_type: 'Work Type',
                                num_roles: 'Vacancies',
                                min_experience: 'Min Exp',
                                max_experience: 'Max Exp',
                                preferred_locations: 'Locations',
                                created_at: 'Created At'
                            })}
                            disabled={positions.length === 0}
                            className="transition-all duration-300"
                        >
                            <Download className="h-5 w-5 mr-2" />
                            Export
                        </Button>
                        {canPostJobs && (
                            <Button onClick={handleAddPosition} className="shadow-lg hover:shadow-primary/20 transition-all duration-300">
                                <Plus className="h-5 w-5 mr-2" />
                                Add Position
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className="gap-2 transition-all"
                        disabled={positionsLoading || positions.length === 0}
                    >
                        <BarChart2 className={`h-4 w-4 ${showAnalytics ? 'text-primary' : ''}`} />
                        {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
                    </Button>
                </div>

                {/* Granular Loading: Analytics Skeleton */}
                {showAnalytics && positionsLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))}
                    </div>
                )}

                {showAnalytics && !positionsLoading && positions.length > 0 && (
                    <div className="space-y-6 mb-8 animate-in fade-in zoom-in-95 duration-500">
                        <AnalyticsCards positions={positions} />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <HiringPipeline positions={positions} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PositionsByCategory positions={positions} />
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <ActivityFeed companyId={company?.id} maxHeight="500px" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6 sticky top-20 z-40 bg-background/80 backdrop-blur-sm py-2 px-1 rounded-lg">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search positions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 input-elegant ring-offset-background"
                        />
                    </div>
                    <PositionFilters filters={filters} onFiltersChange={setFilters} />
                </div>

                {/* Content */}
                {positionsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="border-border/40">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Skeleton className="h-6 w-6 rounded-full" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-6 w-3/4 mb-4" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                    <div className="mt-6 flex gap-2">
                                        <Skeleton className="h-8 w-20" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : positions.length === 0 ? (
                    /* Enhanced Empty State / Onboarding */
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <Card className="border-dashed border-2 border-primary/20 bg-primary/5">
                            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="rounded-full bg-primary/10 p-6 mb-6 animate-pulse">
                                    <Briefcase className="h-12 w-12 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Welcome to Straatix!</h3>
                                <p className="text-muted-foreground mb-8 max-w-md">
                                    You're all set up. Let's create your first position to start tracking candidates and managing your hiring pipeline.
                                </p>
                                <Button onClick={handleAddPosition} size="lg" className="px-8 btn-primary">
                                    <Plus className="h-5 w-5 mr-3" />
                                    Create Your First Position
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                ) : filteredPositions.length === 0 ? (
                    /* No Results State */
                    <EmptyState
                        icon={Search}
                        title="No matching positions"
                        description={`We couldn't find any positions matching "${debouncedSearch}". Try clearing your filters.`}
                        actionLabel="Clear all filters"
                        onAction={() => {
                            setSearchQuery('');
                            setFilters({ category: '', workType: '', priority: '', location: '', status: '' });
                        }}
                    />
                ) : (
                    /* Positions Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredPositions.map((position, index) => (
                            <PositionCard
                                key={position.id}
                                position={position}
                                onEdit={handleEditPosition}
                                searchQuery={debouncedSearch}
                                index={index}
                            />
                        ))}
                    </div>
                )}

                {/* Stats Summary */}
                {positions.length > 0 && (
                    <div className="mt-8 pt-6 border-t animate-in fade-in duration-700 delay-300">
                        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <strong className="text-foreground">{positions.length}</strong> total positions
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <strong className="text-foreground">
                                    {positions.filter(p => p.status === 'active').length}
                                </strong> active
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <strong className="text-foreground">
                                    {positions.reduce((sum, p) => sum + p.num_roles, 0)}
                                </strong> total roles
                            </span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
