import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
    MoreHorizontal,
    User,
    Calendar,
    Activity,
    MessageSquare,
    Mic,
    ClipboardList,
    Edit,
    Trash2,
} from 'lucide-react';
import { Candidate } from './CandidateCard';

interface CandidateActionMenuProps {
    candidate: Candidate;
    onAction?: (candidate: Candidate, tab?: string) => void;
    onEdit?: (candidate: Candidate) => void;
    onDelete?: (candidate: Candidate) => void;
    trigger?: React.ReactNode;
    align?: 'start' | 'center' | 'end';
    canManage?: boolean;
}

export function CandidateActionMenu({
    candidate,
    onAction,
    onEdit,
    onDelete,
    trigger,
    align = 'end',
    canManage = true,
}: CandidateActionMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {trigger || (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-56 p-1">
                <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Quick Actions
                </div>
                <DropdownMenuItem onClick={() => onAction?.(candidate, 'overview')}>
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    <span>View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.(candidate, 'evaluation')}>
                    <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                    <span>Schedule Interview</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.(candidate, 'activity')}>
                    <Activity className="h-4 w-4 mr-2 text-indigo-500" />
                    <span>Activity Log</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.(candidate, 'comments')}>
                    <MessageSquare className="h-4 w-4 mr-2 text-emerald-500" />
                    <span>Send Message</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.(candidate, 'voice')}>
                    <Mic className="h-4 w-4 mr-2 text-rose-500" />
                    <span>Record Note</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction?.(candidate, 'evaluation')}>
                    <ClipboardList className="h-4 w-4 mr-2 text-purple-500" />
                    <span>Review & Evaluation</span>
                </DropdownMenuItem>

                {canManage && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                            Management
                        </div>
                        <DropdownMenuItem onClick={() => onEdit?.(candidate)}>
                            <Edit className="h-4 w-4 mr-2" />
                            <span>Edit Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onDelete?.(candidate)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete Candidate</span>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
