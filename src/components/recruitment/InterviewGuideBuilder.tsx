import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type InterviewGuide = Tables<'interview_guides'>;
type Question = {
    id: string;
    text: string;
    category: 'technical' | 'cultural' | 'behavioral' | 'general';
};

interface InterviewGuideBuilderProps {
    companyId: string;
    positionId?: string;
    existingGuide?: InterviewGuide;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function InterviewGuideBuilder({ companyId, positionId, existingGuide, onSuccess, onCancel }: InterviewGuideBuilderProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Parse existing questions or start empty
    const initialQuestions = existingGuide?.questions
        ? (existingGuide.questions as unknown as Question[])
        : [];

    const [title, setTitle] = useState(existingGuide?.title || '');
    const [description, setDescription] = useState(existingGuide?.description || '');
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);

    // New question state
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionCategory, setNewQuestionCategory] = useState<'technical' | 'cultural' | 'behavioral' | 'general'>('general');

    const handleAddQuestion = () => {
        if (!newQuestionText.trim()) return;

        const newQuestion: Question = {
            id: crypto.randomUUID(),
            text: newQuestionText,
            category: newQuestionCategory
        };

        setQuestions([...questions, newQuestion]);
        setNewQuestionText('');
        // Keep category same for easier batch entry
    };

    const handleRemoveQuestion = (id: string) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === questions.length - 1)
        ) return;

        const newQuestions = [...questions];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]];
        setQuestions(newQuestions);
    };

    const { mutate: saveGuide, isPending } = useMutation({
        mutationFn: async () => {
            if (!title.trim()) throw new Error("Title is required");
            if (questions.length === 0) throw new Error("Add at least one question");

            const guideData = {
                company_id: companyId, // Ensure this is passed correctly
                position_id: positionId || null,
                title,
                description,
                questions: questions as any // Cast for JSONB
            };

            if (existingGuide?.id) {
                const { error } = await supabase
                    .from('interview_guides')
                    .update(guideData)
                    .eq('id', existingGuide.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('interview_guides')
                    .insert(guideData);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            toast({
                title: "Guide Saved",
                description: `Interview guide "${title}" has been saved.`
            });
            queryClient.invalidateQueries({ queryKey: ['interview-guides'] });
            onSuccess?.();
        },
        onError: (error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>{existingGuide ? 'Edit Interview Guide' : 'Create Interview Guide'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Guide Title</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Senior Frontend Engineer Interview"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Instructions for the interviewer..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <Label className="text-base font-semibold">Questions</Label>
                        <div className="space-y-4 mt-2">
                            {/* Question Input */}
                            <div className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg border">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        placeholder="Type a new question..."
                                        value={newQuestionText}
                                        onChange={(e) => setNewQuestionText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                                    />
                                </div>
                                <Select
                                    value={newQuestionCategory}
                                    onValueChange={(val: any) => setNewQuestionCategory(val)}
                                >
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General</SelectItem>
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="behavioral">Behavioral</SelectItem>
                                        <SelectItem value="cultural">Cultural</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddQuestion} size="icon" type="button">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                {questions.length === 0 ? (
                                    <div className="text-center text-slate-500 py-8 border-2 border-dashed rounded-lg">
                                        No questions added yet.
                                    </div>
                                ) : (
                                    questions.map((q, idx) => (
                                        <div key={q.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm group">
                                            <div className="flex flex-col gap-1 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => handleMoveQuestion(idx, 'up')}
                                                    disabled={idx === 0}
                                                >
                                                    <ArrowUp className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => handleMoveQuestion(idx, 'down')}
                                                    disabled={idx === questions.length - 1}
                                                >
                                                    <ArrowDown className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{q.text}</p>
                                            </div>
                                            <Badge variant="secondary" className="capitalize">
                                                {q.category}
                                            </Badge>
                                            <Button
                                                variant="ghost" size="icon"
                                                className="text-slate-400 hover:text-red-500"
                                                onClick={() => handleRemoveQuestion(q.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                    {onCancel && (
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    <Button onClick={() => saveGuide()} disabled={isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        {existingGuide ? 'Update Guide' : 'Save Guide'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
