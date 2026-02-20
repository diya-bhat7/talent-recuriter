import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { CandidateStatus, CANDIDATE_STATUS_OPTIONS } from "./CandidateStatusBadge";
import {
    ChevronDown,
    MoveRight,
    Trash2,
    X,
    CheckCircle2,
    Briefcase,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
    selectedCount: number;
    onStatusUpdate: (status: CandidateStatus) => void;
    onMoveToPosition: (positionId: string) => void;
    onDelete: () => void;
    onClearSelection: () => void;
    positions: Array<{ id: string; position_name: string }>;
    isUpdating?: boolean;
}

export function BulkActionBar({
    selectedCount,
    onStatusUpdate,
    onMoveToPosition,
    onDelete,
    onClearSelection,
    positions,
    isUpdating = false,
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-background/60 backdrop-blur-2xl border border-primary/20 shadow-[0_0_50px_rgba(var(--primary),0.15)] px-6 py-4 rounded-[2rem] flex items-center gap-6 ring-1 ring-white/10">
                <div className="flex items-center gap-3 pr-6 border-r border-border/40">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/20">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-foreground/80 whitespace-nowrap">
                        Candidates <span className="hidden sm:inline">Selected</span>
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Update */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl bg-background/40 border-border/40 hover:bg-background/60 gap-2 font-bold"
                                disabled={isUpdating}
                            >
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                Update Status
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-background/80 backdrop-blur-lg border-border/40 p-2 rounded-2xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/60 p-2">Change Status To</DropdownMenuLabel>
                            {CANDIDATE_STATUS_OPTIONS.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.value}
                                    onSelect={() => onStatusUpdate(opt.value)}
                                    className="rounded-xl p-2 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                                >
                                    {opt.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Move to Position */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-10 rounded-xl bg-background/40 border-border/40 hover:bg-background/60 gap-2 font-bold"
                                disabled={isUpdating}
                            >
                                <Briefcase className="h-4 w-4 text-blue-500" />
                                Move to Position
                                <ChevronDown className="h-3 w-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 max-h-[300px] overflow-y-auto bg-background/80 backdrop-blur-lg border-border/40 p-2 rounded-2xl">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/60 p-2">Select Target Position</DropdownMenuLabel>
                            {positions.length > 0 ? (
                                positions.map((pos) => (
                                    <DropdownMenuItem
                                        key={pos.id}
                                        onSelect={() => onMoveToPosition(pos.id)}
                                        className="rounded-xl p-2 font-bold cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between"
                                    >
                                        <span className="truncate">{pos.position_name}</span>
                                        <MoveRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground italic">No positions found</DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenuSeparator className="bg-border/40 mx-2" />

                    {/* Delete Action */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2 font-bold"
                        onClick={onDelete}
                        disabled={isUpdating}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Bulk Delete</span>
                    </Button>
                </div>

                <div className="pl-6 border-l border-border/40">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full bg-background/20 hover:bg-background/40"
                        onClick={onClearSelection}
                        disabled={isUpdating}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
