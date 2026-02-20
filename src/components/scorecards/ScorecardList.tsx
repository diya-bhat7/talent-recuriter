import { Scorecard } from '@/services/scorecards';
import { useScorecards, useAverageRatings } from '@/hooks/useScorecards';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp, TrendingDown, Minus, CheckCircle2, ThumbsUp, ThumbsDown, XCircle, TrendingUp as TrendingUpIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScorecardListProps {
    candidateId: string;
}

function getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function RatingBadge({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-background/40 border border-border/40 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-muted-foreground/50 tracking-widest">{label}</span>
                <span className="text-[9px] font-black text-primary">{value}/5</span>
            </div>
            <div className="flex gap-1 h-1">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={cn(
                            "flex-1 rounded-full transition-all duration-500",
                            level <= value ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" : "bg-muted/30"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

export function ScorecardList({ candidateId }: ScorecardListProps) {
    const { data: scorecards, isLoading } = useScorecards(candidateId);
    const { data: averages } = useAverageRatings(candidateId);

    if (isLoading) return <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-20 bg-slate-100 rounded-xl" />
    </div>;

    if (!scorecards || scorecards.length === 0) return (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
            <TrendingUpIcon className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No evaluations submitted yet.</p>
        </div>
    );

    const recConfig: Record<string, { icon: any; color: string; label: string }> = {
        strong_yes: { icon: CheckCircle2, color: 'text-emerald-500', label: 'Strong Recommend' },
        yes: { icon: ThumbsUp, color: 'text-blue-500', label: 'Recommend' },
        no: { icon: ThumbsDown, color: 'text-orange-500', label: 'No' },
        strong_no: { icon: XCircle, color: 'text-red-500', label: 'Strong Decline' },
    };

    return (
        <div className="space-y-6">
            {/* Average Ratings Summary */}
            {averages && (
                <div className="grid grid-cols-3 gap-3 p-6 bg-card/60 backdrop-blur-xl rounded-2xl border border-border/40 shadow-xl overflow-hidden relative">
                    <div className="absolute -top-4 -right-4 opacity-[0.03] scale-150">
                        <Star className="h-24 w-24 fill-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Technical</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground">{averages.tech.toFixed(1)}</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 border-x border-border/40 px-3">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Soft Skills</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground">{averages.comm.toFixed(1)}</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 pl-3">
                        <span className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-widest">Culture</span>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-foreground">{averages.culture.toFixed(1)}</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                        </div>
                    </div>
                </div>
            )}

            {/* Historical Scorecards */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground/70 tracking-widest">Evaluation History</h4>
                    <span className="text-[9px] font-medium text-muted-foreground/40">{scorecards.length} entries</span>
                </div>
                {scorecards.map((card) => {
                    const rec = recConfig[card.recommendation || 'yes'];
                    const RecIcon = rec.icon;
                    return (
                        <Card key={card.id} className="border border-border/40 shadow-sm bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden group hover:border-primary/20 transition-all duration-300">
                            <CardContent className="p-0">
                                <div className="flex gap-4 p-5 border-l-4 border-l-border/40 group-hover:border-l-primary transition-all">
                                    <Avatar className="h-12 w-12 border-2 border-background ring-2 ring-border/20 shadow-sm shrink-0">
                                        <AvatarFallback className="text-xs font-black bg-muted text-muted-foreground">
                                            {getInitials(card.user_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="text-sm font-black text-foreground tracking-tight">{card.user_name}</h5>
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter opacity-60">
                                                    {formatDistanceToNow(new Date(card.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm bg-background/50", rec.color, "border-current/10")}>
                                                <RecIcon className="h-3 w-3" />
                                                {rec.label}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <RatingBadge label="Technical" value={card.tech_rating || 0} />
                                            <RatingBadge label="Soft Skills" value={card.comm_rating || 0} />
                                            <RatingBadge label="Culture" value={card.culture_rating || 0} />
                                        </div>

                                        {card.notes && (
                                            <div className="p-4 bg-muted/20 backdrop-blur-sm rounded-xl border border-border/30 text-[13px] text-foreground/80 leading-relaxed italic relative">
                                                <span className="absolute -top-1 -left-1 text-2xl text-primary/10 font-serif">"</span>
                                                {card.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
