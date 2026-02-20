import {
    Phone,
    Linkedin,
    FileText,
    ExternalLink,
    User,
    StickyNote,
    Edit,
    Trash2,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Candidate } from './CandidateCard';
import { CandidateStatus, CandidateStatusBadge } from './CandidateStatusBadge'; // Assuming Badge is used elsewhere or remove
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Status progression for quick status changes
const statusOrder: CandidateStatus[] = ['new', 'screening', 'interview', 'offer', 'hired'];

interface CandidateOverviewProps {
    candidate: Candidate;
    onEdit: (candidate: Candidate) => void;
    onDelete: (candidate: Candidate) => void;
    onStatusChange: (candidate: Candidate, newStatus: CandidateStatus) => void;
}

export function CandidateOverview({
    candidate,
    onEdit,
    onDelete,
    onStatusChange
}: CandidateOverviewProps) {

    return (
        <div className="p-6 space-y-8">
            {/* Actions Row - Moved to top for quick access */}
            <div className="grid grid-cols-2 gap-3">
                <PermissionGuard permission="canEditCandidate">
                    <Button variant="outline" className="w-full justify-center" onClick={() => onEdit(candidate)}>
                        <Edit className="h-4 w-4 mr-2 text-slate-500" />
                        Edit Profile
                    </Button>
                </PermissionGuard>

                <PermissionGuard permission="canDeleteCandidate">
                    <Button variant="outline" className="w-full justify-center hover:bg-red-50 hover:text-red-700 hover:border-red-200" onClick={() => onDelete(candidate)}>
                        <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                        Delete
                    </Button>
                </PermissionGuard>
            </div>

            <Separator />

            {/* Contact Information - Stacked for "stretched" look */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Information
                </h3>
                <div className="space-y-3">
                    {candidate.phone ? (
                        <a href={`tel:${candidate.phone}`} className="flex items-center w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 group">
                            <div className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center mr-4 shadow-sm text-slate-600 group-hover:text-slate-900 group-hover:border-slate-300 transition-colors">
                                <Phone className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Phone Mobile</p>
                                <p className="text-sm font-semibold text-slate-900">{candidate.phone}</p>
                            </div>
                        </a>
                    ) : (
                        <div className="flex items-center w-full p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-dashed opacity-70">
                            <div className="h-8 w-8 rounded-lg bg-white/50 border flex items-center justify-center mr-4 text-slate-400">
                                <Phone className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-slate-400 italic">No phone number added</p>
                        </div>
                    )}

                    {candidate.linkedin_url ? (
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full p-4 rounded-xl bg-[#0A66C2]/5 hover:bg-[#0A66C2]/10 transition-all border border-[#0A66C2]/10 group">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center mr-4 shadow-sm text-[#0A66C2]">
                                <Linkedin className="h-4 w-4 fill-current" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-[#0A66C2]/70 font-bold uppercase tracking-wide">LinkedIn</p>
                                <p className="text-sm font-bold text-[#0A66C2]">View Profile</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-[#0A66C2] opacity-50" />
                        </a>
                    ) : (
                        <div className="flex items-center w-full p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-dashed opacity-70">
                            <div className="h-8 w-8 rounded-lg bg-white/50 border flex items-center justify-center mr-4 text-slate-400">
                                <Linkedin className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-slate-400 italic">No LinkedIn profile</p>
                        </div>
                    )}

                    {candidate.resume_url ? (
                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="flex items-center w-full p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 transition-all border border-emerald-100 group">
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center mr-4 shadow-sm text-emerald-600">
                                <FileText className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-emerald-600/70 font-bold uppercase tracking-wide">Resume</p>
                                <p className="text-sm font-bold text-emerald-700">Open Document</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-emerald-600 opacity-50" />
                        </a>
                    ) : (
                        <div className="flex items-center w-full p-4 rounded-xl bg-slate-50/50 border border-slate-100 border-dashed opacity-70">
                            <div className="h-8 w-8 rounded-lg bg-white/50 border flex items-center justify-center mr-4 text-slate-400">
                                <FileText className="h-4 w-4" />
                            </div>
                            <p className="text-sm text-slate-400 italic">No resume attached</p>
                        </div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Quick Status Change - Stretched Buttons */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Quick Status Change
                </h3>
                <div className="flex flex-wrap gap-2">
                    {statusOrder.map((status) => (
                        <Button
                            key={status}
                            variant={candidate.status === status ? 'default' : 'outline'}
                            onClick={() => onStatusChange(candidate, status)}
                            className={cn(
                                "flex-1 min-w-[80px] capitalize h-9 text-xs font-medium",
                                candidate.status === status && "shadow-md ring-1 ring-primary/20"
                            )}
                        >
                            {status}
                        </Button>
                    ))}
                    <Button
                        variant={candidate.status === 'rejected' ? 'destructive' : 'outline'}
                        onClick={() => onStatusChange(candidate, 'rejected')}
                        className={cn(
                            "flex-1 min-w-[80px] h-9 text-xs font-medium",
                            candidate.status !== 'rejected' && "text-destructive border-destructive/30 hover:bg-destructive/10"
                        )}
                    >
                        Rejected
                    </Button>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes
                </h3>
                <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed min-h-[100px] whitespace-pre-wrap">
                    {candidate.notes || <span className="text-slate-400 italic">No notes added.</span>}
                </div>
            </div>

            <div className="text-[10px] text-slate-300 font-mono text-center pt-4">
                {candidate.updated_at ? (
                    <>Last updated {format(new Date(candidate.updated_at), 'PPP p')}</>
                ) : (
                    <>Created {format(new Date(candidate.created_at), 'PPP p')}</>
                )}
            </div>
        </div>
    );
}
