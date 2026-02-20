import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface InterviewGuideViewerProps {
    guideId: string;
    onComplete?: (notes: Record<string, string>) => void;
}

export function InterviewGuideViewer({ guideId, onComplete }: InterviewGuideViewerProps) {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [notes, setNotes] = useState<Record<string, string>>({});

    const { data: guide, isLoading } = useQuery({
        queryKey: ['interview_guides', guideId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('interview_guides')
                .select('*')
                .eq('id', guideId)
                .single();
            if (error) throw error;
            return data;
        },
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold uppercase text-slate-400 tracking-widest">Loading Guide...</p>
        </div>
    );

    if (!guide) return <div className="p-12 text-center text-slate-500">Guide not found.</div>;

    const questions = guide.questions as any[] || [];
    const totalSteps = questions.length;
    const currentQuestion = questions[currentStep];

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        toast({
            title: "Interview Completed",
            description: "Your session notes have been saved.",
        });
        if (onComplete) onComplete(notes);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-800">{guide.title}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {totalSteps}</p>
                </div>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase px-3 py-1">
                    Active Session
                </Badge>
            </div>

            <Card className="border-2 border-primary/10 shadow-2xl rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-8 md:p-12 space-y-8">
                    <div className="space-y-5">
                        <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none capitalize px-4 py-1.5 text-[10px] font-black tracking-[0.2em] rounded-full">
                            {currentQuestion?.category || 'Focus Area'}
                        </Badge>
                        <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight">
                            {currentQuestion?.question}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Live Evidence & Notes</label>
                            {notes[currentStep] && (
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-bold">
                                    Captured
                                </Badge>
                            )}
                        </div>
                        <Textarea
                            placeholder="Record key takeaways, candidate quotes, or specific evidence..."
                            className="min-h-[250px] text-lg rounded-[1.5rem] border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-primary/10 transition-all resize-none p-6 shadow-inner"
                            value={notes[currentStep] || ''}
                            onChange={(e) => setNotes({ ...notes, [currentStep]: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-4">
                <Button
                    variant="ghost"
                    size="lg"
                    className="rounded-full font-black text-xs uppercase tracking-widest group text-slate-400 hover:text-slate-600"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                >
                    <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back
                </Button>

                <div className="flex gap-4">
                    {currentStep === totalSteps - 1 ? (
                        <Button
                            size="lg"
                            className="rounded-full font-black text-xs uppercase tracking-widest px-10 bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
                            onClick={handleComplete}
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Complete Session
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            className="rounded-full font-black text-xs uppercase tracking-widest px-10 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                            onClick={handleNext}
                        >
                            Continue
                            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex justify-center gap-2 overflow-x-auto py-6">
                {questions.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentStep(idx)}
                        className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            idx === currentStep ? "w-12 bg-primary" : "w-2 bg-slate-200 hover:bg-slate-300"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
