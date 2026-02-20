import { useScorecards } from '@/hooks/useScorecards';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ThumbsUp, ThumbsDown, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScorecardSummary({ candidateId }: { candidateId: string }) {
    const { data: scorecards, isLoading } = useScorecards(candidateId);

    if (isLoading || !scorecards || scorecards.length === 0) return null;

    const stats = scorecards.reduce((acc, s: any) => {
        const scores = s.scores as any;
        acc.tech += scores?.tech_rating || 0;
        acc.comm += scores?.comm_rating || 0;
        acc.culture += scores?.culture_rating || 0;
        acc.rec[s.recommendation as string] = (acc.rec[s.recommendation as string] || 0) + 1;
        return acc;
    }, { tech: 0, comm: 0, culture: 0, rec: {} as Record<string, number> });

    const count = scorecards.length;
    const avgTech = (stats.tech / count).toFixed(1);
    const avgComm = (stats.comm / count).toFixed(1);
    const avgCulture = (stats.culture / count).toFixed(1);

    const recLabels: Record<string, { label: string; icon: any; color: string }> = {
        strong_yes: { label: 'Strong Yes', icon: CheckCircle2, color: 'text-emerald-600' },
        yes: { label: 'Recommend', icon: ThumbsUp, color: 'text-blue-600' },
        no: { label: 'Decline', icon: ThumbsDown, color: 'text-orange-600' },
        strong_no: { label: 'Strong No', icon: XCircle, color: 'text-red-600' },
    };

    return (
        <Card className="bg-slate-50 border-slate-100 shadow-none overflow-hidden rounded-2xl">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Aggregate Evaluation</h4>
                    <Badge variant="outline" className="bg-white text-[10px] font-bold border-slate-200">
                        {count} {count === 1 ? 'Scorecard' : 'Scorecards'}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                            <span>Technical</span>
                            <span>{avgTech}/5</span>
                        </div>
                        <Progress value={(parseFloat(avgTech) / 5) * 100} className="h-1.5 bg-slate-200" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                            <span>Soft Skills</span>
                            <span className="text-primary">{avgComm}/5</span>
                        </div>
                        <Progress value={(parseFloat(avgComm) / 5) * 100} className="h-1.5 bg-primary/10" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
                            <span>Culture</span>
                            <span className="text-primary">{avgCulture}/5</span>
                        </div>
                        <Progress value={(parseFloat(avgCulture) / 5) * 100} className="h-1.5 bg-primary/10" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {Object.entries(stats.rec).map(([rec, count]) => {
                        const info = recLabels[rec] || { label: rec, icon: Info, color: 'text-slate-500' };
                        const Icon = info.icon;
                        return (
                            <div key={rec} className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                                <Icon className={cn("h-3 w-3", info.color)} />
                                <span className="text-[10px] font-bold text-slate-600">{count} {info.label}</span>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
