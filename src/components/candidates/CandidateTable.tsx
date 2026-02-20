import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CandidateStatusBadge } from './CandidateStatusBadge';
import { CandidateActionMenu } from './CandidateActionMenu';
import { CandidateWithPosition } from '@/pages/AllCandidates';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/images';
import { useQueryClient } from '@tanstack/react-query';
import { prefetchComments } from '@/hooks/useComments';
import { prefetchScorecards, prefetchAverageRatings } from '@/hooks/useScorecards';

interface CandidateTableProps {
    candidates: CandidateWithPosition[];
    selectedIds: Set<string>;
    onSelect: (id: string) => void;
    onSelectAll: (ids: string[]) => void;
    onCandidateClick: (candidate: CandidateWithPosition, tab?: string) => void;
    onEdit: (candidate: CandidateWithPosition) => void;
    onDelete: (candidate: CandidateWithPosition) => void;
    canManageCandidates: boolean;
}

export function CandidateTable({
    candidates,
    selectedIds,
    onSelect,
    onSelectAll,
    onCandidateClick,
    onEdit,
    onDelete,
    canManageCandidates
}: CandidateTableProps) {
    const queryClient = useQueryClient();
    const allSelected = candidates.length > 0 && candidates.every(c => selectedIds.has(c.id));
    const someSelected = candidates.some(c => selectedIds.has(c.id)) && !allSelected;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handlePrefetch = (candidateId: string) => {
        prefetchComments(queryClient, candidateId);
        prefetchScorecards(queryClient, candidateId);
        prefetchAverageRatings(queryClient, candidateId);
    };

    return (
        <div className="rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-border/40">
                        <TableHead className="w-[50px]">
                            <Checkbox
                                checked={allSelected || (someSelected ? 'indeterminate' : false)}
                                onCheckedChange={() => onSelectAll(candidates.map(c => c.id))}
                                className="translate-y-[2px]"
                            />
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Candidate</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Experience</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rating</TableHead>
                        <TableHead className="w-[80px] text-right"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {candidates.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                                <p className="text-sm font-bold">No candidates found</p>
                                <p className="text-xs">Try adjusting your filters or search query</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        candidates.map((candidate) => (
                            <TableRow
                                key={candidate.id}
                                className="group cursor-pointer border-border/40 hover:bg-muted/20 transition-colors"
                                onMouseEnter={() => handlePrefetch(candidate.id)}
                                onClick={() => onCandidateClick(candidate)}
                            >
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.has(candidate.id)}
                                        onCheckedChange={() => onSelect(candidate.id)}
                                        className="translate-y-[2px]"
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8 border border-border/40">
                                            <AvatarImage src={getOptimizedImageUrl(candidate.avatar_url, { width: 48, height: 48 })} className="object-cover" />
                                            <AvatarFallback className="text-[10px] font-black bg-primary/10 text-primary">
                                                {getInitials(candidate.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold group-hover:text-primary transition-colors truncate">{candidate.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium truncate">{candidate.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <CandidateStatusBadge status={candidate.status} size="sm" />
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="text-[10px] font-bold bg-background/50 border-border/40 whitespace-nowrap">
                                        {candidate.position_name || 'Unassigned'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-bold text-muted-foreground">
                                        {candidate.experience_years ? `${candidate.experience_years}y` : '—'}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1.5">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "h-2.5 w-2.5",
                                                        i < (candidate.rating || 0)
                                                            ? "text-amber-500 fill-amber-500"
                                                            : "text-muted/30"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black text-muted-foreground">
                                            {candidate.rating ? candidate.rating.toFixed(1) : '0.0'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <CandidateActionMenu
                                        candidate={candidate}
                                        onAction={(c, tab) => onCandidateClick(c as CandidateWithPosition, tab)}
                                        onEdit={(c) => onEdit(c as CandidateWithPosition)}
                                        onDelete={() => onDelete(candidate as CandidateWithPosition)}
                                        canManage={canManageCandidates}
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
