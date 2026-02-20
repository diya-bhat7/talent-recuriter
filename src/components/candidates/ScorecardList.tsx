import { Scorecard } from '@/services/scorecards';
import { useScorecards, useAverageRatings } from '@/hooks/useScorecards';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Star, TrendingUp, TrendingDown, Minus, CheckCircle2, ThumbsUp, ThumbsDown, XCircle } from 'lucide-react';
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
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{label}</span>
            <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "h-2.5 w-2.5",
                            i < value ? "text-amber-400 fill-amber-400" : "text-slate-200"
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
            <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-3" />
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
                <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Star className="h-16 w-16 fill-amber-400" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Technical</span>
                        <span className="text-xl font-black text-slate-900">{averages.tech.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Communication</span>
                        <span className="text-xl font-black text-slate-900">{averages.comm.toFixed(1)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400">Culture Fit</span>
                        <span className="text-xl font-black text-slate-900">{averages.culture.toFixed(1)}</span>
                    </div>
                </div>
            )}

            {/* Historical Scorecards */}
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest pl-1">Review History</h4>
                {scorecards.map((card) => {
                    const rec = recConfig[card.recommendation || 'yes'];
                    const RecIcon = rec.icon;
                    return (
                        <Card key={card.id} className="border-none shadow-none bg-white rounded-2xl overflow-hidden group">
                            <CardContent className="p-0">
                                <div className="flex gap-4 p-4 border-l-4 border-l-slate-100 group-hover:border-l-primary transition-all bg-slate-50/30">
                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm shrink-0">
                                        <AvatarFallback className="text-xs font-bold bg-slate-100">
                                            {getInitials(card.user_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h5 className="text-sm font-bold text-slate-900">{card.user_name}</h5>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-tight">
                                                    {formatDistanceToNow(new Date(card.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border bg-white shadow-sm", rec.color)}>
                                                <RecIcon className="h-3 w-3" />
                                                {rec.label}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <RatingBadge label="Technical" value={card.tech_rating || 0} />
                                            <RatingBadge label="Comm" value={card.comm_rating || 0} />
                                            <RatingBadge label="Culture" value={card.culture_rating || 0} />
                                        </div>

                                        {card.notes && (
                                            <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed italic shadow-sm">
                                                "{card.notes}"
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
