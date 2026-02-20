import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitScorecard } from '@/hooks/useScorecards';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp, ThumbsDown, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScorecardInputProps {
    candidateId: string;
    onSuccess?: () => void;
}

type Recommendation = 'strong_yes' | 'yes' | 'no' | 'strong_no';

interface RatingFieldProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    description: string;
}

function RatingField({ label, value, onChange, description }: RatingFieldProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">{label}</Label>
                <span className="text-xs font-mono text-slate-400">{value}/5</span>
            </div>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="group relative focus:outline-none"
                    >
                        <Star
                            className={cn(
                                "h-8 w-8 transition-all duration-200",
                                star <= value
                                    ? "text-amber-400 fill-amber-400 scale-110 drop-shadow-sm"
                                    : "text-slate-200 hover:text-amber-200"
                            )}
                        />
                    </button>
                ))}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-1">{description}</p>
        </div>
    );
}

export function ScorecardInput({ candidateId, onSuccess }: ScorecardInputProps) {
    const { user } = useAuth();
    const submitScorecard = useSubmitScorecard(candidateId);

    const [ratings, setRatings] = useState({
        tech: 3,
        comm: 3,
        culture: 3,
    });
    const [recommendation, setRecommendation] = useState<Recommendation>('yes');
    const [notes, setNotes] = useState('');

    const handleSubmit = async () => {
        if (!user) return;

        await submitScorecard.mutateAsync({
            candidate_id: candidateId,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
            tech_rating: ratings.tech,
            comm_rating: ratings.comm,
            culture_rating: ratings.culture,
            recommendation,
            notes,
        });

        if (onSuccess) onSuccess();
    };

    const recommendations: { value: Recommendation; label: string; icon: any; color: string; bg: string }[] = [
        { value: 'strong_yes', label: 'Strong Yes', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
        { value: 'yes', label: 'Recommend', icon: ThumbsUp, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
        { value: 'no', label: 'Decline', icon: ThumbsDown, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
        { value: 'strong_no', label: 'Strong No', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <RatingField
                    label="Technical Skill"
                    description="Practical knowledge, problem solving, and tool proficiency."
                    value={ratings.tech}
                    onChange={(v) => setRatings({ ...ratings, tech: v })}
                />
                <RatingField
                    label="Communication"
                    description="Clarity, active listening, and ability to explain complex ideas."
                    value={ratings.comm}
                    onChange={(v) => setRatings({ ...ratings, comm: v })}
                />
                <RatingField
                    label="Culture Fit"
                    description="Core values alignment, teamwork, and overall professional attitude."
                    value={ratings.culture}
                    onChange={(v) => setRatings({ ...ratings, culture: v })}
                />
            </div>

            <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Overall Recommendation</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recommendations.map((rec) => {
                        const Icon = rec.icon;
                        const isSelected = recommendation === rec.value;
                        return (
                            <button
                                key={rec.value}
                                onClick={() => setRecommendation(rec.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300",
                                    isSelected
                                        ? cn(rec.bg, "scale-105 shadow-md ring-2 ring-offset-2 ring-slate-100")
                                        : "bg-white border-slate-100 hover:border-slate-200 text-slate-400"
                                )}
                            >
                                <Icon className={cn("h-6 w-6 mb-2", isSelected ? rec.color : "opacity-40")} />
                                <span className={cn("text-xs font-bold", isSelected ? rec.color : "")}>
                                    {rec.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-slate-500">Detailed Feedback</Label>
                <Textarea
                    placeholder="Provide specific details about their performance and why you made your recommendation..."
                    className="min-h-[120px] rounded-xl border-slate-200 focus:ring-primary/20 transition-all resize-none p-4"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <Button
                className="w-full h-12 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                onClick={handleSubmit}
                disabled={submitScorecard.isPending}
            >
                {submitScorecard.isPending ? "Submitting..." : "Submit Scorecard"}
            </Button>
        </div>
    );
}
