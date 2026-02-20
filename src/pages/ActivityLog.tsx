import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { activityLogService } from '@/services/activityLog';
import type { ActivityAction, EntityType, ActivityLogEntry } from '@/types/advanced-features';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Activity,
    Search,
    UserCircle,
    Calendar,
    Filter,
    RefreshCw,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    created: { label: 'Created', color: 'bg-green-100 text-green-700 border-green-200' },
    updated: { label: 'Updated', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    deleted: { label: 'Deleted', color: 'bg-red-100 text-red-700 border-red-200' },
    status_changed: { label: 'Status Changed', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    commented: { label: 'Commented', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    scored: { label: 'Scored', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    assigned: { label: 'Assigned', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    mentioned: { label: 'Mentioned', color: 'bg-pink-100 text-pink-700 border-pink-200' },
};

const ENTITY_LABELS: Record<string, string> = {
    candidate: 'Candidate',
    position: 'Position',
    comment: 'Comment',
    scorecard: 'Scorecard',
    company: 'Company',
};

function ActionBadge({ action }: { action: string }) {
    const config = ACTION_LABELS[action] || { label: action, color: 'bg-slate-100 text-slate-700' };
    return (
        <Badge variant="outline" className={`text-[10px] font-semibold uppercase ${config.color}`}>
            {config.label}
        </Badge>
    );
}

function MetadataDisplay({ metadata }: { metadata: Record<string, unknown> }) {
    if (!metadata || Object.keys(metadata).length === 0) return <span className="text-muted-foreground">—</span>;

    return (
        <div className="flex flex-wrap gap-1">
            {Object.entries(metadata).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-[10px] font-mono">
                    {key}: {String(value)}
                </Badge>
            ))}
        </div>
    );
}

export default function ActivityLog() {
    const { company } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [entityFilter, setEntityFilter] = useState<string>('all');

    const { data: activities = [], isLoading, refetch } = useQuery({
        queryKey: ['activity-log', company?.id],
        queryFn: () => activityLogService.getRecentActivity(company!.id, 200),
        enabled: !!company?.id,
        staleTime: 1000 * 30, // 30 seconds — activity logs change frequently
    });

    // Filter activities
    const filtered = activities.filter((entry) => {
        const matchesSearch =
            !searchQuery ||
            entry.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.action.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
        const matchesEntity = entityFilter === 'all' || entry.entity_type === entityFilter;
        return matchesSearch && matchesAction && matchesEntity;
    });

    const uniqueActions = [...new Set(activities.map(a => a.action))];
    const uniqueEntities = [...new Set(activities.map(a => a.entity_type))];

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Activity className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Activity Log</CardTitle>
                                    <CardDescription>
                                        Audit trail of all actions across your company
                                    </CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by user, entity, or action..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Select value={actionFilter} onValueChange={setActionFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    {uniqueActions.map(action => (
                                        <SelectItem key={action} value={action}>
                                            {ACTION_LABELS[action]?.label || action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={entityFilter} onValueChange={setEntityFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="Entity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Entities</SelectItem>
                                    {uniqueEntities.map(entity => (
                                        <SelectItem key={entity} value={entity}>
                                            {ENTITY_LABELS[entity] || entity}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Results count */}
                        <div className="text-sm text-muted-foreground mb-4">
                            Showing {filtered.length} of {activities.length} entries
                        </div>

                        {/* Table */}
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Activity className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">No activity found</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    {searchQuery || actionFilter !== 'all' || entityFilter !== 'all'
                                        ? 'Try adjusting your filters'
                                        : 'Actions will appear here as your team uses the platform'}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[180px]">When</TableHead>
                                            <TableHead className="w-[150px]">User</TableHead>
                                            <TableHead className="w-[120px]">Action</TableHead>
                                            <TableHead className="w-[100px]">Entity</TableHead>
                                            <TableHead>Target</TableHead>
                                            <TableHead>Details</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filtered.map((entry) => (
                                            <TableRow key={entry.id} className="hover:bg-muted/30">
                                                <TableCell className="text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                                        <span title={format(new Date(entry.created_at), 'PPpp')}>
                                                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <span className="text-xs font-medium truncate max-w-[120px]">
                                                            {entry.user_name || 'System'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <ActionBadge action={entry.action} />
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[10px] font-medium">
                                                        {ENTITY_LABELS[entry.entity_type] || entry.entity_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-medium">
                                                        {entry.entity_name || entry.entity_id.slice(0, 8)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <MetadataDisplay metadata={entry.metadata} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
