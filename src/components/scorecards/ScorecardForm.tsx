import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitScorecard } from '@/hooks/useScorecards';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, ThumbsUp, ThumbsDown, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MentionSuggestor, MentionUser } from '@/components/ui/MentionSuggestor';
import { useComments } from '@/hooks/useComments';
import { ScorecardInsert } from '@/services/scorecards';
import { LucideIcon } from 'lucide-react';

interface ScorecardFormProps {
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
        <div className="space-y-3 p-4 rounded-2xl bg-background/40 backdrop-blur-sm border border-border/40 shadow-sm transition-all hover:bg-background/60">
            <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">{label}</Label>
                <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-[10px] font-black text-primary">{value} / 5</span>
                </div>
            </div>
            <div className="flex justify-between gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                    <button
                        key={level}
                        type="button"
                        onClick={() => onChange(level)}
                        className={cn(
                            "flex-1 h-10 rounded-lg border-2 transition-all duration-300 relative group overflow-hidden",
                            level <= value
                                ? "bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary),0.3)]"
                                : "bg-muted/30 border-border/50 hover:border-primary/40"
                        )}
                    >
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center font-black text-xs transition-colors",
                            level <= value ? "text-primary-foreground" : "text-muted-foreground/40 group-hover:text-primary/60"
                        )}>
                            {level}
                        </div>
                    </button>
                ))}
            </div>
            <p className="text-[9px] text-muted-foreground font-medium leading-relaxed uppercase tracking-tight opacity-70 px-0.5">{description}</p>
        </div>
    );
}

export function ScorecardForm({ candidateId, onSuccess }: ScorecardFormProps) {
    const { user } = useAuth();
    const submitScorecard = useSubmitScorecard(candidateId);

    const [ratings, setRatings] = useState({
        tech: 3,
        soft: 3,
        culture: 3,
    });
    const [recommendation, setRecommendation] = useState<Recommendation>('yes');
    const [notes, setNotes] = useState('');

    // Mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch comments to get potential mention users
    const { data: comments } = useComments(candidateId);

    // Derive mentionable users
    useEffect(() => {
        const uniqueUsers = new Map<string, MentionUser>();

        // Add current user
        if (user && user.email) {
            uniqueUsers.set(user.id, {
                id: user.id,
                name: user.user_metadata?.full_name || user.email.split('@')[0],
                email: user.email
            });
        }

        // Add comment authors
        if (comments) {
            comments.forEach(c => {
                if (!uniqueUsers.has(c.user_id)) {
                    uniqueUsers.set(c.user_id, {
                        id: c.user_id,
                        name: c.user_name,
                    });
                }
            });
        }

        setMentionUsers(Array.from(uniqueUsers.values()));
    }, [comments, user]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNotes(value);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPosition);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbol !== -1) {
            const query = textBeforeCursor.slice(lastAtSymbol + 1);
            if (!/\s/.test(query)) {
                setMentionQuery(query);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const handleMentionSelect = (selectedUser: MentionUser) => {
        const cursorPosition = textareaRef.current?.selectionStart || 0;
        const textBeforeCursor = notes.slice(0, cursorPosition);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

        const newText =
            notes.slice(0, lastAtSymbol) +
            `@${selectedUser.name} ` +
            notes.slice(cursorPosition);

        setNotes(newText);
        setShowMentions(false);

        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions && e.key === 'Escape') {
            e.preventDefault();
            setShowMentions(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        const scorecardData: ScorecardInsert = {
            candidate_id: candidateId,
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
            tech_rating: ratings.tech,
            comm_rating: ratings.soft, // Reusing comm_rating column for Soft Skills
            culture_rating: ratings.culture,
            recommendation,
            notes,
        };

        await submitScorecard.mutateAsync(scorecardData);

        if (onSuccess) onSuccess();
    };

    interface RecommendationConfig {
        value: Recommendation;
        label: string;
        icon: LucideIcon;
        color: string;
        bg: string;
        activeBorder: string;
    }

    const recommendations: RecommendationConfig[] = [
        { value: 'strong_yes', label: 'Strong Yes', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/5', activeBorder: 'border-emerald-500/50' },
        { value: 'yes', label: 'Recommend', icon: ThumbsUp, color: 'text-blue-500', bg: 'bg-blue-500/5', activeBorder: 'border-blue-500/50' },
        { value: 'no', label: 'Decline', icon: ThumbsDown, color: 'text-orange-500', bg: 'bg-orange-500/5', activeBorder: 'border-orange-500/50' },
        { value: 'strong_no', label: 'Strong No', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/5', activeBorder: 'border-red-500/50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RatingField
                    label="Technical Ability"
                    description="Core skills and practical knowledge"
                    value={ratings.tech}
                    onChange={(v) => setRatings({ ...ratings, tech: v })}
                />
                <RatingField
                    label="Soft Skills"
                    description="Communication and interpersonal talent"
                    value={ratings.soft}
                    onChange={(v) => setRatings({ ...ratings, soft: v })}
                />
                <RatingField
                    label="Culture Alignment"
                    description="Value match and team synergy"
                    value={ratings.culture}
                    onChange={(v) => setRatings({ ...ratings, culture: v })}
                />
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 px-1">Engagement Verdict</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {recommendations.map((rec) => {
                        const Icon = rec.icon;
                        const isSelected = recommendation === rec.value;
                        return (
                            <button
                                key={rec.value}
                                onClick={() => setRecommendation(rec.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300",
                                    isSelected
                                        ? cn(rec.bg, rec.activeBorder, "shadow-xl shadow-primary/5 scale-[1.02] ring-1 ring-primary/20")
                                        : "bg-background/20 border-border/40 hover:border-primary/20 text-muted-foreground/60"
                                )}
                            >
                                <Icon className={cn("h-6 w-6 mb-2", isSelected ? rec.color : "opacity-40")} />
                                <span className={cn("text-[10px] font-black uppercase tracking-wider", isSelected ? rec.color : "")}>
                                    {rec.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 px-1">Detailed Observations</Label>
                <div className="relative group">
                    {showMentions && (
                        <MentionSuggestor
                            query={mentionQuery}
                            users={mentionUsers}
                            onSelect={handleMentionSelect}
                            onClose={() => setShowMentions(false)}
                            position="top"
                        />
                    )}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-transparent rounded-[1.3rem] opacity-0 group-hover:opacity-100 transition-opacity blur" />
                    <Textarea
                        ref={textareaRef}
                        placeholder="Provide deep insights... Use @name to collaborate."
                        className="relative min-h-[120px] rounded-[1.25rem] border-border/40 bg-background/50 backdrop-blur-sm focus:ring-primary/20 transition-all resize-none p-5 text-sm"
                        value={notes}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            <Button
                className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl transition-all hover:scale-[1.01] active:scale-95 bg-primary text-primary-foreground"
                onClick={handleSubmit}
                disabled={submitScorecard.isPending}
            >
                {submitScorecard.isPending ? "Finalizing Entry..." : "Submit Structured Scorecard"}
            </Button>
        </div>
    );
}
